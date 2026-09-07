//"use strict"; // if we use this then it will stop the autoglobal 
var teacher="Abhishekh";// global
function fun(){//global
    teacher="sarthak";//fun
    content="js";//autoglobal
    console.log("wow",content,teacher);
}
console.log(teacher);//calling to var teacher global 
//console.log(content); // error
fun();
console.log(teacher);
console.log(content);