"use strict";
// DataType requires both name and email
var empData1 = {
    name: "Abhi",
    email: "anil@test.com",
};
var studentData1 = {
    name: "Sam",
    email: "sam@gmail.com",
};
// Union type examples
var data1 = { name: "Abhi" };
var data2 = { email: "anil@test.com" };
var data3 = { name: "Abhi", email: "anil@test.com" };
// Intersection type example
// Both name AND email are required
var data4 = {
    name: "Abhi",
    email: "anil@test.com",
};
console.log(empData1);
console.log(studentData1);
console.log(data1);
console.log(data2);
console.log(data3);
console.log(data4);
