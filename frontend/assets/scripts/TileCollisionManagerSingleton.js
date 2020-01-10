"use strict";

window.ALL_DISCRETE_DIRECTIONS_CLOCKWISE = [{
  dx: 0,
  dy: 1
}, {
  dx: 2,
  dy: 1
}, {
  dx: 2,
  dy: 0
}, {
  dx: 2,
  dy: -1
}, {
  dx: 0,
  dy: -1
}, {
  dx: -2,
  dy: -1
}, {
  dx: -2,
  dy: 0
}, {
  dx: -2,
  dy: 1
}];

function TileCollisionManager() {
}

TileCollisionManager.prototype._continuousFromCentreOfDiscreteTile = function(tiledMapNode, tiledMapIns, layerIns, discretePosX, discretePosY) {
  let mapOrientation = tiledMapIns.getMapOrientation();
  let mapTileRectilinearSize = tiledMapIns.getTileSize();
  let mapAnchorOffset = cc.v2(0, 0);
  let tileSize = {
    width: 0,
    height: 0
  };
  let layerOffset = cc.v2(0, 0);

  switch (mapOrientation) {
    case cc.TiledMap.Orientation.ORTHO:
      return null;

    case cc.TiledMap.Orientation.ISO:
      let tileSizeUnifiedLength = Math.sqrt(mapTileRectilinearSize.width * mapTileRectilinearSize.width / 4 + mapTileRectilinearSize.height * mapTileRectilinearSize.height / 4);
      tileSize = {
        width: tileSizeUnifiedLength,
        height: tileSizeUnifiedLength
      };
      let cosineThetaRadian = mapTileRectilinearSize.width / 2 / tileSizeUnifiedLength;
      let sineThetaRadian = mapTileRectilinearSize.height / 2 / tileSizeUnifiedLength;
      mapAnchorOffset = cc.v2(
        tiledMapNode.getContentSize().width * (0.5 - tiledMapNode.getAnchorPoint().x),
        tiledMapNode.getContentSize().height * (1 - tiledMapNode.getAnchorPoint().y)
      );
      layerOffset = cc.v2(0, 0);
      let transMat = [
        [cosineThetaRadian, -cosineThetaRadian],
        [-sineThetaRadian, -sineThetaRadian]
      ];
      let tmpContinuousX = (parseFloat(discretePosX) + 0.5) * tileSizeUnifiedLength;
      let tmpContinuousY = (parseFloat(discretePosY) + 0.5) * tileSizeUnifiedLength;
      let dContinuousXWrtMapNode = transMat[0][0] * tmpContinuousX + transMat[0][1] * tmpContinuousY;
      let dContinuousYWrtMapNode = transMat[1][0] * tmpContinuousX + transMat[1][1] * tmpContinuousY;
      return cc.v2(dContinuousXWrtMapNode, dContinuousYWrtMapNode).add(mapAnchorOffset);

    default:
      return null;
  }
};

TileCollisionManager.prototype._continuousToDiscrete = function(tiledMapNode, tiledMapIns, continuousNewPosLocalToMap, continuousOldPosLocalToMap) {
  /*
   * References
   * - http://cocos2d-x.org/docs/api-ref/creator/v1.5/classes/TiledMap.html
   * - http://cocos2d-x.org/docs/api-ref/creator/v1.5/classes/TiledLayer.html
   * - http://docs.mapeditor.org/en/stable/reference/tmx-map-format/?highlight=orientation#map
   */
  let mapOrientation = tiledMapIns.getMapOrientation();
  let mapTileRectilinearSize = tiledMapIns.getTileSize();
  let mapAnchorOffset = {
    x: 0,
    y: 0
  };
  let tileSize = {
    width: 0,
    height: 0
  };
  let layerOffset = {
    x: 0,
    y: 0
  };
  let convertedContinuousOldXInTileCoordinates = null;
  let convertedContinuousOldYInTileCoordinates = null;
  let convertedContinuousNewXInTileCoordinates = null;
  let convertedContinuousNewYInTileCoordinates = null;
  let oldWholeMultipleX = 0;
  let oldWholeMultipleY = 0;
  let newWholeMultipleX = 0;
  let newWholeMultipleY = 0;
  let discretePosX = 0;
  let discretePosY = 0;
  let exactBorderX = 0;
  let exactBorderY = 0; // These tmp variables are NOT NECESSARILY useful.

  let oldTmpX = 0;
  let oldTmpY = 0;
  let newTmpX = 0;
  let newTmpY = 0;

  switch (mapOrientation) {
    case cc.TiledMap.Orientation.ORTHO:
      mapAnchorOffset = {
        x: -(tiledMapNode.getContentSize().width * tiledMapNode.getAnchorPoint().x),
        y: tiledMapNode.getContentSize().height * (1 - tiledMapNode.getAnchorPoint().y)
      };
      layerOffset = {
        x: 0,
        y: 0
      };
      tileSize = mapTileRectilinearSize;
      convertedContinuousOldXInTileCoordinates = continuousOldPosLocalToMap.x - layerOffset.x - mapAnchorOffset.x;
      convertedContinuousOldYInTileCoordinates = mapAnchorOffset.y - (continuousOldPosLocalToMap.y - layerOffset.y);
      convertedContinuousNewXInTileCoordinates = continuousNewPosLocalToMap.x - layerOffset.x - mapAnchorOffset.x;
      convertedContinuousNewYInTileCoordinates = mapAnchorOffset.y - (continuousNewPosLocalToMap.y - layerOffset.y);
      break;

    case cc.TiledMap.Orientation.ISO:
      let tileSizeUnifiedLength = Math.sqrt(mapTileRectilinearSize.width * mapTileRectilinearSize.width / 4 + mapTileRectilinearSize.height * mapTileRectilinearSize.height / 4);
      tileSize = {
        width: tileSizeUnifiedLength,
        height: tileSizeUnifiedLength
      };
      let cosineThetaRadian = mapTileRectilinearSize.width / 2 / tileSizeUnifiedLength;
      let sineThetaRadian = mapTileRectilinearSize.height / 2 / tileSizeUnifiedLength;
      mapAnchorOffset = {
        x: tiledMapNode.getContentSize().width * (0.5 - tiledMapNode.getAnchorPoint().x),
        y: tiledMapNode.getContentSize().height * (1 - tiledMapNode.getAnchorPoint().y)
      };
      layerOffset = {
        x: 0,
        y: 0
      };
      oldTmpX = continuousOldPosLocalToMap.x - layerOffset.x - mapAnchorOffset.x;
      oldTmpY = continuousOldPosLocalToMap.y - layerOffset.y - mapAnchorOffset.y;
      newTmpX = continuousNewPosLocalToMap.x - layerOffset.x - mapAnchorOffset.x;
      newTmpY = continuousNewPosLocalToMap.y - layerOffset.y - mapAnchorOffset.y;
      let transMat = [[1 / (2 * cosineThetaRadian), -1 / (2 * sineThetaRadian)], [-1 / (2 * cosineThetaRadian), -1 / (2 * sineThetaRadian)]];
      convertedContinuousOldXInTileCoordinates = transMat[0][0] * oldTmpX + transMat[0][1] * oldTmpY;
      convertedContinuousOldYInTileCoordinates = transMat[1][0] * oldTmpX + transMat[1][1] * oldTmpY;
      convertedContinuousNewXInTileCoordinates = transMat[0][0] * newTmpX + transMat[0][1] * newTmpY;
      convertedContinuousNewYInTileCoordinates = transMat[1][0] * newTmpX + transMat[1][1] * newTmpY;
      break;

    default:
      break;
  }

  if (null == convertedContinuousOldXInTileCoordinates || null == convertedContinuousOldYInTileCoordinates || null == convertedContinuousNewXInTileCoordinates || null == convertedContinuousNewYInTileCoordinates) {
    return null;
  }

  oldWholeMultipleX = Math.floor(convertedContinuousOldXInTileCoordinates / tileSize.width);
  oldWholeMultipleY = Math.floor(convertedContinuousOldYInTileCoordinates / tileSize.height);
  newWholeMultipleX = Math.floor(convertedContinuousNewXInTileCoordinates / tileSize.width);
  newWholeMultipleY = Math.floor(convertedContinuousNewYInTileCoordinates / tileSize.height); // Mind that the calculation of `exactBorderY` is different for `convertedContinuousOldYInTileCoordinates <> convertedContinuousNewYInTileCoordinates`. 

  if (convertedContinuousOldYInTileCoordinates < convertedContinuousNewYInTileCoordinates) {
    exactBorderY = newWholeMultipleY * tileSize.height;

    if (convertedContinuousNewYInTileCoordinates > exactBorderY && convertedContinuousOldYInTileCoordinates <= exactBorderY) {
      // Will try to cross the border if (newWholeMultipleY != oldWholeMultipleY).
      discretePosY = newWholeMultipleY;
    } else {
      discretePosY = oldWholeMultipleY;
    }
  } else if (convertedContinuousOldYInTileCoordinates > convertedContinuousNewYInTileCoordinates) {
    exactBorderY = oldWholeMultipleY * tileSize.height;

    if (convertedContinuousNewYInTileCoordinates < exactBorderY && convertedContinuousOldYInTileCoordinates >= exactBorderY) {
      // Will try to cross the border if (newWholeMultipleY != oldWholeMultipleY).
      discretePosY = newWholeMultipleY;
    } else {
      discretePosY = oldWholeMultipleY;
    }
  } else {
    discretePosY = oldWholeMultipleY;
  } // Mind that the calculation of `exactBorderX` is different for `convertedContinuousOldXInTileCoordinates <> convertedContinuousNewXInTileCoordinates`. 


  if (convertedContinuousOldXInTileCoordinates < convertedContinuousNewXInTileCoordinates) {
    exactBorderX = newWholeMultipleX * tileSize.width;

    if (convertedContinuousNewXInTileCoordinates > exactBorderX && convertedContinuousOldXInTileCoordinates <= exactBorderX) {
      // Will cross the border if (newWholeMultipleX != oldWholeMultipleX).
      discretePosX = newWholeMultipleX;
    } else {
      discretePosX = oldWholeMultipleX;
    }
  } else if (convertedContinuousOldXInTileCoordinates > convertedContinuousNewXInTileCoordinates) {
    exactBorderX = oldWholeMultipleX * tileSize.width;

    if (convertedContinuousNewXInTileCoordinates < exactBorderX && convertedContinuousOldXInTileCoordinates >= exactBorderX) {
      // Will cross the border if (newWholeMultipleX != oldWholeMultipleX).
      discretePosX = newWholeMultipleX;
    } else {
      discretePosX = oldWholeMultipleX;
    }
  } else {
    discretePosX = oldWholeMultipleX;
  }

  return {
    x: discretePosX,
    y: discretePosY
  };
};

