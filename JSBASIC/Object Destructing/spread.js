const product={
    name:"Iphone",
    price:123,
    category:"Mobile"
};
const purchasedProduct={
    orderId:"XYZ",
    orderDate:25/9/2026,
    ...product
}

console.log(purchasedProduct)

