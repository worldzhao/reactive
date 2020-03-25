const { reactive, observe } = require("../src");

const counter = reactive({ count: 1 });

observe(() => {
  console.log(counter.count);
});

counter.count += 1;
