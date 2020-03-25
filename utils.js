exports.isObject = (x) =>
  Object.prototype.toString.call(x) === "[object Object]";
