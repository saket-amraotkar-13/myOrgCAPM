/**
 * Returns HTML content for an employee email.
 * @param {object} emp - Employee object containing FirstName, LastName, Department, etc.
 * @returns {string} HTML string for email body
 */
module.exports = function getEmailContent(emp) {
  return `
    <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            color: #333;
          }
          .container {
            padding: 16px;
            background-color: #f9f9f9;
            border-radius: 8px;
            border: 1px solid #ddd;
          }
          h2 {
            color: #007acc;
          }
          p {
            margin: 8px 0;
          }
          .footer {
            font-size: 12px;
            color: #777;
            margin-top: 16px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>Hello ${emp.FirstName || 'Employee'} ${emp.LastName || ''},</h2>
          <p>We hope you're doing well.</p>
          <p>Please find attached your employee details in Excel format.</p>
          <p>Department: <b>${emp.Department_ID || 'N/A'}</b></p>
          <p>Employee ID: <b>${emp.ID}</b></p>
          <p>Thank you,<br><b>HR Department</b></p>

          <div class="footer">
            This is an automated message from BTP System.
          </div>
        </div>
      </body>
    </html>
  `;
};