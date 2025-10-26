const cds = require('@sap/cds');
// const { executeHttpRequest} = require("@sap-cloud-sdk/http-client");

//extend the Application service
class MyOrgService extends cds.ApplicationService {

  async init() {
    //declare external entity set for which read opearion needs to be handled
    const { ProductSet, EmployeeSet } = this.entities;

    // ==========================================================================
    // READ External API Entity Products: Northwind API Connection for Products
    // ==========================================================================
    const nws = await cds.connect.to("northwind");

    this.on('READ', ProductSet, async (req) => {
      //return result of read operation
      return nws.run(req.query);
    });

    //Call External API as Function - Option 1    
    // this.on('getProducts', async (req) => {
    //     try{
    //         let oResponse = await executeHttpRequest(
    //             {
    //                 destinationName: "Northwind",
    //             },
    //             {
    //                 method: "get",
    //                 "url": "/v2/northwind/northwind.svc/Products",
    //             }
    //         );
    //         let data = oResponse.data.d.results;
    //         return data;
    //     } catch (oError){
    //         console.log(oError);
    //     }
    // });

    // ==========================================================================
    // Function External API Function Products: Northwind API Connection for Products
    // ==========================================================================
    // Call External API as Function - 2 option 2    
    this.on('getProducts', async (req) => {
      try {
        const products = await nws.run(SELECT.from("Products"));
        return products;
      } catch (err) {
        console.error("Error calling Northwind:", err);
        req.reject(500, "Failed to fetch products");
      }
    });

    // ======================================
    // 🟣 AFTER READ: Inject numberOfDependent
    // ======================================
    this.after('READ', EmployeeSet, async (employees) => {
      const employeeList = Array.isArray(employees) ? employees : [employees];
      if (employeeList.length === 0) return;

      // Extract all employee IDs
      const empIDs = employeeList.map(e => e.ID);

      // Query dependents count grouped by employee
      const dependents = await cds.run(
        SELECT.from('myorg.db.EmpDependentSet')
          .columns('OrgEmployee_ID', 'count(*) as depCount')
          .where({ OrgEmployee_ID: { in: empIDs } })
          .groupBy('OrgEmployee_ID')
      );

      // Create lookup map
      const depCountMap = Object.fromEntries(
        dependents.map(d => [d.OrgEmployee_ID, d.depCount])
      );

      // Inject counts into result
      for (const emp of employeeList) {
        emp.numberOfDependent = depCountMap[emp.ID] || 0;
      }
    });

    // ==================================================
    // 🟢 BEFORE CREATE/UPDATE: Validation + Logic
    // ==================================================
    this.before(['CREATE', 'UPDATE'], 'EmployeeSet', async (req) => {
      const { Age, FirstName, LastName, Salary, FavProduct } = req.data;

      // Collect validation errors
      const errors = [];

      // --- Validate First/Last Name ---
      if (!FirstName || FirstName.trim() === '') errors.push('First Name is required.');
      if (!LastName || LastName.trim() === '') errors.push('Last Name is required.');

      // --- Validate Age ---
      if (Age == null || Age === '') errors.push('Age is required.');
      else if (Age < 20) errors.push('Employee age must be at least 20 years.');

      // --- Handle Senior Citizen Flag ---
      if (Age > 60) {
        req.data.SrCitizen = true;   // automatically mark as true
      } else {
        req.data.SrCitizen = false;  // ensure false if below 60
      }
      // --- Handle Salary Taxble Flag ---
      if (Salary > 4000) {
        req.data.Taxable = true;   // automatically mark as true
      } else {
        req.data.Taxable = false;  // ensure false if below 60
      }
      // --- Check duplicate FirstName + LastName ---
      if (FirstName && LastName) {
        // Build query to check if another record exists with same first + last name
        const whereClause = {
          FirstName: FirstName.trim(),
          LastName: LastName.trim()
        };

        // For update, exclude the same record
        if (req.event === 'UPDATE' && ID) {
          whereClause.ID = { '!=': ID };
        }

        const existing = await SELECT.from(EmployeeSet)
          .columns('ID')
          .where(whereClause)
          .limit(1);

        if (existing.length > 0) {
          errors.push(`Employee with name '${FirstName} ${LastName}' already exists.`);
        }
      }

      if (FavProduct) {
        // Make sure you have the Northwind connection
        const nws = await cds.connect.to("northwind");
        // Fetch all products
        const products = await nws.run(SELECT.from("Products"));
        // Check if FavProduct exists
        const exists = products.some(p => p.ProductName === FavProduct);
        if (!exists) {
          errors.push(`FavProduct '${FavProduct}' does not exist in Products.`);
        }
      }

      // --- Capture logged-in user for change log ---
      const userId = req.user?.id || 'anonymous';
      if (req.event === 'CREATE') {
        req.data.createdBy = userId;
      }
      req.data.modifiedBy = userId;
      console.log(userId);

      // --- Stop processing if errors exist ---
      if (errors.length > 0) {
        req.error(400, errors.join(' '));
      }

    });

    //return the init
    return super.init();
  }
}

//modules for services
module.exports = MyOrgService;

