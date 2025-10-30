# Getting Started

Welcome to your new project.

It contains these folders and files, following our recommended project layout:

File or Folder | Purpose
---------|----------
`app/` | content for UI frontends goes here
`db/` | your domain models and data go here
`srv/` | your service models and code go here
`package.json` | project metadata and configuration
`readme.md` | this getting started guide


## Next Steps

- Open a new terminal and run `cds watch`
- (in VS Code simply choose _**Terminal** > Run Task > cds watch_)
- Start adding content, for example, a [db/schema.cds](db/schema.cds).


## Learn More

Learn more at https://cap.cloud.sap/docs/get-started/.

## cds watch --profile hybrid :- run cap server with binded services instances using its service key locally in bas
this will use the .cdsrs-private.json file to load all service instance with its service keys

## cds add hana --for production
cds add hana --for production --> to add hana db config in package.json file as
1. in dependencies for "@cap-js/hana": "^2"
2.  "cds": {
    "requires": {
      "[production]": {        
        "db": "hana"
      } } }

## cds add xsua --for production
 it will add below config in package.json:
 1. dependencies for "@sap/xssec": "^4"
 2. "cds": {
    "requires": {
      "[production]": {
        "auth": {
          "kind": "xsuaa"
        }       
      } }}

## cds bind -2 <destinationServiceInstance>:ServiceKey :- bind service with its key locally in bas 
it will bind the service instance of destination with its service key locally in file .cdsrc-private.json which will help to run all services with its service keys locally using cds watch --profile hybrid

## cds add mta
to add mta file to cap project with all its dependencies from package.json file.

## cf cs destination lite myDest OR cf create service destination lite myDest :- create destination service instance
here destination is service instance, lite is plan of service instance, myDest is name of service instance which you want to create
like this you can create other services also from terminal of BAS/VScode

## cf csk myDest myDest-ServiceKey OR cf create service key myDest myDesk-ServiceKey :- create service key for service instance myDest
here myDest is already created service instance, myDest-ServiceKey is service key for instance which will get created

## mbt build :- build mta.yaml file to generate mtar file

## cf deploy <mtarfilepath> : 

