let inPreviewGIDCache = {};

window.CORE_LAYER_Z_INDEX = {
  // zIndex under map node.
  PLAYER: 2,  // 需要与UN_HIGHLIGHTED_STATEFUL_BUILDBALE_INSTANCE一样大.
  IMAGE_OBJ: 5,
  THE_BUTTON: 15,
  STATEFUL_BUILDABLE_INSTANCE_HIGHLIGHTER_LAYER: 99,
  LAWN_LAYER: 1,
  SHADOW_LAYER: 5,
  UN_HIGHLIGHTED_STATEFUL_BUILDABLE_INSTANCE: 2,
  HIGHLIGHTED_STATEFUL_BUILDABLE_INSTANCE: 100,
  DRAGGING_INGREDIENT: 100,
  STATEFUL_BUILDABLE_INSTANCE_CHAIR: 4, // 需要比UN_HIGHLIGHTED_STATEFUL_BUILDBALE_INSTANCE大2，这样npc才能处于桌子和建筑中间，并且不会被锅挡住.
  CACHED_GOLD: 95,
  POPUP_OVER_STATEFUL_BUILDABLE_FOLLOWING_NPC: 96,
  LABEL_POPUP_OVER_ORDERING_NPC: 97,
  POPUP_OVER_HOUSEKEEPER_NPC: 98,

  // zIndex under statefulBuildableInstance node.
  TO_COLLECT_INCOME: 2,
  UPGRADABLE_INDICATOR: 1,

  // zIndex under widgetsAboveAllNode.
  DIALOG: 11,
  WALLET_INFO: 9,
  DIALOG_MASK: 8,
  ACTIONABLE_BUBBLE: 7,
  COIN_ANIMATION_UNDER_MAP: 10,
  COIN_ANIMATION_UNDER_DIALOG: 12,
  // Utils
  INFINITY: 9999,
};

window._hideExistingShelter = function(mapScriptIns, mapNode, withinTiledLayer, tilePos) {
  if (!withinTiledLayer) return;
  const existingGID = withinTiledLayer.getTileGIDAt(tilePos.x, tilePos.y);
  withinTiledLayer.setTileGIDAt(0, tilePos.x, tilePos.y);
  return existingGID;
};

window._unhideExistingShelter = function(mapScriptIns, mapNode, withinTiledLayer, tilePos) {
  if (!withinTiledLayer) return;
  const tiledMapIns = mapNode.getComponent(cc.TiledMap);
  const theSubCache = inPreviewGIDCache[withinTiledLayer.uuid];
  if (null == theSubCache) return;
  const gid = theSubCache[tilePos.toString()];
  if (null == gid) return;
  withinTiledLayer.setTileGIDAt(gid, tilePos.x, tilePos.y);
};

window.previewShelter = function(mapScriptIns, mapNode, withinTiledLayer, tilePos) {
  if (!withinTiledLayer) return;
  const tiledMapIns = mapNode.getComponent(cc.TiledMap);

  const shelterPreviewLayer = tiledMapIns.getLayer("ShelterPreview");
  if (!shelterPreviewLayer) return;
  const gid = window._hideExistingShelter(mapScriptIns, mapNode, withinTiledLayer, tilePos);
  if (null == gid || 0 == gid) return;

  if (null == inPreviewGIDCache[withinTiledLayer.uuid]) {
    inPreviewGIDCache[withinTiledLayer.uuid] = {};
  }

  inPreviewGIDCache[withinTiledLayer.uuid][tilePos.toString()] = gid;

  const theTex = withinTiledLayer.getTexture();
  const theTileSet = withinTiledLayer.getTileSet();
  shelterPreviewLayer.setTileSet(theTileSet);
  shelterPreviewLayer.setTexture(theTex);
  shelterPreviewLayer.setTileGIDAt(gid, tilePos.x, tilePos.y);
};

window.cancelPreviewingOfShelter = function(mapScriptIns, mapNode, withinTiledLayer, tilePos) {
  if (!withinTiledLayer) return;
  const tiledMapIns = mapNode.getComponent(cc.TiledMap);
  const shelterPreviewLayer = tiledMapIns.getLayer("ShelterPreview");
  if (!shelterPreviewLayer) return;

  shelterPreviewLayer.setTileGIDAt(0, tilePos.x, tilePos.y);
  _unhideExistingShelter(mapScriptIns, mapNode, withinTiledLayer, tilePos);
};

class ShelterChainVertice {
  constructor() {
    this.id = null; 
		this.ccNode = null;
    this.prependedVertices = {};    
    this.appendedVertices = {};    
    this.layerIndex = 0;
    this.isGlueVertice = false;
  }

