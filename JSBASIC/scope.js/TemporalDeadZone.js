function fun()
// x is not visible here
{
    console.log(x);//TDZ
    let x ;
    x=5;
    console.log(x);
}
console.log("start");
fun();