TileCollisionManager.prototype.continuousMapNodeVecToContinuousObjLayerVec = function(withTiledMapNode, continuousMapNodeVec) {
  let tiledMapIns = withTiledMapNode.getComponent(cc.TiledMap);

  let mapOrientation = tiledMapIns.getMapOrientation();
  let mapTileRectilinearSize = tiledMapIns.getTileSize();

  switch (mapOrientation) {
    case cc.TiledMap.Orientation.ORTHO:
      // TODO
      return null;

    case cc.TiledMap.Orientation.ISO:
      let tileSizeUnifiedLength = Math.sqrt(mapTileRectilinearSize.width * mapTileRectilinearSize.width * 0.25 + mapTileRectilinearSize.height * mapTileRectilinearSize.height * 0.25);
      let isometricObjectLayerPointOffsetScaleFactor = (tileSizeUnifiedLength / mapTileRectilinearSize.height);
      let inverseIsometricObjectLayerPointOffsetScaleFactor = 1 / isometricObjectLayerPointOffsetScaleFactor;

      let cosineThetaRadian = (mapTileRectilinearSize.width * 0.5) / tileSizeUnifiedLength;
      let sineThetaRadian = (mapTileRectilinearSize.height * 0.5) / tileSizeUnifiedLength;

      let inverseTransMat = [
        [inverseIsometricObjectLayerPointOffsetScaleFactor * 0.5 * (1 / cosineThetaRadian), -inverseIsometricObjectLayerPointOffsetScaleFactor * 0.5 * (1 / sineThetaRadian)],
        [-inverseIsometricObjectLayerPointOffsetScaleFactor * 0.5 * (1 / cosineThetaRadian), -inverseIsometricObjectLayerPointOffsetScaleFactor * 0.5 * (1 / sineThetaRadian)]
      ];
      let convertedVecX = inverseTransMat[0][0] * continuousMapNodeVec.x + inverseTransMat[0][1] * continuousMapNodeVec.y;
      let convertedVecY = inverseTransMat[1][0] * continuousMapNodeVec.x + inverseTransMat[1][1] * continuousMapNodeVec.y;

      return cc.v2(convertedVecX, convertedVecY);

    default:
      return null;
  }
}

TileCollisionManager.prototype.continuousObjLayerVecToContinuousMapNodeVec = function(withTiledMapNode, continuousObjLayerVec) {
  let tiledMapIns = withTiledMapNode.getComponent(cc.TiledMap);

  let mapOrientation = tiledMapIns.getMapOrientation();
  let mapTileRectilinearSize = tiledMapIns.getTileSize();

  switch (mapOrientation) {
    case cc.TiledMap.Orientation.ORTHO:
      // TODO
      return null;

    case cc.TiledMap.Orientation.ISO:
      let tileSizeUnifiedLength = Math.sqrt(mapTileRectilinearSize.width * mapTileRectilinearSize.width * 0.25 + mapTileRectilinearSize.height * mapTileRectilinearSize.height * 0.25);
      let isometricObjectLayerPointOffsetScaleFactor = (tileSizeUnifiedLength / mapTileRectilinearSize.height);

      let cosineThetaRadian = (mapTileRectilinearSize.width * 0.5) / tileSizeUnifiedLength;
      let sineThetaRadian = (mapTileRectilinearSize.height * 0.5) / tileSizeUnifiedLength;

      let transMat = [
        [isometricObjectLayerPointOffsetScaleFactor * cosineThetaRadian, -isometricObjectLayerPointOffsetScaleFactor * cosineThetaRadian],
        [-isometricObjectLayerPointOffsetScaleFactor * sineThetaRadian, -isometricObjectLayerPointOffsetScaleFactor * sineThetaRadian]
      ];
      let convertedVecX = transMat[0][0] * continuousObjLayerVec.x + transMat[0][1] * continuousObjLayerVec.y;
      let convertedVecY = transMat[1][0] * continuousObjLayerVec.x + transMat[1][1] * continuousObjLayerVec.y;

      return cc.v2(convertedVecX, convertedVecY);

    default:
      return null;
  }
}

TileCollisionManager.prototype.continuousObjLayerOffsetToContinuousMapNodePos = function(withTiledMapNode, continuousObjLayerOffset) {
  let tiledMapIns = withTiledMapNode.getComponent(cc.TiledMap);

  let mapOrientation = tiledMapIns.getMapOrientation();
  let mapTileRectilinearSize = tiledMapIns.getTileSize();

  switch (mapOrientation) {
    case cc.TiledMap.Orientation.ORTHO:
      // TODO
      return null;

    case cc.TiledMap.Orientation.ISO:
      let calibratedVec = continuousObjLayerOffset; // TODO: Respect the real offsets!

      // The immediately following statement takes a magic assumption that the anchor of `withTiledMapNode` is (0.5, 0.5) which is NOT NECESSARILY true.
      let layerOffset = cc.v2(0, +(withTiledMapNode.getContentSize().height * 0.5));

      return layerOffset.add(this.continuousObjLayerVecToContinuousMapNodeVec(withTiledMapNode, calibratedVec));

    default:
      return null;
  }
}

