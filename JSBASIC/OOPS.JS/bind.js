const obj = {
    firstName: 'Abhishekh',

    greet: function() {
        console.log("Hello, my name is", this.firstName);
    }
};

obj.greet();

const newObj = {firstName: 'Abhi Etech global service Developer'};

const f = obj.greet.bind(newObj);

f();
