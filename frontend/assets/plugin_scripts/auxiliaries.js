"use strict";
const Heap = require('./Heap')
const i18n = require('LanguageData');

let IS_USING_WKWECHAT_KERNEL = null;
window.isUsingWebkitWechatKernel = function() {
  if (null == IS_USING_WKWECHAT_KERNEL) {
    // The extraction of `browserType` might take a considerable amount of time in mobile browser kernels.
    IS_USING_WKWECHAT_KERNEL = (cc.sys.BROWSER_TYPE_WECHAT == cc.sys.browserType);  
  }
  return IS_USING_WKWECHAT_KERNEL;
};

let IS_USING_X5_BLINK_KERNEL = null;
window.isUsingX5BlinkKernel = function() {
  if (null == IS_USING_X5_BLINK_KERNEL) {
    // The extraction of `browserType` might take a considerable amount of time in mobile browser kernels.
    IS_USING_X5_BLINK_KERNEL = (cc.sys.BROWSER_TYPE_MOBILE_QQ == cc.sys.browserType);  
  }
  return IS_USING_X5_BLINK_KERNEL;
};

let IS_USING_X5_BLINK_KERNEL_OR_WKWECHAT_KERNEL = null;
window.isUsingX5BlinkKernelOrWebkitWeChatKernel = function() {
  if (null == IS_USING_X5_BLINK_KERNEL_OR_WKWECHAT_KERNEL) {
    // The extraction of `browserType` might take a considerable amount of time in mobile browser kernels.
    IS_USING_X5_BLINK_KERNEL_OR_WKWECHAT_KERNEL = (cc.sys.BROWSER_TYPE_MOBILE_QQ == cc.sys.browserType || cc.sys.BROWSER_TYPE_WECHAT == cc.sys.browserType); 
  }
  return IS_USING_X5_BLINK_KERNEL_OR_WKWECHAT_KERNEL;
};


window.getRandomArbitrary = function(min, max) {
  return Math.random() * (max - min) + min;
};

window.getRandomInt = function(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min; //The maximum is exclusive and the minimum is inclusive
};

window.randomKey = function(obj) {
  var keys = Object.keys(obj)
  return keys[keys.length * Math.random() << 0];
};

window.randomProperty = function(obj) {
  return obj[window.randomKey(obj)];
};

window.getQueryParamDict = function() {
  // Kindly note that only the first occurrence of duplicated keys will be picked up. 
  var query = window.location.search.substring(1);
  var kvPairs = query.split('&');
  var toRet = {};
  for (var i = 0; i < kvPairs.length; ++i) {
    var kAndV = kvPairs[i].split('=');
    if (undefined === kAndV || null === kAndV || 2 != kAndV.length) return;
    var k = kAndV[0];
    var v = decodeURIComponent(kAndV[1]);
    toRet[k] = v;
  }
  return toRet;
}

window.safelyAssignParent = function(proposedChild, proposedParent) {
  if (proposedChild.parent == proposedParent) return false;
  proposedChild.parent = proposedParent;
  return true;
};

window.get2dRotation = function(aCCNode) {
  // return aCCNode.rotation; // For cc2.0+ 
  return aCCNode.angle; // For cc2.1+ 
};

window.set2dRotation = function(aCCNode, clockwiseAngle) {
  // aCCNode.rotation = angle; // For cc2.0+ 
  aCCNode.angle = -clockwiseAngle; // For cc2.1+ 
};

window.getLocalZOrder = function(aCCNode) {
  return aCCNode.zIndex; // For cc2.0+ 
};

window.setLocalZOrder = function(aCCNode, zIndex) {
  aCCNode.zIndex = zIndex; // For cc2.0+ 
};

window.safelyAddChild = function(proposedParent, proposedChild) {
  if (proposedChild.parent == proposedParent) return false;
  if (null != proposedChild.parent) return false;
  setLocalZOrder(proposedChild, getLocalZOrder(proposedParent) + 1);
  proposedParent.addChild(proposedChild);
  return true;
};

