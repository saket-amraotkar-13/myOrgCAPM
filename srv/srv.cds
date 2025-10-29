
using { myorg.db as mydb } from '../db/data-model';
using { northwind as nw } from '../srv/external/northwind';


service MyOrgService {

    entity DepartmentSet as projection on mydb.DepartmentSet{
        *,
        @Core.Computed: false
        virtual AdminPWD : String
    };
    entity EmployeeSet as projection on mydb.EmployeeSet {
        *,       
        @Core.Computed: false
        virtual numberOfDependent : Integer,
        dependents : redirected to EmpDependentSet,    // ✅ expose composition
        MediaDoc   : redirected to AttachmentSet,      // ✅ expose attachments
    };

    entity EmpDependentSet as projection on mydb.EmpDependentSet {
        *,
        OrgEmployee : redirected to EmployeeSet        // ✅ allow reverse navigation
    };

    entity AttachmentSet as projection on mydb.AttachmentSet {
        *,
        EmployeeFile : redirected to EmployeeSet
    };

    function fnReadCredStore() returns array of String;
    @cds.persistence.skip
    entity CustomerSet  {
     key CustomerID: String;
      CompanyName: String;
      ContactName: String;
      ContactTitle: String;
      Address: String;
      City: String;
      Region: String;
      PostalCode: String;
      Country: String;
      Phone: String;
      Fax: String;
    }
    //declare entity with fields from external source
@path: 'service/sdk'
    @cds.persistence.skip
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
