namespace sap.capire.db;

using {Currency} from '@sap/cds/common';

//Department
entity Roles {
    key ID         : UUID;
        name       : String;
        baseSalary : Double;
}

//Employees
entity Employees {
    key ID                : UUID;
        firstName         : String;
        lastName          : String;
        email             : String;
        gender            : String;
        hireDate          : Date;
        dateOfBirth       : Date;
        salary            : Double;
        currency          : Currency;
        department        : Association to Departments;
        role              : Association to Roles;
}

//Department
entity Departments {
    key ID   : UUID;
        name : String;
}
