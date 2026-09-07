function product(n,p,d){
    this.name = n;
    this.price = p;
    this.description = d;
    this.displayProduct = function(){
        console.log("Name", this.name, "Price", this.price, "Description", this.description);
    }

}

let iPhone1 = new product("iPhone", 1000, "Apple iPhone");
iPhone1.displayProduct();