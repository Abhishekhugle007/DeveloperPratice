let user:[number, string, boolean] =[1,"Anil", true];
user.push('mumbai');
console.log(user);


function getUser(): [string, number] {
  return ["Abhi", 25];
}

const [name, age] = getUser();

console.log(name);
console.log(age); 

