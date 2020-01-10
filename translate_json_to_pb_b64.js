const baseAbsPath = __dirname + '/';
const yaml = require('js-yaml');
const process = require('process');
const fs = require('fs');
const singleton = Symbol();
const singletonEnforcer = Symbol();

const sequelize = require('sequelize');

const _base64ToUint8Array = function(base64) {
  return Buffer.from(base64, 'base64');
}

const _base64ToArrayBuffer = function(base64) {
  return _base64ToUint8Array(base64).buffer;
}

const transformArrayBufferToBase64 = function(buffer) {
  return fromByteArray(buffer);
};

const pbEncodeData = (struct, payLoad) => {
  const message = struct.create(payLoad);
  const encodedMessage = struct.encode(message).finish();
  return transformArrayBufferToBase64(encodedMessage);
};

const pbDecodeData = (struct, data) => {
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

const pbStructRoot = require(baseAbsPath + './frontend/assets/scripts/modules/buildable_proto_bundle.forcemsg.js');
const buildableLevelConfStruct = pbStructRoot.mineralchem.BuildableLevelConfStruct;
const syncDataStruct = pbStructRoot.mineralchem.SyncDataStruct;
const stageInitialState = pbStructRoot.mineralchem.StageInitialState;

const cmdArgs = process.argv.slice(2);
if (2 != cmdArgs.length) {
  console.error("Please specify exactly 2 parameters as the path of the input JSON file and that of the target SQLite file. If a relative path is used please make sure that it's relative to the SAME directory as this script!");
  process.exit(1);
}

global.window = {}; // A trick to circumvent the "ReferenceError: ... is not defined" in Nodejs for variable named "window".
require(baseAbsPath + 'frontend/assets/plugin_scripts/NetworkUtils');

const commonJsonFilePath = baseAbsPath + '/frontend/assets/resources/stage-common.json';
const commonJsonStr = fs.readFileSync(commonJsonFilePath, "utf8");
const commonJsonObj = JSON.parse(commonJsonStr);

const specificJsonFilePath = cmdArgs[0];
const specificJsonStr = fs.readFileSync(specificJsonFilePath, "utf8");
const specificJsonObj = JSON.parse(specificJsonStr);

const jsonObj = window.calculateEffectiveStageObj(specificJsonObj, commonJsonObj);

const pbB64EncodedStr = pbEncodeData(stageInitialState, jsonObj);

// console.log("\nThe encoded StageInitialState:\n", pbB64EncodedStr);
// console.log("\n");
// console.log("\nThe decoded StageInitialState:\n", pbDecodeData(stageInitialState, pbB64EncodedStr));

const sqliteFilePath = cmdArgs[1];
class SQLiteManager {
  static get instance() {
    if (!this[singleton]) {
      this[singleton] = new SQLiteManager(singletonEnforcer);
    }
    return this[singleton];
  }

  constructor(enforcer) {
    if (enforcer != singletonEnforcer) {
      throw "Cannot construct singleton";
    }

    this.initConnection = this.initConnection.bind(this);
    this.testConnectionAsync = this.testConnectionAsync.bind(this);
  }

  initConnection(sqlitePath) {
    // Refernece https://sequelize.readthedocs.io/en/v3/docs/getting-started/.
    this.dbRef = new sequelize('preconfigured', 'null', 'null', {
      dialect: 'sqlite',
      storage: sqlitePath 
    });
  }

  testConnectionAsync() {
    const instance = this;
    return instance.dbRef.authenticate();
  }
}

class MySQLManager {
  static get instance() {
    if (!this[singleton]) {
      this[singleton] = new MySQLManager(singletonEnforcer);
    }
    return this[singleton];
  }

  constructor(enforcer) {
    if (enforcer != singletonEnforcer)
      throw "Cannot construct singleton";

    const instance = this;

    this.dbRef = null;
    this.host = null;
    this.port = null;
    this.dbname = null;

    this.username = null;
    this.password = null;

    this.testConnectionAsync = this.testConnectionAsync.bind(this);

    try {
      const mysqlConfig = './battle_srv/configs/mysql.json';
      const config = yaml.safeLoad(fs.readFileSync(baseAbsPath + mysqlConfig, 'utf8'));
      this.host = config.host;
      this.port = config.port;
      this.dbname = config.dbname;

      this.username = config.username;
      this.password = config.password;

      this.locationAndIdentity = instance.host + ":" + instance.port + "/" + this.dbname;

      this.dbRef = new sequelize(instance.dbname, instance.username, instance.password, {
        host: instance.host,
        port: instance.port,
        dialect: 'mysql',
        pool: {
          max: 5,
          min: 0,
          idle: 10000
        }
      });
    } catch (e) {
      console.error(e);
    }
  }

  testConnectionAsync() {
    const instance = this;
    return instance.dbRef.authenticate();
  }
}

SQLiteManager.instance.initConnection(sqliteFilePath);

// Reference https://sequelize.org/master/manual/raw-queries.html#replacements
SQLiteManager.instance.dbRef.query('UPDATE stage_initial_state SET pb_b64_encoded_data=? WHERE stage_id=?', {replacements: [pbB64EncodedStr, jsonObj.stageId], type: sequelize.QueryTypes.UPDATE}).then(([results, metadata]) => {
  console.log("SQLite file update result", results, metadata)
  return MySQLManager.instance.testConnectionAsync();
})
.then((res) => {
  console.log("MySQL server connection result: ", res);
  return MySQLManager.instance.dbRef.query('UPDATE stage_initial_state SET pb_b64_encoded_data=? WHERE stage_id=?', {replacements: [pbB64EncodedStr, jsonObj.stageId], type: sequelize.QueryTypes.UPDATE})
  .then(([results, metadata]) => {
    console.log("MySQL server update result: ", results, metadata);
    process.exit();
  });
}, (err) => {
  console.log("MySQL server connection error: ", err);
  process.exit();
});

