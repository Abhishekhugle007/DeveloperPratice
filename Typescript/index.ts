type IphoneFeatures = {[feature: string]: string;};

const iphone16: IphoneFeatures = {
    color: "Black",
    display: "6.3 inch",
    camera: "48MP",
    processor: "A19 Pro"
};

console.log(iphone16["camera"]);
console.log(iphone16["processor"]);
