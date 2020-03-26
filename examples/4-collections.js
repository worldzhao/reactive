const { reactive, observe } = require("../src");

const data1 = reactive(new Map([[1, "a"]]));

observe(() => {
  console.log("1 ->", data1.get(1));
});

data1.set(1, "b");

const data2 = reactive(new Map([[2, { a: "1" }]]));

observe(() => {
  console.log("2 -> a ->", data2.get(2).a);
});

data2.get(2).a = "2";