window.setVisible = function(aCCNode) {
  aCCNode.opacity = 255;
};

window.setInvisible = function(aCCNode) {
  aCCNode.opacity = 0;
};

window.gidSpriteFrameMap = {};
window.getOrCreateSpriteFrameForGid = function(gid, tiledMapInfo, tilesElListUnderTilesets) {
  if (null != gidSpriteFrameMap[gid]) return gidSpriteFrameMap[gid];
  if (false == gidSpriteFrameMap[gid]) return null;

  var tilesets = tiledMapInfo.getTilesets();
  var targetTileset = null;
  for (var i = 0; i < tilesets.length; ++i) {
    // TODO: Optimize by binary search.
    if (gid < tilesets[i].firstGid) continue;
    if (i < tilesets.length - 1) {
      if (gid >= tilesets[i + 1].firstGid) continue;
    }
    targetTileset = tilesets[i];
    break;
  }
  if (!targetTileset) return null;
  var tileIdWithinTileset = (gid - targetTileset.firstGid);
  var tilesElListUnderCurrentTileset = tilesElListUnderTilesets[targetTileset.name + ".tsx"];

  var targetTileEl = null;
  for (var tileIdx = 0; tileIdx < tilesElListUnderCurrentTileset.length; ++tileIdx) {
    var tmpTileEl = tilesElListUnderCurrentTileset[tileIdx];
    if (tileIdWithinTileset != parseInt(tmpTileEl.id)) continue;
    targetTileEl = tmpTileEl;
    break;
  }

  //if (!targetTileEl) return null;当tile没有custom type时，不会存储相应tile
  var tileId = tileIdWithinTileset;
  var tilesPerRow = (targetTileset.sourceImage.width / targetTileset._tileSize.width);
  var row = parseInt(tileId / tilesPerRow);
  var col = (tileId % tilesPerRow);
  var offset = cc.v2(targetTileset._tileSize.width * col, targetTileset._tileSize.height * row);
  var origSize = targetTileset._tileSize;
  var rect = cc.rect(offset.x, offset.y, origSize.width, origSize.height);
  var sf = new cc.SpriteFrame(targetTileset.sourceImage, rect, false /* rotated */ , offset, origSize);
  const data = {
    origSize: targetTileset._tileSize,
    spriteFrame: sf,
  }
  window.gidSpriteFrameMap[gid] = data;
  return data;
}
window.gidAnimationClipMap = {};
window.getOrCreateAnimationClipForGid = function(gid, tiledMapInfo, tilesElListUnderTilesets) {
  // cc.log(`getOrCreateAnimationClipForGid ${gid}`);
  if (null != gidAnimationClipMap[gid]) return gidAnimationClipMap[gid];
  if (false == gidAnimationClipMap[gid]) return null;

  var tilesets = tiledMapInfo.getTilesets();
  var targetTileset = null;
  for (var i = 0; i < tilesets.length; ++i) {
    // TODO: Optimize by binary search.
    if (gid < tilesets[i].firstGid) continue;
    if (i < tilesets.length - 1) {
      if (gid >= tilesets[i + 1].firstGid) continue;
    }
    targetTileset = tilesets[i];
    break;
  }

  // cc.log(`getOrCreateAnimationClipForGid ${gid}, found targetTileset.firstGid == ${targetTileset.firstGid}`);
  if (!targetTileset) return null;
  var tileIdWithinTileset = (gid - targetTileset.firstGid);
  var tsxFileName = (targetTileset.name + ".tsx");
  var tilesElListUnderCurrentTileset = tilesElListUnderTilesets[tsxFileName];

  // cc.log(`getOrCreateAnimationClipForGid ${gid}, tilesElListUnderCurrentTileset == ${tilesElListUnderCurrentTileset} whose length == ${tilesElListUnderCurrentTileset.length} for tsxFileName == ${tsxFileName}.`);

  var targetTileEl = null;
  for (var theSeqId = 0; theSeqId < tilesElListUnderCurrentTileset.length; ++theSeqId) {
    var tmpTileEl = tilesElListUnderCurrentTileset[theSeqId];
    var tileId = (cc.sys.isNative ? tmpTileEl.attributes.getNamedItem("id").nodeValue : tmpTileEl.id);
    cc.log(`getOrCreateAnimationClipForGid ${gid}, examining tmpTileEl to match tileIdWithinTileset == ${tileIdWithinTileset}.`);
    if (tileIdWithinTileset != parseInt(tileId)) continue;
    targetTileEl = tmpTileEl;
    break;
  }

  if (!targetTileEl) {
    cc.log(`getOrCreateAnimationClipForGid ${gid}, targetTileEl not found for tileIdWithinTileset == ${tileIdWithinTileset}.`);
    return null;
  }
  var animElList = targetTileEl.getElementsByTagName("animation");
  if (!animElList || 0 >= animElList.length) {
    cc.log(`getOrCreateAnimationClipForGid ${gid}, tagname "animation" not located within targetTileEl.`);
    return null;
  }
  var animEl = animElList[0];

  var uniformDurationSecondsPerFrame = null;
  var totDurationSeconds = 0;
  var sfList = [];
  var frameElListUnderAnim = animEl.getElementsByTagName("frame");
  var tilesPerRow = (targetTileset.sourceImage.width / targetTileset._tileSize.width);

  // cc.log(`getOrCreateAnimationClipForGid ${gid}, got the first animEl and frameElListUnderAnim == ${frameElListUnderAnim}.`);
  for (var k = 0; k < frameElListUnderAnim.length; ++k) {
    var frameEl = frameElListUnderAnim[k];
    var tileId = (cc.sys.isNative ? parseInt(frameEl.attributes.getNamedItem("tileid").nodeValue) : parseInt(frameEl.attributes.tileid.value));
    var durationSeconds = (cc.sys.isNative ? (parseFloat(frameEl.attributes.getNamedItem("duration").nodeValue) / 1000) : (frameEl.attributes.duration.value / 1000));
    if (null == uniformDurationSecondsPerFrame) {
      uniformDurationSecondsPerFrame = durationSeconds;
    }
    totDurationSeconds += durationSeconds;
    var row = parseInt(tileId / tilesPerRow);
    var col = (tileId % tilesPerRow);
    var offset = cc.v2(targetTileset._tileSize.width * col, targetTileset._tileSize.height * row);
    var origSize = targetTileset._tileSize;
    var rect = cc.rect(offset.x, offset.y, origSize.width, origSize.height);
    var sf = new cc.SpriteFrame(targetTileset.sourceImage, rect, false /* rotated */ , offset, origSize);
    cc.log(`Cropped SpriteFrame from targetTileset.sourceImage == ${targetTileset.sourceImage} by rect == ${rect}, offset == ${offset} and origSize == ${origSize}.`);
    sfList.push(sf);
  }
  var sampleRate = 1 / uniformDurationSecondsPerFrame; // A.k.a. fps.
  var animClip = cc.AnimationClip.createWithSpriteFrames(sfList, sampleRate);
  // http://docs.cocos.com/creator/api/en/enums/WrapMode.html.
  animClip.wrapMode = cc.WrapMode.Loop;
  return {
    origSize: targetTileset._tileSize,
    animationClip: animClip,
  };
};