TileCollisionManager.prototype.continuousMapNodePosToContinuousObjLayerOffset = function(withTiledMapNode, continuousMapNodePos) {
  let tiledMapIns = withTiledMapNode.getComponent(cc.TiledMap);

  let mapOrientation = tiledMapIns.getMapOrientation();
  let mapTileRectilinearSize = tiledMapIns.getTileSize();

  switch (mapOrientation) {
    case cc.TiledMap.Orientation.ORTHO:
      // TODO
      return null;

    case cc.TiledMap.Orientation.ISO:
      // The immediately following statement takes a magic assumption that the anchor of `withTiledMapNode` is (0.5, 0.5) which is NOT NECESSARILY true.
      let layerOffset = cc.v2(0, +(withTiledMapNode.getContentSize().height * 0.5));
      let calibratedVec = continuousMapNodePos.sub(layerOffset); // TODO: Respect the real offsets!
      return this.continuousMapNodeVecToContinuousObjLayerVec(withTiledMapNode, calibratedVec);

    default:
      return null;
  }
}

/**
 * Note that `TileCollisionManager.extractBoundaryObjects` returns everything with coordinates local to `withTiledMapNode`!
 */
TileCollisionManager.prototype.extractBoundaryObjects = function(withTiledMapNode) {
  let toRet = {
    barriers: [],
    transparents: [],
    shelterChainTails: [],
    shelterChainHeads: [],
    sheltersZReducer: [],
    frameAnimations: [],
    imageObjects: [],
    grandBoundaries: [],
    statefulBuildableInhibitions: [],
    attackingNpcPositionInMapNodeList: [],
    typedBuildableAreaDict: {},  
    enemyAttackingNpcPositionInMapNodeList: [],
    enemyEscapingTargetList: [],
    allyEscapingTargetList: [],
    buildableInitialPositionMap: {},
    soldierDroppables: [],
    initialCameraPos: [], // Of length 1.
  };
  let tiledMapIns = withTiledMapNode.getComponent(cc.TiledMap); // This is a magic name.
  let mapTileSize = tiledMapIns.getTileSize();
  let mapOrientation = tiledMapIns.getMapOrientation();

  /*
   * Copies from https://github.com/cocos-creator/engine/blob/master/cocos2d/tilemap/CCTiledMap.js as a hack to parse advanced <tile> info
   * of a TSX file. [BEGINS]
   */
  let file = tiledMapIns._tmxFile;
  let texValues = file.textures;
  let texKeys = file.textureNames;
  let textures = {};
  for (let texIdx = 0; texIdx < texValues.length; ++texIdx) {
    textures[texKeys[texIdx]] = texValues[texIdx];
  }

  let tsxFileNames = file.tsxFileNames;
  let tsxFiles = file.tsxFiles;
  let tsxMap = {};
  for (let tsxFilenameIdx = 0; tsxFilenameIdx < tsxFileNames.length; ++tsxFilenameIdx) {
    if (0 >= tsxFileNames[tsxFilenameIdx].length) continue;
    tsxMap[tsxFileNames[tsxFilenameIdx]] = tsxFiles[tsxFilenameIdx].text;
  }

  let mapInfo = new cc.TMXMapInfo(file.tmxXmlStr, tsxMap, textures);
  let tileSets = mapInfo.getTilesets();
  /*
   * Copies from https://github.com/cocos-creator/engine/blob/master/cocos2d/tilemap/CCTiledMap.js as a hack to parse advanced <tile> info
   * of a TSX file. [ENDS]
   */
  let gidBoundariesMap = {};
  let tilesElListUnderTilesets = {};
  for (let tsxFilenameIdx = 0; tsxFilenameIdx < tsxFileNames.length; ++tsxFilenameIdx) {
    let tsxOrientation = tileSets[tsxFilenameIdx].orientation;
    if (cc.TiledMap.Orientation.ORTHO == tsxOrientation) {
      cc.error("Error at tileset %s: We proceed with ONLY tilesets in ORTHO orientation for all map orientations by now.", tsxFileNames[tsxFilenameIdx]);
      continue;
    }

    let tsxXMLStr = tsxMap[tsxFileNames[tsxFilenameIdx]];
    let selTileset = mapInfo._parser._parseXML(tsxXMLStr).documentElement;
    let firstGid = (parseInt(selTileset.getAttribute('firstgid')) || tileSets[tsxFilenameIdx].firstGid || 0);
    let currentTiles = selTileset.getElementsByTagName('tile');
    if (!currentTiles) continue;
    tilesElListUnderTilesets[tsxFileNames[tsxFilenameIdx]] = currentTiles;

    for (let tileIdx = 0; tileIdx < currentTiles.length; ++tileIdx) {
      let currentTile = currentTiles[tileIdx];
      let parentGID = parseInt(firstGid) + parseInt(currentTile.getAttribute('id') || 0);
      let childrenOfCurrentTile = null;
      if (cc.sys.isNative) {
        childrenOfCurrentTile = currentTile.getElementsByTagName("objectgroup");
      } else if (cc.sys.platform == cc.sys.WECHAT_GAME) {
        childrenOfCurrentTile = currentTile.childNodes;
      } else {
        childrenOfCurrentTile = currentTile.children;
      }
      for (let childIdx = 0; childIdx < childrenOfCurrentTile.length; ++childIdx) {
        let ch = childrenOfCurrentTile[childIdx];
        if (!(ch.nodeName === 'objectgroup')) continue;
        let currentObjectGroupUnderTile = mapInfo._parseObjectGroup(ch);
        gidBoundariesMap[parentGID] = {
          barriers: [],
          shelterChainTails: [],
          shelterChainHeads: [],
          transparents: [],
          sheltersZReducer: [],
          tilesetTileSize: tileSets[tsxFilenameIdx]._tileSize,
        };
        for (let oidx = 0; oidx < currentObjectGroupUnderTile._objects.length; ++oidx) {
          let oo = currentObjectGroupUnderTile._objects[oidx];
          let polylinePoints = oo.polylinePoints;
          if (!polylinePoints) continue;
          let boundaryType = oo.boundary_type;
          switch (boundaryType) {
            case "barrier":
              let brToPushTmp = [];
              for (let bidx = 0; bidx < polylinePoints.length; ++bidx) {
                brToPushTmp.push(cc.v2(oo.x, oo.y).add(polylinePoints[bidx]));
              }
              gidBoundariesMap[parentGID].barriers.push(brToPushTmp);
              break;
            case "transparent":
              let transToPushTmp = [];
              for (let shidx = 0; shidx < polylinePoints.length; ++shidx) {
                transToPushTmp.push(cc.v2(oo.x, oo.y).add(polylinePoints[shidx]));
              }
              gidBoundariesMap[parentGID].transparents.push(transToPushTmp);
              break;
            case "shelter_z_reducer":
              let shzrToPushTmp = [];
              for (let shzridx = 0; shzridx < polylinePoints.length; ++shzridx) {
                shzrToPushTmp.push(cc.v2(oo.x, oo.y).add(polylinePoints[shzridx]));
              }
              gidBoundariesMap[parentGID].sheltersZReducer.push(shzrToPushTmp);
              break;
            case "shelter_chain_tail":
              let shChainTailToPushTmp = [];
              for (let shidx = 0; shidx < polylinePoints.length; ++shidx) {
                shChainTailToPushTmp.push(cc.v2(oo.x, oo.y).add(polylinePoints[shidx]));
              }
              gidBoundariesMap[parentGID].shelterChainTails.push(shChainTailToPushTmp);
              break;
            case "shelter_chain_head":
              let shChainHeadToPushTmp = [];
              for (let shidx = 0; shidx < polylinePoints.length; ++shidx) {
                shChainHeadToPushTmp.push(cc.v2(oo.x, oo.y).add(polylinePoints[shidx]));
              }
              gidBoundariesMap[parentGID].shelterChainHeads.push(shChainHeadToPushTmp);
              break;
            default:
              break;
          }
        }
      }
    }
  }
  // Reference http://docs.cocos.com/creator/api/en/classes/TiledMap.html.
  let allObjectGroups = tiledMapIns.getObjectGroups();

  for (let i = 0; i < allObjectGroups.length; ++i) {
    // Reference http://docs.cocos.com/creator/api/en/classes/TiledObjectGroup.html.
    let objectGroup = allObjectGroups[i];
    if ("sprite_frame" != objectGroup.getProperty("type")) continue;
    let allObjects = objectGroup.getObjects();
    for (let j = 0; j < allObjects.length; ++j) {
      let object = allObjects[j];
      let gid = object.gid;
      if (!gid || gid <= 0) {
        // cc.log("gid is null ", gid)
        continue;
      }
      let spriteFrameInfoForGid = getOrCreateSpriteFrameForGid(gid, mapInfo, tilesElListUnderTilesets);
      if (!spriteFrameInfoForGid) {
        // cc.log("cannot find the spriteFrameInfoForGid for gid: ", gid)
        continue;
      }

      const theImageObject = {
        posInMapNode: this.continuousObjLayerOffsetToContinuousMapNodePos(withTiledMapNode, object.offset),
        origSize: spriteFrameInfoForGid.origSize,
        sizeInMapNode: cc.size(object.width, object.height),
        spriteFrame: spriteFrameInfoForGid.spriteFrame,
        imageObjectNode: null,
        name: object.name, //FOR DEBUG 
      };
      toRet.imageObjects.push(theImageObject);
      if (!gidBoundariesMap[gid]) {
        continue;
      }
      const gidBoundaries = gidBoundariesMap[gid];
      // Note that currently the polyline points within each `gidBoundaries` is respecting the "topleft corner as (0, 0) where x+ points toward right and y+ points toward down."
      // Due to a special requirement for "image-type Tiled object" by "CocosCreator v2.0.1", we'll be using cc.v2(0.5, 0) as the anchor of the scaled spriteframe, but cc.v2(0, 0) as the anchor of the scaled boundaries.
      let unscaledSpriteFrameCenterInMapNode = this.continuousObjLayerOffsetToContinuousMapNodePos(withTiledMapNode, object.offset);
      const scaleX = (object.width / spriteFrameInfoForGid.origSize.width);
      const scaleY = (object.height / spriteFrameInfoForGid.origSize.height);
      let currentSpriteFrameAnchorPosInMapNode = unscaledSpriteFrameCenterInMapNode.sub(cc.v2(0, 0.5 * spriteFrameInfoForGid.origSize.height));
      let currentObjPosInMapNode = currentSpriteFrameAnchorPosInMapNode.add(cc.v2(0, 0.5 * gidBoundaries.tilesetTileSize.height /* WARNING: Using "0.5*object.height" instead would be INCORRECT! */ ));

      for (let bidx = 0; bidx < gidBoundaries.barriers.length; ++bidx) {
        let theBarrier = gidBoundaries.barriers[bidx]; // An array of cc.v2 points.
        let brToPushTmp = [];
        for (let tbidx = 0; tbidx < theBarrier.length; ++tbidx) {
          const polylinePointOffsetInMapNode = cc.v2(-scaleX * (0.5 * gidBoundaries.tilesetTileSize.width - theBarrier[tbidx].x), scaleY * (gidBoundaries.tilesetTileSize.height - theBarrier[tbidx].y));
          brToPushTmp.push(currentObjPosInMapNode.add(polylinePointOffsetInMapNode));
        }
        brToPushTmp.imageObject = theImageObject;
        toRet.barriers.push(brToPushTmp);
      }
      for (let shidx = 0; shidx < gidBoundaries.shelterChainTails.length; ++shidx) {
        let theShelter = gidBoundaries.shelterChainTails[shidx]; // An array of cc.v2 points.
        let shToPushTmp = [];
        for (let tshidx = 0; tshidx < theShelter.length; ++tshidx) {
          const polylinePointOffsetInMapNode = cc.v2(-scaleX * (0.5 * gidBoundaries.tilesetTileSize.width - theShelter[tshidx].x), scaleY * (gidBoundaries.tilesetTileSize.height - theShelter[tshidx].y));
          shToPushTmp.push(currentObjPosInMapNode.add(polylinePointOffsetInMapNode));
        }
        shToPushTmp.imageObject = theImageObject;
        toRet.shelterChainTails.push(shToPushTmp);
      }
      for (let shidx = 0; shidx < gidBoundaries.shelterChainHeads.length; ++shidx) {
        let theShelter = gidBoundaries.shelterChainHeads[shidx]; // An array of cc.v2 points.
        let shToPushTmp = [];
        for (let tshidx = 0; tshidx < theShelter.length; ++tshidx) {
          const polylinePointOffsetInMapNode = cc.v2(-scaleX * (0.5 * gidBoundaries.tilesetTileSize.width - theShelter[tshidx].x), scaleY * (gidBoundaries.tilesetTileSize.height - theShelter[tshidx].y));
          shToPushTmp.push(currentObjPosInMapNode.add(polylinePointOffsetInMapNode));
        }
        shToPushTmp.imageObject = theImageObject;
        toRet.shelterChainHeads.push(shToPushTmp);
      }
      for (let shzridx = 0; shzridx < gidBoundaries.sheltersZReducer.length; ++shzridx) {
        let theShelter = gidBoundaries.sheltersZReducer[shzridx]; // An array of cc.v2 points.
        let shzrToPushTmp = [];
        for (let tshzridx = 0; tshzridx < theShelter.length; ++tshzridx) {
          const polylinePointOffsetInMapNode = cc.v2(-scaleX * (0.5 * gidBoundaries.tilesetTileSize.width - theShelter[tshzridx].x), scaleY * (gidBoundaries.tilesetTileSize.height - theShelter[tshzridx].y));
          shzrToPushTmp.push(currentObjPosInMapNode.add(polylinePointOffsetInMapNode));
        }
        shzrToPushTmp.imageObject = theImageObject;
        toRet.sheltersZReducer.push(shzrToPushTmp);
      }
    }
  }

  for (let i = 0; i < allObjectGroups.length; ++i) {
    // Reference http://docs.cocos.com/creator/api/en/classes/TiledObjectGroup.html.
    let objectGroup = allObjectGroups[i];
    if ("frame_anim" != objectGroup.getProperty("type")) continue;
    let allObjects = objectGroup.getObjects();
    for (let j = 0; j < allObjects.length; ++j) {
      let object = allObjects[j];
      let gid = object.gid;
      if (!gid || gid <= 0) {
        continue;
      }
      let animationClipInfoForGid = getOrCreateAnimationClipForGid(gid, mapInfo, tilesElListUnderTilesets);
      if (!animationClipInfoForGid) continue;
      toRet.frameAnimations.push({
        posInMapNode: this.continuousObjLayerOffsetToContinuousMapNodePos(withTiledMapNode, object.offset),
        origSize: animationClipInfoForGid.origSize,
        sizeInMapNode: cc.size(object.width, object.height),
        animationClip: animationClipInfoForGid.animationClip,
        type: objectGroup.getProperty("animType"),
      });
    }
  }

  for (let i = 0; i < allObjectGroups.length; ++i) {
    let objectGroup = allObjectGroups[i];
    if ("barrier_and_shelter" != objectGroup.getProperty("type")) continue;
    let allObjects = objectGroup.getObjects();
    for (let j = 0; j < allObjects.length; ++j) {
      let object = allObjects[j];
      let gid = object.gid;
      if (gid > 0) {
        continue;
      }
      let polylinePoints = object.polylinePoints;
      if (!polylinePoints) {
        continue
      }
      for (let k = 0; k < polylinePoints.length; ++k) {
        /* Since CocosCreatorv2.1.3, the Y-coord of object polylines DIRECTLY DRAWN ON tmx with ISOMETRIC ORIENTATION is inverted. -- YFLu, 2019-11-01. */
        polylinePoints[k].y = -polylinePoints[k].y;
      }
      let boundaryType = object.boundary_type;
      switch (boundaryType) {
        case "barrier":
          let toPushBarriers = [];
          for (let k = 0; k < polylinePoints.length; ++k) {
            const tmp = object.offset.add(polylinePoints[k]);
            toPushBarriers.push(this.continuousObjLayerOffsetToContinuousMapNodePos(withTiledMapNode, tmp));
          }
          toRet.barriers.push(toPushBarriers);
          break;
        case "transparent":
          let toPushTrans = [];
          for (let kk = 0; kk < polylinePoints.length; ++kk) {
            toPushTrans.push(this.continuousObjLayerOffsetToContinuousMapNodePos(withTiledMapNode, object.offset.add(polylinePoints[kk])));
          }
          toRet.transparents.push(toPushTrans);
          break;
        case "shelter_z_reducer":
          let toPushSheltersZReducer = [];
          for (let kkk = 0; kkk < polylinePoints.length; ++kkk) {
            toPushSheltersZReducer.push(this.continuousObjLayerOffsetToContinuousMapNodePos(withTiledMapNode, object.offset.add(polylinePoints[kkk])));
          }
          toRet.sheltersZReducer.push(toPushSheltersZReducer);
          break;
        case "stateful_buildable_inhibition":
          let toPushStatefulBuildableInhibition = [];
          for (let kkk = 0; kkk < polylinePoints.length; ++kkk) {
            toPushStatefulBuildableInhibition.push(this.continuousObjLayerOffsetToContinuousMapNodePos(withTiledMapNode, object.offset.add(polylinePoints[kkk])));
          }
          toRet.statefulBuildableInhibitions.push(toPushStatefulBuildableInhibition);
          break;
        case "grand_boundary":
          let toPushGrandBoundaries = [];
          for (let kkk = 0; kkk < polylinePoints.length; ++kkk) {
            toPushGrandBoundaries.push(this.continuousObjLayerOffsetToContinuousMapNodePos(withTiledMapNode, object.offset.add(polylinePoints[kkk])));
          }
          toRet.grandBoundaries.push(toPushGrandBoundaries);
          break;
        case "shelter_chain_head":
          let toPushShelterChainHeads = [];
          for (let kk = 0; kk < polylinePoints.length; ++kk) {
            toPushShelterChainHeads.push(this.continuousObjLayerOffsetToContinuousMapNodePos(withTiledMapNode, object.offset.add(polylinePoints[kk])));
          }
          toRet.shelterChainHeads.push(toPushShelterChainHeads);
          break;
        case "soldier_droppable":
          let toPushSoldierDroppables = [];
          for (let kk = 0; kk < polylinePoints.length; ++kk) {
            toPushSoldierDroppables.push(this.continuousObjLayerOffsetToContinuousMapNodePos(withTiledMapNode, object.offset.add(polylinePoints[kk])));
          }
          toRet.soldierDroppables.push(toPushSoldierDroppables);
          break;
        default:
          break;
      }
    }
  }

  for (let i = 0; i < allObjectGroups.length; ++i) {
    let objectGroup = allObjectGroups[i];
    const objectGroupType = objectGroup.getProperty("type");
    const allObjects = objectGroup.getObjects();
    if ("attacking_npc" == objectGroupType) {
      for (let j = 0; j < allObjects.length; ++j) {
        let object = allObjects[j];
        let attackingNpcPositionInMapNode = this.continuousObjLayerOffsetToContinuousMapNodePos(withTiledMapNode, object.offset);
        toRet.attackingNpcPositionInMapNodeList.push(attackingNpcPositionInMapNode);
      }
    } 

    if ("escaping_attacking_npc" == objectGroupType) {
      for (let j = 0; j < allObjects.length; ++j) {
        let object = allObjects[j];
        let attackingNpcPositionInMapNode = this.continuousObjLayerOffsetToContinuousMapNodePos(withTiledMapNode, object.offset);
        toRet.enemyAttackingNpcPositionInMapNodeList.push(attackingNpcPositionInMapNode);
      }
    } 

    if ("enemy_escaping_target" == objectGroupType) {
      for (let j = 0; j < allObjects.length; ++j) {
        let object = allObjects[j];
        let escapingTarget = this.continuousObjLayerOffsetToContinuousMapNodePos(withTiledMapNode, object.offset);
        toRet.enemyEscapingTargetList.push(escapingTarget);
      }
    }

    if ("ally_escaping_target" == objectGroupType) {
      for (let j = 0; j < allObjects.length; ++j) {
        let object = allObjects[j];
        let escapingTarget = this.continuousObjLayerOffsetToContinuousMapNodePos(withTiledMapNode, object.offset);
        toRet.allyEscapingTargetList.push(escapingTarget);
      }
    }

    if ("initial_camera_pos" == objectGroupType) {
      for (let j = 0; j < allObjects.length; ++j) {
        let object = allObjects[j];
        let cameraPos = this.continuousObjLayerOffsetToContinuousMapNodePos(withTiledMapNode, object.offset);
        toRet.initialCameraPos.push(cameraPos);
      }
    }

    if ("buildable_position" == objectGroupType) {
      for (let j = 0; j < allObjects.length; ++j) {
        let object = allObjects[j];
        let buildableInitialPositionInMapIns = this.continuousObjLayerOffsetToContinuousMapNodePos(withTiledMapNode, object.offset);
        let discretePosition = this._continuousToDiscrete(withTiledMapNode, tiledMapIns, buildableInitialPositionInMapIns, cc.v2(0, 0));
        let centreContinuousPosWrtDiscretePosition = this._continuousFromCentreOfDiscreteTile(withTiledMapNode, tiledMapIns, null, discretePosition.x, discretePosition.y);
        if (null == object.buildableId) {
          console.warn("You shold add a customProperties {buildableId: StatelessBuildableId} for this object.");
          continue;
        }
        toRet.buildableInitialPositionMap[object.buildableId] = centreContinuousPosWrtDiscretePosition;
      }
    }
  }

  let allLayers = tiledMapIns.getLayers();

  let layerDOMTrees = [];
  let mapDomTree = mapInfo._parser._parseXML(tiledMapIns.tmxAsset.tmxXmlStr).documentElement;
  let mapDomAllChildren = null;
  if (cc.sys.isNative) {
    mapDomAllChildren = mapDomTree.getElementsByTagName("layer");
  } else if (cc.sys.platform == cc.sys.WECHAT_GAME) {
    mapDomAllChildren = mapDomTree.childNodes;
  } else {
    mapDomAllChildren = mapDomTree.children;
  }
  for (let mdtIdx = 0; mdtIdx < mapDomAllChildren.length; ++mdtIdx) {
    let tmpCh = mapDomAllChildren[mdtIdx];
    if (mapInfo._shouldIgnoreNode(tmpCh)) {
      continue;
    }

    if ("layer" != tmpCh.nodeName) {
      continue;
    }

    const layerName = tmpCh.getAttribute('name');  
    if (-1 != layerName.indexOf("BuildableArea_")) {
      const currentTileLayer = mapInfo._parseLayer(tmpCh);
      const allowedBuildableTypeStr = currentTileLayer.properties["allowed_buildable_type"]; 
      if (null == allowedBuildableTypeStr) {
        continue;
      }
      const allowedBuildableTypeList = allowedBuildableTypeStr.trim().split(","); 
      for (let kk in allowedBuildableTypeList) {
        const allowedBuildableType = parseInt(allowedBuildableTypeList[kk]);
        const currentLayerSize = currentTileLayer._layerSize;
        
        if (null == toRet.typedBuildableAreaDict[allowedBuildableType]) {
          toRet.typedBuildableAreaDict[allowedBuildableType] = {};
        } 

        for (let discreteXInLayer = 0; discreteXInLayer < currentLayerSize.width; ++discreteXInLayer) {
          for (let discreteYInLayer = 0; discreteYInLayer < currentLayerSize.height; ++discreteYInLayer) {
            const index = discreteXInLayer + discreteYInLayer * currentLayerSize.width;
            const currentGid = currentTileLayer._tiles[index];
            if (0 >= currentGid) continue;
            if (null == toRet.typedBuildableAreaDict[allowedBuildableType][discreteXInLayer]) {
              toRet.typedBuildableAreaDict[allowedBuildableType][discreteXInLayer] = {};
            }
            toRet.typedBuildableAreaDict[allowedBuildableType][discreteXInLayer][discreteYInLayer] = true;
          }
        }
      } 
    }
    layerDOMTrees.push(tmpCh);
  }

  for (let j = 0; j < allLayers.length; ++j) {
    // TODO: Respect layer offset!
    let currentTileLayer = allLayers[j];
    let currentTileset = currentTileLayer.getTileSet();

    if (!currentTileset) {
      continue;
    }
    
    const tileLayerType = currentTileLayer.getProperty("type");
    if (tileLayerType != "barrier_and_shelter") {
      continue;
    }

    let currentLayerSize = currentTileLayer.getLayerSize();

    let currentLayerTileSize = currentTileset._tileSize;
    let firstGidInCurrentTileset = currentTileset.firstGid;

    for (let discreteXInLayer = 0; discreteXInLayer < currentLayerSize.width; ++discreteXInLayer) {
      for (let discreteYInLayer = 0; discreteYInLayer < currentLayerSize.height; ++discreteYInLayer) {
        let currentGid = currentTileLayer.getTileGIDAt(discreteXInLayer, discreteYInLayer);
        if (0 >= currentGid) continue;
        let gidBoundaries = gidBoundariesMap[currentGid];
        if (!gidBoundaries) continue;
        switch (mapOrientation) {
          case cc.TiledMap.Orientation.ORTHO:
            // TODO
            return toRet;

          case cc.TiledMap.Orientation.ISO:
            let centreOfAnchorTileInMapNode = this._continuousFromCentreOfDiscreteTile(withTiledMapNode, tiledMapIns, currentTileLayer, discreteXInLayer, discreteYInLayer);
            let topLeftOfWholeTsxTileInMapNode = centreOfAnchorTileInMapNode.add(cc.v2(-0.5 * mapTileSize.width, currentLayerTileSize.height - 0.5 * mapTileSize.height));
            for (let bidx = 0; bidx < gidBoundaries.barriers.length; ++bidx) {
              let theBarrier = gidBoundaries.barriers[bidx]; // An array of cc.v2 points.
              let brToPushTmp = [];
              for (let tbidx = 0; tbidx < theBarrier.length; ++tbidx) {
                brToPushTmp.push(topLeftOfWholeTsxTileInMapNode.add(cc.v2(theBarrier[tbidx].x, -theBarrier[tbidx].y /* Mind the reverse y-axis here. */ )));
              }
              toRet.barriers.push(brToPushTmp);
            }
            for (let shidx = 0; shidx < gidBoundaries.transparents.length; ++shidx) {
              let theTransparent = gidBoundaries.transparents[shidx]; // An array of cc.v2 points.
              let transToPushTmp = [];
              for (let tshidx = 0; tshidx < theTransparent.length; ++tshidx) {
                transToPushTmp.push(topLeftOfWholeTsxTileInMapNode.add(cc.v2(theTransparent[tshidx].x, -theTransparent[tshidx].y)));
              }
              transToPushTmp.pTiledLayer = currentTileLayer;
              transToPushTmp.tileDiscretePos = cc.v2(discreteXInLayer, discreteYInLayer);
              toRet.transparents.push(transToPushTmp);
            }
            for (let shidx = 0; shidx < gidBoundaries.shelterChainTails.length; ++shidx) {
              let theShelter = gidBoundaries.shelterChainTails[shidx]; // An array of cc.v2 points.
              let shToPushTmp = [];
              for (let tshidx = 0; tshidx < theShelter.length; ++tshidx) {
                shToPushTmp.push(topLeftOfWholeTsxTileInMapNode.add(cc.v2(theShelter[tshidx].x, -theShelter[tshidx].y)));
              }
              shToPushTmp.pTiledLayer = currentTileLayer;
              shToPushTmp.tileDiscretePos = cc.v2(discreteXInLayer, discreteYInLayer);
              toRet.shelterChainTails.push(shToPushTmp);
            }
            for (let shidx = 0; shidx < gidBoundaries.shelterChainHeads.length; ++shidx) {
              let theShelter = gidBoundaries.shelterChainHeads[shidx]; // An array of cc.v2 points.
              let shToPushTmp = [];
              for (let tshidx = 0; tshidx < theShelter.length; ++tshidx) {
                shToPushTmp.push(topLeftOfWholeTsxTileInMapNode.add(cc.v2(theShelter[tshidx].x, -theShelter[tshidx].y)));
              }
              shToPushTmp.pTiledLayer = currentTileLayer;
              shToPushTmp.tileDiscretePos = cc.v2(discreteXInLayer, discreteYInLayer);
              toRet.shelterChainHeads.push(shToPushTmp);
            }
            for (let shzridx = 0; shzridx < gidBoundaries.sheltersZReducer.length; ++shzridx) {
              let theShelter = gidBoundaries.sheltersZReducer[shzridx]; // An array of cc.v2 points.
              let shzrToPushTmp = [];
              for (let tshzridx = 0; tshzridx < theShelter.length; ++tshzridx) {
                shzrToPushTmp.push(topLeftOfWholeTsxTileInMapNode.add(cc.v2(theShelter[tshzridx].x, -theShelter[tshzridx].y)));
              }
              toRet.sheltersZReducer.push(shzrToPushTmp);
            }

            continue;

          default:
            return toRet;
        }
      }
    }
  }
  return toRet;
}

