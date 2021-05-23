const describe = function(discretePt) {
  return discretePt.x.toString() + "," + discretePt.y.toString();
};

const heuristicallyEstimatePathLength = function(p1, p2, random=false) {
  const absDx = Math.abs(p1.x - p2.x);
  const absDy = Math.abs(p1.y - p2.y);
  const hval = Math.sqrt(absDx * absDx + absDy * absDy);
  return hval + (random ? hval * Math.random() * 1 / (Math.abs(hval) + 1) : 0);
};

const manhattanDistance = function(p1, p2) {
  const absDx = Math.abs(p1.x - p2.x);
  const absDy = Math.abs(p1.y - p2.y);
  return absDx + absDy;
};

/**
* These global variables should be cleaned up within "BuildableMap.onDestroy()".  
*/
window.reverseStatefulBuildableFollowingNpcDestinationDict = {};
window.reverseStatefulBuildableAttackingNpcDestinationDict = {};
window.reverseStatefulBuildableOrderingNpcDestinationDict = {};

window.cachedKnownBarrierGridDict = {};
window.refreshCachedKnownBarrierGridDict = function(mapNode, barrierColliders, thisPlayerCollider) {
  cachedKnownBarrierGridDict = {};
  const tiledMapIns = mapNode.getComponent(cc.TiledMap); // This is a magic name.
  const mapSizeDiscrete = tiledMapIns.getMapSize();
  const uniformDiscreteMargin = 0;

  for (let aComp of barrierColliders) {
    let toCollidePolygon = [];
    for (let p of aComp.points) {
      toCollidePolygon.push(aComp.node.position.add(p));
    }

    for (let discretePosXInMap = uniformDiscreteMargin; discretePosXInMap < mapSizeDiscrete.width - uniformDiscreteMargin; ++discretePosXInMap) {
      for (let discretePosYInMap = uniformDiscreteMargin; discretePosYInMap < mapSizeDiscrete.height - uniformDiscreteMargin; ++discretePosYInMap) {
        if (null != cachedKnownBarrierGridDict[discretePosXInMap]
          && true == cachedKnownBarrierGridDict[discretePosXInMap][discretePosYInMap]) {
          continue;
        }

        let centreOfAnchorTileInMapNode = tileCollisionManager._continuousFromCentreOfDiscreteTile(mapNode, tiledMapIns, null, discretePosXInMap, discretePosYInMap);

        let toCollideCircle = {
          position: centreOfAnchorTileInMapNode.add(
            ((null == thisPlayerCollider) ? cc.v2(0, 0) : thisPlayerCollider.offset)
          ),
          radius: ((null == thisPlayerCollider) ? 20 : thisPlayerCollider.radius),
        };

        if (cc.Intersection.polygonCircle(toCollidePolygon, toCollideCircle)) {
          if (null == cachedKnownBarrierGridDict[discretePosXInMap]) {
            cachedKnownBarrierGridDict[discretePosXInMap] = {};
          }
          cachedKnownBarrierGridDict[discretePosXInMap][discretePosYInMap] = true;

          if (null != window.reverseStatefulBuildableFollowingNpcDestinationDict && null != window.reverseStatefulBuildableFollowingNpcDestinationDict[discretePosXInMap]) {
            const reverseStatefulBuildableFollowingNpcDestinationDictRecord = window.reverseStatefulBuildableFollowingNpcDestinationDict[discretePosXInMap][discretePosYInMap];
            if (null != reverseStatefulBuildableFollowingNpcDestinationDictRecord) {
              const statefulBuildableFollowingNpcsBoundForThisGrid = Object.values(reverseStatefulBuildableFollowingNpcDestinationDictRecord);  
              for (let statefulBuildableFollowingNpc of statefulBuildableFollowingNpcsBoundForThisGrid) {
                statefulBuildableFollowingNpc.refreshCurrentDestination();
              }
            }  
          } 
          if (null != window.reverseStatefulBuildableAttackingNpcDestinationDict && null != window.reverseStatefulBuildableAttackingNpcDestinationDict[discretePosXInMap]) {
            const reverseStatefulBuildableAttackingNpcDestinationDictRecord = window.reverseStatefulBuildableAttackingNpcDestinationDict[discretePosXInMap][discretePosYInMap];
            if (null != reverseStatefulBuildableAttackingNpcDestinationDictRecord) {
              const statefulBuildableAttackingNpcsBoundForThisGrid = Object.values(reverseStatefulBuildableAttackingNpcDestinationDictRecord);  
              for (let statefulBuildableFollowingNpc of statefulBuildableAttackingNpcsBoundForThisGrid) {
                statefulBuildableFollowingNpc.refreshCurrentDestination();
              }
            }
          }
          // Deliberately not refreshCurrentDestination for all statefulBuildableOrderingNpc. --guoyl6
        }
      }
    }
  }

  for (let k in window.mapIns.statefulBuildableFollowingNpcScriptInsDict) {
    const statefulBuildableFollowingNpc = window.mapIns.statefulBuildableFollowingNpcScriptInsDict[k]; 
    statefulBuildableFollowingNpc.refreshContinuousStopsFromCurrentPositionToCurrentDestination();
    statefulBuildableFollowingNpc.restartPatrolling();
  }  

  for (let k in window.mapIns.statefulBuildableAttackingNpcScriptInsDict) {
    const statefulBuildableAttackingNpc = window.mapIns.statefulBuildableAttackingNpcScriptInsDict[k]; 
    statefulBuildableAttackingNpc.rerouteIfNotAttacking();
  }
  // Should not restartFollowing for All statefulBuildableOrderingNpc. --guoyl6 
};

