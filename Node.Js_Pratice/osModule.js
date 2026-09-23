const os = require('os');

// get the operating System name
const osName =os.type();
console.log('Operating System:' + osName);

console.log(os.platform());
console.log(os.arch());

console.log(os.hostname());
console.log(os.release());
console.log(os.uptime());

console.log(os.userInfo());

console.log(os.cpus());

console.log(os.freemem());
console.log(os.totalmem());