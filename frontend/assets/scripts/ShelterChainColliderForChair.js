module.export = cc.Class({
  extends: cc.Component,
  ctor() {
  },
  onCollisionEnter(other, self) {
    if (null == self.node.theChairNode) {
      return;
    }
    switch (other.node.name) {
      case "PolygonBoundaryShelter":
        if (null == other.node.tailOrHead) {
          break;
        }
        const theChairNode = self.node.theChairNode; // This is currently a dirty hack!
        const theChairVertice = globalShelterChainVerticeMap[theChairNode.uuid];
        const theImageObjectNode = other.node.imageObject.imageObjectNode;
        if (theImageObjectNode == self.node.boundStatefulBuildable) {
          switch (other.node.tailOrHead) {
            case "head":
            case "tail":
              const theVertice = globalShelterChainVerticeMap[theImageObjectNode.uuid];         
              theVertice.appendVertice(theChairVertice);
              window.updateLayerIndex(window.globalShelterChainVerticeMap);
            break;
            default:
            break;
          }
        } else {
          switch (other.node.tailOrHead) {
            case "tail":
              const theVertice = globalShelterChainVerticeMap[theImageObjectNode.uuid];         
              theChairVertice.appendVertice(theVertice);
              window.updateLayerIndex(window.globalShelterChainVerticeMap);
            break;
            default:
            break;
          }
        }
        break;
      default:
        break;
    }
  },

  onCollisionExit(other, self) {
    if (null == self.node.theChairNode) {
      return;
    }
    switch (other.node.name) {
      case "PolygonBoundaryShelter":
        if (null == other.node.tailOrHead) {
          break;
        }
        const theChairNode = self.node.theChairNode; // This is currently a dirty hack!
        const theChairVertice = globalShelterChainVerticeMap[theChairNode.uuid];
        const theImageObjectNode = other.node.imageObject.imageObjectNode;
        if (theImageObjectNode == self.node.boundStatefulBuildable) {
          switch (other.node.tailOrHead) {
            case "head":
            case "tail":
              const theVertice = globalShelterChainVerticeMap[theImageObjectNode.uuid];         
              theVertice.removeAppendedVertice(theChairVertice);
              window.updateLayerIndex(window.globalShelterChainVerticeMap);
            break;
            default:
            break;
          }
        } else {
          switch (other.node.tailOrHead) {
            case "tail":
              const theVertice = globalShelterChainVerticeMap[theImageObjectNode.uuid];         
              theChairVertice.removeAppendedVertice(theVertice);
              window.updateLayerIndex(window.globalShelterChainVerticeMap);
            break;
            default:
            break;
          }
        }
        break;
      default:
        break;
    }
  },
});