const NEIGHBOUR_DISCRETE_OFFSETS = [{
  dx: 0,
  dy: 1
}, {
  dx: 1,
  dy: 1
}, {
  dx: 1,
  dy: 0
}, {
  dx: 1,
  dy: -1
}, {
  dx: 0,
  dy: -1
}, {
  dx: -1,
  dy: -1
}, {
  dx: -1,
  dy: 0
}, {
  dx: -1,
  dy: 1
}];

window.findPathWithMapDiscretizingAStar = function(continuousSrcPtInMapNode, continuousDstPtInMapNode, eps, thisPlayerCollider, barrierColliders, controlledPlayerColliders, mapNode, maxExpanderTrialCount, discreteBarrierGridsToIgnore) {
  const tiledMapIns = mapNode.getComponent(cc.TiledMap); // This is a magic name.
  const mapSizeDiscrete = tiledMapIns.getMapSize();
  if (null == maxExpanderTrialCount) {
    maxExpanderTrialCount = ((mapSizeDiscrete.width*mapSizeDiscrete.height) << 1);
  }
  // [Phase#0] Discretize the mapNode to grids (be it ORTHO or ISOMETRIC w.r.t. orientation of the tiledMapIns) and mark `cachedKnownBarrierGridDict`.
  if (!cachedKnownBarrierGridDict) {
    window.refreshCachedKnownBarrierGridDict(mapNode, barrierColliders, thisPlayerCollider);
  }

  const discreteSrcPos = tileCollisionManager._continuousToDiscrete(mapNode, tiledMapIns, continuousSrcPtInMapNode, cc.v2(0, 0));
  const discreteDstPos = tileCollisionManager._continuousToDiscrete(mapNode, tiledMapIns, continuousDstPtInMapNode, cc.v2(0, 0));

  let openSetFromSrc = new Set();
  let closedSet = new Set();
  let dFromSrc = {}; // Actual distance for path "srcPt -> k (end of current path)". 
  let hTotal = {}; // Heuristically estimated total distance for path "srcPt -> k (must pass) -> dstPt". 

  // Initialization.
  openSetFromSrc.add(describe(discreteSrcPos));
  dFromSrc[describe(discreteSrcPos)] = {
    pos: discreteSrcPos,
    value: 0.0,
    pre: null // Always NULL for `dFromSrc`.
  };
  hTotal[describe(discreteSrcPos)] = {
    pos: discreteSrcPos,
    value: dFromSrc[describe(discreteSrcPos)].value + heuristicallyEstimatePathLength(discreteDstPos, discreteDstPos, constants.ADD_NOISE_TO_ASTAR),
    pre: null
  };
  let expanderTrialCount = 0;

  // Main iteration body.  
  while (0 < openSetFromSrc.size) {
    if (expanderTrialCount > maxExpanderTrialCount) {
      console.log("No path for (", discreteSrcPos.x, ", ", discreteSrcPos.y, ") => (", discreteDstPos.x, ", ", discreteDstPos.y, "), returning after maxExpanderTrialCount == ", maxExpanderTrialCount, " reached. #1");
      return null;
    }
    // [Phase#1] 
    let expanderKey = null;
    let expander = null;
    /*
    * TODO
    * 
    * Make `openSetFromSrc` a heap scored by `hTotal[candidateKey]` and still be popping `candidateKey`.
    */
    for (let candidateKey of openSetFromSrc) {
      let candidate = hTotal[candidateKey];
      if (null != expander && (expander.value <= candidate.value)) continue;
      expanderKey = candidateKey;
      expander = candidate;
    }

    if (null == expanderKey) {
      // Not reachable in this discretization. 
      console.log("No path due to no expanderKey for (", discreteSrcPos.x, ", ", discreteSrcPos.y, ") => (", discreteDstPos.x, ", ", discreteDstPos.y, "), returning after expanderTrialCount == ", expanderTrialCount, ".");
      return null;
    }

    if (expander.pos.x == discreteDstPos.x && expander.pos.y == discreteDstPos.y) {
      // Found a path in this discretization. 
      let pathToRet = [];
      while (null != expander) {
        const discretePos = expander.pos;
        const continuousPtInMapNode = tileCollisionManager._continuousFromCentreOfDiscreteTile(mapNode, tiledMapIns, null, discretePos.x, discretePos.y);
        pathToRet.push(continuousPtInMapNode);
        expander = expander.pre;
      }
      pathToRet.reverse();
      return pathToRet;
    }

    ++expanderTrialCount;

    // [Phase#2] 
    openSetFromSrc.delete(expanderKey);

    // [Phase#3] 
    closedSet.add(expanderKey);

    // [Phase#4] Traverse the neighbours of `expanderKey` and update accordingly.
    // let searchStartingIndice = (null == window.mapIns ? 0 : window.mapIns.successfullyDroppedSoldierCount);
    let searchStartingIndice = 0;
    searchStartingIndice = (searchStartingIndice%NEIGHBOUR_DISCRETE_OFFSETS.length);
    let upperCapForTraversal = (NEIGHBOUR_DISCRETE_OFFSETS.length + searchStartingIndice); 
    for (let k = searchStartingIndice; k < upperCapForTraversal; k += 2) {
      const neighbourOffset = NEIGHBOUR_DISCRETE_OFFSETS[k%NEIGHBOUR_DISCRETE_OFFSETS.length];
      const discreteNeighbourPos = {
        x: expander.pos.x + neighbourOffset.dx,
        y: expander.pos.y + neighbourOffset.dy,
      };
      if (discreteNeighbourPos.x < 0
          ||
          discreteNeighbourPos.x >= mapSizeDiscrete.width
          ||
          discreteNeighbourPos.y < 0
          ||
          discreteNeighbourPos.y >= mapSizeDiscrete.height
          ) {
        continue;
      }
      const discreteNeighbourPosDesc = describe(discreteNeighbourPos);

      if (true == closedSet.has(discreteNeighbourPosDesc)) {
        continue;
      }

      if (
        (cachedKnownBarrierGridDict[discreteNeighbourPos.x] && true == cachedKnownBarrierGridDict[discreteNeighbourPos.x][discreteNeighbourPos.y])
        && 
        (null == discreteBarrierGridsToIgnore || null == discreteBarrierGridsToIgnore[discreteNeighbourPos.x] || true != discreteBarrierGridsToIgnore[discreteNeighbourPos.x][discreteNeighbourPos.y])
        ) {
        // console.log("discreteNeighbourPos == (", discreteNeighbourPos.x, ",", discreteNeighbourPos.y, ") is a knownBarrierGrid.");
        continue;
      }

      if (!openSetFromSrc.has(discreteNeighbourPosDesc)) {
        openSetFromSrc.add(discreteNeighbourPosDesc);
      }
      const proposedNeighbourDFromSrcValue = dFromSrc[expanderKey].value + manhattanDistance(expander.pos, discreteNeighbourPos);

      if (null == dFromSrc[discreteNeighbourPosDesc]) {
        dFromSrc[discreteNeighbourPosDesc] = {
          pos: discreteNeighbourPos,
          value: proposedNeighbourDFromSrcValue,
          pre: null
        };
        hTotal[discreteNeighbourPosDesc] = {
          pos: discreteNeighbourPos,
          value: proposedNeighbourDFromSrcValue + heuristicallyEstimatePathLength(discreteNeighbourPos, discreteDstPos, constants.ADD_NOISE_TO_ASTAR),
          pre: hTotal[expanderKey],
        };
      } else {
        const origNeighbourDFromSrcValue = dFromSrc[discreteNeighbourPosDesc].val;
        if (origNeighbourDFromSrcValue <= proposedNeighbourDFromSrcValue) {
          continue;
        }
        dFromSrc[discreteNeighbourPosDesc].value = proposedNeighbourDFromSrcValue;
        hTotal[discreteNeighbourPosDesc].value = proposedNeighbourDFromSrcValue + heuristicallyEstimatePathLength(discreteNeighbourPos, discreteDstPos, constants.ADD_NOISE_TO_ASTAR);
        hTotal[discreteNeighbourPosDesc].pre = hTotal[expanderKey];
      }
    }
  }

  console.log("No path for (", discreteSrcPos.x, ", ", discreteSrcPos.y, ") => (", discreteDstPos.x, ", ", discreteDstPos.y, "), returning after expanderTrialCount == ", expanderTrialCount, ".");
  return null;
};

