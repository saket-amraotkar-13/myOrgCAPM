const cds = require('@sap/cds');
const { executeHttpRequest } = require("@sap-cloud-sdk/http-client");
const { readCredential } = require('./credStore');
const SapCfMailer = require("sap-cf-mailer").default;
const ExcelJS = require("exceljs");
const getEmailContent = require('./utils/emailTemplate'); // <-- imported here

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

    // Call External API as Function - Option 2 using sap cloud sdk/http client    
    this.on('READ', 'CustomerSet', async (req) => {
      try {
        let oResponse = await executeHttpRequest(
          {
            destinationName: "Northwind",
          },
          {
            method: "get",
            "url": "/v2/northwind/northwind.svc/Customers",
          }
        );
        let data = oResponse.data.d.results;
        return data;
      } catch (oError) {
        console.log(oError);
      }
    });

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
    // 🟢 BEFORE CREATE/UPDATE EMPLOYEESET: Validation + Logic
    // ==================================================
    this.before(['CREATE', 'UPDATE'], 'EmployeeSet', async (req) => {
      const { ID, Age, FirstName, LastName, Salary, FavProduct } = req.data;


      // Safely extract Department ID from association or foreign key
      let Department_ID = req.data.Department_ID;
      if (!Department_ID && req.data.Department && req.data.Department.ID) {
        Department_ID = req.data.Department.ID;
      }
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
      // --- Validate Department existence ---
      if (Department_ID) {
        const department = await SELECT.one
          .from('myorg.db.DepartmentSet')
          .columns('ID')
          .where({ ID: Department_ID });

        if (!department) {
          errors.push(`Department with ID '${Department_ID}' does not exist.`);
        }
      } else {
        errors.push('Department_ID is required.');
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

    /// ==================================================
    // 🔵 BEFORE CREATE/UPDATE: EmpDependentSet — Auto Fetch Employee LastName
    // ==================================================
    this.before(['CREATE', 'UPDATE'], 'EmpDependentSet', async (req) => {
      const { OrgEmployee_ID, DepdFirstName, DepdLastName, ID } = req.data;

      const errors = [];

      // --- Validate OrgEmployee_ID existence ---
      if (!OrgEmployee_ID) {
        errors.push('Employee reference (OrgEmployee_ID) is required.');
      }

      // --- Fetch Employee LastName ---
      let employee;
      if (OrgEmployee_ID) {
        employee = await SELECT.one
          .from('myorg.db.EmployeeSet')
          .columns('FirstName', 'LastName')
          .where({ ID: OrgEmployee_ID });

        if (!employee) {
          errors.push(`No Employee found with ID '${OrgEmployee_ID}'.`);
        } else {
          // 🟢 Automatically set DepdLastName = Employee.LastName
          req.data.DepdLastName = employee.LastName;
        }
      }

      // --- Validate First Name ---
      if (!DepdFirstName || DepdFirstName.trim() === '') {
        errors.push('Dependent First Name is required.');
      }

      // --- Check duplicate (same dependent for same employee) ---
      if (OrgEmployee_ID && DepdFirstName && req.data.DepdLastName) {
        const whereClause = {
          OrgEmployee_ID: OrgEmployee_ID,
          DepdFirstName: DepdFirstName.trim(),
          DepdLastName: req.data.DepdLastName.trim(),
        };

        if (req.event === 'UPDATE' && ID) {
          whereClause.ID = { '!=': ID };
        }

        const existing = await SELECT.from('myorg.db.EmpDependentSet')
          .columns('ID')
          .where(whereClause)
          .limit(1);

        if (existing.length > 0) {
          errors.push(
            `Dependent '${DepdFirstName} ${req.data.DepdLastName}' already exists for this employee.`
          );
        }
      }

      // --- Stop processing if errors exist ---
      if (errors.length > 0) {
        req.error(400, errors.join(' '));
      }
    });

    // ==================================================
    // 🟢 BEFORE CREATE/UPDATE DEPARTMENTSET: Avoid Duplicates
    // ==================================================
    this.before(['CREATE', 'UPDATE', 'DELETE'], 'DepartmentSet', async (req) => {

      const { ID, DepartName, DepartmentCode, AdminPWD } = req.data;
      const errors = [];

      // --- 🔒 Read actual Admin password from BTP Credential Store ---
      let storedAdminPwd;
      try {
        storedAdminPwd = await readCredential("MyOrgCredentials", "password", "AdminPassword");
        if (!storedAdminPwd) {
          req.error(500, "❌ Failed to read Admin password from Credential Store.");
          return;
        }
      } catch (err) {
        console.error("❌ Error reading credential:", err.message);
        req.error(500, "❌ Error while reading Admin password from Credential Store.");
        return;
      }


      // --- Validate AdminPWD ---
      // if (!AdminPWD || AdminPWD.trim() !== storedAdminPwd.trim()) {
      //   req.error(403, '❌ Invalid Admin password. You are not authorized to create or update a Department.');
      //   return;
      // }

      // --- Skip further validations if DELETE (only password check needed) ---
      if (req.event === 'DELETE') {
        const orAdminPWD = req.headers.slug;

        if (!orAdminPWD || orAdminPWD !== storedAdminPwd) {
          req.error(403, '❌ Invalid Admin password. You are not authorized to create or update a Department.');
          return;
        }
        return;
      }

      // --- Validate mandatory fields ---
      if (!DepartName || DepartName.trim() === '') errors.push('Department Name is required.');
      if (!DepartmentCode || DepartmentCode.trim() === '') errors.push('Department Code is required.');

      // --- Check for duplicates ---
      if (DepartName && DepartmentCode) {
        const whereClause = {
          DepartName: DepartName.trim(),
          DepartmentCode: DepartmentCode.trim(),
        };

        // Exclude same record when updating
        if (req.event === 'UPDATE' && ID) {
          whereClause.ID = { '!=': ID };
        }

        const existing = await SELECT.from('myorg.db.DepartmentSet')
          .columns('ID')
          .where(whereClause)
          .limit(1);

        if (existing.length > 0) {
          errors.push(
            `Department '${DepartName}' with code '${DepartmentCode}' already exists.`
          );
        }
      }

      // --- Capture logged-in user ---
      const userId = req.user?.id || 'anonymous';
      if (req.event === 'CREATE') req.data.createdBy = userId;
      req.data.modifiedBy = userId;

      // --- Stop processing if errors exist ---
      if (errors.length > 0) {
        req.error(400, errors.join(' '));
      }
    });

    // ==================================================
    // 🟢 Read Cred Store
    // ==================================================

    // fnReadCredStore 
    this.on('fnReadCredStore', async (req) => {
      try {
        const res = await readCredential("MyOrgCredentials", "password", "AdminPassword");
        console.log("✅ Read credential:", res);
        return [`Read successfull for AdminPassword: ${res ? 'value found' : 'no value'}`, res];
      } catch (error) {
        console.error("❌ Read failed:", error.message);
        return [`Read failed: ${error.message}`];
      }
    });

    // ==================================================
    // 🟢 Send Email 
    // ==================================================      
    this.on('sendEmail', async (request, response) => {
      const oReq = request.data.ID;
      console.log(oReq);
    
      const employee = await SELECT.from('myorg.db.EmployeeSet').where({ ID: oReq });
      if (!employee || employee.length === 0) 
        {
        return request.error(404, `❌ No employee found for ID: ${oReq}`);
        
        }
       const oEmail = employee[0].email
       const emp = employee[0];
      console.log(employee[0].email);
// Create Excel workbook
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('employee');

  // Define headers
  worksheet.columns = Object.keys(emp).map(key => ({
    header: key.charAt(0).toUpperCase() + key.slice(1),
    key: key
  }));

  // Header styling
  const headerRow = worksheet.getRow(1);
  headerRow.eachCell(cell => {
    cell.font = { bold: true, color: { argb: '#000000' } };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '#FF0000' } };
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    };
  });

  // Add data rows
  worksheet.addRows(employee);

  // Auto-size columns
  worksheet.columns.forEach(col => {
    let maxLength = 0;
    col.eachCell({ includeEmpty: true }, cell => {
      const cellValue = cell.value ? cell.value.toString() : '';
      maxLength = Math.max(maxLength, cellValue.length);
    });
    col.width = maxLength < 10 ? 10 : maxLength + 2;
  });

  // Convert to base64
  const buffer = await workbook.xlsx.writeBuffer();
  const base64Excel = buffer.toString('base64');

try {

    const transporter = new SapCfMailer("mail_destination"); //enter destination name
    const htmlContent = getEmailContent(emp);
    const result = await transporter.sendMail({
                to: "saket.amraotkar@gmail.com",
                cc: "",
                subject: `Employee Details - ${emp.FirstName} ${emp.LastName}`,
                html: htmlContent,
                attachments:  [{
                        filename: "myData.xlsx",
                        content: base64Excel,
                        encoding: "base64",
                        contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                    }]
            });

     return `Email sent successfully w`;

        } catch (error) {
            console.error('Error sending email:', error);
            return `Error sending email: ${error.message}`;
        }
    });



    //return the init
    return super.init();
  }
}

//modules for services
module.exports = MyOrgService;