TileCollisionManager.prototype.initMapNodeByTiledBoundaries = function(mapScriptIns, mapNode, extractedBoundaryObjs) {
  const tiledMapIns = mapNode.getComponent(cc.TiledMap);
  if (extractedBoundaryObjs.attackingNpcPositionInMapNodeList) {
    mapScriptIns.attackingNpcPositionInMapNodeList = extractedBoundaryObjs.attackingNpcPositionInMapNodeList;
  }

  if (extractedBoundaryObjs.enemyAttackingNpcPositionInMapNodeList) {
    mapScriptIns.enemyAttackingNpcPositionInMapNodeList = extractedBoundaryObjs.enemyAttackingNpcPositionInMapNodeList;
  }

  if (extractedBoundaryObjs.enemyEscapingTargetList) {
    mapScriptIns.enemyEscapingTargetList = extractedBoundaryObjs.enemyEscapingTargetList;
  }

  if (extractedBoundaryObjs.allyEscapingTargetList) {
    mapScriptIns.allyEscapingTargetList = extractedBoundaryObjs.allyEscapingTargetList;
  }

  if (extractedBoundaryObjs.initialCameraPos && 1 <= extractedBoundaryObjs.initialCameraPos.length) {
    mapScriptIns.initialCameraPos = extractedBoundaryObjs.initialCameraPos[0];
  }
  
  if (extractedBoundaryObjs.typedBuildableAreaDict) {
    mapScriptIns.typedBuildableAreaDict = extractedBoundaryObjs.typedBuildableAreaDict;
  }

  if (extractedBoundaryObjs.soldierDroppables) {
    mapScriptIns.soldierDroppables = extractedBoundaryObjs.soldierDroppables;
  }

  if (extractedBoundaryObjs.buildableInitialPositionMap) {
    mapScriptIns.buildableInitialPositionMap = extractedBoundaryObjs.buildableInitialPositionMap;
  }

  if (extractedBoundaryObjs.grandBoundaries) {
    window.grandBoundary = [];
    for (let boundaryObj of extractedBoundaryObjs.grandBoundaries) {
      for (let p of boundaryObj) {
        if (CC_DEBUG) {
          const labelNode = new cc.Node();
          labelNode.setPosition(p);
          const label = labelNode.addComponent(cc.Label);
          label.string = "GB_(" + p.x.toFixed(2) + ", " + p.y.toFixed(2) + ")";
          safelyAddChild(mapNode, labelNode);
          setLocalZOrder(labelNode, 999);
        }
        window.grandBoundary.push(p);
      }
      break;
    }
  }
  for (let imageObject of extractedBoundaryObjs.imageObjects) {
    if (null == mapScriptIns.imageObjectPrefab) {
      console.warn("You don't have a mapScriptIns.imageObjectPrefab to instantiate TiledImage objects!");
    }
    const imageObjectNode = cc.instantiate(mapScriptIns.imageObjectPrefab);
    const spriteComp = imageObjectNode.getComponent(cc.Sprite);
    imageObjectNode.setPosition(imageObject.posInMapNode);
    imageObjectNode.width = imageObject.sizeInMapNode.width;
    imageObjectNode.height = imageObject.sizeInMapNode.height;
    imageObjectNode.setScale(imageObject.sizeInMapNode.width / imageObject.origSize.width, imageObject.sizeInMapNode.height / imageObject.origSize.height);
    imageObjectNode.setAnchorPoint(cc.v2(0.5, 0)); // A special requirement for "image-type Tiled object" by "CocosCreator v2.0.1".
    spriteComp.spriteFrame = imageObject.spriteFrame;
    imageObjectNode.active = false;
    safelyAddChild(mapScriptIns.node, imageObjectNode);
    setLocalZOrder(imageObjectNode, window.CORE_LAYER_Z_INDEX.IMAGE_OBJ);
    imageObjectNode.origZIndex = window.CORE_LAYER_Z_INDEX.IMAGE_OBJ;
    imageObject.imageObjectNode = imageObjectNode;
  }

  mapScriptIns.dictOfTiledFrameAnimationList = {};
  for (let frameAnim of extractedBoundaryObjs.frameAnimations) {
    if (!frameAnim.type) {
      cc.warn("should bind a type to the frameAnim obejct layer");
      continue
    }
    const tiledMapIns = mapScriptIns.node.getComponent(cc.TiledMap);
    let frameAnimInType = mapScriptIns.dictOfTiledFrameAnimationList[frameAnim.type];
    if (!frameAnimInType) {
      mapScriptIns.dictOfTiledFrameAnimationList[frameAnim.type] = [];
      frameAnimInType = mapScriptIns.dictOfTiledFrameAnimationList[frameAnim.type];
    }
    if (null == mapScriptIns.tiledAnimPrefab) {
      console.warn("You don't have a mapScriptIns.tiledAnimPrefab to instantiate TiledAnim objects!");
      break;
    }
    const animNode = cc.instantiate(mapScriptIns.tiledAnimPrefab);
    const anim = animNode.getComponent(cc.Animation);
    animNode.setPosition(frameAnim.posInMapNode);
    animNode.width = frameAnim.sizeInMapNode.width;
    animNode.height = frameAnim.sizeInMapNode.height;
    animNode.setScale(frameAnim.sizeInMapNode.width / frameAnim.origSize.width, frameAnim.sizeInMapNode.height / frameAnim.origSize.height);
    animNode.opacity = 0;
    animNode.setAnchorPoint(cc.v2(0.5, 0)); // A special requirement for "image-type Tiled object" by "CocosCreator v2.0.1".
    safelyAddChild(mapScriptIns.node, animNode);
    setLocalZOrder(animNode, 5);
    anim.addClip(frameAnim.animationClip, "default");
    anim.play("default");
    frameAnimInType.push(animNode);
  }

  for (let boundaryObj of extractedBoundaryObjs.shelterChainTails) {
    const newShelter = cc.instantiate(mapScriptIns.polygonBoundaryShelterPrefab);
    const newBoundaryOffsetInMapNode = cc.v2(boundaryObj[0].x, boundaryObj[0].y);
    newShelter.setPosition(newBoundaryOffsetInMapNode);
    newShelter.setAnchorPoint(cc.v2(0, 0));
    const newShelterColliderIns = newShelter.getComponent(cc.PolygonCollider);
    newShelterColliderIns.points = [];
    for (let p of boundaryObj) {
      newShelterColliderIns.points.push(p.sub(newBoundaryOffsetInMapNode));
    }
    newShelter.pTiledLayer = boundaryObj.pTiledLayer;
    newShelter.tileDiscretePos = boundaryObj.tileDiscretePos;
    if (null != boundaryObj.imageObject) {
      newShelter.imageObject = boundaryObj.imageObject;
      newShelter.tailOrHead = "tail";
      window.addToGlobalShelterChainVerticeMap(newShelter.imageObject.imageObjectNode); // Deliberately NOT adding at the "traversal of shelterChainHeads".
    }
    newShelter.boundaryObj = boundaryObj;
    mapScriptIns.node.addChild(newShelter);
  }

  for (let boundaryObj of extractedBoundaryObjs.shelterChainHeads) {
    const newShelter = cc.instantiate(mapScriptIns.polygonBoundaryShelterPrefab);
    const newBoundaryOffsetInMapNode = cc.v2(boundaryObj[0].x, boundaryObj[0].y);
    newShelter.setPosition(newBoundaryOffsetInMapNode);
    newShelter.setAnchorPoint(cc.v2(0, 0));
    const newShelterColliderIns = newShelter.getComponent(cc.PolygonCollider);
    newShelterColliderIns.points = [];
    for (let p of boundaryObj) {
      newShelterColliderIns.points.push(p.sub(newBoundaryOffsetInMapNode));
    }
    newShelter.pTiledLayer = boundaryObj.pTiledLayer;
    newShelter.tileDiscretePos = boundaryObj.tileDiscretePos;
    if (null != boundaryObj.imageObject) {
      newShelter.imageObject = boundaryObj.imageObject;
      newShelter.tailOrHead = "head";
    }
    newShelter.boundaryObj = boundaryObj;
    mapScriptIns.node.addChild(newShelter);
  }

  mapScriptIns.statefulBuildableInhibitionColliders = [];
  for (let boundaryObj of extractedBoundaryObjs.statefulBuildableInhibitions) {
    const newStatefulBuildableInhibition = cc.instantiate(mapScriptIns.polygonBoundaryStatefulBuildableInhibitionPrefab);
    const newBoundaryOffsetInMapNode = cc.v2(boundaryObj[0].x, boundaryObj[0].y);
    newStatefulBuildableInhibition.setPosition(newBoundaryOffsetInMapNode);
    newStatefulBuildableInhibition.setAnchorPoint(cc.v2(0, 0));
    const newStatefulBuildableInhibitionColliderIns = newStatefulBuildableInhibition.getComponent(cc.PolygonCollider);
    newStatefulBuildableInhibitionColliderIns.points = [];
    for (let p of boundaryObj) {
      newStatefulBuildableInhibitionColliderIns.points.push(p.sub(newBoundaryOffsetInMapNode));
    }
    mapScriptIns.statefulBuildableInhibitionColliders.push(newStatefulBuildableInhibition);
    mapScriptIns.node.addChild(newStatefulBuildableInhibition);
  }

  mapScriptIns.barrierColliders = [];
  for (let boundaryObj of extractedBoundaryObjs.barriers) {
    const newBarrier = cc.instantiate(mapScriptIns.polygonBoundaryBarrierPrefab);
    const newBoundaryOffsetInMapNode = cc.v2(boundaryObj[0].x, boundaryObj[0].y);
    newBarrier.setPosition(newBoundaryOffsetInMapNode);
    newBarrier.setAnchorPoint(cc.v2(0, 0));
    const newBarrierColliderIns = newBarrier.getComponent(cc.PolygonCollider);
    newBarrierColliderIns.points = [];
    for (let p of boundaryObj) {
      newBarrierColliderIns.points.push(p.sub(newBoundaryOffsetInMapNode));
    }
    mapScriptIns.barrierColliders.push(newBarrierColliderIns);
    mapScriptIns.node.addChild(newBarrier);
  }

  for (let boundaryObj of extractedBoundaryObjs.transparents) {
    const newTransparent = cc.instantiate(mapScriptIns.polygonBoundaryTransparentPrefab);
    const newBoundaryOffsetInMapNode = cc.v2(boundaryObj[0].x, boundaryObj[0].y);
    newTransparent.setPosition(newBoundaryOffsetInMapNode);
    newTransparent.setAnchorPoint(cc.v2(0, 0));
    const newTransparentColliderIns = newTransparent.getComponent(cc.PolygonCollider);
    newTransparentColliderIns.points = [];
    for (let p of boundaryObj) {
      newTransparentColliderIns.points.push(p.sub(newBoundaryOffsetInMapNode));
    }
    newTransparent.pTiledLayer = boundaryObj.pTiledLayer;
    newTransparent.tileDiscretePos = boundaryObj.tileDiscretePos;
    mapScriptIns.node.addChild(newTransparent);
  }

  for (let boundaryObj of extractedBoundaryObjs.sheltersZReducer) {
    const newShelter = cc.instantiate(mapScriptIns.polygonBoundaryShelterZReducerPrefab);
    const newBoundaryOffsetInMapNode = cc.v2(boundaryObj[0].x, boundaryObj[0].y);
    newShelter.setPosition(newBoundaryOffsetInMapNode);
    newShelter.setAnchorPoint(cc.v2(0, 0));
    const newShelterColliderIns = newShelter.getComponent(cc.PolygonCollider);
    newShelterColliderIns.points = [];
    for (let p of boundaryObj) {
      newShelterColliderIns.points.push(p.sub(newBoundaryOffsetInMapNode));
    }
    mapScriptIns.node.addChild(newShelter);
  }

  const allLayers = tiledMapIns.getLayers();
  for (let layer of allLayers) {
    const layerType = layer.getProperty("type");
    switch (layerType) {
      case "barrier_and_shelter":
        setLocalZOrder(layer.node, 3);
        break;
      case "shelter_preview":
        layer.node.opacity = 100;
        setLocalZOrder(layer.node, 500);
        break;
      default:
        break;
    }
  }

  const allObjectGroups = tiledMapIns.getObjectGroups();
  for (let objectGroup of allObjectGroups) {
    const objectGroupType = objectGroup.getProperty("type");
    switch (objectGroupType) {
      case "barrier_and_shelter":
        setLocalZOrder(objectGroup.node, 3);
        break;
      default:
        break;
    }
  }
}

