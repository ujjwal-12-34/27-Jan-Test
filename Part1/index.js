function checkElemFrequency(arr1, arr2){
    let ans = [];
    arr2.forEach((el)=>{
       let i =0;
       let count = 0;
       for(;i<arr1.length;i++){
           if(el==arr1[i])
               count++;
       }
       ans.push(count);
    });
    return ans;
}

console.log(checkElemFrequency([1,2,1,4], [1,2,3,4]));