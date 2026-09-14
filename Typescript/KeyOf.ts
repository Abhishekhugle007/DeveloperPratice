type User = {
    name: string;
    age: number;
    city: string;
};

type UserKeys = keyof User;
let key: UserKeys;

key = "name"; // 
key = "age";  // 
key = "city"; // 


//key = "salary"; //  error

console.log(key);