window.secondsToNaturalExp = function(remainingSeconds, isNormalExp) {
  if (remainingSeconds < 1 && remainingSeconds >= 0) {
    return isNormalExp ? cc.js.formatStr(i18n.t("durationInNormal.seconds"), 0) : cc.js.formatStr(i18n.t("duration.seconds"), 0); //防止不必要的小数溢出
  }
  const toDisplayDays = parseInt(remainingSeconds / constants.TIME_CHUNK.SECONDS_IN_DAY);
  remainingSeconds -= (toDisplayDays * constants.TIME_CHUNK.SECONDS_IN_DAY);
  const toDisplayHours = parseInt(remainingSeconds / constants.TIME_CHUNK.SECONDS_IN_HOUR);
  remainingSeconds -= (toDisplayHours * constants.TIME_CHUNK.SECONDS_IN_HOUR);
  const toDisplayMinutes = parseInt(remainingSeconds / constants.TIME_CHUNK.SECONDS_IN_MINUTE);
  remainingSeconds -= (toDisplayMinutes * constants.TIME_CHUNK.SECONDS_IN_MINUTE);
  let hintStrDays = "";
  let hintStrHours = "";
  let hintStrSeconds = "";
  let hintStrMinutes = "";
  if (isNormalExp) {
    hintStrDays = (0 < toDisplayDays ? cc.js.formatStr(i18n.t("durationInNormal.days") + " ", toDisplayDays) : "");
    hintStrHours = ((0 < toDisplayHours) ? cc.js.formatStr(i18n.t("durationInNormal.hours") + " ", toDisplayHours) : "");
    hintStrMinutes = ((0 < toDisplayMinutes) ? cc.js.formatStr(i18n.t("durationInNormal.minutes") + " ", toDisplayMinutes) : "");
    hintStrSeconds = ((0 < remainingSeconds) ? cc.js.formatStr(i18n.t("durationInNormal.seconds"), Math.round(remainingSeconds * 10) / 10) : "");
  } else {
    hintStrDays = (0 < toDisplayDays ? cc.js.formatStr(i18n.t("duration.days") + " ", toDisplayDays) : "");
    hintStrHours = ((0 < toDisplayHours) ? cc.js.formatStr(i18n.t("duration.hours") + " ", toDisplayHours) : "");
    hintStrMinutes = ((0 < toDisplayMinutes) ? cc.js.formatStr(i18n.t("duration.minutes") + " ", toDisplayMinutes) : "");
    hintStrSeconds = ((0 < remainingSeconds) ? cc.js.formatStr(i18n.t("duration.seconds"), Math.floor(remainingSeconds)) : "" );
  }
  const hintStr = [hintStrDays, hintStrHours, hintStrMinutes, hintStrSeconds].join('');
  return hintStr;
};
window._base64ToUint8Array = function(base64) {
  var origBytes = null;
  if (cc.sys.platform == cc.sys.WECHAT_GAME) {
    return Buffer.from(base64, 'base64');
  } else if (null != window.atob) {
    var origBinaryStr = window.atob(base64);
    var origLen = origBinaryStr.length;
    origBytes = new Uint8Array(origLen);
    for (var i = 0; i < origLen; i++) {
      origBytes[i] = origBinaryStr.charCodeAt(i);
    }
    return origBytes;
  } else {
    return null;
  }
}