TileCollisionManager.prototype.isOutOfMapNode = function(tiledMapNode, continuousPosLocalToMap) {
  let tiledMapIns = tiledMapNode.getComponent(cc.TiledMap); // This is a magic name.

  let mapOrientation = tiledMapIns.getMapOrientation();
  let mapTileRectilinearSize = tiledMapIns.getTileSize();

  let mapContentSize = cc.size(tiledMapIns.getTileSize().width * tiledMapIns.getMapSize().width, tiledMapIns.getTileSize().height * tiledMapIns.getMapSize().height);

  switch (mapOrientation) {
    case cc.TiledMap.Orientation.ORTHO:
      // TODO
      return true;

    case cc.TiledMap.Orientation.ISO:
      let continuousObjLayerOffset = this.continuousMapNodePosToContinuousObjLayerOffset(tiledMapNode, continuousPosLocalToMap);
      return 0 > continuousObjLayerOffset.x || 0 > continuousObjLayerOffset.y || mapContentSize.width < continuousObjLayerOffset.x || mapContentSize.height < continuousObjLayerOffset.y;

    default:
      return true;
  }
  return true;
};

TileCollisionManager.prototype.cameraIsOutOfGrandBoundary = function(tiledMapNode, continuousPosLocalToMap) {
  let tiledMapIns = tiledMapNode.getComponent(cc.TiledMap);

  let mapOrientation = tiledMapIns.getMapOrientation();
  let tileRectilinearSize = tiledMapIns.getTileSize();
  let rhombus = null;
  switch (mapOrientation) {
    case cc.TiledMap.Orientation.ORTHO:
      // TODO
      return true;

    case cc.TiledMap.Orientation.ISO:
      if (!window.grandBoundary || 3 > window.grandBoundary.length) {
        rhombus = [
          cc.v2(-(tiledMapNode.getContentSize().width * tiledMapNode.getAnchorPoint().x), 0),
          cc.v2(0, -(tiledMapNode.getContentSize().height * tiledMapNode.getAnchorPoint().y)),
          cc.v2(+(tiledMapNode.getContentSize().width * tiledMapNode.getAnchorPoint().x), 0),
          cc.v2(0, +(tiledMapNode.getContentSize().height * tiledMapNode.getAnchorPoint().y)),
        ];
      } else {
        rhombus = window.grandBoundary;
      }
      return !cc.Intersection.pointInPolygon(continuousPosLocalToMap, rhombus);

    default:
      return true;
  }
  return true;
};

