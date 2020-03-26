const { reactive } = require("../reactive");
const {
  registerRunningReaction,
  hasRunningReaction,
  queueReactions4Operation,
} = require("../reaction");
const { proxy2Raw, raw2Proxy } = require("../store");
const { hasOwnProperty, isObject } = require("../utils");
const { OPERATION_TYPE, ITERATION_KEY } = require("../constants");

const instrumentations = {
  get(key) {
    // 获取原始数据
    const target = proxy2Raw.get(this);
    // 注册get类型的依赖
    registerRunningReaction({ target, key, type: OPERATION_TYPE.GET });
    // 获取原始数据的__proto__
    const proto = Reflect.getPrototypeOf(this);
    // 调用原型链上的get方法求值 复杂数据类型继续定义为响应式
    return findReactive(proto.get.apply(target, arguments));
  },
  set(key, value) {
    // 获取原始数据
    const target = proxy2Raw.get(this);
    // 获取原始数据的__proto__
    const proto = Reflect.getPrototypeOf(this);
    // 判断是否是新增的key
    const isExistedKey = proto.has.call(target, key);
    // 拿到旧值
    const oldValue = proto.get.call(target, key);
    // 进行真实操作
    const result = proto.set.apply(target, arguments);
    if (!isExistedKey) {
      // 新增key值时以type:add触发观察函数
      queueReactions4Operation({
        target,
        key,
        value,
        type: OPERATION_TYPE.ADD,
      });
    } else if (value !== oldValue) {
      queueReactions4Operation({
        target,
        key,
        value,
        oldValue,
        type: OPERATION_TYPE.SET,
      });
    }
    return result;
  },
};

function findReactive(raw) {
  const proxy = raw2Proxy.get(raw);
  // 存在runningReaction时才可以定义 为啥？ 不是一定存在runningReaction的吗
  if (hasRunningReaction() && isObject(raw)) {
    if (proxy) return proxy;
    return reactive(raw);
  }
  return proxy || raw;
}

/**
 * 集合数据类型的proxy handlers，譬如Map,Set,WeakMap,WeakSet
 * 劫持所有get访问（针对其api进行函数劫持）如map.get map.set 移交至 instrumentations 上
 * 其实就是把隐式的get set劫持变成了显式的api函数劫持
 */
exports.collectionHandlers = {
  get(target, key, receiver) {
    // 返回劫持api
    target = hasOwnProperty.call(instrumentations, key)
      ? instrumentations
      : target;
    return Reflect.get(target, key, receiver);
  },
};
