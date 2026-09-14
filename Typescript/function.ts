function fn():string{
    return 'Apple';
}
fn();

function simple(){

}

function complex(): number | string {
    let data = 10;
    let type = "age";
    let name = "Anil";

    if (type == "age") {
        return data;   // number
    } else {
        return name;   // string
    }
}

console.log(complex());


