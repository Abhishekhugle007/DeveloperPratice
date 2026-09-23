function abc(){
    console.log("Hii")
}

abc();
abc();

const EventEmitter = require('events');
const emitter = new EventEmitter();

emitter.on('greet', (name, age) => {
    console.log(`Hii, ${name}! You are ${age} years old.`);
});



emitter.emit('greet', "Abhishekh", 25);


//once method
emitter.once('greetOnce', (name) => {
    console.log(`Hii, ${name}! This will be logged only once.`);
});



emitter.emit('greetOnce', "Abhishekh");


// event Remove listener
const callback = (name, age) => {
    console.log(`Hii, ${name}! You are ${age} years old.`);
};
emitter.on('removeListener', callback);
emitter.removeListener('removeListener', callback);
emitter.emit('removeListener', "Abhishekh", 25); // This will not trigger the callback since it has been removed

