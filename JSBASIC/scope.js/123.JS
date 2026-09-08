const arr=[1,2,1,7,5,2,3,5,6,1,0];

const result ={};
arr.forEach((num) =>{
    if(result[num]){
        result[num]++;
    }
    else{
        result[num] =1;
    }
});
console.log(result);