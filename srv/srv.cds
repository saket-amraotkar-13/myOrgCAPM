
using { myorg.db as mydb } from '../db/data-model';
using { northwind as nw } from '../srv/external/northwind';


service MyOrgService {

    entity DepartmentSet as projection on mydb.DepartmentSet;
    entity EmployeeSet as projection on mydb.EmployeeSet{
         *,
        @Core.Computed: false
        virtual numberOfDependent : Integer
    };
    entity EmpDependentSet as projection on mydb.EmpDependentSet;
    entity AttachmentSet as projection on mydb.AttachmentSet;
    
    //declare entity with fields from external source
@path: 'service/sdk'
    entity ProductSet as projection on nw.Products{
        key ProductID as ProductID,
        ProductName as ProductName,
        QuantityPerUnit as QuantityPerUnit,
        UnitsInStock as UnitsInStock,
        Discontinued as Discontinued
    }

    //declare function to perform get operation specifically entity of external source
    function getProducts() returns array of String;
}
