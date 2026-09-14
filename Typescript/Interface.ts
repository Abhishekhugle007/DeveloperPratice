interface Info {
    name: string;
    age: number;
    college: string;
}

var studentObj: Info = {
    name: "Anil",
    age: 30,
    college: "Parul"
};

var teacherObj: Info = {
    name: "Sam",
    age: 40,
    college: "Ram"
};
console.log(studentObj);
console.log(teacherObj);

console.log(studentObj.name);
console.log(teacherObj.college);