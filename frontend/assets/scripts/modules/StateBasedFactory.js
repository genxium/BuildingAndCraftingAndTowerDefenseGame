function StateBasedFactory(ENUM, defaultValue, specifiedFieldName, specifiedNodeMapField) {
  if (null == defaultValue) {
    defaultValue = Object.values(ENUM)[0];
  }
  
  let fieldName = 'state';
  if (null != specifiedFieldName) {
    fieldName = specifiedFieldName;
  }
  // if specifiedFieldName is null, valueFieldName will be _state, eventName will be onStateChanged
  let valueFieldName = '_' + fieldName, eventName = `on${fieldName.replace(/^[a-z]/, (str) => {return str.toUpperCase();})}Changed`;

  let nodeMapField = 'nodeMap', _nodeMapFiled = '_nodeMap';
  if (null != specifiedNodeMapField) {
    nodeMapField = specifiedNodeMapField;
    _nodeMapFiled = '_' + specifiedNodeMapField;
  }

  return {
    properties: {
      [valueFieldName]: {
        type: ENUM,
        default: defaultValue,
      },
      [fieldName]: {
        type: ENUM,
        get() {
          return this[valueFieldName];
        },
        set(val) {
          let prev = this[valueFieldName];
          this[valueFieldName] = val;
          this._refreshNodesActive(prev, val);
          if (prev != val) {
            this[eventName] && this[eventName](prev, val);
          }
        },
      },
      [_nodeMapFiled]: {
        default: function() {
          const _nodeMap = {};
          Object.values(ENUM).forEach(function(val) {
            _nodeMap[val] = [];
          });
          return _nodeMap;
        },
      },
      [nodeMapField]: {
        type: [cc.Node],
        get() {
          const self = this;
          let arr = self[_nodeMapFiled][this[fieldName]];
          if (null == arr) {
            arr = self[_nodeMapFiled][this[fieldName]] = [];
          }
          return arr;
        },
      },
    },
    _refreshNodesActive(prevState, currentState) {
      const self = this;
      let activedNodes = self[_nodeMapFiled][currentState];
      if (null == activedNodes) {
        activedNodes = self[_nodeMapFiled][currentState] = [];
      }
      let allNodes = [];
      Object.values(self[_nodeMapFiled]).forEach(function(nodeArray) {
        allNodes.push.apply(allNodes, nodeArray);
      })
      allNodes.filter(function(node) {
        return null != node;
      }).forEach(function(node) {
        if (activedNodes.includes(node)) {
          node.active = true;
        } else {
          node.active = false;
        }
      });
    },
  }
}

module.exports = StateBasedFactory; 

