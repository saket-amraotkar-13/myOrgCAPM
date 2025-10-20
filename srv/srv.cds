using { myorg.db as mydb } from '../db/data-model';

service MyOrgService {

    entity DepartmentSet as projection on mydb.DepartmentSet;
    entity EmployeeSet as projection on mydb.EmployeeSet;
    entity EmpDependentSet as projection on mydb.EmpDependentSet;
    entity AttachmentSet as projection on mydb.AttachmentSet;
}