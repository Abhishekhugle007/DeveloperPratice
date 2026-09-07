var teacher="Abhishekh ugle"; //global
function fun(){ //global

    var teacher="sarthak";
    console.log("hello",teacher);
}

function gun(){ // global
    var student="sanjay";
    console.log(student)
}

fun(); //calling to function fun 
gun(); // calling to function gun 