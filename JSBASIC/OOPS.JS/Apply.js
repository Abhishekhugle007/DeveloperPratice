const obj = {
    firstName: "Abhishekh",
    greet: function(message, company) {
        console.log(message, this.firstName, company);
    }
};

const newObj = {firstName: "Abhi"};

obj.greet.apply(newObj, ["Hello", "Etech Global Service"]);
