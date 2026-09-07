let obj ={id:101,name:"Abhi",salary:12344};

let emp =new Object();
emp.id=102;
emp.name="abhi";
console.log(emp);

console.log(obj);

function Emp(i,n,s){
    this.id=i;
    this.name=n;
    this.salary=s;
}

const e = new Emp(103,"abhi",1200);
console.log(e);

//
console.log(emp.id);
console.log(emp['name']);

emp.salary=130000;

emp.id=13;
emp['name']='mr.rahul'

delete emp.id

console.log(emp);