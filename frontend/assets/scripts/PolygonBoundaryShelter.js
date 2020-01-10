cc.Class({
  extends: cc.Component,
  // LIFE-CYCLE CALLBACKS:
  start() {
  },

  onLoad() {
  },

  update(dt) {
  },

  onCollisionEnter(other, self) {
    const playerScriptIns = self.getComponent(self.node.name);
    switch (other.node.name) {
      case "PolygonBoundaryShelter":
        if (null == other.node.tailOrHead) {
          break;
        }
        if (null == self.node.tailOrHead) {
          break; 
        }
				let theTailColliderNode = null;
				let theHeadColliderNode = null;
				if ("head" == other.node.tailOrHead && "tail" == self.node.tailOrHead) {
					theTailColliderNode = self.node;
					theHeadColliderNode = other.node;	
				} else if ("tail" == other.node.tailOrHead && "head" == self.node.tailOrHead) {
					theTailColliderNode = other.node;
					theHeadColliderNode = self.node;	
				} else {
          break;
        }
				const theToBeTailVertice = globalShelterChainVerticeMap[theTailColliderNode.imageObject.imageObjectNode.uuid]; 
				const theToBeHeadVertice = globalShelterChainVerticeMap[theHeadColliderNode.boundaryObj.imageObject.imageObjectNode.uuid];
				theToBeHeadVertice.appendVertice(theToBeTailVertice);
        window.updateLayerIndex(globalShelterChainVerticeMap);
        break;
			default:
			break;
		}
  },

  onCollisionStay(other, self) {
    // TBD.
  },

  onCollisionExit(other, self) {
    const playerScriptIns = self.getComponent(self.node.name);
    switch (other.node.name) {
      case "PolygonBoundaryShelter":
        if (null == other.node.tailOrHead) {
          break;
        }
        if (null == self.node.tailOrHead) {
          break; 
        }
				let theTailColliderNode = null;
				let theHeadColliderNode = null;
				if ("head" == other.node.tailOrHead && "tail" == self.node.tailOrHead) {
					theTailColliderNode = self.node;
					theHeadColliderNode = other.node;	
				} else if ("tail" == other.node.tailOrHead && "head" == self.node.tailOrHead) {
					theTailColliderNode = other.node;
					theHeadColliderNode = self.node;	
				} else {
          break;
        }
				const theToBeTailVertice = globalShelterChainVerticeMap[theTailColliderNode.imageObject.imageObjectNode.uuid]; 
				const theToBeHeadVertice = globalShelterChainVerticeMap[theHeadColliderNode.boundaryObj.imageObject.imageObjectNode.uuid];
        theToBeHeadVertice.removeAppendedVertice(theToBeTailVertice);
        window.updateLayerIndex(globalShelterChainVerticeMap);
        break;
			default:
			break;
		}
  }
});
