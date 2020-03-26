const { OPERATION_TYPE, ITERATION_KEY } = require("./constants");
const { connectionStore } = require("./store");

// 依赖收集栈
const reactionStack = [];

// 从栈的末尾取到正在运行的observe包裹的函数
function getRunningReaction() {
  const [runningReaction] = reactionStack.slice(-1);
  return runningReaction;
}

/**
 * 在相关key上注册观察函数
 */
function registerRunningReaction(operation) {
  let { target, key, type } = operation;
  const runningReaction = getRunningReaction();

  if (runningReaction) {
    // 如果是遍历操作，单独给个key 后续触发这个key的观察函数
    if (type === OPERATION_TYPE.ITERATE) {
      key = ITERATION_KEY;
    }

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

/**
 * 根据相关操作触发观察函数
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
  // 把所有需要触发的观察函数都收集到新的set里
  const reactions4Key = new Set();
  addReactions4Key(reactions4Key, reactions4Raw, key);

  if ([OPERATION_TYPE.ADD, OPERATION_TYPE.DELETE].includes(type)) {
    // 数组遍历时会触发对length属性的访问 get劫持中搜集length属性并注册观察函数
    // 数组/对象新增/删除元素时应该触发相关观察函数
    const iterationKey = Array.isArray(target) ? "length" : ITERATION_KEY;
    addReactions4Key(reactions4Key, reactions4Raw, iterationKey);
  }
  return reactions4Key;
}

/**
 * 将对应key的观察函数都收集到新的set里
 */
function addReactions4Key(reactions4Key, reactions4Raw, key) {
  const reactions = reactions4Raw.get(key);
  reactions && reactions.forEach((reaction) => reactions4Key.add(reaction));
}

/**
 * 把函数包裹为观察函数
 */
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

exports.registerRunningReaction = registerRunningReaction;

exports.queueReactions4Operation = queueReactions4Operation;

exports.runReactionWrap = runReactionWrap;
