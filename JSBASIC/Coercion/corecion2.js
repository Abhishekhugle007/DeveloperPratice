class product{
    constructor(n,p){
        this.name=n;
        this.price=p;

    }
    valueOf(){
        return this.price;

    }
}
const p = new product("Iphone",100);
console.log(p);
console.log(10 - p);