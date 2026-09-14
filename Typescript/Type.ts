type DataType = {
  name: string;
  email: string;
};

type a = {
  name: string;
};

type b = {
  email: string;
};

// Union type: OR
type c = a | b;

// Intersection type: AND
type d = a & b;

// DataType requires both name and email
var empData1: DataType = {
  name: "Abhi",
  email: "anil@test.com",
};

var studentData1: DataType = {
  name: "Sam",
  email: "sam@gmail.com",
};

// Union type examples
var data1: c = { name: "Abhi" };

var data2: c = { email: "anil@test.com" };

var data3: c = { name: "Abhi", email: "anil@test.com" };

// Intersection type example
// Both name AND email are required
var data4: d = {
  name: "Abhi",
  email: "anil@test.com",
};

console.log(empData1);
console.log(studentData1);

console.log(data1);
console.log(data2);
console.log(data3);
console.log(data4);
