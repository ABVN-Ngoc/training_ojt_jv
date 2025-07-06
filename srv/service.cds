using sap.capire.db as db from '../db/employee_schema';

@path: '/ngoc123'


// service Service @(requires: 'authenticated-user') {
service Service {


    entity Employees   as projection on db.Employees;
    action   getEmployeeInfo(ID : UUID)          returns Employees;
    entity Departments as projection on db.Departments;
    entity Roles       as projection on db.Roles;

    type empId {
        empID : UUID;
    };

    type RoleInfo : {
        name : String;
        roles : String;
    };

    action   onCalculateSalary(Employee : empId) returns Double;
    function getRole()                           returns String;

}

annotate Service with @(restrict: [
    {
        grant: ['READ'],
        to   : ['employee']
    },
    {
        grant: [
            'READ',
            'UPDATE',
            'CREATE',
            'DELETE'
        ],
        to   : ['admin']
    }
]);
