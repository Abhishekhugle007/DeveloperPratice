var studentData: string | number | [] = "Abhi";
studentData = 20;
studentData = [];

console.log(studentData);

function fruitsData(): string |string [] | number {
  var item = 1;
  if (item > 1) {
    return ["Apple", "banana"];
  } else {
    return " Apple";
  }
}
console.log(fruitsData());