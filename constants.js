/**
 * 触发收集依赖的操作 get iterate
 * 触发更新的操作 set(add) delete
 * @type {{ADD: string, DELETE: string, SET: string, GET: string, ITERATE: string}}
 */
const OPERATION_TYPE = {
  GET: "get",
  ITERATE: "iterate",
  SET: "set",
  ADD: "add",
  DELETE: "delete",
};

exports.OPERATION_TYPE = OPERATION_TYPE;

exports.ITERATION_KEY = Symbol("iteration");
