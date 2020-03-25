const { reactive, observe } = require("../index");

const counter = reactive({ data: { count: 1 } });

observe(() => {
  console.log(counter.data.count);
});

counter.data.count += 1;
