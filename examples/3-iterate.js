const { reactive, observe } = require("../index");

const data1 = reactive({ a: 1, b: 2 });

observe(() => {
  console.log(Object.keys(data1));
});

data1.c = 3;
delete data1.c;

const data2 = reactive([1, 2]);

observe(() => {
  console.log(data2.map((ele) => ele));
});

data2.push(3);
data2.pop();
