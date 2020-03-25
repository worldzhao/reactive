const { reactive, observe } = require("../index");

const counter = reactive({ count: 1 });

observe(() => {
  console.log(counter.count);
});

counter.count += 1;
