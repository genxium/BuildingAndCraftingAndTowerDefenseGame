module.export = cc.Class({
  extends: cc.Component,

  onCollisionEnter(other, self) {
    switch (other.node.name) {
      case "PolygonBoundaryShelter":
        if (null == other.node.tailOrHead) {
          break;
        }
        const thePlayerNode = self.node.thePlayerNode; // This is currently a dirty hack!
        const thePlayerVertice = globalShelterChainVerticeMap[thePlayerNode.uuid];
        const theImageObjectNode = other.node.imageObject.imageObjectNode;
        switch (other.node.tailOrHead) {
          case "head":
            const theHeadVertice = globalShelterChainVerticeMap[theImageObjectNode.uuid];         
            theHeadVertice.appendVertice(thePlayerVertice);
            window.updateLayerIndex(window.globalShelterChainVerticeMap);
          break;
          case "tail":
            const theTailVertice = globalShelterChainVerticeMap[theImageObjectNode.uuid];         
            thePlayerVertice.appendVertice(theTailVertice);
            window.updateLayerIndex(window.globalShelterChainVerticeMap);
          break;
          default:
          break;
        }
        break;
      default:
        break;
    }
  },

  onCollisionExit(other, self) {
    switch (other.node.name) {
      case "PolygonBoundaryShelter":
        if (null == other.node.tailOrHead) {
          break;
        }
        const thePlayerNode = self.node.thePlayerNode; // This is currently a dirty hack!
        const thePlayerVertice = globalShelterChainVerticeMap[thePlayerNode.uuid];
        const theImageObjectNode = other.node.imageObject.imageObjectNode;
        switch (other.node.tailOrHead) {
          case "head":
            const theHeadVertice = globalShelterChainVerticeMap[theImageObjectNode.uuid];         
            theHeadVertice.removeAppendedVertice(thePlayerVertice);
            window.updateLayerIndex(window.globalShelterChainVerticeMap);
          break;
          case "tail":
            const theTailVertice = globalShelterChainVerticeMap[theImageObjectNode.uuid];         
            thePlayerVertice.removeAppendedVertice(theTailVertice);
            window.updateLayerIndex(window.globalShelterChainVerticeMap);
          break;
          default:
          break;
        }
        break;
      default:
        break;
    }
  },
});
