type personTA={name:string}
type personTB={age:number}
type personTC =personTA &personTB

var personDataA:personTA={name:'Anil'}
var personDataB:personTB={age:30}

var personDataC :personTC= {name:'sidhu',age:30}


console.log(personDataA);
console.log(personDataB);
console.log(personDataC);

