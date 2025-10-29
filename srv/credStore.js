const jose = require('node-jose');
const fetch = require('node-fetch'); 
const fs = require("fs");
const xsenv = require("@sap/xsenv");

xsenv.loadEnv();
let binding;
try {
    const services = xsenv.getServices({ credstore: { tag: 'credstore' } });
    binding = services.credstore;
} catch (error) {
    console.log(`oops we have an issue: ${JSON.stringify(error)}`);
}

const https = require('https');

function headers(namespace, init) {
    const headers = new fetch.Headers(init);
    headers.set("sapcp-credstore-namespace", namespace);
    headers.set('Cache-Control', 'no-cache');
    return headers;
}

function checkStatus(response) {
    if (!response.ok) console.log(`Please verify that you CredStore binding info is up to date Unexpected status code: ${response.status}`);
    return response;
}

async function decryptPayload(privateKey, payload) {
    const key = await jose.JWK.asKey(`-----BEGIN PRIVATE KEY-----${privateKey}-----END PRIVATE KEY-----`,
        "pem",
        { alg: "RSA-OAEP-256", enc: "A256GCM" }
    );
    const decrypt = await jose.JWE.createDecrypt(key).decrypt(payload);
    const result = decrypt.plaintext.toString();
    return result;
}

async function fetchAndDecrypt(privateKey, url, method, headers, body) {
    const agent = new https.Agent({
      cert: binding.certificate,
      key: binding.key
    });
    return fetch(url, { method, headers, agent }).then((resFetch)=>{
      const resCheckStatus = checkStatus(resFetch);
      return(resCheckStatus)})
      .then((response) => {
          const resText = response.text()
          return resText
          })
          .then(payload => decryptPayload(privateKey, payload))
          .then((resObj)=>{
              return(JSON.parse(resObj))})
           //NOSONAR
          .catch(e=>{
             console.log(`oops we have an issue: ${JSON.stringify(e)}`);
          });
  }

async function readCredential(namespace, type, name) {
    // Add logic to check if file exist.
    const headersToSend = headers(namespace)
    const resData = await fetchAndDecrypt(
        binding.encryption.client_private_key,
        `${binding.url}/${type}?name=${encodeURIComponent(name)}`,
        "get",
        headersToSend
    );

    if(resData && resData.name == 'CreationPWD' && resData.value) {
        // fs.writeFileSync(`./srv/skey`, resData.value);
        return resData.value;
    }else {
        return resData.value;
    }
}

async function encryptPayload(publicKey, data) {
  const key = await jose.JWK.asKey(`-----BEGIN PUBLIC KEY-----${publicKey}-----END PUBLIC KEY-----`, "pem");
  const payload = JSON.stringify(data);
  const jwe = await jose.JWE.createEncrypt(
    { format: "compact", fields: { "alg": "RSA-OAEP-256", "enc": "A256GCM" } },
    key
  )
    .update(payload)
    .final();
  return jwe;
}

async function writeCredential(namespace, type, name, value, description = "Created via CAPM") {
  const headersToSend = headers(namespace);
  headersToSend.set("Content-Type", "application/jose");
  
  const encryptedPayload = await encryptPayload(binding.encryption.server_public_key, {
    name,
    value,
    description
  });

  const agent = new https.Agent({
    cert: binding.certificate,
    key: binding.key
  });

  const url = `${binding.url}/${type}/${encodeURIComponent(name)}`;
  const response = await fetch(url, {
    method: "PUT", // or "POST" for new
    headers: headersToSend,
    agent,
    body: encryptedPayload
  });

  if (!response.ok) {
    const text = await response.text();
    console.error(`❌ Write failed: ${response.status} - ${text}`);
    throw new Error(`Write failed: ${response.status}`);
  }

  console.log(`✅ Credential '${name}' successfully written to ${namespace}`);
  return true;
}

async function getRequiredCredentials(type) {
  try {
    const namespace = process.env.credstoreNamespace;
    // const namespace = 'myNameSpace ';

    if (!namespace) {
      throw new Error("credstoreNamespace not present");
    }

    if (type === 'userSession') {
      const aribabtp_pwd = await readCredential(namespace, "password", "aribabtp_pwd");
      const appid = await readCredential(namespace, "password", "aribabtp_appid");
      return {aribabtp_pwd, appid};
    }

    if (type === 'wsToken') {
      const aribabtp_int_pwd = await readCredential(namespace, "password", "aribabtp_int_pwd");
      const appId = await readCredential(namespace, "password", "aribabtp_idmsapi_appid");
      return {aribabtp_int_pwd, appId};
    }

    if (type === 'findPerson') {
      const aribabtp_findperson_pwd = await readCredential(namespace, "password", "aribabtp_findperson_pwd");
      const appId = await readCredential(namespace, "password", "aribabtp_idmsapi_appid");
      return {aribabtp_findperson_pwd, appId};
    }

    if (type === 'accessInfos') {
      const appId = await readCredential(namespace, "password", "aribabtp_idmsapi_appid");
      return {appId};
    }

    if (type === '2SV') {
      return await readCredential(namespace, "password", "AdminPassword");
    }
  } catch (error) {
    throw error; 
  }
}

module.exports = { getRequiredCredentials, readCredential,writeCredential }