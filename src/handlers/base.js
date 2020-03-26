/**
 * 数组以及对象的proxy handlers
 */
const { reactive } = require("../reactive");
const {
  registerRunningReaction,
  queueReactions4Operation,
} = require("../reaction");
const { isObject, hasOwnProperty } = require("../utils");
const { OPERATION_TYPE } = require("../constants");

/**
 * proxy-handler-get
 * 劫持get访问 收集依赖
 */
function get(target, key, receiver) {
  const result = Reflect.get(target, key, receiver);

  registerRunningReaction({ target, key, receiver, type: OPERATION_TYPE.GET });

  // 如果访问的是对象 则返回这个对象的响应式proxy
  if (isObject(result)) {
    return reactive(result);
  }

  return result;
}

/**
 * proxy-handler-set
 * 劫持set操作 触发收集到的观察函数
 */
function set(target, key, value, receiver) {
  // 检查key是否为已存在的key
  const isExistedKey = hasOwnProperty.call(target, key);
  // 拿到旧值
  const oldValue = target[key];
  // 设置新值
  const result = Reflect.set(target, key, value, receiver);
  if (!isExistedKey) {
    // 新增key值时触发观察函数
    queueReactions4Operation({
      type: OPERATION_TYPE.ADD,
      target,
      key,
      value,
      receiver,
    });
  } else if (value !== oldValue) {
    // 已经存在的key值发生变化时触发更新函数
    queueReactions4Operation({
      type: OPERATION_TYPE.SET,
      target,
      key,
      value,
      oldValue,
      receiver,
    });
  }

  return result;
}

/**
 * proxy-handler-deleteProperty
 * 劫持删除操作 触发遍历相关的观察函数
 */
function deleteProperty(target, key) {
  // 检查key是否为已存在的key
  const isExistedKey = hasOwnProperty.call(target, key);
  // 取得该属性的值
  const oldValue = target[key];
  // 删除属性
  const result = Reflect.deleteProperty(target, key);
  // 存在该属性时方可进行更新
  if (isExistedKey) {
    // type为delete的话 会触发遍历相关的观察函数更新
    queueReactions4Operation({
      type: OPERATION_TYPE.DELETE,
      target,
      key,
      oldValue,
    });
  }
  return result;
}

/**
 * proxy-handler-ownKey
 * 劫持遍历访问 比如Object.keys 收集依赖
 */
function ownKeys(target) {
  registerRunningReaction({ target, type: OPERATION_TYPE.ITERATE });
  return Reflect.ownKeys(target);
}

const baseHandlers = { get, set, deleteProperty, ownKeys };

exports.baseHandlers = baseHandlers;