  appendVertice(newVertice) {
    /*
    * If hereby "true == this.prependedVertices.hasOwnProperty(newVertice.id)", then a short "cycle" is formed. 
    */
		if (this.appendedVertices.hasOwnProperty(newVertice.id)) {
			return false;
		}	
		this.appendedVertices[newVertice.id] = newVertice;
		newVertice.prependedVertices[this.id] = this;
    return true;
  } 

  removeAppendedVertice(existingVertice) {
		if (false == this.appendedVertices.hasOwnProperty(existingVertice.id)) {
			return false;
		}	
		delete this.appendedVertices[existingVertice.id]; 
		delete existingVertice.prependedVertices[this.id];
    return true;
  }
}

let globalShelterChainVerticeMap = {};
window.globalShelterChainVerticeMap = globalShelterChainVerticeMap;

window.addToGlobalShelterChainVerticeMap = function(theCcNode) {
	const theId = theCcNode.uuid;
	if (globalShelterChainVerticeMap.hasOwnProperty(theId)) {
		return false;
	}
	const newVertice = new ShelterChainVertice(); 
	newVertice.id = theId;
	newVertice.ccNode = theCcNode;
	globalShelterChainVerticeMap[theId] = newVertice; 
	return true;
}

window.removeFromGlobalShelterChainVerticeMap = function(theCcNode) {
	const theId = theCcNode.uuid;
	const theVertice = globalShelterChainVerticeMap[theId]; 
	if (null == theVertice) {
		return false;
	}

	for (let k in theVertice.appendedVertices) {
		const theAppendedVertice = theVertice.appendedVertices[k];  
		delete theAppendedVertice.prependedVertices[theVertice.id];
	}

	for (let k in theVertice.prependedVertices) {
		const thePrependedVertice = theVertice.prependedVertices[k];
		delete thePrependedVertice.appendedVertices[theVertice.id];
	} 

	delete globalShelterChainVerticeMap[theId];
	return true;
}

window.clearShelterChainVertice = function(theCcNode) {
  const theId = theCcNode.uuid;
	const theVertice = globalShelterChainVerticeMap[theId]; 
	if (null == theVertice) {
		return false;
	}

	for (let k in theVertice.appendedVertices) {
		const theAppendedVertice = theVertice.appendedVertices[k];  
		delete theAppendedVertice.prependedVertices[theVertice.id];
	}

	for (let k in theVertice.prependedVertices) {
		const thePrependedVertice = theVertice.prependedVertices[k];
		delete thePrependedVertice.appendedVertices[theVertice.id];
	} 

	return true; 
}

window.isUpdatingShelterChainLayerIndex = false;
window.updateLayerIndex = function(verticeMap) {
	if (null == verticeMap) {
		return false;
	}

	if (window.isUpdatingShelterChainLayerIndex) {
		return false;
	}

  window.isUpdatingShelterChainLayerIndex = true;

	let queue = [];
	let roots = {};
	for (let k in globalShelterChainVerticeMap) {
		const theVertice = globalShelterChainVerticeMap[k];	
		if (0 < Object.keys(theVertice.prependedVertices).length) continue;
		roots[theVertice.id] = theVertice;
		theVertice.layerIndex = 0;	
		queue.push(theVertice);
	}

	const maxIterationCount = 50000;
	let currentIterationCount = 0;
	while (0 < queue.length) {
		const thatVertice = queue.pop();
		++currentIterationCount;
		if (currentIterationCount > maxIterationCount) {
			cc.warn(`Within "updateLayerIndex", currentIterationCount == ${currentIterationCount} exceeds maxIterationCount == ${maxIterationCount}. Force breaking...`);
			break;
		}
		for (let k in thatVertice.appendedVertices) {
      if (thatVertice.prependedVertices.hasOwnProperty(k)) {
        // A dirty hack to avoid obvious "cycle".
        continue;
      }
			const theAppendedVertice = thatVertice.appendedVertices[k];  	
			const candidateLayerIndex = (1 + thatVertice.layerIndex); 
			theAppendedVertice.layerIndex = (theAppendedVertice.layerIndex > candidateLayerIndex ? theAppendedVertice.layerIndex : candidateLayerIndex);
			queue.push(theAppendedVertice);
		}	
	}

	for (let k in globalShelterChainVerticeMap) {
		const theVertice = globalShelterChainVerticeMap[k];	
		if (null == theVertice.ccNode.origZIndex) continue;
		setLocalZOrder(theVertice.ccNode, (theVertice.ccNode.origZIndex + theVertice.layerIndex)); 
	}

  window.isUpdatingShelterChainLayerIndex = false;
  return true;
}
