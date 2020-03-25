const _ = require("./utils");

// 用来存储响应式proxy和原始值的映射
const proxy2Raw = new WeakMap();

// 用来存储原始值和响应式proxy的映射
const raw2Proxy = new WeakMap();

// key: 监听对象 value: reactions4Raw
const connectionStore = new WeakMap();

// 依赖收集栈
const reactionStack = [];

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

function createReactive(raw) {
  const reactive = new Proxy(raw, { get, set });

  // 双向存储原始值和proxy的映射
  raw2Proxy.set(raw, reactive);
  proxy2Raw.set(reactive, raw);

  // 建立一个映射
  // 原始值 -> 存储这个原始值的各个key搜集到的函数依赖的Map
  connectionStore.set(raw, new Map());

  return reactive;
}

// get收集依赖
function get(target, key, receiver) {
  const result = Reflect.get(target, key, receiver);

  registerRunningReaction({ target, key, receiver, type: "get" });

  return result;
}

// 从栈的末尾取到正在运行的observe包裹的函数
function getRunningReaction() {
  const [runningReaction] = reactionStack.slice(-1);
  return runningReaction;
}

// 收集依赖
function registerRunningReaction(operation) {
  const { target, key } = operation;
  const runningReaction = getRunningReaction();

  if (runningReaction) {
    // 拿到原始对象 -> 观察者的map
    const reactions4Raw = connectionStore.get(target);
    // 拿到key -> 观察者的set
    let reactions4Key = reactions4Raw.get(key);

    if (!reactions4Key) {
      // 如果这个key之前没有收集过观察函数 就新建一个
      reactions4Key = new Set();
      // set到整个value的存储里去
      reactions4Raw.set(key, reactions4Key);
    }

    if (!reactions4Key.has(runningReaction)) {
      reactions4Key.add(runningReaction);
    }
  }
}

// set触发更新
function set(target, key, value, receiver) {
  // 拿到旧值
  const oldValue = target[key];
  // 设置新值
  const result = Reflect.set(target, key, value, receiver);
  queueReactions4Operation({
    target,
    key,
    value,
    oldValue,
    receiver,
    type: "set",
  });
  return result;
}

/**
 * 值更新时触发观察函数
 */
function queueReactions4Operation(operation) {
  getReactions4Operation(operation).forEach((reaction) => reaction());
}

/**
 * 根据key,type和原始对象 拿到需要触发的所有观察函数
 */
function getReactions4Operation({ target, key, type }) {
  // 拿到原始对象 -> 观察者map
  const reactions4Raw = connectionStore.get(target);
  // return reactions4Raw.get(key);
  // 把所有需要触发的观察函数都收集到新的set里
  const reactions4Key = new Set();
  addReactions4Key(reactions4Key, reactions4Raw, key);
  return reactions4Key;
}

function addReactions4Key(reactions4Key, reactions4Raw, key) {
  const reactions = reactions4Raw.get(key);
  reactions && reactions.forEach((reaction) => reactions4Key.add(reaction));
}

/**
 * 观察函数
 * 在传入的函数里去访问响应式的proxy 会收集传入的函数作为依赖
 * 下次访问的key发生变化的时候 就会重新运行这个函数
 */
function observe(fn) {
  // reaction是包装了原始函数只后的观察函数
  // 在runReactionWrap的上下文中执行原始函数 可以收集到依赖。
  const reaction = (...args) => {
    return runReactionWrap(reaction, fn, this, args);
  };
  // 先执行一遍reaction
  reaction();

  // 返回出去 让外部也可以手动调用
  return reaction;
}

// 把函数包裹为观察函数
function runReactionWrap(reaction, fn, context, args) {
  try {
    // 把当前的观察函数推入栈内 开始观察响应式proxy
    reactionStack.push(reaction);
    // 运行用户传入的函数 这个函数里访问proxy就会收集reaction函数作为依赖了
    return Reflect.apply(fn, context, args);
  } finally {
    // 运行完了永远要出栈
    reactionStack.pop();
  }
}

/**
 * 导出相关方法
 */
exports.reactive = reactive;
exports.observe = observe;
