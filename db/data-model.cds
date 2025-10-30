namespace myorg.db;

using {
    cuid,
    managed,
    sap.common.Countries
} from '@sap/cds/common';

    entity DepartmentSet : cuid, managed {
        DepartName     : String;
        DepartmentCode : String;
    }

    entity EmployeeSet : cuid, managed {
        FirstName     : String @title: 'First Name';
        LastName : String @title: 'Last Name';
        Age: Integer @assert.range.min: 0;
        Salary: Integer @assert.range.min: 0;
        Role: String;
        Taxable: Boolean;
        SrCitizen: Boolean;
        email: String;
        yrsOfExperience: Integer @assert.range.min: 0;
        Address: String;
        Country: Association to Countries;
        City: String;
        Department: Association to DepartmentSet;
        dependents: Composition of many EmpDependentSet on dependents.OrgEmployee = $self;        
        FavProduct:String;
        MediaDoc: Composition of many AttachmentSet on MediaDoc.EmployeeFile = $self;
    }

    entity EmpDependentSet : cuid, managed {
        DepdFirstName: String;
        DepdLastName: String;
        Depdage: String;
        relationship: String;
        OrgEmployee: Association to EmployeeSet;
    }

    entity AttachmentSet : cuid, managed {
        EmployeeFile: Association to EmployeeSet;
        @Core.MediaType: mediaType
        @Core.ContentDisposition.Type: 'inline'
        content: LargeBinary;        
        
        @Core.IsMediaType: true
        mediaType: String default 'application/octet-stream';
        
        @Core.ContentDisposition.Filename: filename
        filename: String;
    }