window.tileCollisionManager = new TileCollisionManager();
window.flyAndFade = function(nodeRightUnderMapNode, endPointNodeOnWidgetsAboveAll, widgetsAboveAllNode, durationSeconds, shouldFadeIn, shouldFadeOut, cb) {
  //将node转移到widgetsAboveAllNode下 
  const nodePosInWorld = nodeRightUnderMapNode.convertToWorldSpaceAR(cc.v2(0, 0));
  const widgetsAboveAllNodeWordSpaceAr = widgetsAboveAllNode.convertToWorldSpaceAR(cc.v2(0, 0));
  const nodePosInWidgetAboveAllNode = nodePosInWorld.sub(widgetsAboveAllNodeWordSpaceAr).div(widgetsAboveAllNode.scale);
  nodeRightUnderMapNode.parent = widgetsAboveAllNode;
  nodeRightUnderMapNode.setPosition(nodePosInWidgetAboveAllNode);
  nodeRightUnderMapNode.opacity = 255;
  nodeRightUnderMapNode.setScale(1 / widgetsAboveAllNode.scale);
  let bufferedTargetPos = endPointNodeOnWidgetsAboveAll.convertToWorldSpaceAR(cc.v2(0, 0)).
     sub(widgetsAboveAllNodeWordSpaceAr).
     div(widgetsAboveAllNode.scale);
  const opacity = shouldFadeIn ? 255 : 0;
  const scalingRepeatCount = 5;
  const movementSpawn = cc.moveTo(durationSeconds, bufferedTargetPos).easing(cc.easeOut(3.0));

  const moveAndCallback = cc.sequence(
    movementSpawn,
    cc.callFunc(() => {
      if (cb) {
        cb();
      }
    })
  );
  nodeRightUnderMapNode.runAction(moveAndCallback);
};