window._base64ToArrayBuffer = function(base64) {
  return _base64ToUint8Array(base64).buffer;
}

window.transformArrayBufferToBase64 = function(buffer) {
  if (cc.sys.platform == cc.sys.WECHAT_GAME) {
    return fromByteArray(buffer);
  }
  var binary = '';
  var bytes = new Uint8Array(buffer);
  for (var len = bytes.byteLength, i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
};

window.pbEncodeData = (struct, payLoad) => {
  const message = struct.create(payLoad);
  const encodedMessage = struct.encode(message).finish();
  return transformArrayBufferToBase64(encodedMessage);
};

window.pbDecodeData = (struct, data) => {
  const unitArrayData = _base64ToUint8Array(data);
  return struct.decode(unitArrayData);
};

/*
* Base64 utilities.
*/
var lookup = []
var revLookup = []
var Arr = typeof Uint8Array !== 'undefined' ? Uint8Array : Array

var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
for (var i = 0, len = code.length; i < len; ++i) {
  lookup[i] = code[i]
  revLookup[code.charCodeAt(i)] = i
}

// Support decoding URL-safe base64 strings, as Node.js does.
// See: https://en.wikipedia.org/wiki/Base64#URL_applications
revLookup['-'.charCodeAt(0)] = 62
revLookup['_'.charCodeAt(0)] = 63

function getLens (b64) {
  var len = b64.length

  if (len % 4 > 0) {
    throw new Error('Invalid string. Length must be a multiple of 4')
  }

  // Trim off extra bytes after placeholder bytes are found
  // See: https://github.com/beatgammit/base64-js/issues/42
  var validLen = b64.indexOf('=')
  if (validLen === -1) validLen = len

  var placeHoldersLen = validLen === len
    ? 0
    : 4 - (validLen % 4)

  return [validLen, placeHoldersLen]
}

// base64 is 4/3 + up to two characters of the original data
function byteLength (b64) {
  var lens = getLens(b64)
  var validLen = lens[0]
  var placeHoldersLen = lens[1]
  return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
}

function _byteLength (b64, validLen, placeHoldersLen) {
  return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
}

function toByteArray (b64) {
  var tmp
  var lens = getLens(b64)
  var validLen = lens[0]
  var placeHoldersLen = lens[1]

  var arr = new Arr(_byteLength(b64, validLen, placeHoldersLen))

  var curByte = 0

  // if there are placeholders, only get up to the last complete 4 chars
  var len = placeHoldersLen > 0
    ? validLen - 4
    : validLen

  var i
  for (i = 0; i < len; i += 4) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 18) |
      (revLookup[b64.charCodeAt(i + 1)] << 12) |
      (revLookup[b64.charCodeAt(i + 2)] << 6) |
      revLookup[b64.charCodeAt(i + 3)]
    arr[curByte++] = (tmp >> 16) & 0xFF
    arr[curByte++] = (tmp >> 8) & 0xFF
    arr[curByte++] = tmp & 0xFF
  }

  if (placeHoldersLen === 2) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 2) |
      (revLookup[b64.charCodeAt(i + 1)] >> 4)
    arr[curByte++] = tmp & 0xFF
  }

  if (placeHoldersLen === 1) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 10) |
      (revLookup[b64.charCodeAt(i + 1)] << 4) |
      (revLookup[b64.charCodeAt(i + 2)] >> 2)
    arr[curByte++] = (tmp >> 8) & 0xFF
    arr[curByte++] = tmp & 0xFF
  }

  return arr
}

