class product{
     
    // name;
    // price;
    // category;
    // description;
    // rating;
    constructor(productName, productPrice, productCategory, productDescription, productRating){
        this.name = productName;
        this.price = productPrice;
        this.category = productCategory;
        this.description = productDescription;
        this.rating = productRating;
    }
    addToCart() {
        console.log("Product added to cart");
    }
    removeFromCart(){
        console.log("Product removed from cart");
    }

    displayProduct(){
        console.log("Product displayed");
    }

    buyProduct(){
        console.log("Product bought");
    }
}
let iPhone = new product("iPhone", 1000, "Electronics", "Apple iPhone", 4.5);
console.log(iPhone);



/** 
let obj ={
    x:1,
    y:3,
    z:{
        
             x:3,
             y:4,
            fn:function(){
            const printValues = () => {
                console.log(this.x, this.y);
                
            }
            printValues();
        }
    }
}

   
obj.z.fn();
*/ 