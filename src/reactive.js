const { proxy2Raw, raw2Proxy, connectionStore } = require("./store");

// reactive与handlers/base存在循环引入 需要注意导出和导入的顺序
exports.reactive = reactive;

function reactive(raw) {
  // 已经被定义成响应式proxy了
  if (proxy2Raw.has(raw)) {
    return raw;
  }
  // 如果这个原始对象已经被定义过响应式
  const existProxy = raw2Proxy.get(raw);
  if (existProxy) {
    return existProxy;
  }

  // 新建响应式proxy
  return createReactive(raw);
}

const { getHandlers } = require("./handlers");

function createReactive(raw) {
  const reactive = new Proxy(raw, getHandlers(raw));

  // 双向存储原始值和proxy的映射
  raw2Proxy.set(raw, reactive);
  proxy2Raw.set(reactive, raw);

  // 建立一个映射
  // 原始值 -> 存储这个原始值的各个key搜集到的函数依赖的Map
  connectionStore.set(raw, new Map());

  return reactive;
}
