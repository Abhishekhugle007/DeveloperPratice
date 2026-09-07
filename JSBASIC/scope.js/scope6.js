
//ReferenceError: bestFriend is not defined
var currentStudent="sanket";
console.log("start")
console.log(bestFriend);//undefined how ?

function updateStudentInfo(){ //global
    var currentStudentLocal ="sarthak";
    bestFriend="Tanmay";
    console.log('The best friend of ${currentStudent} is ${bestFriend}');

}