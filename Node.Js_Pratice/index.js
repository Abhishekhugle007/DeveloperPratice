const _ = require('lodash');

const arr=[1, 2, 3, 4, 5,6,7,8,9,10];

const chunkedArray = _.chunk(arr, 2);
console.log(chunkedArray); // Output: [[1, 2], [3, 4], [5, 6], [7, 8], [9, 10]]

const clonedArray = _.clone(arr);
console.log(clonedArray); // Output: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]


let chalk = require('chalk');
console.log(chalk.blue.bold('Hello world!'));


const axios = require('axios');

axios.get('https://jsonplaceholder.typicode.com/posts/1')
  .then(response => {
    console.log(response.data);
  })
  .catch(error => {
    console.error(error);
  });


  const dayjs = require('dayjs');
  console.log(dayjs().format('YYYY-MM-DD HH:mm:ss')); // Output: Current date and time in the specified format