Math.seed = function(s, mod) {
    var mask = 0xffffffff;
    var m_w  = (123456789 + s) & mask;
    var m_z  = (987654321 - s) & mask;

    m_z = (36969 * (m_z & 65535) + (m_z >>> 16)) & mask;
    m_w = (18000 * (m_w & 65535) + (m_w >>> 16)) & mask;

    const result = ((m_z << 16) + (m_w & 65535)) >>> 0;
    return (result % mod);
}

const shuffle = function(a) {
  const nowMillis = Date.now();
  for (let i = a.length - 1; i > 0; i--) {
    let j = Math.seed(nowMillis*i, a.length);
    let x = a[i];
    a[i] = a[j];
    a[j] = x;
  }
  return a;
}

const simpleShuffle = function(array) {
  const firstEle = array.shift();
  array.push(firstEle);
  return array;
}

window.findNearbyNonBarrierGridByBreathFirstSearch = function(mapNode, continuousSrcPtInMapNode /* cc.v2 */, minRequiredLayerDistance, maxExpanderTrialCount, useShuffledNeighbours) {
  let effectiveNeighbourOffsetArr = [];
  for (let neighbourOffset of NEIGHBOUR_DISCRETE_OFFSETS) {
    effectiveNeighbourOffsetArr.push(neighbourOffset);
  }

  effectiveNeighbourOffsetArr = effectiveNeighbourOffsetArr.filter((x, i) => {
    return i % 2 == 0;
  });

  const tiledMapIns = mapNode.getComponent(cc.TiledMap); // This is a magic name.
  const mapSizeDiscrete = tiledMapIns.getMapSize();
  if (null == maxExpanderTrialCount) {
    maxExpanderTrialCount = ((mapSizeDiscrete.width*mapSizeDiscrete.height) << 1);
  }
 
  const discreteSrcPos = tileCollisionManager._continuousToDiscrete(mapNode, tiledMapIns, continuousSrcPtInMapNode, cc.v2(0, 0));

  let openDictFromSrc = new Set();
  let bfsQueue= []; 
  let closedSet = new Set();

  // Initialization.
  const starter = {
    pos: discreteSrcPos,
    layerDistance: 0,
    pre: null,
  };
  openDictFromSrc[describe(discreteSrcPos)] = starter;
  bfsQueue.push(discreteSrcPos);
  let expanderTrialCount = 0;

  // Main iteration body.  
  while (0 < bfsQueue.length) {
    if (expanderTrialCount > maxExpanderTrialCount) {
      console.warn(`No nearby non-barrier grid found for (${discreteSrcPos.x}, ${discreteSrcPos.y}), returning after maxExpanderTrialCount == ${maxExpanderTrialCount} reached.`);
      return null;
    }

    const expanderPos = bfsQueue.shift();
    if (null == expanderPos) {
      console.warn(`No nearby non-barrier grid found for (${discreteSrcPos.x}, ${discreteSrcPos.y}), no feasible expanderPos.`);
      return null;
    }
    const expanderKey = describe(expanderPos);
    const expander = openDictFromSrc[expanderKey];

    ++expanderTrialCount;

    delete openDictFromSrc[expanderKey]; // [SYNTAX NOTE] The actually heap content is still held by `expander` in the current closure. -- YFLu.
    closedSet.add(expanderKey);

    let neighbourOffsetArr = (false == useShuffledNeighbours ? effectiveNeighbourOffsetArr : shuffle(effectiveNeighbourOffsetArr));

    for (let neighbourOffset of neighbourOffsetArr) {
      const discreteNeighbourPos = {
        x: expander.pos.x + neighbourOffset.dx,
        y: expander.pos.y + neighbourOffset.dy,
      };
      if (discreteNeighbourPos.x < 0
          ||
          discreteNeighbourPos.x >= mapSizeDiscrete.width
          ||
          discreteNeighbourPos.y < 0
          ||
          discreteNeighbourPos.y >= mapSizeDiscrete.height
          ) {
        continue;
      }

      const discreteNeighbourPosDesc = describe(discreteNeighbourPos);

      if (true == closedSet.has(discreteNeighbourPosDesc)) {
        continue;
      }

      let existingDiscreteNeighbourObj = openDictFromSrc[discreteNeighbourPosDesc];
      if (null == existingDiscreteNeighbourObj) {
        const discreteNeighbour = {
          pos: discreteNeighbourPos,
          layerDistance: (expander.layerDistance + 1),
          pre: expander,
        };
        existingDiscreteNeighbourObj = discreteNeighbour;
        openDictFromSrc[discreteNeighbourPosDesc] = discreteNeighbour;
        bfsQueue.push(discreteNeighbourPos);
      } else {
        const proposedLayerDistanceForNeighbour = (expander.layerDistance + 1);
        if (proposedLayerDistanceForNeighbour < existingDiscreteNeighbourObj) {
          existingDiscreteNeighbourObj.layerDistance = proposedLayerDistanceForNeighbour;
          existingDiscreteNeighbourObj.pre = expander;
        }
      }

      const theEffectiveDiscreteNeighbourLayerDistance = existingDiscreteNeighbourObj.layerDistance;
      if (
          theEffectiveDiscreteNeighbourLayerDistance >= minRequiredLayerDistance
          &&
          (
          null == cachedKnownBarrierGridDict[discreteNeighbourPos.x] 
          || 
          null == cachedKnownBarrierGridDict[discreteNeighbourPos.x][discreteNeighbourPos.y]
          ||
          false == cachedKnownBarrierGridDict[discreteNeighbourPos.x][discreteNeighbourPos.y]
          )
        ) {
        // Found a feasible solution.
        const continuousNeighbourPtInMapNode = tileCollisionManager._continuousFromCentreOfDiscreteTile(mapNode, tiledMapIns, null, discreteNeighbourPos.x, discreteNeighbourPos.y);
        return continuousNeighbourPtInMapNode;  
      }
    }
  }
  return null;
};

cc.Class({
  extends: cc.Component,

  properties: {
    map: {
      type: cc.Node,
      default: null
    },
  },

  // LIFE-CYCLE CALLBACKS:
  onLoad() {
  }
});
