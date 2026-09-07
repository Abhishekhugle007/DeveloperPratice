
var teacher="Abhishekh ugle"; //global
function fun(){ //global

    var teacher="sarthak"; //fun
    console.log("hello",teacher); 

    function gun(){ // fun
        var student="sanjay";//gun
        console.log(student, teacher);
    }

    gun(); // calling to function gun 
}

fun(); 