window.runActionUnderOtherNode = function(nodeRightUnderMapNode, targetNode, action) {
  const nodePosInWorld = nodeRightUnderMapNode.convertToWorldSpaceAR(cc.v2(0, 0));
  const nodePosInWidgetAboveAllNode = targetNode.convertToNodeSpaceAR(nodePosInWorld);
  nodeRightUnderMapNode.parent = targetNode;
  nodeRightUnderMapNode.setPosition(nodePosInWidgetAboveAllNode);
  nodeRightUnderMapNode.setScale(1 / targetNode.scale);
  nodeRightUnderMapNode.runAction(action);
};

window.currentlyShowingQuantityLimitPopup = undefined;

window.removeCurrentlyShowingQuantityLimitPopup = function() {
  if (!window.currentlyShowingQuantityLimitPopup) {
    return;
  }
  window.currentlyShowingQuantityLimitPopup.active = false;
  window.currentlyShowingQuantityLimitPopup = undefined;
};

window.showQuantityLimitPopup = function(quantityLimitPopup) {
  if (!quantityLimitPopup.getComponent("QuantityLimitPopup")) {
    return;
  }
  if (window.currentlyShowingQuantityLimitPopup) {
    window.currentlyShowingQuantityLimitPopup.active = false;
  }
  quantityLimitPopup.active = true;
  window.currentlyShowingQuantityLimitPopup = quantityLimitPopup;
};
