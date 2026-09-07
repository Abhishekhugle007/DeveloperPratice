const product={
    name:"iphone12",
    price:1200,
    category:{
        name:"Mobile",
        categoryId:12,
        type:{
            typeId:1,
            TypeName:"Electronic",
        }
    }
}
const{category:{type:{TypeName,typeId}}}=product;
console.log(TypeName,typeId);
