/**
 * Creates a binary heap.
 *
 * @constructor
 * @param {function} customCompare An optional custom node comparison
 * function.
 */
var BinaryHeap = function (customCompare) {
  /**
   * The backing data of the heap.
   * @type {Object[]}
   * @private
   */
  this.list = [];

  if (customCompare) {
    this.compare = customCompare;
  }
};

/**
 * Builds a heap with the provided keys and values, this will discard the
 * heap's current data.
 *
 * @param {Array} keys An array of keys.
 * @param {Array} values An array of values. This must be the same size as the
 * key array.
 */
BinaryHeap.prototype.buildHeap = function (keys, values) {
  if (typeof values !== 'undefined' && values.length !== keys.length) {
    throw new Error('Key array must be the same length as value array');
  }

  var nodeArray = [];

  for (var i = 0; i < keys.length; i++) {
    nodeArray.push(new Node(keys[i], values ? values[i] : undefined));
  }

  buildHeapFromNodeArray(this, nodeArray);
};

/**
 * Clears the heap's data, making it an empty heap.
 */
BinaryHeap.prototype.clear = function () {
  this.list.length = 0;
};

/**
 * Extracts and returns the minimum node from the heap.
 *
 * @return {Node} node The heap's minimum node or undefined if the heap is
 * empty.
 */
BinaryHeap.prototype.extractMinimum = function () {
  if (!this.list.length) {
    return undefined;
  }
  if (this.list.length === 1) {
    return this.list.shift();
  }
  var min = this.list[0];
  this.list[0] = this.list.pop();
  heapify(this, 0);
  return min;
};

/**
 * Returns the minimum node from the heap.
 *
 * @return {Node} node The heap's minimum node or undefined if the heap is
 * empty.
 */
BinaryHeap.prototype.findMinimum = function () {
  return this.isEmpty() ? undefined : this.list[0];
};

/**
 * Inserts a new key-value pair into the heap.
 *
 * @param {Object} key The key to insert.
 * @param {Object} value The value to insert.
 * @return {Node} node The inserted node.
 */
BinaryHeap.prototype.insert = function (key, value) {
  var i = this.list.length;
  var node = new Node(key, value);
  this.list.push(node);
  var parent = getParent(i);
  while (typeof parent !== 'undefined' &&
      this.compare(this.list[i], this.list[parent]) < 0) {
    swap(this.list, i, parent);
    i = parent;
    parent = getParent(i);
  }
  return node;
};

/**
 * @return {boolean} Whether the heap is empty.
 */
BinaryHeap.prototype.isEmpty = function () {
  return !this.list.length;
};

/**
 * @return {number} The size of the heap.
 */
BinaryHeap.prototype.size = function () {
  return this.list.length;
};

/**
 * Joins another heap to this one.
 *
 * @param {BinaryHeap} otherHeap The other heap.
 */
BinaryHeap.prototype.union = function (otherHeap) {
  var array = this.list.concat(otherHeap.list);
  buildHeapFromNodeArray(this, array);
};

/**
 * Compares two nodes with each other.
 *
 * @private
 * @param {Object} a The first key to compare.
 * @param {Object} b The second key to compare.
 * @return -1, 0 or 1 if a < b, a == b or a > b respectively.
 */
BinaryHeap.prototype.compare = function (a, b) {
  if (a.key > b.key) {
    return 1;
  }
  if (a.key < b.key) {
    return -1;
  }
  return 0;
};

/**
 * Heapifies a node.
 *
 * @private
 * @param {BinaryHeap} heap The heap containing the node to heapify.
 * @param {number} i The index of the node to heapify.
 */
function heapify(heap, i) {
  var l = getLeft(i);
  var r = getRight(i);
  var smallest = i;
  if (l < heap.list.length &&
      heap.compare(heap.list[l], heap.list[i]) < 0) {
    smallest = l;
  }
  if (r < heap.list.length &&
      heap.compare(heap.list[r], heap.list[smallest]) < 0) {
    smallest = r;
  }
  if (smallest !== i) {
    swap(heap.list, i, smallest);
    heapify(heap, smallest);
  }
}

/**
 * Builds a heap from a node array, this will discard the heap's current data.
 *
 * @private
 * @param {BinaryHeap} heap The heap to override.
 * @param {Node[]} nodeArray The array of nodes for the new heap.
 */
function buildHeapFromNodeArray(heap, nodeArray) {
  heap.list = nodeArray;
  for (var i = Math.floor(heap.list.length / 2); i >= 0; i--) {
    heapify(heap, i);
  }
}

/**
 * Swaps two values in an array.
 *
 * @private
 * @param {Array} array The array to swap on.
 * @param {number} a The index of the first element.
 * @param {number} b The index of the second element.
 */
function swap(array, a, b) {
  var temp = array[a];
  array[a] = array[b];
  array[b] = temp;
}

/**
 * Gets the index of a node's parent.
 *
 * @private
 * @param {number} i The index of the node to get the parent of.
 * @return {number} The index of the node's parent.
 */
function getParent(i) {
  if (i === 0) {
    return undefined;
  }
  return Math.floor((i - 1) / 2);
}

/**
 * Gets the index of a node's left child.
 *
 * @private
 * @param {number} i The index of the node to get the left child of.
 * @return {number} The index of the node's left child.
 */
function getLeft(i) {
  return 2 * i + 1;
}

/**
 * Gets the index of a node's right child.
 *
 * @private
 * @param {number} i The index of the node to get the right child of.
 * @return {number} The index of the node's right child.
 */
function getRight(i) {
  return 2 * i + 2;
}

/**
 * Creates a node.
 *
 * @constructor
 * @param {Object} key The key of the new node.
 * @param {Object} value The value of the new node.
 */
function Node(key, value) {
  this.key = key;
  this.value = value;
}

module.exports = BinaryHeap;
