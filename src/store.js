// 用来存储响应式proxy和原始值的映射
exports.proxy2Raw = new WeakMap();

// 用来存储原始值和响应式proxy的映射
exports.raw2Proxy = new WeakMap();

// key: 监听对象 value: reactions4Raw
exports.connectionStore = new WeakMap();
