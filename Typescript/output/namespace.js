"use strict";
var Iphone;
(function (Iphone) {
    Iphone.model = "iPhone 17 Pro";
    Iphone.price = 129999;
    function showDetails() {
        console.log("Model:", Iphone.model);
        console.log("Price:", Iphone.price);
    }
    Iphone.showDetails = showDetails;
})(Iphone || (Iphone = {}));
console.log(Iphone.model);
console.log(Iphone.price);
Iphone.showDetails();
var Company;
(function (Company) {
    let HR;
    (function (HR) {
        function getEmployee() {
            console.log("HR Employee");
        }
        HR.getEmployee = getEmployee;
    })(HR = Company.HR || (Company.HR = {}));
    let IT;
    (function (IT) {
        function getDeveloper() {
            console.log("IT Developer");
        }
        IT.getDeveloper = getDeveloper;
    })(IT = Company.IT || (Company.IT = {}));
})(Company || (Company = {}));
Company.HR.getEmployee();
Company.IT.getDeveloper();
