using MyOrgService as service from '../../srv/srv';

annotate service.EmployeeSet with @(
    UI.LineItem:
    [
        {
            $Type: 'UI.DataField',
            Value: ID
        },
        {
            $Type: 'UI.DataField',
            Value: FirstName
        },
        {
            $Type: 'UI.DataField',
            Value: LastName
        },
        {
            $Type: 'UI.DataField',
            Value: numberOfDependent
        },
        {
            $Type: 'UI.DataField',
            Value: City
        }
    ],
    UI.Facets : [
        {
            $Type : 'UI.ReferenceFacet',
            Label : 'Employee Details',
            ID : 'EmployeeDetails',
            Target : '@UI.FieldGroup#EmployeeDetails',
        },
        {
            $Type : 'UI.ReferenceFacet',
            Label : 'Dependents',
            ID : 'Dependents',
            Target : 'dependents/@UI.LineItem#Dependents',
        },
        {
            $Type : 'UI.ReferenceFacet',
            Label : 'Files',
            ID : 'Files',
            Target : 'MediaDoc/@UI.LineItem#Files',
        },
    ],
    UI.FieldGroup #EmployeeDetails : {
        $Type : 'UI.FieldGroupType',
        Data : [
            {
                $Type : 'UI.DataField',
                Value : FirstName,
            },
            {
                $Type : 'UI.DataField',
                Value : LastName,
            },
            {
                $Type : 'UI.DataField',
                Value : Age,
                Label : 'Age',
            },
            {
                $Type : 'UI.DataField',
                Value : City,
                Label : 'City',
            },
            {
                $Type : 'UI.DataField',
                Value : email,
                Label : '{i18n>Email}',
            },
            {
                $Type : 'UI.DataField',
                Value : FavProduct,
                Label : '{i18n>FavoriteProduct}',
            },
            {
                $Type : 'UI.DataField',
                Value : numberOfDependent,
                Label : '{i18n>DependentsCount}',
            },
            {
                $Type : 'UI.DataField',
                Value : Role,
                Label : 'Role',
            },
            {
                $Type : 'UI.DataField',
                Value : Salary,
                Label : 'Salary',
            },
            {
                $Type : 'UI.DataField',
                Value : SrCitizen,
                Label : '{i18n>SrCitizen}',
            },
            {
                $Type : 'UI.DataField',
                Value : Taxable,
                Label : 'Taxable',
            },
            {
                $Type : 'UI.DataField',
                Value : yrsOfExperience,
                Label : '{i18n>ExperienceInYears}',
            },
            {
                $Type : 'UI.DataField',
                Value : Department_ID,
                Label : '{i18n>DepartmentId}',
            },
            {
                $Type : 'UI.DataField',
                Value : Country_code,
                Label : '{i18n>Country1}',
            },
        ],
    },
    UI.FieldGroup #Files : {
        $Type : 'UI.FieldGroupType',
        Data : [
        ],
    },
);
annotate service.EmpDependentSet with @(
    UI.LineItem #Dependents : [
        {
            $Type : 'UI.DataField',
            Value : DepdFirstName,
            Label : '{i18n>DependentsFirstName}',
        },
        {
            $Type : 'UI.DataField',
            Value : DepdLastName,
            Label : '{i18n>DependentsLastName}',
        },
        {
            $Type : 'UI.DataField',
            Value : OrgEmployee_ID,
            Label : '{i18n>DependentsEmployee}',
        },
        {
            $Type : 'UI.DataField',
            Value : relationship,
            Label : '{i18n>Relatioship}',
        },
        {
            $Type : 'UI.DataField',
            Value : Depdage,
            Label : '{i18n>AgeOfDependent}',
        },
        {
            $Type : 'UI.DataField',
            Value : ID,
            Label : '{i18n>DependentsId}',
        },
    ]
);

annotate service.AttachmentSet with @(
    UI.LineItem #Files : [
        {
            $Type : 'UI.DataField',
            Value : ID,
            Label : '{i18n>FileId}',
        },
        {
            $Type : 'UI.DataField',
            Value : filename,
            Label : '{i18n>FileName}',
        },
        {
            $Type : 'UI.DataField',
            Value : content,
            Label : 'content',
        },
        {
            $Type : 'UI.DataField',
            Value : mediaType,
            Label : 'mediaType',
        },
        {
            $Type : 'UI.DataField',
            Value : EmployeeFile_ID,
            Label : '{i18n>EmployeeId}',
        },
    ]
);

annotate service.EmployeeSet with {
    Department @Common.Text : Department.DepartName
};

