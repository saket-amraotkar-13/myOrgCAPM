
using { myorg.db as mydb } from '../db/data-model';
using { northwind as nw } from '../srv/external/northwind';


service MyOrgService {

    entity DepartmentSet as projection on mydb.DepartmentSet;
    entity EmployeeSet as projection on mydb.EmployeeSet;
    entity EmpDependentSet as projection on mydb.EmpDependentSet;
    entity AttachmentSet as projection on mydb.AttachmentSet;
    //declare entity with fields from external source
    entity ProductSet as projection on nw.Products{
        key ProductID as ProductID,
        ProductName as ProductName,
        QuantityPerUnit as QuantityPerUnit,
        UnitsInStock as UnitsInStock,
        Discontinued as Discontinued
    }
@path: 'service/sdk'
    type mProduct{
         ProductID: String;
        ProductName: String;
        QuantityPerUnit:String;
        UnitsInStock: String;
        Discontinued: String;
    }
    //declare function to perform get operation specifically entity of external source
    function getProducts() returns array of String;
}