function tripletToBase64 (num) {
  return lookup[num >> 18 & 0x3F] +
    lookup[num >> 12 & 0x3F] +
    lookup[num >> 6 & 0x3F] +
    lookup[num & 0x3F]
}

function encodeChunk (uint8, start, end) {
  var tmp
  var output = []
  for (var i = start; i < end; i += 3) {
    tmp =
      ((uint8[i] << 16) & 0xFF0000) +
      ((uint8[i + 1] << 8) & 0xFF00) +
      (uint8[i + 2] & 0xFF)
    output.push(tripletToBase64(tmp))
  }
  return output.join('')
}

function fromByteArray (uint8) {
  var tmp
  var len = uint8.length
  var extraBytes = len % 3 // if we have 1 byte left, pad 2 bytes
  var parts = []
  var maxChunkLength = 16383 // must be multiple of 3

  // go through the array every three bytes, we'll deal with trailing stuff later
  for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
    parts.push(encodeChunk(
      uint8, i, (i + maxChunkLength) > len2 ? len2 : (i + maxChunkLength)
    ))
  }

  // pad the end with zeros, but make sure to not forget the extra bytes
  if (extraBytes === 1) {
    tmp = uint8[len - 1]
    parts.push(
      lookup[tmp >> 2] +
      lookup[(tmp << 4) & 0x3F] +
      '=='
    )
  } else if (extraBytes === 2) {
    tmp = (uint8[len - 2] << 8) + uint8[len - 1]
    parts.push(
      lookup[tmp >> 10] +
      lookup[(tmp >> 4) & 0x3F] +
      lookup[(tmp << 2) & 0x3F] +
      '='
    )
  }

  return parts.join('')
}
