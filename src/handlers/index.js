const { baseHandlers } = require("./base");

const { collectionHandlers } = require("./collections");

const handlers = new Map([
  [Map, collectionHandlers],
  [Set, collectionHandlers],
  [WeakMap, collectionHandlers],
  [WeakSet, collectionHandlers],
  [Object, baseHandlers],
  [Array, baseHandlers],
  [Int8Array, baseHandlers],
  [Uint8Array, baseHandlers],
  [Uint8ClampedArray, baseHandlers],
  [Int16Array, baseHandlers],
  [Uint16Array, baseHandlers],
  [Int32Array, baseHandlers],
  [Uint32Array, baseHandlers],
  [Float32Array, baseHandlers],
  [Float64Array, baseHandlers],
]);

/** 获取Proxy的handlers */
const getHandlers = (obj) => {
  return handlers.get(obj.constructor);
};

exports.handlers = handlers;
exports.getHandlers = getHandlers;
