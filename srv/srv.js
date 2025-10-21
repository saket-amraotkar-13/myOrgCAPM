const cds = require('@sap/cds');
const { executeHttpRequest} = require("@sap-cloud-sdk/http-client");

//extend the Application service
class MyOrgService extends cds.ApplicationService {

async init(){
    //declare external entity set for which read opearion needs to be handled
    const { ProductSet } = this.entities;

    // declare the destination as datasource to be connected
    const nws = await cds.connect.to("northwind");

    //handlers---1
    //perform read operation on entity from external source
    this.on('READ', ProductSet, async (req) => {
            //return result of read operation
            return nws.run(req.query);
    });
    //handlers---2
    this.on('getProducts', async (req) => {
        try{
            let oResponse = await executeHttpRequest(
                {
                    destinationName: "Northwind",
                },
                {
                    method: "get",
                    "url": "/v2/northwind/northwind.svc/Products",
                }
            );
            let data = oResponse.data.d.results;
            return data;
        } catch (oError){
            console.log(oError);
        }
    });


    //return the init
    return super.init();
    }
}
//modules for services
module.exports = MyOrgService;

