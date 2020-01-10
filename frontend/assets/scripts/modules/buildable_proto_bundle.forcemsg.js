/*eslint-disable block-scoped-var, id-length, no-control-regex, no-magic-numbers, no-prototype-builtins, no-redeclare, no-shadow, no-var, sort-vars*/
"use strict";

var $protobuf = require("./protobuf");

// Common aliases
var $Reader = $protobuf.Reader, $Writer = $protobuf.Writer, $util = $protobuf.util;

// Exported root namespace
var $root = $protobuf.roots["default"] || ($protobuf.roots["default"] = {});

$root.mineralchem = (function() {

    /**
     * Namespace mineralchem.
     * @exports mineralchem
     * @namespace
     */
    var mineralchem = {};

    mineralchem.Buildable = (function() {

        /**
         * Properties of a Buildable.
         * @memberof mineralchem
         * @interface IBuildable
         * @property {number|null} [id] Buildable id
         * @property {number|null} [type] Buildable type
         * @property {number|null} [discreteWidth] Buildable discreteWidth
         * @property {number|null} [discreteHeight] Buildable discreteHeight
         * @property {string|null} [displayName] Buildable displayName
         * @property {number|null} [autoCollect] Buildable autoCollect
         */

        /**
         * Constructs a new Buildable.
         * @memberof mineralchem
         * @classdesc Represents a Buildable.
         * @implements IBuildable
         * @constructor
         * @param {mineralchem.IBuildable=} [properties] Properties to set
         */
        function Buildable(properties) {
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * Buildable id.
         * @member {number} id
         * @memberof mineralchem.Buildable
         * @instance
         */
        Buildable.prototype.id = 0;

        /**
         * Buildable type.
         * @member {number} type
         * @memberof mineralchem.Buildable
         * @instance
         */
        Buildable.prototype.type = 0;

        /**
         * Buildable discreteWidth.
         * @member {number} discreteWidth
         * @memberof mineralchem.Buildable
         * @instance
         */
        Buildable.prototype.discreteWidth = 0;

        /**
         * Buildable discreteHeight.
         * @member {number} discreteHeight
         * @memberof mineralchem.Buildable
         * @instance
         */
        Buildable.prototype.discreteHeight = 0;

        /**
         * Buildable displayName.
         * @member {string} displayName
         * @memberof mineralchem.Buildable
         * @instance
         */
        Buildable.prototype.displayName = "";

        /**
         * Buildable autoCollect.
         * @member {number} autoCollect
         * @memberof mineralchem.Buildable
         * @instance
         */
        Buildable.prototype.autoCollect = 0;

        /**
         * Creates a new Buildable instance using the specified properties.
         * @function create
         * @memberof mineralchem.Buildable
         * @static
         * @param {mineralchem.IBuildable=} [properties] Properties to set
         * @returns {mineralchem.Buildable} Buildable instance
         */
        Buildable.create = function create(properties) {
            return new Buildable(properties);
        };

        /**
         * Encodes the specified Buildable message. Does not implicitly {@link mineralchem.Buildable.verify|verify} messages.
         * @function encode
         * @memberof mineralchem.Buildable
         * @static
         * @param {mineralchem.Buildable} message Buildable message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        Buildable.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.id != null && message.hasOwnProperty("id"))
                writer.uint32(/* id 1, wireType 0 =*/8).int32(message.id);
            if (message.type != null && message.hasOwnProperty("type"))
                writer.uint32(/* id 2, wireType 0 =*/16).int32(message.type);
            if (message.discreteWidth != null && message.hasOwnProperty("discreteWidth"))
                writer.uint32(/* id 3, wireType 0 =*/24).int32(message.discreteWidth);
            if (message.discreteHeight != null && message.hasOwnProperty("discreteHeight"))
                writer.uint32(/* id 4, wireType 0 =*/32).int32(message.discreteHeight);
            if (message.displayName != null && message.hasOwnProperty("displayName"))
                writer.uint32(/* id 5, wireType 2 =*/42).string(message.displayName);
            if (message.autoCollect != null && message.hasOwnProperty("autoCollect"))
                writer.uint32(/* id 6, wireType 0 =*/48).int32(message.autoCollect);
            return writer;
        };

        /**
         * Encodes the specified Buildable message, length delimited. Does not implicitly {@link mineralchem.Buildable.verify|verify} messages.
         * @function encodeDelimited
         * @memberof mineralchem.Buildable
         * @static
         * @param {mineralchem.Buildable} message Buildable message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        Buildable.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a Buildable message from the specified reader or buffer.
         * @function decode
         * @memberof mineralchem.Buildable
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {mineralchem.Buildable} Buildable
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        Buildable.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.mineralchem.Buildable();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    message.id = reader.int32();
                    break;
                case 2:
                    message.type = reader.int32();
                    break;
                case 3:
                    message.discreteWidth = reader.int32();
                    break;
                case 4:
                    message.discreteHeight = reader.int32();
                    break;
                case 5:
                    message.displayName = reader.string();
                    break;
                case 6:
                    message.autoCollect = reader.int32();
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a Buildable message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof mineralchem.Buildable
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {mineralchem.Buildable} Buildable
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        Buildable.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a Buildable message.
         * @function verify
         * @memberof mineralchem.Buildable
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        Buildable.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.id != null && message.hasOwnProperty("id"))
                if (!$util.isInteger(message.id))
                    return "id: integer expected";
            if (message.type != null && message.hasOwnProperty("type"))
                if (!$util.isInteger(message.type))
                    return "type: integer expected";
            if (message.discreteWidth != null && message.hasOwnProperty("discreteWidth"))
                if (!$util.isInteger(message.discreteWidth))
                    return "discreteWidth: integer expected";
            if (message.discreteHeight != null && message.hasOwnProperty("discreteHeight"))
                if (!$util.isInteger(message.discreteHeight))
                    return "discreteHeight: integer expected";
            if (message.displayName != null && message.hasOwnProperty("displayName"))
                if (!$util.isString(message.displayName))
                    return "displayName: string expected";
            if (message.autoCollect != null && message.hasOwnProperty("autoCollect"))
                if (!$util.isInteger(message.autoCollect))
                    return "autoCollect: integer expected";
            return null;
        };

        /**
         * Creates a Buildable message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof mineralchem.Buildable
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {mineralchem.Buildable} Buildable
         */
        Buildable.fromObject = function fromObject(object) {
            if (object instanceof $root.mineralchem.Buildable)
                return object;
            var message = new $root.mineralchem.Buildable();
            if (object.id != null)
                message.id = object.id | 0;
            if (object.type != null)
                message.type = object.type | 0;
            if (object.discreteWidth != null)
                message.discreteWidth = object.discreteWidth | 0;
            if (object.discreteHeight != null)
                message.discreteHeight = object.discreteHeight | 0;
            if (object.displayName != null)
                message.displayName = String(object.displayName);
            if (object.autoCollect != null)
                message.autoCollect = object.autoCollect | 0;
            return message;
        };

        /**
         * Creates a plain object from a Buildable message. Also converts values to other types if specified.
         * @function toObject
         * @memberof mineralchem.Buildable
         * @static
         * @param {mineralchem.Buildable} message Buildable
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        Buildable.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            var object = {};
            if (options.defaults) {
                object.id = 0;
                object.type = 0;
                object.discreteWidth = 0;
                object.discreteHeight = 0;
                object.displayName = "";
                object.autoCollect = 0;
            }
            if (message.id != null && message.hasOwnProperty("id"))
                object.id = message.id;
            if (message.type != null && message.hasOwnProperty("type"))
                object.type = message.type;
            if (message.discreteWidth != null && message.hasOwnProperty("discreteWidth"))
                object.discreteWidth = message.discreteWidth;
            if (message.discreteHeight != null && message.hasOwnProperty("discreteHeight"))
                object.discreteHeight = message.discreteHeight;
            if (message.displayName != null && message.hasOwnProperty("displayName"))
                object.displayName = message.displayName;
            if (message.autoCollect != null && message.hasOwnProperty("autoCollect"))
                object.autoCollect = message.autoCollect;
            return object;
        };

        /**
         * Converts this Buildable to JSON.
         * @function toJSON
         * @memberof mineralchem.Buildable
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        Buildable.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return Buildable;
    })();

    mineralchem.BuildableLevelBinding = (function() {

        /**
         * Properties of a BuildableLevelBinding.
         * @memberof mineralchem
         * @interface IBuildableLevelBinding
         * @property {number|null} [id] BuildableLevelBinding id
         * @property {mineralchem.Buildable|null} [buildable] BuildableLevelBinding buildable
         * @property {number|null} [level] BuildableLevelBinding level
         * @property {number|null} [buildingOrUpgradingDuration] BuildableLevelBinding buildingOrUpgradingDuration
         * @property {number|null} [buildingOrUpgradingRequiredGold] BuildableLevelBinding buildingOrUpgradingRequiredGold
         * @property {number|null} [buildingOrUpgradingRequiredResidentsCount] BuildableLevelBinding buildingOrUpgradingRequiredResidentsCount
         * @property {number|null} [baseGoldProductionRate] BuildableLevelBinding baseGoldProductionRate
         * @property {number|null} [baseFoodProductionRate] BuildableLevelBinding baseFoodProductionRate
         * @property {number|null} [baseRiflemanProductionRequiredGold] BuildableLevelBinding baseRiflemanProductionRequiredGold
         * @property {number|null} [baseRiflemanProductionDuration] BuildableLevelBinding baseRiflemanProductionDuration
         * @property {Array.<mineralchem.BuildableLevelDependency>|null} [dependency] BuildableLevelBinding dependency
         * @property {number|null} [goldLimitAddition] BuildableLevelBinding goldLimitAddition
         * @property {number|null} [baseHp] BuildableLevelBinding baseHp
         * @property {number|null} [baseDamage] BuildableLevelBinding baseDamage
         */

        /**
         * Constructs a new BuildableLevelBinding.
         * @memberof mineralchem
         * @classdesc Represents a BuildableLevelBinding.
         * @implements IBuildableLevelBinding
         * @constructor
         * @param {mineralchem.IBuildableLevelBinding=} [properties] Properties to set
         */
        function BuildableLevelBinding(properties) {
            this.dependency = [];
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * BuildableLevelBinding id.
         * @member {number} id
         * @memberof mineralchem.BuildableLevelBinding
         * @instance
         */
        BuildableLevelBinding.prototype.id = 0;

        /**
         * BuildableLevelBinding buildable.
         * @member {mineralchem.Buildable|null|undefined} buildable
         * @memberof mineralchem.BuildableLevelBinding
         * @instance
         */
        BuildableLevelBinding.prototype.buildable = null;

        /**
         * BuildableLevelBinding level.
         * @member {number} level
         * @memberof mineralchem.BuildableLevelBinding
         * @instance
         */
        BuildableLevelBinding.prototype.level = 0;

        /**
         * BuildableLevelBinding buildingOrUpgradingDuration.
         * @member {number} buildingOrUpgradingDuration
         * @memberof mineralchem.BuildableLevelBinding
         * @instance
         */
        BuildableLevelBinding.prototype.buildingOrUpgradingDuration = 0;

        /**
         * BuildableLevelBinding buildingOrUpgradingRequiredGold.
         * @member {number} buildingOrUpgradingRequiredGold
         * @memberof mineralchem.BuildableLevelBinding
         * @instance
         */
        BuildableLevelBinding.prototype.buildingOrUpgradingRequiredGold = 0;

        /**
         * BuildableLevelBinding buildingOrUpgradingRequiredResidentsCount.
         * @member {number} buildingOrUpgradingRequiredResidentsCount
         * @memberof mineralchem.BuildableLevelBinding
         * @instance
         */
        BuildableLevelBinding.prototype.buildingOrUpgradingRequiredResidentsCount = 0;

        /**
         * BuildableLevelBinding baseGoldProductionRate.
         * @member {number} baseGoldProductionRate
         * @memberof mineralchem.BuildableLevelBinding
         * @instance
         */
        BuildableLevelBinding.prototype.baseGoldProductionRate = 0;

        /**
         * BuildableLevelBinding baseFoodProductionRate.
         * @member {number} baseFoodProductionRate
         * @memberof mineralchem.BuildableLevelBinding
         * @instance
         */
        BuildableLevelBinding.prototype.baseFoodProductionRate = 0;

        /**
         * BuildableLevelBinding baseRiflemanProductionRequiredGold.
         * @member {number} baseRiflemanProductionRequiredGold
         * @memberof mineralchem.BuildableLevelBinding
         * @instance
         */
        BuildableLevelBinding.prototype.baseRiflemanProductionRequiredGold = 0;

        /**
         * BuildableLevelBinding baseRiflemanProductionDuration.
         * @member {number} baseRiflemanProductionDuration
         * @memberof mineralchem.BuildableLevelBinding
         * @instance
         */
        BuildableLevelBinding.prototype.baseRiflemanProductionDuration = 0;

        /**
         * BuildableLevelBinding dependency.
         * @member {Array.<mineralchem.BuildableLevelDependency>} dependency
         * @memberof mineralchem.BuildableLevelBinding
         * @instance
         */
        BuildableLevelBinding.prototype.dependency = $util.emptyArray;

        /**
         * BuildableLevelBinding goldLimitAddition.
         * @member {number} goldLimitAddition
         * @memberof mineralchem.BuildableLevelBinding
         * @instance
         */
        BuildableLevelBinding.prototype.goldLimitAddition = 0;

        /**
         * BuildableLevelBinding baseHp.
         * @member {number} baseHp
         * @memberof mineralchem.BuildableLevelBinding
         * @instance
         */
        BuildableLevelBinding.prototype.baseHp = 0;

        /**
         * BuildableLevelBinding baseDamage.
         * @member {number} baseDamage
         * @memberof mineralchem.BuildableLevelBinding
         * @instance
         */
        BuildableLevelBinding.prototype.baseDamage = 0;

        /**
         * Creates a new BuildableLevelBinding instance using the specified properties.
         * @function create
         * @memberof mineralchem.BuildableLevelBinding
         * @static
         * @param {mineralchem.IBuildableLevelBinding=} [properties] Properties to set
         * @returns {mineralchem.BuildableLevelBinding} BuildableLevelBinding instance
         */
        BuildableLevelBinding.create = function create(properties) {
            return new BuildableLevelBinding(properties);
        };

        /**
         * Encodes the specified BuildableLevelBinding message. Does not implicitly {@link mineralchem.BuildableLevelBinding.verify|verify} messages.
         * @function encode
         * @memberof mineralchem.BuildableLevelBinding
         * @static
         * @param {mineralchem.BuildableLevelBinding} message BuildableLevelBinding message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        BuildableLevelBinding.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.id != null && message.hasOwnProperty("id"))
                writer.uint32(/* id 1, wireType 0 =*/8).int32(message.id);
            if (message.buildable != null && message.hasOwnProperty("buildable"))
                $root.mineralchem.Buildable.encode(message.buildable, writer.uint32(/* id 2, wireType 2 =*/18).fork()).ldelim();
            if (message.level != null && message.hasOwnProperty("level"))
                writer.uint32(/* id 3, wireType 0 =*/24).int32(message.level);
            if (message.buildingOrUpgradingDuration != null && message.hasOwnProperty("buildingOrUpgradingDuration"))
                writer.uint32(/* id 4, wireType 0 =*/32).int32(message.buildingOrUpgradingDuration);
            if (message.buildingOrUpgradingRequiredGold != null && message.hasOwnProperty("buildingOrUpgradingRequiredGold"))
                writer.uint32(/* id 5, wireType 0 =*/40).int32(message.buildingOrUpgradingRequiredGold);
            if (message.buildingOrUpgradingRequiredResidentsCount != null && message.hasOwnProperty("buildingOrUpgradingRequiredResidentsCount"))
                writer.uint32(/* id 6, wireType 0 =*/48).int32(message.buildingOrUpgradingRequiredResidentsCount);
            if (message.baseGoldProductionRate != null && message.hasOwnProperty("baseGoldProductionRate"))
                writer.uint32(/* id 7, wireType 1 =*/57).double(message.baseGoldProductionRate);
            if (message.baseFoodProductionRate != null && message.hasOwnProperty("baseFoodProductionRate"))
                writer.uint32(/* id 8, wireType 0 =*/64).int32(message.baseFoodProductionRate);
            if (message.baseRiflemanProductionRequiredGold != null && message.hasOwnProperty("baseRiflemanProductionRequiredGold"))
                writer.uint32(/* id 9, wireType 0 =*/72).int32(message.baseRiflemanProductionRequiredGold);
            if (message.baseRiflemanProductionDuration != null && message.hasOwnProperty("baseRiflemanProductionDuration"))
                writer.uint32(/* id 10, wireType 0 =*/80).int32(message.baseRiflemanProductionDuration);
            if (message.dependency != null && message.dependency.length)
                for (var i = 0; i < message.dependency.length; ++i)
                    $root.mineralchem.BuildableLevelDependency.encode(message.dependency[i], writer.uint32(/* id 11, wireType 2 =*/90).fork()).ldelim();
            if (message.goldLimitAddition != null && message.hasOwnProperty("goldLimitAddition"))
                writer.uint32(/* id 12, wireType 0 =*/96).int32(message.goldLimitAddition);
            if (message.baseHp != null && message.hasOwnProperty("baseHp"))
                writer.uint32(/* id 13, wireType 0 =*/104).int32(message.baseHp);
            if (message.baseDamage != null && message.hasOwnProperty("baseDamage"))
                writer.uint32(/* id 14, wireType 0 =*/112).int32(message.baseDamage);
            return writer;
        };

        /**
         * Encodes the specified BuildableLevelBinding message, length delimited. Does not implicitly {@link mineralchem.BuildableLevelBinding.verify|verify} messages.
         * @function encodeDelimited
         * @memberof mineralchem.BuildableLevelBinding
         * @static
         * @param {mineralchem.BuildableLevelBinding} message BuildableLevelBinding message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        BuildableLevelBinding.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a BuildableLevelBinding message from the specified reader or buffer.
         * @function decode
         * @memberof mineralchem.BuildableLevelBinding
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {mineralchem.BuildableLevelBinding} BuildableLevelBinding
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        BuildableLevelBinding.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.mineralchem.BuildableLevelBinding();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    message.id = reader.int32();
                    break;
                case 2:
                    message.buildable = $root.mineralchem.Buildable.decode(reader, reader.uint32());
                    break;
                case 3:
                    message.level = reader.int32();
                    break;
                case 4:
                    message.buildingOrUpgradingDuration = reader.int32();
                    break;
                case 5:
                    message.buildingOrUpgradingRequiredGold = reader.int32();
                    break;
                case 6:
                    message.buildingOrUpgradingRequiredResidentsCount = reader.int32();
                    break;
                case 7:
                    message.baseGoldProductionRate = reader.double();
                    break;
                case 8:
                    message.baseFoodProductionRate = reader.int32();
                    break;
                case 9:
                    message.baseRiflemanProductionRequiredGold = reader.int32();
                    break;
                case 10:
                    message.baseRiflemanProductionDuration = reader.int32();
                    break;
                case 11:
                    if (!(message.dependency && message.dependency.length))
                        message.dependency = [];
                    message.dependency.push($root.mineralchem.BuildableLevelDependency.decode(reader, reader.uint32()));
                    break;
                case 12:
                    message.goldLimitAddition = reader.int32();
                    break;
                case 13:
                    message.baseHp = reader.int32();
                    break;
                case 14:
                    message.baseDamage = reader.int32();
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a BuildableLevelBinding message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof mineralchem.BuildableLevelBinding
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {mineralchem.BuildableLevelBinding} BuildableLevelBinding
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        BuildableLevelBinding.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a BuildableLevelBinding message.
         * @function verify
         * @memberof mineralchem.BuildableLevelBinding
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        BuildableLevelBinding.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.id != null && message.hasOwnProperty("id"))
                if (!$util.isInteger(message.id))
                    return "id: integer expected";
            if (message.buildable != null && message.hasOwnProperty("buildable")) {
                var error = $root.mineralchem.Buildable.verify(message.buildable);
                if (error)
                    return "buildable." + error;
            }
            if (message.level != null && message.hasOwnProperty("level"))
                if (!$util.isInteger(message.level))
                    return "level: integer expected";
            if (message.buildingOrUpgradingDuration != null && message.hasOwnProperty("buildingOrUpgradingDuration"))
                if (!$util.isInteger(message.buildingOrUpgradingDuration))
                    return "buildingOrUpgradingDuration: integer expected";
            if (message.buildingOrUpgradingRequiredGold != null && message.hasOwnProperty("buildingOrUpgradingRequiredGold"))
                if (!$util.isInteger(message.buildingOrUpgradingRequiredGold))
                    return "buildingOrUpgradingRequiredGold: integer expected";
            if (message.buildingOrUpgradingRequiredResidentsCount != null && message.hasOwnProperty("buildingOrUpgradingRequiredResidentsCount"))
                if (!$util.isInteger(message.buildingOrUpgradingRequiredResidentsCount))
                    return "buildingOrUpgradingRequiredResidentsCount: integer expected";
            if (message.baseGoldProductionRate != null && message.hasOwnProperty("baseGoldProductionRate"))
                if (typeof message.baseGoldProductionRate !== "number")
                    return "baseGoldProductionRate: number expected";
            if (message.baseFoodProductionRate != null && message.hasOwnProperty("baseFoodProductionRate"))
                if (!$util.isInteger(message.baseFoodProductionRate))
                    return "baseFoodProductionRate: integer expected";
            if (message.baseRiflemanProductionRequiredGold != null && message.hasOwnProperty("baseRiflemanProductionRequiredGold"))
                if (!$util.isInteger(message.baseRiflemanProductionRequiredGold))
                    return "baseRiflemanProductionRequiredGold: integer expected";
            if (message.baseRiflemanProductionDuration != null && message.hasOwnProperty("baseRiflemanProductionDuration"))
                if (!$util.isInteger(message.baseRiflemanProductionDuration))
                    return "baseRiflemanProductionDuration: integer expected";
            if (message.dependency != null && message.hasOwnProperty("dependency")) {
                if (!Array.isArray(message.dependency))
                    return "dependency: array expected";
                for (var i = 0; i < message.dependency.length; ++i) {
                    var error = $root.mineralchem.BuildableLevelDependency.verify(message.dependency[i]);
                    if (error)
                        return "dependency." + error;
                }
            }
            if (message.goldLimitAddition != null && message.hasOwnProperty("goldLimitAddition"))
                if (!$util.isInteger(message.goldLimitAddition))
                    return "goldLimitAddition: integer expected";
            if (message.baseHp != null && message.hasOwnProperty("baseHp"))
                if (!$util.isInteger(message.baseHp))
                    return "baseHp: integer expected";
            if (message.baseDamage != null && message.hasOwnProperty("baseDamage"))
                if (!$util.isInteger(message.baseDamage))
                    return "baseDamage: integer expected";
            return null;
        };

        /**
         * Creates a BuildableLevelBinding message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof mineralchem.BuildableLevelBinding
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {mineralchem.BuildableLevelBinding} BuildableLevelBinding
         */
        BuildableLevelBinding.fromObject = function fromObject(object) {
            if (object instanceof $root.mineralchem.BuildableLevelBinding)
                return object;
            var message = new $root.mineralchem.BuildableLevelBinding();
            if (object.id != null)
                message.id = object.id | 0;
            if (object.buildable != null) {
                if (typeof object.buildable !== "object")
                    throw TypeError(".mineralchem.BuildableLevelBinding.buildable: object expected");
                message.buildable = $root.mineralchem.Buildable.fromObject(object.buildable);
            }
            if (object.level != null)
                message.level = object.level | 0;
            if (object.buildingOrUpgradingDuration != null)
                message.buildingOrUpgradingDuration = object.buildingOrUpgradingDuration | 0;
            if (object.buildingOrUpgradingRequiredGold != null)
                message.buildingOrUpgradingRequiredGold = object.buildingOrUpgradingRequiredGold | 0;
            if (object.buildingOrUpgradingRequiredResidentsCount != null)
                message.buildingOrUpgradingRequiredResidentsCount = object.buildingOrUpgradingRequiredResidentsCount | 0;
            if (object.baseGoldProductionRate != null)
                message.baseGoldProductionRate = Number(object.baseGoldProductionRate);
            if (object.baseFoodProductionRate != null)
                message.baseFoodProductionRate = object.baseFoodProductionRate | 0;
            if (object.baseRiflemanProductionRequiredGold != null)
                message.baseRiflemanProductionRequiredGold = object.baseRiflemanProductionRequiredGold | 0;
            if (object.baseRiflemanProductionDuration != null)
                message.baseRiflemanProductionDuration = object.baseRiflemanProductionDuration | 0;
            if (object.dependency) {
                if (!Array.isArray(object.dependency))
                    throw TypeError(".mineralchem.BuildableLevelBinding.dependency: array expected");
                message.dependency = [];
                for (var i = 0; i < object.dependency.length; ++i) {
                    if (typeof object.dependency[i] !== "object")
                        throw TypeError(".mineralchem.BuildableLevelBinding.dependency: object expected");
                    message.dependency[i] = $root.mineralchem.BuildableLevelDependency.fromObject(object.dependency[i]);
                }
            }
            if (object.goldLimitAddition != null)
                message.goldLimitAddition = object.goldLimitAddition | 0;
            if (object.baseHp != null)
                message.baseHp = object.baseHp | 0;
            if (object.baseDamage != null)
                message.baseDamage = object.baseDamage | 0;
            return message;
        };

        /**
         * Creates a plain object from a BuildableLevelBinding message. Also converts values to other types if specified.
         * @function toObject
         * @memberof mineralchem.BuildableLevelBinding
         * @static
         * @param {mineralchem.BuildableLevelBinding} message BuildableLevelBinding
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        BuildableLevelBinding.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            var object = {};
            if (options.arrays || options.defaults)
                object.dependency = [];
            if (options.defaults) {
                object.id = 0;
                object.buildable = null;
                object.level = 0;
                object.buildingOrUpgradingDuration = 0;
                object.buildingOrUpgradingRequiredGold = 0;
                object.buildingOrUpgradingRequiredResidentsCount = 0;
                object.baseGoldProductionRate = 0;
                object.baseFoodProductionRate = 0;
                object.baseRiflemanProductionRequiredGold = 0;
                object.baseRiflemanProductionDuration = 0;
                object.goldLimitAddition = 0;
                object.baseHp = 0;
                object.baseDamage = 0;
            }
            if (message.id != null && message.hasOwnProperty("id"))
                object.id = message.id;
            if (message.buildable != null && message.hasOwnProperty("buildable"))
                object.buildable = $root.mineralchem.Buildable.toObject(message.buildable, options);
            if (message.level != null && message.hasOwnProperty("level"))
                object.level = message.level;
            if (message.buildingOrUpgradingDuration != null && message.hasOwnProperty("buildingOrUpgradingDuration"))
                object.buildingOrUpgradingDuration = message.buildingOrUpgradingDuration;
            if (message.buildingOrUpgradingRequiredGold != null && message.hasOwnProperty("buildingOrUpgradingRequiredGold"))
                object.buildingOrUpgradingRequiredGold = message.buildingOrUpgradingRequiredGold;
            if (message.buildingOrUpgradingRequiredResidentsCount != null && message.hasOwnProperty("buildingOrUpgradingRequiredResidentsCount"))
                object.buildingOrUpgradingRequiredResidentsCount = message.buildingOrUpgradingRequiredResidentsCount;
            if (message.baseGoldProductionRate != null && message.hasOwnProperty("baseGoldProductionRate"))
                object.baseGoldProductionRate = options.json && !isFinite(message.baseGoldProductionRate) ? String(message.baseGoldProductionRate) : message.baseGoldProductionRate;
            if (message.baseFoodProductionRate != null && message.hasOwnProperty("baseFoodProductionRate"))
                object.baseFoodProductionRate = message.baseFoodProductionRate;
            if (message.baseRiflemanProductionRequiredGold != null && message.hasOwnProperty("baseRiflemanProductionRequiredGold"))
                object.baseRiflemanProductionRequiredGold = message.baseRiflemanProductionRequiredGold;
            if (message.baseRiflemanProductionDuration != null && message.hasOwnProperty("baseRiflemanProductionDuration"))
                object.baseRiflemanProductionDuration = message.baseRiflemanProductionDuration;
            if (message.dependency && message.dependency.length) {
                object.dependency = [];
                for (var j = 0; j < message.dependency.length; ++j)
                    object.dependency[j] = $root.mineralchem.BuildableLevelDependency.toObject(message.dependency[j], options);
            }
            if (message.goldLimitAddition != null && message.hasOwnProperty("goldLimitAddition"))
                object.goldLimitAddition = message.goldLimitAddition;
            if (message.baseHp != null && message.hasOwnProperty("baseHp"))
                object.baseHp = message.baseHp;
            if (message.baseDamage != null && message.hasOwnProperty("baseDamage"))
                object.baseDamage = message.baseDamage;
            return object;
        };

        /**
         * Converts this BuildableLevelBinding to JSON.
         * @function toJSON
         * @memberof mineralchem.BuildableLevelBinding
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        BuildableLevelBinding.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return BuildableLevelBinding;
    })();

    mineralchem.BuildableLevelDependency = (function() {

        /**
         * Properties of a BuildableLevelDependency.
         * @memberof mineralchem
         * @interface IBuildableLevelDependency
         * @property {number|null} [requiredBuildableId] BuildableLevelDependency requiredBuildableId
         * @property {number|null} [requiredBuildableCount] BuildableLevelDependency requiredBuildableCount
         * @property {number|null} [requiredMinimumLevel] BuildableLevelDependency requiredMinimumLevel
         * @property {number|null} [targetBuildableMaxCount] BuildableLevelDependency targetBuildableMaxCount
         */

        /**
         * Constructs a new BuildableLevelDependency.
         * @memberof mineralchem
         * @classdesc Represents a BuildableLevelDependency.
         * @implements IBuildableLevelDependency
         * @constructor
         * @param {mineralchem.IBuildableLevelDependency=} [properties] Properties to set
         */
        function BuildableLevelDependency(properties) {
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * BuildableLevelDependency requiredBuildableId.
         * @member {number} requiredBuildableId
         * @memberof mineralchem.BuildableLevelDependency
         * @instance
         */
        BuildableLevelDependency.prototype.requiredBuildableId = 0;

        /**
         * BuildableLevelDependency requiredBuildableCount.
         * @member {number} requiredBuildableCount
         * @memberof mineralchem.BuildableLevelDependency
         * @instance
         */
        BuildableLevelDependency.prototype.requiredBuildableCount = 0;

        /**
         * BuildableLevelDependency requiredMinimumLevel.
         * @member {number} requiredMinimumLevel
         * @memberof mineralchem.BuildableLevelDependency
         * @instance
         */
        BuildableLevelDependency.prototype.requiredMinimumLevel = 0;

        /**
         * BuildableLevelDependency targetBuildableMaxCount.
         * @member {number} targetBuildableMaxCount
         * @memberof mineralchem.BuildableLevelDependency
         * @instance
         */
        BuildableLevelDependency.prototype.targetBuildableMaxCount = 0;

        /**
         * Creates a new BuildableLevelDependency instance using the specified properties.
         * @function create
         * @memberof mineralchem.BuildableLevelDependency
         * @static
         * @param {mineralchem.IBuildableLevelDependency=} [properties] Properties to set
         * @returns {mineralchem.BuildableLevelDependency} BuildableLevelDependency instance
         */
        BuildableLevelDependency.create = function create(properties) {
            return new BuildableLevelDependency(properties);
        };

        /**
         * Encodes the specified BuildableLevelDependency message. Does not implicitly {@link mineralchem.BuildableLevelDependency.verify|verify} messages.
         * @function encode
         * @memberof mineralchem.BuildableLevelDependency
         * @static
         * @param {mineralchem.BuildableLevelDependency} message BuildableLevelDependency message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        BuildableLevelDependency.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.requiredBuildableId != null && message.hasOwnProperty("requiredBuildableId"))
                writer.uint32(/* id 1, wireType 0 =*/8).int32(message.requiredBuildableId);
            if (message.requiredBuildableCount != null && message.hasOwnProperty("requiredBuildableCount"))
                writer.uint32(/* id 2, wireType 0 =*/16).int32(message.requiredBuildableCount);
            if (message.requiredMinimumLevel != null && message.hasOwnProperty("requiredMinimumLevel"))
                writer.uint32(/* id 3, wireType 0 =*/24).int32(message.requiredMinimumLevel);
            if (message.targetBuildableMaxCount != null && message.hasOwnProperty("targetBuildableMaxCount"))
                writer.uint32(/* id 4, wireType 0 =*/32).int32(message.targetBuildableMaxCount);
            return writer;
        };

        /**
         * Encodes the specified BuildableLevelDependency message, length delimited. Does not implicitly {@link mineralchem.BuildableLevelDependency.verify|verify} messages.
         * @function encodeDelimited
         * @memberof mineralchem.BuildableLevelDependency
         * @static
         * @param {mineralchem.BuildableLevelDependency} message BuildableLevelDependency message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        BuildableLevelDependency.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a BuildableLevelDependency message from the specified reader or buffer.
         * @function decode
         * @memberof mineralchem.BuildableLevelDependency
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {mineralchem.BuildableLevelDependency} BuildableLevelDependency
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        BuildableLevelDependency.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.mineralchem.BuildableLevelDependency();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    message.requiredBuildableId = reader.int32();
                    break;
                case 2:
                    message.requiredBuildableCount = reader.int32();
                    break;
                case 3:
                    message.requiredMinimumLevel = reader.int32();
                    break;
                case 4:
                    message.targetBuildableMaxCount = reader.int32();
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a BuildableLevelDependency message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof mineralchem.BuildableLevelDependency
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {mineralchem.BuildableLevelDependency} BuildableLevelDependency
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        BuildableLevelDependency.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a BuildableLevelDependency message.
         * @function verify
         * @memberof mineralchem.BuildableLevelDependency
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        BuildableLevelDependency.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.requiredBuildableId != null && message.hasOwnProperty("requiredBuildableId"))
                if (!$util.isInteger(message.requiredBuildableId))
                    return "requiredBuildableId: integer expected";
            if (message.requiredBuildableCount != null && message.hasOwnProperty("requiredBuildableCount"))
                if (!$util.isInteger(message.requiredBuildableCount))
                    return "requiredBuildableCount: integer expected";
            if (message.requiredMinimumLevel != null && message.hasOwnProperty("requiredMinimumLevel"))
                if (!$util.isInteger(message.requiredMinimumLevel))
                    return "requiredMinimumLevel: integer expected";
            if (message.targetBuildableMaxCount != null && message.hasOwnProperty("targetBuildableMaxCount"))
                if (!$util.isInteger(message.targetBuildableMaxCount))
                    return "targetBuildableMaxCount: integer expected";
            return null;
        };

        /**
         * Creates a BuildableLevelDependency message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof mineralchem.BuildableLevelDependency
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {mineralchem.BuildableLevelDependency} BuildableLevelDependency
         */
        BuildableLevelDependency.fromObject = function fromObject(object) {
            if (object instanceof $root.mineralchem.BuildableLevelDependency)
                return object;
            var message = new $root.mineralchem.BuildableLevelDependency();
            if (object.requiredBuildableId != null)
                message.requiredBuildableId = object.requiredBuildableId | 0;
            if (object.requiredBuildableCount != null)
                message.requiredBuildableCount = object.requiredBuildableCount | 0;
            if (object.requiredMinimumLevel != null)
                message.requiredMinimumLevel = object.requiredMinimumLevel | 0;
            if (object.targetBuildableMaxCount != null)
                message.targetBuildableMaxCount = object.targetBuildableMaxCount | 0;
            return message;
        };

        /**
         * Creates a plain object from a BuildableLevelDependency message. Also converts values to other types if specified.
         * @function toObject
         * @memberof mineralchem.BuildableLevelDependency
         * @static
         * @param {mineralchem.BuildableLevelDependency} message BuildableLevelDependency
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        BuildableLevelDependency.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            var object = {};
            if (options.defaults) {
                object.requiredBuildableId = 0;
                object.requiredBuildableCount = 0;
                object.requiredMinimumLevel = 0;
                object.targetBuildableMaxCount = 0;
            }
            if (message.requiredBuildableId != null && message.hasOwnProperty("requiredBuildableId"))
                object.requiredBuildableId = message.requiredBuildableId;
            if (message.requiredBuildableCount != null && message.hasOwnProperty("requiredBuildableCount"))
                object.requiredBuildableCount = message.requiredBuildableCount;
            if (message.requiredMinimumLevel != null && message.hasOwnProperty("requiredMinimumLevel"))
                object.requiredMinimumLevel = message.requiredMinimumLevel;
            if (message.targetBuildableMaxCount != null && message.hasOwnProperty("targetBuildableMaxCount"))
                object.targetBuildableMaxCount = message.targetBuildableMaxCount;
            return object;
        };

        /**
         * Converts this BuildableLevelDependency to JSON.
         * @function toJSON
         * @memberof mineralchem.BuildableLevelDependency
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        BuildableLevelDependency.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return BuildableLevelDependency;
    })();

    mineralchem.BuildableIngredientInteraction = (function() {

        /**
         * Properties of a BuildableIngredientInteraction.
         * @memberof mineralchem
         * @interface IBuildableIngredientInteraction
         * @property {number|null} [id] BuildableIngredientInteraction id
         * @property {number|null} [buildableId] BuildableIngredientInteraction buildableId
         * @property {number|null} [ingredientId] BuildableIngredientInteraction ingredientId
         * @property {number|null} [type] BuildableIngredientInteraction type
         * @property {number|null} [buildableLevelToUnlockDisplayName] BuildableIngredientInteraction buildableLevelToUnlockDisplayName
         * @property {number|null} [recipeId] BuildableIngredientInteraction recipeId
         * @property {number|null} [ingredientPurchasePriceCurrency] BuildableIngredientInteraction ingredientPurchasePriceCurrency
         * @property {number|null} [ingredientPurchasePriceValue] BuildableIngredientInteraction ingredientPurchasePriceValue
         */

        /**
         * Constructs a new BuildableIngredientInteraction.
         * @memberof mineralchem
         * @classdesc Represents a BuildableIngredientInteraction.
         * @implements IBuildableIngredientInteraction
         * @constructor
         * @param {mineralchem.IBuildableIngredientInteraction=} [properties] Properties to set
         */
        function BuildableIngredientInteraction(properties) {
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * BuildableIngredientInteraction id.
         * @member {number} id
         * @memberof mineralchem.BuildableIngredientInteraction
         * @instance
         */
        BuildableIngredientInteraction.prototype.id = 0;

        /**
         * BuildableIngredientInteraction buildableId.
         * @member {number} buildableId
         * @memberof mineralchem.BuildableIngredientInteraction
         * @instance
         */
        BuildableIngredientInteraction.prototype.buildableId = 0;

        /**
         * BuildableIngredientInteraction ingredientId.
         * @member {number} ingredientId
         * @memberof mineralchem.BuildableIngredientInteraction
         * @instance
         */
        BuildableIngredientInteraction.prototype.ingredientId = 0;

        /**
         * BuildableIngredientInteraction type.
         * @member {number} type
         * @memberof mineralchem.BuildableIngredientInteraction
         * @instance
         */
        BuildableIngredientInteraction.prototype.type = 0;

        /**
         * BuildableIngredientInteraction buildableLevelToUnlockDisplayName.
         * @member {number} buildableLevelToUnlockDisplayName
         * @memberof mineralchem.BuildableIngredientInteraction
         * @instance
         */
        BuildableIngredientInteraction.prototype.buildableLevelToUnlockDisplayName = 0;

        /**
         * BuildableIngredientInteraction recipeId.
         * @member {number} recipeId
         * @memberof mineralchem.BuildableIngredientInteraction
         * @instance
         */
        BuildableIngredientInteraction.prototype.recipeId = 0;

        /**
         * BuildableIngredientInteraction ingredientPurchasePriceCurrency.
         * @member {number} ingredientPurchasePriceCurrency
         * @memberof mineralchem.BuildableIngredientInteraction
         * @instance
         */
        BuildableIngredientInteraction.prototype.ingredientPurchasePriceCurrency = 0;

        /**
         * BuildableIngredientInteraction ingredientPurchasePriceValue.
         * @member {number} ingredientPurchasePriceValue
         * @memberof mineralchem.BuildableIngredientInteraction
         * @instance
         */
        BuildableIngredientInteraction.prototype.ingredientPurchasePriceValue = 0;

        /**
         * Creates a new BuildableIngredientInteraction instance using the specified properties.
         * @function create
         * @memberof mineralchem.BuildableIngredientInteraction
         * @static
         * @param {mineralchem.IBuildableIngredientInteraction=} [properties] Properties to set
         * @returns {mineralchem.BuildableIngredientInteraction} BuildableIngredientInteraction instance
         */
        BuildableIngredientInteraction.create = function create(properties) {
            return new BuildableIngredientInteraction(properties);
        };

        /**
         * Encodes the specified BuildableIngredientInteraction message. Does not implicitly {@link mineralchem.BuildableIngredientInteraction.verify|verify} messages.
         * @function encode
         * @memberof mineralchem.BuildableIngredientInteraction
         * @static
         * @param {mineralchem.BuildableIngredientInteraction} message BuildableIngredientInteraction message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        BuildableIngredientInteraction.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.id != null && message.hasOwnProperty("id"))
                writer.uint32(/* id 1, wireType 0 =*/8).int32(message.id);
            if (message.buildableId != null && message.hasOwnProperty("buildableId"))
                writer.uint32(/* id 2, wireType 0 =*/16).int32(message.buildableId);
            if (message.ingredientId != null && message.hasOwnProperty("ingredientId"))
                writer.uint32(/* id 3, wireType 0 =*/24).int32(message.ingredientId);
            if (message.type != null && message.hasOwnProperty("type"))
                writer.uint32(/* id 4, wireType 0 =*/32).int32(message.type);
            if (message.buildableLevelToUnlockDisplayName != null && message.hasOwnProperty("buildableLevelToUnlockDisplayName"))
                writer.uint32(/* id 5, wireType 0 =*/40).int32(message.buildableLevelToUnlockDisplayName);
            if (message.recipeId != null && message.hasOwnProperty("recipeId"))
                writer.uint32(/* id 6, wireType 0 =*/48).int32(message.recipeId);
            if (message.ingredientPurchasePriceCurrency != null && message.hasOwnProperty("ingredientPurchasePriceCurrency"))
                writer.uint32(/* id 7, wireType 0 =*/56).int32(message.ingredientPurchasePriceCurrency);
            if (message.ingredientPurchasePriceValue != null && message.hasOwnProperty("ingredientPurchasePriceValue"))
                writer.uint32(/* id 8, wireType 0 =*/64).int32(message.ingredientPurchasePriceValue);
            return writer;
        };

        /**
         * Encodes the specified BuildableIngredientInteraction message, length delimited. Does not implicitly {@link mineralchem.BuildableIngredientInteraction.verify|verify} messages.
         * @function encodeDelimited
         * @memberof mineralchem.BuildableIngredientInteraction
         * @static
         * @param {mineralchem.BuildableIngredientInteraction} message BuildableIngredientInteraction message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        BuildableIngredientInteraction.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a BuildableIngredientInteraction message from the specified reader or buffer.
         * @function decode
         * @memberof mineralchem.BuildableIngredientInteraction
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {mineralchem.BuildableIngredientInteraction} BuildableIngredientInteraction
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        BuildableIngredientInteraction.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.mineralchem.BuildableIngredientInteraction();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    message.id = reader.int32();
                    break;
                case 2:
                    message.buildableId = reader.int32();
                    break;
                case 3:
                    message.ingredientId = reader.int32();
                    break;
                case 4:
                    message.type = reader.int32();
                    break;
                case 5:
                    message.buildableLevelToUnlockDisplayName = reader.int32();
                    break;
                case 6:
                    message.recipeId = reader.int32();
                    break;
                case 7:
                    message.ingredientPurchasePriceCurrency = reader.int32();
                    break;
                case 8:
                    message.ingredientPurchasePriceValue = reader.int32();
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a BuildableIngredientInteraction message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof mineralchem.BuildableIngredientInteraction
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {mineralchem.BuildableIngredientInteraction} BuildableIngredientInteraction
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        BuildableIngredientInteraction.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a BuildableIngredientInteraction message.
         * @function verify
         * @memberof mineralchem.BuildableIngredientInteraction
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        BuildableIngredientInteraction.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.id != null && message.hasOwnProperty("id"))
                if (!$util.isInteger(message.id))
                    return "id: integer expected";
            if (message.buildableId != null && message.hasOwnProperty("buildableId"))
                if (!$util.isInteger(message.buildableId))
                    return "buildableId: integer expected";
            if (message.ingredientId != null && message.hasOwnProperty("ingredientId"))
                if (!$util.isInteger(message.ingredientId))
                    return "ingredientId: integer expected";
            if (message.type != null && message.hasOwnProperty("type"))
                if (!$util.isInteger(message.type))
                    return "type: integer expected";
            if (message.buildableLevelToUnlockDisplayName != null && message.hasOwnProperty("buildableLevelToUnlockDisplayName"))
                if (!$util.isInteger(message.buildableLevelToUnlockDisplayName))
                    return "buildableLevelToUnlockDisplayName: integer expected";
            if (message.recipeId != null && message.hasOwnProperty("recipeId"))
                if (!$util.isInteger(message.recipeId))
                    return "recipeId: integer expected";
            if (message.ingredientPurchasePriceCurrency != null && message.hasOwnProperty("ingredientPurchasePriceCurrency"))
                if (!$util.isInteger(message.ingredientPurchasePriceCurrency))
                    return "ingredientPurchasePriceCurrency: integer expected";
            if (message.ingredientPurchasePriceValue != null && message.hasOwnProperty("ingredientPurchasePriceValue"))
                if (!$util.isInteger(message.ingredientPurchasePriceValue))
                    return "ingredientPurchasePriceValue: integer expected";
            return null;
        };

        /**
         * Creates a BuildableIngredientInteraction message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof mineralchem.BuildableIngredientInteraction
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {mineralchem.BuildableIngredientInteraction} BuildableIngredientInteraction
         */
        BuildableIngredientInteraction.fromObject = function fromObject(object) {
            if (object instanceof $root.mineralchem.BuildableIngredientInteraction)
                return object;
            var message = new $root.mineralchem.BuildableIngredientInteraction();
            if (object.id != null)
                message.id = object.id | 0;
            if (object.buildableId != null)
                message.buildableId = object.buildableId | 0;
            if (object.ingredientId != null)
                message.ingredientId = object.ingredientId | 0;
            if (object.type != null)
                message.type = object.type | 0;
            if (object.buildableLevelToUnlockDisplayName != null)
                message.buildableLevelToUnlockDisplayName = object.buildableLevelToUnlockDisplayName | 0;
            if (object.recipeId != null)
                message.recipeId = object.recipeId | 0;
            if (object.ingredientPurchasePriceCurrency != null)
                message.ingredientPurchasePriceCurrency = object.ingredientPurchasePriceCurrency | 0;
            if (object.ingredientPurchasePriceValue != null)
                message.ingredientPurchasePriceValue = object.ingredientPurchasePriceValue | 0;
            return message;
        };

        /**
         * Creates a plain object from a BuildableIngredientInteraction message. Also converts values to other types if specified.
         * @function toObject
         * @memberof mineralchem.BuildableIngredientInteraction
         * @static
         * @param {mineralchem.BuildableIngredientInteraction} message BuildableIngredientInteraction
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        BuildableIngredientInteraction.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            var object = {};
            if (options.defaults) {
                object.id = 0;
                object.buildableId = 0;
                object.ingredientId = 0;
                object.type = 0;
                object.buildableLevelToUnlockDisplayName = 0;
                object.recipeId = 0;
                object.ingredientPurchasePriceCurrency = 0;
                object.ingredientPurchasePriceValue = 0;
            }
            if (message.id != null && message.hasOwnProperty("id"))
                object.id = message.id;
            if (message.buildableId != null && message.hasOwnProperty("buildableId"))
                object.buildableId = message.buildableId;
            if (message.ingredientId != null && message.hasOwnProperty("ingredientId"))
                object.ingredientId = message.ingredientId;
            if (message.type != null && message.hasOwnProperty("type"))
                object.type = message.type;
            if (message.buildableLevelToUnlockDisplayName != null && message.hasOwnProperty("buildableLevelToUnlockDisplayName"))
                object.buildableLevelToUnlockDisplayName = message.buildableLevelToUnlockDisplayName;
            if (message.recipeId != null && message.hasOwnProperty("recipeId"))
                object.recipeId = message.recipeId;
            if (message.ingredientPurchasePriceCurrency != null && message.hasOwnProperty("ingredientPurchasePriceCurrency"))
                object.ingredientPurchasePriceCurrency = message.ingredientPurchasePriceCurrency;
            if (message.ingredientPurchasePriceValue != null && message.hasOwnProperty("ingredientPurchasePriceValue"))
                object.ingredientPurchasePriceValue = message.ingredientPurchasePriceValue;
            return object;
        };

        /**
         * Converts this BuildableIngredientInteraction to JSON.
         * @function toJSON
         * @memberof mineralchem.BuildableIngredientInteraction
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        BuildableIngredientInteraction.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return BuildableIngredientInteraction;
    })();

    mineralchem.PlayerBuildableBinding = (function() {

        /**
         * Properties of a PlayerBuildableBinding.
         * @memberof mineralchem
         * @interface IPlayerBuildableBinding
         * @property {number|null} [id] PlayerBuildableBinding id
         * @property {number|null} [topmostTileDiscretePositionX] PlayerBuildableBinding topmostTileDiscretePositionX
         * @property {number|null} [topmostTileDiscretePositionY] PlayerBuildableBinding topmostTileDiscretePositionY
         * @property {number|null} [playerId] PlayerBuildableBinding playerId
         * @property {mineralchem.Buildable|null} [buildable] PlayerBuildableBinding buildable
         * @property {number|null} [currentLevel] PlayerBuildableBinding currentLevel
         * @property {number|null} [state] PlayerBuildableBinding state
         * @property {number|Long|null} [buildingOrUpgradingStartedAt] PlayerBuildableBinding buildingOrUpgradingStartedAt
         * @property {number|null} [immediateGoldProductionRate] PlayerBuildableBinding immediateGoldProductionRate
         * @property {number|null} [immediateRifleProductionRequiredGold] PlayerBuildableBinding immediateRifleProductionRequiredGold
         * @property {number|null} [immediateRifleProductionDuration] PlayerBuildableBinding immediateRifleProductionDuration
         * @property {number|Long|null} [lastCollectedAt] PlayerBuildableBinding lastCollectedAt
         */

        /**
         * Constructs a new PlayerBuildableBinding.
         * @memberof mineralchem
         * @classdesc Represents a PlayerBuildableBinding.
         * @implements IPlayerBuildableBinding
         * @constructor
         * @param {mineralchem.IPlayerBuildableBinding=} [properties] Properties to set
         */
        function PlayerBuildableBinding(properties) {
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * PlayerBuildableBinding id.
         * @member {number} id
         * @memberof mineralchem.PlayerBuildableBinding
         * @instance
         */
        PlayerBuildableBinding.prototype.id = 0;

        /**
         * PlayerBuildableBinding topmostTileDiscretePositionX.
         * @member {number} topmostTileDiscretePositionX
         * @memberof mineralchem.PlayerBuildableBinding
         * @instance
         */
        PlayerBuildableBinding.prototype.topmostTileDiscretePositionX = 0;

        /**
         * PlayerBuildableBinding topmostTileDiscretePositionY.
         * @member {number} topmostTileDiscretePositionY
         * @memberof mineralchem.PlayerBuildableBinding
         * @instance
         */
        PlayerBuildableBinding.prototype.topmostTileDiscretePositionY = 0;

        /**
         * PlayerBuildableBinding playerId.
         * @member {number} playerId
         * @memberof mineralchem.PlayerBuildableBinding
         * @instance
         */
        PlayerBuildableBinding.prototype.playerId = 0;

        /**
         * PlayerBuildableBinding buildable.
         * @member {mineralchem.Buildable|null|undefined} buildable
         * @memberof mineralchem.PlayerBuildableBinding
         * @instance
         */
        PlayerBuildableBinding.prototype.buildable = null;

        /**
         * PlayerBuildableBinding currentLevel.
         * @member {number} currentLevel
         * @memberof mineralchem.PlayerBuildableBinding
         * @instance
         */
        PlayerBuildableBinding.prototype.currentLevel = 0;

        /**
         * PlayerBuildableBinding state.
         * @member {number} state
         * @memberof mineralchem.PlayerBuildableBinding
         * @instance
         */
        PlayerBuildableBinding.prototype.state = 0;

        /**
         * PlayerBuildableBinding buildingOrUpgradingStartedAt.
         * @member {number|Long} buildingOrUpgradingStartedAt
         * @memberof mineralchem.PlayerBuildableBinding
         * @instance
         */
        PlayerBuildableBinding.prototype.buildingOrUpgradingStartedAt = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

        /**
         * PlayerBuildableBinding immediateGoldProductionRate.
         * @member {number} immediateGoldProductionRate
         * @memberof mineralchem.PlayerBuildableBinding
         * @instance
         */
        PlayerBuildableBinding.prototype.immediateGoldProductionRate = 0;

        /**
         * PlayerBuildableBinding immediateRifleProductionRequiredGold.
         * @member {number} immediateRifleProductionRequiredGold
         * @memberof mineralchem.PlayerBuildableBinding
         * @instance
         */
        PlayerBuildableBinding.prototype.immediateRifleProductionRequiredGold = 0;

        /**
         * PlayerBuildableBinding immediateRifleProductionDuration.
         * @member {number} immediateRifleProductionDuration
         * @memberof mineralchem.PlayerBuildableBinding
         * @instance
         */
        PlayerBuildableBinding.prototype.immediateRifleProductionDuration = 0;

        /**
         * PlayerBuildableBinding lastCollectedAt.
         * @member {number|Long} lastCollectedAt
         * @memberof mineralchem.PlayerBuildableBinding
         * @instance
         */
        PlayerBuildableBinding.prototype.lastCollectedAt = $util.Long ? $util.Long.fromBits(0,0,true) : 0;

        /**
         * Creates a new PlayerBuildableBinding instance using the specified properties.
         * @function create
         * @memberof mineralchem.PlayerBuildableBinding
         * @static
         * @param {mineralchem.IPlayerBuildableBinding=} [properties] Properties to set
         * @returns {mineralchem.PlayerBuildableBinding} PlayerBuildableBinding instance
         */
        PlayerBuildableBinding.create = function create(properties) {
            return new PlayerBuildableBinding(properties);
        };

        /**
         * Encodes the specified PlayerBuildableBinding message. Does not implicitly {@link mineralchem.PlayerBuildableBinding.verify|verify} messages.
         * @function encode
         * @memberof mineralchem.PlayerBuildableBinding
         * @static
         * @param {mineralchem.PlayerBuildableBinding} message PlayerBuildableBinding message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        PlayerBuildableBinding.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.id != null && message.hasOwnProperty("id"))
                writer.uint32(/* id 1, wireType 0 =*/8).int32(message.id);
            if (message.topmostTileDiscretePositionX != null && message.hasOwnProperty("topmostTileDiscretePositionX"))
                writer.uint32(/* id 2, wireType 0 =*/16).int32(message.topmostTileDiscretePositionX);
            if (message.topmostTileDiscretePositionY != null && message.hasOwnProperty("topmostTileDiscretePositionY"))
                writer.uint32(/* id 3, wireType 0 =*/24).int32(message.topmostTileDiscretePositionY);
            if (message.playerId != null && message.hasOwnProperty("playerId"))
                writer.uint32(/* id 4, wireType 0 =*/32).int32(message.playerId);
            if (message.buildable != null && message.hasOwnProperty("buildable"))
                $root.mineralchem.Buildable.encode(message.buildable, writer.uint32(/* id 5, wireType 2 =*/42).fork()).ldelim();
            if (message.currentLevel != null && message.hasOwnProperty("currentLevel"))
                writer.uint32(/* id 6, wireType 0 =*/48).int32(message.currentLevel);
            if (message.state != null && message.hasOwnProperty("state"))
                writer.uint32(/* id 7, wireType 0 =*/56).int32(message.state);
            if (message.buildingOrUpgradingStartedAt != null && message.hasOwnProperty("buildingOrUpgradingStartedAt"))
                writer.uint32(/* id 8, wireType 0 =*/64).int64(message.buildingOrUpgradingStartedAt);
            if (message.immediateGoldProductionRate != null && message.hasOwnProperty("immediateGoldProductionRate"))
                writer.uint32(/* id 9, wireType 0 =*/72).int32(message.immediateGoldProductionRate);
            if (message.immediateRifleProductionRequiredGold != null && message.hasOwnProperty("immediateRifleProductionRequiredGold"))
                writer.uint32(/* id 10, wireType 0 =*/80).int32(message.immediateRifleProductionRequiredGold);
            if (message.immediateRifleProductionDuration != null && message.hasOwnProperty("immediateRifleProductionDuration"))
                writer.uint32(/* id 11, wireType 0 =*/88).int32(message.immediateRifleProductionDuration);
            if (message.lastCollectedAt != null && message.hasOwnProperty("lastCollectedAt"))
                writer.uint32(/* id 12, wireType 0 =*/96).uint64(message.lastCollectedAt);
            return writer;
        };

        /**
         * Encodes the specified PlayerBuildableBinding message, length delimited. Does not implicitly {@link mineralchem.PlayerBuildableBinding.verify|verify} messages.
         * @function encodeDelimited
         * @memberof mineralchem.PlayerBuildableBinding
         * @static
         * @param {mineralchem.PlayerBuildableBinding} message PlayerBuildableBinding message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        PlayerBuildableBinding.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a PlayerBuildableBinding message from the specified reader or buffer.
         * @function decode
         * @memberof mineralchem.PlayerBuildableBinding
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {mineralchem.PlayerBuildableBinding} PlayerBuildableBinding
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        PlayerBuildableBinding.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.mineralchem.PlayerBuildableBinding();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    message.id = reader.int32();
                    break;
                case 2:
                    message.topmostTileDiscretePositionX = reader.int32();
                    break;
                case 3:
                    message.topmostTileDiscretePositionY = reader.int32();
                    break;
                case 4:
                    message.playerId = reader.int32();
                    break;
                case 5:
                    message.buildable = $root.mineralchem.Buildable.decode(reader, reader.uint32());
                    break;
                case 6:
                    message.currentLevel = reader.int32();
                    break;
                case 7:
                    message.state = reader.int32();
                    break;
                case 8:
                    message.buildingOrUpgradingStartedAt = reader.int64();
                    break;
                case 9:
                    message.immediateGoldProductionRate = reader.int32();
                    break;
                case 10:
                    message.immediateRifleProductionRequiredGold = reader.int32();
                    break;
                case 11:
                    message.immediateRifleProductionDuration = reader.int32();
                    break;
                case 12:
                    message.lastCollectedAt = reader.uint64();
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a PlayerBuildableBinding message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof mineralchem.PlayerBuildableBinding
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {mineralchem.PlayerBuildableBinding} PlayerBuildableBinding
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        PlayerBuildableBinding.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a PlayerBuildableBinding message.
         * @function verify
         * @memberof mineralchem.PlayerBuildableBinding
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        PlayerBuildableBinding.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.id != null && message.hasOwnProperty("id"))
                if (!$util.isInteger(message.id))
                    return "id: integer expected";
            if (message.topmostTileDiscretePositionX != null && message.hasOwnProperty("topmostTileDiscretePositionX"))
                if (!$util.isInteger(message.topmostTileDiscretePositionX))
                    return "topmostTileDiscretePositionX: integer expected";
            if (message.topmostTileDiscretePositionY != null && message.hasOwnProperty("topmostTileDiscretePositionY"))
                if (!$util.isInteger(message.topmostTileDiscretePositionY))
                    return "topmostTileDiscretePositionY: integer expected";
            if (message.playerId != null && message.hasOwnProperty("playerId"))
                if (!$util.isInteger(message.playerId))
                    return "playerId: integer expected";
            if (message.buildable != null && message.hasOwnProperty("buildable")) {
                var error = $root.mineralchem.Buildable.verify(message.buildable);
                if (error)
                    return "buildable." + error;
            }
            if (message.currentLevel != null && message.hasOwnProperty("currentLevel"))
                if (!$util.isInteger(message.currentLevel))
                    return "currentLevel: integer expected";
            if (message.state != null && message.hasOwnProperty("state"))
                if (!$util.isInteger(message.state))
                    return "state: integer expected";
            if (message.buildingOrUpgradingStartedAt != null && message.hasOwnProperty("buildingOrUpgradingStartedAt"))
                if (!$util.isInteger(message.buildingOrUpgradingStartedAt) && !(message.buildingOrUpgradingStartedAt && $util.isInteger(message.buildingOrUpgradingStartedAt.low) && $util.isInteger(message.buildingOrUpgradingStartedAt.high)))
                    return "buildingOrUpgradingStartedAt: integer|Long expected";
            if (message.immediateGoldProductionRate != null && message.hasOwnProperty("immediateGoldProductionRate"))
                if (!$util.isInteger(message.immediateGoldProductionRate))
                    return "immediateGoldProductionRate: integer expected";
            if (message.immediateRifleProductionRequiredGold != null && message.hasOwnProperty("immediateRifleProductionRequiredGold"))
                if (!$util.isInteger(message.immediateRifleProductionRequiredGold))
                    return "immediateRifleProductionRequiredGold: integer expected";
            if (message.immediateRifleProductionDuration != null && message.hasOwnProperty("immediateRifleProductionDuration"))
                if (!$util.isInteger(message.immediateRifleProductionDuration))
                    return "immediateRifleProductionDuration: integer expected";
            if (message.lastCollectedAt != null && message.hasOwnProperty("lastCollectedAt"))
                if (!$util.isInteger(message.lastCollectedAt) && !(message.lastCollectedAt && $util.isInteger(message.lastCollectedAt.low) && $util.isInteger(message.lastCollectedAt.high)))
                    return "lastCollectedAt: integer|Long expected";
            return null;
        };

        /**
         * Creates a PlayerBuildableBinding message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof mineralchem.PlayerBuildableBinding
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {mineralchem.PlayerBuildableBinding} PlayerBuildableBinding
         */
        PlayerBuildableBinding.fromObject = function fromObject(object) {
            if (object instanceof $root.mineralchem.PlayerBuildableBinding)
                return object;
            var message = new $root.mineralchem.PlayerBuildableBinding();
            if (object.id != null)
                message.id = object.id | 0;
            if (object.topmostTileDiscretePositionX != null)
                message.topmostTileDiscretePositionX = object.topmostTileDiscretePositionX | 0;
            if (object.topmostTileDiscretePositionY != null)
                message.topmostTileDiscretePositionY = object.topmostTileDiscretePositionY | 0;
            if (object.playerId != null)
                message.playerId = object.playerId | 0;
            if (object.buildable != null) {
                if (typeof object.buildable !== "object")
                    throw TypeError(".mineralchem.PlayerBuildableBinding.buildable: object expected");
                message.buildable = $root.mineralchem.Buildable.fromObject(object.buildable);
            }
            if (object.currentLevel != null)
                message.currentLevel = object.currentLevel | 0;
            if (object.state != null)
                message.state = object.state | 0;
            if (object.buildingOrUpgradingStartedAt != null)
                if ($util.Long)
                    (message.buildingOrUpgradingStartedAt = $util.Long.fromValue(object.buildingOrUpgradingStartedAt)).unsigned = false;
                else if (typeof object.buildingOrUpgradingStartedAt === "string")
                    message.buildingOrUpgradingStartedAt = parseInt(object.buildingOrUpgradingStartedAt, 10);
                else if (typeof object.buildingOrUpgradingStartedAt === "number")
                    message.buildingOrUpgradingStartedAt = object.buildingOrUpgradingStartedAt;
                else if (typeof object.buildingOrUpgradingStartedAt === "object")
                    message.buildingOrUpgradingStartedAt = new $util.LongBits(object.buildingOrUpgradingStartedAt.low >>> 0, object.buildingOrUpgradingStartedAt.high >>> 0).toNumber();
            if (object.immediateGoldProductionRate != null)
                message.immediateGoldProductionRate = object.immediateGoldProductionRate | 0;
            if (object.immediateRifleProductionRequiredGold != null)
                message.immediateRifleProductionRequiredGold = object.immediateRifleProductionRequiredGold | 0;
            if (object.immediateRifleProductionDuration != null)
                message.immediateRifleProductionDuration = object.immediateRifleProductionDuration | 0;
            if (object.lastCollectedAt != null)
                if ($util.Long)
                    (message.lastCollectedAt = $util.Long.fromValue(object.lastCollectedAt)).unsigned = true;
                else if (typeof object.lastCollectedAt === "string")
                    message.lastCollectedAt = parseInt(object.lastCollectedAt, 10);
                else if (typeof object.lastCollectedAt === "number")
                    message.lastCollectedAt = object.lastCollectedAt;
                else if (typeof object.lastCollectedAt === "object")
                    message.lastCollectedAt = new $util.LongBits(object.lastCollectedAt.low >>> 0, object.lastCollectedAt.high >>> 0).toNumber(true);
            return message;
        };

        /**
         * Creates a plain object from a PlayerBuildableBinding message. Also converts values to other types if specified.
         * @function toObject
         * @memberof mineralchem.PlayerBuildableBinding
         * @static
         * @param {mineralchem.PlayerBuildableBinding} message PlayerBuildableBinding
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        PlayerBuildableBinding.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            var object = {};
            if (options.defaults) {
                object.id = 0;
                object.topmostTileDiscretePositionX = 0;
                object.topmostTileDiscretePositionY = 0;
                object.playerId = 0;
                object.buildable = null;
                object.currentLevel = 0;
                object.state = 0;
                if ($util.Long) {
                    var long = new $util.Long(0, 0, false);
                    object.buildingOrUpgradingStartedAt = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
                } else
                    object.buildingOrUpgradingStartedAt = options.longs === String ? "0" : 0;
                object.immediateGoldProductionRate = 0;
                object.immediateRifleProductionRequiredGold = 0;
                object.immediateRifleProductionDuration = 0;
                if ($util.Long) {
                    var long = new $util.Long(0, 0, true);
                    object.lastCollectedAt = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
                } else
                    object.lastCollectedAt = options.longs === String ? "0" : 0;
            }
            if (message.id != null && message.hasOwnProperty("id"))
                object.id = message.id;
            if (message.topmostTileDiscretePositionX != null && message.hasOwnProperty("topmostTileDiscretePositionX"))
                object.topmostTileDiscretePositionX = message.topmostTileDiscretePositionX;
            if (message.topmostTileDiscretePositionY != null && message.hasOwnProperty("topmostTileDiscretePositionY"))
                object.topmostTileDiscretePositionY = message.topmostTileDiscretePositionY;
            if (message.playerId != null && message.hasOwnProperty("playerId"))
                object.playerId = message.playerId;
            if (message.buildable != null && message.hasOwnProperty("buildable"))
                object.buildable = $root.mineralchem.Buildable.toObject(message.buildable, options);
            if (message.currentLevel != null && message.hasOwnProperty("currentLevel"))
                object.currentLevel = message.currentLevel;
            if (message.state != null && message.hasOwnProperty("state"))
                object.state = message.state;
            if (message.buildingOrUpgradingStartedAt != null && message.hasOwnProperty("buildingOrUpgradingStartedAt"))
                if (typeof message.buildingOrUpgradingStartedAt === "number")
                    object.buildingOrUpgradingStartedAt = options.longs === String ? String(message.buildingOrUpgradingStartedAt) : message.buildingOrUpgradingStartedAt;
                else
                    object.buildingOrUpgradingStartedAt = options.longs === String ? $util.Long.prototype.toString.call(message.buildingOrUpgradingStartedAt) : options.longs === Number ? new $util.LongBits(message.buildingOrUpgradingStartedAt.low >>> 0, message.buildingOrUpgradingStartedAt.high >>> 0).toNumber() : message.buildingOrUpgradingStartedAt;
            if (message.immediateGoldProductionRate != null && message.hasOwnProperty("immediateGoldProductionRate"))
                object.immediateGoldProductionRate = message.immediateGoldProductionRate;
            if (message.immediateRifleProductionRequiredGold != null && message.hasOwnProperty("immediateRifleProductionRequiredGold"))
                object.immediateRifleProductionRequiredGold = message.immediateRifleProductionRequiredGold;
            if (message.immediateRifleProductionDuration != null && message.hasOwnProperty("immediateRifleProductionDuration"))
                object.immediateRifleProductionDuration = message.immediateRifleProductionDuration;
            if (message.lastCollectedAt != null && message.hasOwnProperty("lastCollectedAt"))
                if (typeof message.lastCollectedAt === "number")
                    object.lastCollectedAt = options.longs === String ? String(message.lastCollectedAt) : message.lastCollectedAt;
                else
                    object.lastCollectedAt = options.longs === String ? $util.Long.prototype.toString.call(message.lastCollectedAt) : options.longs === Number ? new $util.LongBits(message.lastCollectedAt.low >>> 0, message.lastCollectedAt.high >>> 0).toNumber(true) : message.lastCollectedAt;
            return object;
        };

        /**
         * Converts this PlayerBuildableBinding to JSON.
         * @function toJSON
         * @memberof mineralchem.PlayerBuildableBinding
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        PlayerBuildableBinding.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return PlayerBuildableBinding;
    })();

    mineralchem.WalletStruct = (function() {

        /**
         * Properties of a WalletStruct.
         * @memberof mineralchem
         * @interface IWalletStruct
         * @property {number|null} [gold] WalletStruct gold
         * @property {number|null} [goldLimit] WalletStruct goldLimit
         */

        /**
         * Constructs a new WalletStruct.
         * @memberof mineralchem
         * @classdesc Represents a WalletStruct.
         * @implements IWalletStruct
         * @constructor
         * @param {mineralchem.IWalletStruct=} [properties] Properties to set
         */
        function WalletStruct(properties) {
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * WalletStruct gold.
         * @member {number} gold
         * @memberof mineralchem.WalletStruct
         * @instance
         */
        WalletStruct.prototype.gold = 0;

        /**
         * WalletStruct goldLimit.
         * @member {number} goldLimit
         * @memberof mineralchem.WalletStruct
         * @instance
         */
        WalletStruct.prototype.goldLimit = 0;

        /**
         * Creates a new WalletStruct instance using the specified properties.
         * @function create
         * @memberof mineralchem.WalletStruct
         * @static
         * @param {mineralchem.IWalletStruct=} [properties] Properties to set
         * @returns {mineralchem.WalletStruct} WalletStruct instance
         */
        WalletStruct.create = function create(properties) {
            return new WalletStruct(properties);
        };

        /**
         * Encodes the specified WalletStruct message. Does not implicitly {@link mineralchem.WalletStruct.verify|verify} messages.
         * @function encode
         * @memberof mineralchem.WalletStruct
         * @static
         * @param {mineralchem.WalletStruct} message WalletStruct message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        WalletStruct.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.gold != null && message.hasOwnProperty("gold"))
                writer.uint32(/* id 1, wireType 0 =*/8).int32(message.gold);
            if (message.goldLimit != null && message.hasOwnProperty("goldLimit"))
                writer.uint32(/* id 2, wireType 0 =*/16).int32(message.goldLimit);
            return writer;
        };

        /**
         * Encodes the specified WalletStruct message, length delimited. Does not implicitly {@link mineralchem.WalletStruct.verify|verify} messages.
         * @function encodeDelimited
         * @memberof mineralchem.WalletStruct
         * @static
         * @param {mineralchem.WalletStruct} message WalletStruct message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        WalletStruct.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a WalletStruct message from the specified reader or buffer.
         * @function decode
         * @memberof mineralchem.WalletStruct
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {mineralchem.WalletStruct} WalletStruct
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        WalletStruct.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.mineralchem.WalletStruct();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    message.gold = reader.int32();
                    break;
                case 2:
                    message.goldLimit = reader.int32();
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a WalletStruct message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof mineralchem.WalletStruct
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {mineralchem.WalletStruct} WalletStruct
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        WalletStruct.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a WalletStruct message.
         * @function verify
         * @memberof mineralchem.WalletStruct
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        WalletStruct.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.gold != null && message.hasOwnProperty("gold"))
                if (!$util.isInteger(message.gold))
                    return "gold: integer expected";
            if (message.goldLimit != null && message.hasOwnProperty("goldLimit"))
                if (!$util.isInteger(message.goldLimit))
                    return "goldLimit: integer expected";
            return null;
        };

        /**
         * Creates a WalletStruct message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof mineralchem.WalletStruct
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {mineralchem.WalletStruct} WalletStruct
         */
        WalletStruct.fromObject = function fromObject(object) {
            if (object instanceof $root.mineralchem.WalletStruct)
                return object;
            var message = new $root.mineralchem.WalletStruct();
            if (object.gold != null)
                message.gold = object.gold | 0;
            if (object.goldLimit != null)
                message.goldLimit = object.goldLimit | 0;
            return message;
        };

        /**
         * Creates a plain object from a WalletStruct message. Also converts values to other types if specified.
         * @function toObject
         * @memberof mineralchem.WalletStruct
         * @static
         * @param {mineralchem.WalletStruct} message WalletStruct
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        WalletStruct.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            var object = {};
            if (options.defaults) {
                object.gold = 0;
                object.goldLimit = 0;
            }
            if (message.gold != null && message.hasOwnProperty("gold"))
                object.gold = message.gold;
            if (message.goldLimit != null && message.hasOwnProperty("goldLimit"))
                object.goldLimit = message.goldLimit;
            return object;
        };

        /**
         * Converts this WalletStruct to JSON.
         * @function toJSON
         * @memberof mineralchem.WalletStruct
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        WalletStruct.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return WalletStruct;
    })();

    mineralchem.LegalCurrencyPaymentRecord = (function() {

        /**
         * Properties of a LegalCurrencyPaymentRecord.
         * @memberof mineralchem
         * @interface ILegalCurrencyPaymentRecord
         * @property {number|null} [id] LegalCurrencyPaymentRecord id
         * @property {number|null} [channel] LegalCurrencyPaymentRecord channel
         * @property {string|null} [extTrxId] LegalCurrencyPaymentRecord extTrxId
         */

        /**
         * Constructs a new LegalCurrencyPaymentRecord.
         * @memberof mineralchem
         * @classdesc Represents a LegalCurrencyPaymentRecord.
         * @implements ILegalCurrencyPaymentRecord
         * @constructor
         * @param {mineralchem.ILegalCurrencyPaymentRecord=} [properties] Properties to set
         */
        function LegalCurrencyPaymentRecord(properties) {
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * LegalCurrencyPaymentRecord id.
         * @member {number} id
         * @memberof mineralchem.LegalCurrencyPaymentRecord
         * @instance
         */
        LegalCurrencyPaymentRecord.prototype.id = 0;

        /**
         * LegalCurrencyPaymentRecord channel.
         * @member {number} channel
         * @memberof mineralchem.LegalCurrencyPaymentRecord
         * @instance
         */
        LegalCurrencyPaymentRecord.prototype.channel = 0;

        /**
         * LegalCurrencyPaymentRecord extTrxId.
         * @member {string} extTrxId
         * @memberof mineralchem.LegalCurrencyPaymentRecord
         * @instance
         */
        LegalCurrencyPaymentRecord.prototype.extTrxId = "";

        /**
         * Creates a new LegalCurrencyPaymentRecord instance using the specified properties.
         * @function create
         * @memberof mineralchem.LegalCurrencyPaymentRecord
         * @static
         * @param {mineralchem.ILegalCurrencyPaymentRecord=} [properties] Properties to set
         * @returns {mineralchem.LegalCurrencyPaymentRecord} LegalCurrencyPaymentRecord instance
         */
        LegalCurrencyPaymentRecord.create = function create(properties) {
            return new LegalCurrencyPaymentRecord(properties);
        };

        /**
         * Encodes the specified LegalCurrencyPaymentRecord message. Does not implicitly {@link mineralchem.LegalCurrencyPaymentRecord.verify|verify} messages.
         * @function encode
         * @memberof mineralchem.LegalCurrencyPaymentRecord
         * @static
         * @param {mineralchem.LegalCurrencyPaymentRecord} message LegalCurrencyPaymentRecord message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        LegalCurrencyPaymentRecord.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.id != null && message.hasOwnProperty("id"))
                writer.uint32(/* id 1, wireType 0 =*/8).int32(message.id);
            if (message.channel != null && message.hasOwnProperty("channel"))
                writer.uint32(/* id 2, wireType 0 =*/16).int32(message.channel);
            if (message.extTrxId != null && message.hasOwnProperty("extTrxId"))
                writer.uint32(/* id 3, wireType 2 =*/26).string(message.extTrxId);
            return writer;
        };

        /**
         * Encodes the specified LegalCurrencyPaymentRecord message, length delimited. Does not implicitly {@link mineralchem.LegalCurrencyPaymentRecord.verify|verify} messages.
         * @function encodeDelimited
         * @memberof mineralchem.LegalCurrencyPaymentRecord
         * @static
         * @param {mineralchem.LegalCurrencyPaymentRecord} message LegalCurrencyPaymentRecord message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        LegalCurrencyPaymentRecord.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a LegalCurrencyPaymentRecord message from the specified reader or buffer.
         * @function decode
         * @memberof mineralchem.LegalCurrencyPaymentRecord
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {mineralchem.LegalCurrencyPaymentRecord} LegalCurrencyPaymentRecord
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        LegalCurrencyPaymentRecord.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.mineralchem.LegalCurrencyPaymentRecord();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    message.id = reader.int32();
                    break;
                case 2:
                    message.channel = reader.int32();
                    break;
                case 3:
                    message.extTrxId = reader.string();
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a LegalCurrencyPaymentRecord message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof mineralchem.LegalCurrencyPaymentRecord
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {mineralchem.LegalCurrencyPaymentRecord} LegalCurrencyPaymentRecord
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        LegalCurrencyPaymentRecord.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a LegalCurrencyPaymentRecord message.
         * @function verify
         * @memberof mineralchem.LegalCurrencyPaymentRecord
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        LegalCurrencyPaymentRecord.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.id != null && message.hasOwnProperty("id"))
                if (!$util.isInteger(message.id))
                    return "id: integer expected";
            if (message.channel != null && message.hasOwnProperty("channel"))
                if (!$util.isInteger(message.channel))
                    return "channel: integer expected";
            if (message.extTrxId != null && message.hasOwnProperty("extTrxId"))
                if (!$util.isString(message.extTrxId))
                    return "extTrxId: string expected";
            return null;
        };

        /**
         * Creates a LegalCurrencyPaymentRecord message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof mineralchem.LegalCurrencyPaymentRecord
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {mineralchem.LegalCurrencyPaymentRecord} LegalCurrencyPaymentRecord
         */
        LegalCurrencyPaymentRecord.fromObject = function fromObject(object) {
            if (object instanceof $root.mineralchem.LegalCurrencyPaymentRecord)
                return object;
            var message = new $root.mineralchem.LegalCurrencyPaymentRecord();
            if (object.id != null)
                message.id = object.id | 0;
            if (object.channel != null)
                message.channel = object.channel | 0;
            if (object.extTrxId != null)
                message.extTrxId = String(object.extTrxId);
            return message;
        };

        /**
         * Creates a plain object from a LegalCurrencyPaymentRecord message. Also converts values to other types if specified.
         * @function toObject
         * @memberof mineralchem.LegalCurrencyPaymentRecord
         * @static
         * @param {mineralchem.LegalCurrencyPaymentRecord} message LegalCurrencyPaymentRecord
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        LegalCurrencyPaymentRecord.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            var object = {};
            if (options.defaults) {
                object.id = 0;
                object.channel = 0;
                object.extTrxId = "";
            }
            if (message.id != null && message.hasOwnProperty("id"))
                object.id = message.id;
            if (message.channel != null && message.hasOwnProperty("channel"))
                object.channel = message.channel;
            if (message.extTrxId != null && message.hasOwnProperty("extTrxId"))
                object.extTrxId = message.extTrxId;
            return object;
        };

        /**
         * Converts this LegalCurrencyPaymentRecord to JSON.
         * @function toJSON
         * @memberof mineralchem.LegalCurrencyPaymentRecord
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        LegalCurrencyPaymentRecord.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return LegalCurrencyPaymentRecord;
    })();

    mineralchem.SyncDataStruct = (function() {

        /**
         * Properties of a SyncDataStruct.
         * @memberof mineralchem
         * @interface ISyncDataStruct
         * @property {Array.<mineralchem.PlayerBuildableBinding>|null} [playerBuildableBindingList] SyncDataStruct playerBuildableBindingList
         * @property {mineralchem.WalletStruct|null} [wallet] SyncDataStruct wallet
         * @property {number|null} [tutorialStage] SyncDataStruct tutorialStage
         * @property {Object.<string,number>|null} [questCompletedMap] SyncDataStruct questCompletedMap
         * @property {mineralchem.AccumulatedResource|null} [accumulatedResource] SyncDataStruct accumulatedResource
         * @property {number|null} [comboCulmulatedCount] SyncDataStruct comboCulmulatedCount
         * @property {number|null} [housekeeperOfflineIncome] SyncDataStruct housekeeperOfflineIncome
         * @property {Array.<mineralchem.HousekeeperBinding>|null} [housekeeperBindingList] SyncDataStruct housekeeperBindingList
         */

        /**
         * Constructs a new SyncDataStruct.
         * @memberof mineralchem
         * @classdesc Represents a SyncDataStruct.
         * @implements ISyncDataStruct
         * @constructor
         * @param {mineralchem.ISyncDataStruct=} [properties] Properties to set
         */
        function SyncDataStruct(properties) {
            this.playerBuildableBindingList = [];
            this.questCompletedMap = {};
            this.housekeeperBindingList = [];
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * SyncDataStruct playerBuildableBindingList.
         * @member {Array.<mineralchem.PlayerBuildableBinding>} playerBuildableBindingList
         * @memberof mineralchem.SyncDataStruct
         * @instance
         */
        SyncDataStruct.prototype.playerBuildableBindingList = $util.emptyArray;

        /**
         * SyncDataStruct wallet.
         * @member {mineralchem.WalletStruct|null|undefined} wallet
         * @memberof mineralchem.SyncDataStruct
         * @instance
         */
        SyncDataStruct.prototype.wallet = null;

        /**
         * SyncDataStruct tutorialStage.
         * @member {number} tutorialStage
         * @memberof mineralchem.SyncDataStruct
         * @instance
         */
        SyncDataStruct.prototype.tutorialStage = 0;

        /**
         * SyncDataStruct questCompletedMap.
         * @member {Object.<string,number>} questCompletedMap
         * @memberof mineralchem.SyncDataStruct
         * @instance
         */
        SyncDataStruct.prototype.questCompletedMap = $util.emptyObject;

        /**
         * SyncDataStruct accumulatedResource.
         * @member {mineralchem.AccumulatedResource|null|undefined} accumulatedResource
         * @memberof mineralchem.SyncDataStruct
         * @instance
         */
        SyncDataStruct.prototype.accumulatedResource = null;

        /**
         * SyncDataStruct comboCulmulatedCount.
         * @member {number} comboCulmulatedCount
         * @memberof mineralchem.SyncDataStruct
         * @instance
         */
        SyncDataStruct.prototype.comboCulmulatedCount = 0;

        /**
         * SyncDataStruct housekeeperOfflineIncome.
         * @member {number} housekeeperOfflineIncome
         * @memberof mineralchem.SyncDataStruct
         * @instance
         */
        SyncDataStruct.prototype.housekeeperOfflineIncome = 0;

        /**
         * SyncDataStruct housekeeperBindingList.
         * @member {Array.<mineralchem.HousekeeperBinding>} housekeeperBindingList
         * @memberof mineralchem.SyncDataStruct
         * @instance
         */
        SyncDataStruct.prototype.housekeeperBindingList = $util.emptyArray;

        /**
         * Creates a new SyncDataStruct instance using the specified properties.
         * @function create
         * @memberof mineralchem.SyncDataStruct
         * @static
         * @param {mineralchem.ISyncDataStruct=} [properties] Properties to set
         * @returns {mineralchem.SyncDataStruct} SyncDataStruct instance
         */
        SyncDataStruct.create = function create(properties) {
            return new SyncDataStruct(properties);
        };

        /**
         * Encodes the specified SyncDataStruct message. Does not implicitly {@link mineralchem.SyncDataStruct.verify|verify} messages.
         * @function encode
         * @memberof mineralchem.SyncDataStruct
         * @static
         * @param {mineralchem.SyncDataStruct} message SyncDataStruct message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        SyncDataStruct.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.playerBuildableBindingList != null && message.playerBuildableBindingList.length)
                for (var i = 0; i < message.playerBuildableBindingList.length; ++i)
                    $root.mineralchem.PlayerBuildableBinding.encode(message.playerBuildableBindingList[i], writer.uint32(/* id 1, wireType 2 =*/10).fork()).ldelim();
            if (message.wallet != null && message.hasOwnProperty("wallet"))
                $root.mineralchem.WalletStruct.encode(message.wallet, writer.uint32(/* id 2, wireType 2 =*/18).fork()).ldelim();
            if (message.tutorialStage != null && message.hasOwnProperty("tutorialStage"))
                writer.uint32(/* id 3, wireType 0 =*/24).int32(message.tutorialStage);
            if (message.questCompletedMap != null && message.hasOwnProperty("questCompletedMap"))
                for (var keys = Object.keys(message.questCompletedMap), i = 0; i < keys.length; ++i)
                    writer.uint32(/* id 7, wireType 2 =*/58).fork().uint32(/* id 1, wireType 0 =*/8).int32(keys[i]).uint32(/* id 2, wireType 0 =*/16).int32(message.questCompletedMap[keys[i]]).ldelim();
            if (message.accumulatedResource != null && message.hasOwnProperty("accumulatedResource"))
                $root.mineralchem.AccumulatedResource.encode(message.accumulatedResource, writer.uint32(/* id 8, wireType 2 =*/66).fork()).ldelim();
            if (message.comboCulmulatedCount != null && message.hasOwnProperty("comboCulmulatedCount"))
                writer.uint32(/* id 9, wireType 0 =*/72).int32(message.comboCulmulatedCount);
            if (message.housekeeperOfflineIncome != null && message.hasOwnProperty("housekeeperOfflineIncome"))
                writer.uint32(/* id 11, wireType 0 =*/88).int32(message.housekeeperOfflineIncome);
            if (message.housekeeperBindingList != null && message.housekeeperBindingList.length)
                for (var i = 0; i < message.housekeeperBindingList.length; ++i)
                    $root.mineralchem.HousekeeperBinding.encode(message.housekeeperBindingList[i], writer.uint32(/* id 12, wireType 2 =*/98).fork()).ldelim();
            return writer;
        };

        /**
         * Encodes the specified SyncDataStruct message, length delimited. Does not implicitly {@link mineralchem.SyncDataStruct.verify|verify} messages.
         * @function encodeDelimited
         * @memberof mineralchem.SyncDataStruct
         * @static
         * @param {mineralchem.SyncDataStruct} message SyncDataStruct message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        SyncDataStruct.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a SyncDataStruct message from the specified reader or buffer.
         * @function decode
         * @memberof mineralchem.SyncDataStruct
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {mineralchem.SyncDataStruct} SyncDataStruct
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        SyncDataStruct.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.mineralchem.SyncDataStruct(), key;
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    if (!(message.playerBuildableBindingList && message.playerBuildableBindingList.length))
                        message.playerBuildableBindingList = [];
                    message.playerBuildableBindingList.push($root.mineralchem.PlayerBuildableBinding.decode(reader, reader.uint32()));
                    break;
                case 2:
                    message.wallet = $root.mineralchem.WalletStruct.decode(reader, reader.uint32());
                    break;
                case 3:
                    message.tutorialStage = reader.int32();
                    break;
                case 7:
                    reader.skip().pos++;
                    if (message.questCompletedMap === $util.emptyObject)
                        message.questCompletedMap = {};
                    key = reader.int32();
                    reader.pos++;
                    message.questCompletedMap[key] = reader.int32();
                    break;
                case 8:
                    message.accumulatedResource = $root.mineralchem.AccumulatedResource.decode(reader, reader.uint32());
                    break;
                case 9:
                    message.comboCulmulatedCount = reader.int32();
                    break;
                case 11:
                    message.housekeeperOfflineIncome = reader.int32();
                    break;
                case 12:
                    if (!(message.housekeeperBindingList && message.housekeeperBindingList.length))
                        message.housekeeperBindingList = [];
                    message.housekeeperBindingList.push($root.mineralchem.HousekeeperBinding.decode(reader, reader.uint32()));
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a SyncDataStruct message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof mineralchem.SyncDataStruct
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {mineralchem.SyncDataStruct} SyncDataStruct
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        SyncDataStruct.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a SyncDataStruct message.
         * @function verify
         * @memberof mineralchem.SyncDataStruct
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        SyncDataStruct.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.playerBuildableBindingList != null && message.hasOwnProperty("playerBuildableBindingList")) {
                if (!Array.isArray(message.playerBuildableBindingList))
                    return "playerBuildableBindingList: array expected";
                for (var i = 0; i < message.playerBuildableBindingList.length; ++i) {
                    var error = $root.mineralchem.PlayerBuildableBinding.verify(message.playerBuildableBindingList[i]);
                    if (error)
                        return "playerBuildableBindingList." + error;
                }
            }
            if (message.wallet != null && message.hasOwnProperty("wallet")) {
                var error = $root.mineralchem.WalletStruct.verify(message.wallet);
                if (error)
                    return "wallet." + error;
            }
            if (message.tutorialStage != null && message.hasOwnProperty("tutorialStage"))
                if (!$util.isInteger(message.tutorialStage))
                    return "tutorialStage: integer expected";
            if (message.questCompletedMap != null && message.hasOwnProperty("questCompletedMap")) {
                if (!$util.isObject(message.questCompletedMap))
                    return "questCompletedMap: object expected";
                var key = Object.keys(message.questCompletedMap);
                for (var i = 0; i < key.length; ++i) {
                    if (!$util.key32Re.test(key[i]))
                        return "questCompletedMap: integer key{k:int32} expected";
                    if (!$util.isInteger(message.questCompletedMap[key[i]]))
                        return "questCompletedMap: integer{k:int32} expected";
                }
            }
            if (message.accumulatedResource != null && message.hasOwnProperty("accumulatedResource")) {
                var error = $root.mineralchem.AccumulatedResource.verify(message.accumulatedResource);
                if (error)
                    return "accumulatedResource." + error;
            }
            if (message.comboCulmulatedCount != null && message.hasOwnProperty("comboCulmulatedCount"))
                if (!$util.isInteger(message.comboCulmulatedCount))
                    return "comboCulmulatedCount: integer expected";
            if (message.housekeeperOfflineIncome != null && message.hasOwnProperty("housekeeperOfflineIncome"))
                if (!$util.isInteger(message.housekeeperOfflineIncome))
                    return "housekeeperOfflineIncome: integer expected";
            if (message.housekeeperBindingList != null && message.hasOwnProperty("housekeeperBindingList")) {
                if (!Array.isArray(message.housekeeperBindingList))
                    return "housekeeperBindingList: array expected";
                for (var i = 0; i < message.housekeeperBindingList.length; ++i) {
                    var error = $root.mineralchem.HousekeeperBinding.verify(message.housekeeperBindingList[i]);
                    if (error)
                        return "housekeeperBindingList." + error;
                }
            }
            return null;
        };

        /**
         * Creates a SyncDataStruct message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof mineralchem.SyncDataStruct
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {mineralchem.SyncDataStruct} SyncDataStruct
         */
        SyncDataStruct.fromObject = function fromObject(object) {
            if (object instanceof $root.mineralchem.SyncDataStruct)
                return object;
            var message = new $root.mineralchem.SyncDataStruct();
            if (object.playerBuildableBindingList) {
                if (!Array.isArray(object.playerBuildableBindingList))
                    throw TypeError(".mineralchem.SyncDataStruct.playerBuildableBindingList: array expected");
                message.playerBuildableBindingList = [];
                for (var i = 0; i < object.playerBuildableBindingList.length; ++i) {
                    if (typeof object.playerBuildableBindingList[i] !== "object")
                        throw TypeError(".mineralchem.SyncDataStruct.playerBuildableBindingList: object expected");
                    message.playerBuildableBindingList[i] = $root.mineralchem.PlayerBuildableBinding.fromObject(object.playerBuildableBindingList[i]);
                }
            }
            if (object.wallet != null) {
                if (typeof object.wallet !== "object")
                    throw TypeError(".mineralchem.SyncDataStruct.wallet: object expected");
                message.wallet = $root.mineralchem.WalletStruct.fromObject(object.wallet);
            }
            if (object.tutorialStage != null)
                message.tutorialStage = object.tutorialStage | 0;
            if (object.questCompletedMap) {
                if (typeof object.questCompletedMap !== "object")
                    throw TypeError(".mineralchem.SyncDataStruct.questCompletedMap: object expected");
                message.questCompletedMap = {};
                for (var keys = Object.keys(object.questCompletedMap), i = 0; i < keys.length; ++i)
                    message.questCompletedMap[keys[i]] = object.questCompletedMap[keys[i]] | 0;
            }
            if (object.accumulatedResource != null) {
                if (typeof object.accumulatedResource !== "object")
                    throw TypeError(".mineralchem.SyncDataStruct.accumulatedResource: object expected");
                message.accumulatedResource = $root.mineralchem.AccumulatedResource.fromObject(object.accumulatedResource);
            }
            if (object.comboCulmulatedCount != null)
                message.comboCulmulatedCount = object.comboCulmulatedCount | 0;
            if (object.housekeeperOfflineIncome != null)
                message.housekeeperOfflineIncome = object.housekeeperOfflineIncome | 0;
            if (object.housekeeperBindingList) {
                if (!Array.isArray(object.housekeeperBindingList))
                    throw TypeError(".mineralchem.SyncDataStruct.housekeeperBindingList: array expected");
                message.housekeeperBindingList = [];
                for (var i = 0; i < object.housekeeperBindingList.length; ++i) {
                    if (typeof object.housekeeperBindingList[i] !== "object")
                        throw TypeError(".mineralchem.SyncDataStruct.housekeeperBindingList: object expected");
                    message.housekeeperBindingList[i] = $root.mineralchem.HousekeeperBinding.fromObject(object.housekeeperBindingList[i]);
                }
            }
            return message;
        };

        /**
         * Creates a plain object from a SyncDataStruct message. Also converts values to other types if specified.
         * @function toObject
         * @memberof mineralchem.SyncDataStruct
         * @static
         * @param {mineralchem.SyncDataStruct} message SyncDataStruct
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        SyncDataStruct.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            var object = {};
            if (options.arrays || options.defaults) {
                object.playerBuildableBindingList = [];
                object.housekeeperBindingList = [];
            }
            if (options.objects || options.defaults)
                object.questCompletedMap = {};
            if (options.defaults) {
                object.wallet = null;
                object.tutorialStage = 0;
                object.accumulatedResource = null;
                object.comboCulmulatedCount = 0;
                object.housekeeperOfflineIncome = 0;
            }
            if (message.playerBuildableBindingList && message.playerBuildableBindingList.length) {
                object.playerBuildableBindingList = [];
                for (var j = 0; j < message.playerBuildableBindingList.length; ++j)
                    object.playerBuildableBindingList[j] = $root.mineralchem.PlayerBuildableBinding.toObject(message.playerBuildableBindingList[j], options);
            }
            if (message.wallet != null && message.hasOwnProperty("wallet"))
                object.wallet = $root.mineralchem.WalletStruct.toObject(message.wallet, options);
            if (message.tutorialStage != null && message.hasOwnProperty("tutorialStage"))
                object.tutorialStage = message.tutorialStage;
            var keys2;
            if (message.questCompletedMap && (keys2 = Object.keys(message.questCompletedMap)).length) {
                object.questCompletedMap = {};
                for (var j = 0; j < keys2.length; ++j)
                    object.questCompletedMap[keys2[j]] = message.questCompletedMap[keys2[j]];
            }
            if (message.accumulatedResource != null && message.hasOwnProperty("accumulatedResource"))
                object.accumulatedResource = $root.mineralchem.AccumulatedResource.toObject(message.accumulatedResource, options);
            if (message.comboCulmulatedCount != null && message.hasOwnProperty("comboCulmulatedCount"))
                object.comboCulmulatedCount = message.comboCulmulatedCount;
            if (message.housekeeperOfflineIncome != null && message.hasOwnProperty("housekeeperOfflineIncome"))
                object.housekeeperOfflineIncome = message.housekeeperOfflineIncome;
            if (message.housekeeperBindingList && message.housekeeperBindingList.length) {
                object.housekeeperBindingList = [];
                for (var j = 0; j < message.housekeeperBindingList.length; ++j)
                    object.housekeeperBindingList[j] = $root.mineralchem.HousekeeperBinding.toObject(message.housekeeperBindingList[j], options);
            }
            return object;
        };

        /**
         * Converts this SyncDataStruct to JSON.
         * @function toJSON
         * @memberof mineralchem.SyncDataStruct
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        SyncDataStruct.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return SyncDataStruct;
    })();

    mineralchem.HousekeeperBinding = (function() {

        /**
         * Properties of an HousekeeperBinding.
         * @memberof mineralchem
         * @interface IHousekeeperBinding
         * @property {number|Long|null} [lastPeriodStartedAt] HousekeeperBinding lastPeriodStartedAt
         * @property {number|null} [buildableId] HousekeeperBinding buildableId
         * @property {number|null} [currentLevel] HousekeeperBinding currentLevel
         */

        /**
         * Constructs a new HousekeeperBinding.
         * @memberof mineralchem
         * @classdesc Represents an HousekeeperBinding.
         * @implements IHousekeeperBinding
         * @constructor
         * @param {mineralchem.IHousekeeperBinding=} [properties] Properties to set
         */
        function HousekeeperBinding(properties) {
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * HousekeeperBinding lastPeriodStartedAt.
         * @member {number|Long} lastPeriodStartedAt
         * @memberof mineralchem.HousekeeperBinding
         * @instance
         */
        HousekeeperBinding.prototype.lastPeriodStartedAt = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

        /**
         * HousekeeperBinding buildableId.
         * @member {number} buildableId
         * @memberof mineralchem.HousekeeperBinding
         * @instance
         */
        HousekeeperBinding.prototype.buildableId = 0;

        /**
         * HousekeeperBinding currentLevel.
         * @member {number} currentLevel
         * @memberof mineralchem.HousekeeperBinding
         * @instance
         */
        HousekeeperBinding.prototype.currentLevel = 0;

        /**
         * Creates a new HousekeeperBinding instance using the specified properties.
         * @function create
         * @memberof mineralchem.HousekeeperBinding
         * @static
         * @param {mineralchem.IHousekeeperBinding=} [properties] Properties to set
         * @returns {mineralchem.HousekeeperBinding} HousekeeperBinding instance
         */
        HousekeeperBinding.create = function create(properties) {
            return new HousekeeperBinding(properties);
        };

        /**
         * Encodes the specified HousekeeperBinding message. Does not implicitly {@link mineralchem.HousekeeperBinding.verify|verify} messages.
         * @function encode
         * @memberof mineralchem.HousekeeperBinding
         * @static
         * @param {mineralchem.HousekeeperBinding} message HousekeeperBinding message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        HousekeeperBinding.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.lastPeriodStartedAt != null && message.hasOwnProperty("lastPeriodStartedAt"))
                writer.uint32(/* id 1, wireType 0 =*/8).int64(message.lastPeriodStartedAt);
            if (message.buildableId != null && message.hasOwnProperty("buildableId"))
                writer.uint32(/* id 3, wireType 0 =*/24).int32(message.buildableId);
            if (message.currentLevel != null && message.hasOwnProperty("currentLevel"))
                writer.uint32(/* id 4, wireType 0 =*/32).int32(message.currentLevel);
            return writer;
        };

        /**
         * Encodes the specified HousekeeperBinding message, length delimited. Does not implicitly {@link mineralchem.HousekeeperBinding.verify|verify} messages.
         * @function encodeDelimited
         * @memberof mineralchem.HousekeeperBinding
         * @static
         * @param {mineralchem.HousekeeperBinding} message HousekeeperBinding message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        HousekeeperBinding.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes an HousekeeperBinding message from the specified reader or buffer.
         * @function decode
         * @memberof mineralchem.HousekeeperBinding
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {mineralchem.HousekeeperBinding} HousekeeperBinding
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        HousekeeperBinding.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.mineralchem.HousekeeperBinding();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    message.lastPeriodStartedAt = reader.int64();
                    break;
                case 3:
                    message.buildableId = reader.int32();
                    break;
                case 4:
                    message.currentLevel = reader.int32();
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes an HousekeeperBinding message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof mineralchem.HousekeeperBinding
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {mineralchem.HousekeeperBinding} HousekeeperBinding
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        HousekeeperBinding.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies an HousekeeperBinding message.
         * @function verify
         * @memberof mineralchem.HousekeeperBinding
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        HousekeeperBinding.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.lastPeriodStartedAt != null && message.hasOwnProperty("lastPeriodStartedAt"))
                if (!$util.isInteger(message.lastPeriodStartedAt) && !(message.lastPeriodStartedAt && $util.isInteger(message.lastPeriodStartedAt.low) && $util.isInteger(message.lastPeriodStartedAt.high)))
                    return "lastPeriodStartedAt: integer|Long expected";
            if (message.buildableId != null && message.hasOwnProperty("buildableId"))
                if (!$util.isInteger(message.buildableId))
                    return "buildableId: integer expected";
            if (message.currentLevel != null && message.hasOwnProperty("currentLevel"))
                if (!$util.isInteger(message.currentLevel))
                    return "currentLevel: integer expected";
            return null;
        };

        /**
         * Creates an HousekeeperBinding message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof mineralchem.HousekeeperBinding
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {mineralchem.HousekeeperBinding} HousekeeperBinding
         */
        HousekeeperBinding.fromObject = function fromObject(object) {
            if (object instanceof $root.mineralchem.HousekeeperBinding)
                return object;
            var message = new $root.mineralchem.HousekeeperBinding();
            if (object.lastPeriodStartedAt != null)
                if ($util.Long)
                    (message.lastPeriodStartedAt = $util.Long.fromValue(object.lastPeriodStartedAt)).unsigned = false;
                else if (typeof object.lastPeriodStartedAt === "string")
                    message.lastPeriodStartedAt = parseInt(object.lastPeriodStartedAt, 10);
                else if (typeof object.lastPeriodStartedAt === "number")
                    message.lastPeriodStartedAt = object.lastPeriodStartedAt;
                else if (typeof object.lastPeriodStartedAt === "object")
                    message.lastPeriodStartedAt = new $util.LongBits(object.lastPeriodStartedAt.low >>> 0, object.lastPeriodStartedAt.high >>> 0).toNumber();
            if (object.buildableId != null)
                message.buildableId = object.buildableId | 0;
            if (object.currentLevel != null)
                message.currentLevel = object.currentLevel | 0;
            return message;
        };

        /**
         * Creates a plain object from an HousekeeperBinding message. Also converts values to other types if specified.
         * @function toObject
         * @memberof mineralchem.HousekeeperBinding
         * @static
         * @param {mineralchem.HousekeeperBinding} message HousekeeperBinding
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        HousekeeperBinding.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            var object = {};
            if (options.defaults) {
                if ($util.Long) {
                    var long = new $util.Long(0, 0, false);
                    object.lastPeriodStartedAt = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
                } else
                    object.lastPeriodStartedAt = options.longs === String ? "0" : 0;
                object.buildableId = 0;
                object.currentLevel = 0;
            }
            if (message.lastPeriodStartedAt != null && message.hasOwnProperty("lastPeriodStartedAt"))
                if (typeof message.lastPeriodStartedAt === "number")
                    object.lastPeriodStartedAt = options.longs === String ? String(message.lastPeriodStartedAt) : message.lastPeriodStartedAt;
                else
                    object.lastPeriodStartedAt = options.longs === String ? $util.Long.prototype.toString.call(message.lastPeriodStartedAt) : options.longs === Number ? new $util.LongBits(message.lastPeriodStartedAt.low >>> 0, message.lastPeriodStartedAt.high >>> 0).toNumber() : message.lastPeriodStartedAt;
            if (message.buildableId != null && message.hasOwnProperty("buildableId"))
                object.buildableId = message.buildableId;
            if (message.currentLevel != null && message.hasOwnProperty("currentLevel"))
                object.currentLevel = message.currentLevel;
            return object;
        };

        /**
         * Converts this HousekeeperBinding to JSON.
         * @function toJSON
         * @memberof mineralchem.HousekeeperBinding
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        HousekeeperBinding.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return HousekeeperBinding;
    })();

    mineralchem.BuildableLevelConfStruct = (function() {

        /**
         * Properties of a BuildableLevelConfStruct.
         * @memberof mineralchem
         * @interface IBuildableLevelConfStruct
         * @property {Array.<mineralchem.BuildableLevelBinding>|null} [levelConfList] BuildableLevelConfStruct levelConfList
         * @property {Array.<mineralchem.BuildableIngredientInteraction>|null} [buildableIngredientInteractionList] BuildableLevelConfStruct buildableIngredientInteractionList
         */

        /**
         * Constructs a new BuildableLevelConfStruct.
         * @memberof mineralchem
         * @classdesc Represents a BuildableLevelConfStruct.
         * @implements IBuildableLevelConfStruct
         * @constructor
         * @param {mineralchem.IBuildableLevelConfStruct=} [properties] Properties to set
         */
        function BuildableLevelConfStruct(properties) {
            this.levelConfList = [];
            this.buildableIngredientInteractionList = [];
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * BuildableLevelConfStruct levelConfList.
         * @member {Array.<mineralchem.BuildableLevelBinding>} levelConfList
         * @memberof mineralchem.BuildableLevelConfStruct
         * @instance
         */
        BuildableLevelConfStruct.prototype.levelConfList = $util.emptyArray;

        /**
         * BuildableLevelConfStruct buildableIngredientInteractionList.
         * @member {Array.<mineralchem.BuildableIngredientInteraction>} buildableIngredientInteractionList
         * @memberof mineralchem.BuildableLevelConfStruct
         * @instance
         */
        BuildableLevelConfStruct.prototype.buildableIngredientInteractionList = $util.emptyArray;

        /**
         * Creates a new BuildableLevelConfStruct instance using the specified properties.
         * @function create
         * @memberof mineralchem.BuildableLevelConfStruct
         * @static
         * @param {mineralchem.IBuildableLevelConfStruct=} [properties] Properties to set
         * @returns {mineralchem.BuildableLevelConfStruct} BuildableLevelConfStruct instance
         */
        BuildableLevelConfStruct.create = function create(properties) {
            return new BuildableLevelConfStruct(properties);
        };

        /**
         * Encodes the specified BuildableLevelConfStruct message. Does not implicitly {@link mineralchem.BuildableLevelConfStruct.verify|verify} messages.
         * @function encode
         * @memberof mineralchem.BuildableLevelConfStruct
         * @static
         * @param {mineralchem.BuildableLevelConfStruct} message BuildableLevelConfStruct message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        BuildableLevelConfStruct.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.levelConfList != null && message.levelConfList.length)
                for (var i = 0; i < message.levelConfList.length; ++i)
                    $root.mineralchem.BuildableLevelBinding.encode(message.levelConfList[i], writer.uint32(/* id 1, wireType 2 =*/10).fork()).ldelim();
            if (message.buildableIngredientInteractionList != null && message.buildableIngredientInteractionList.length)
                for (var i = 0; i < message.buildableIngredientInteractionList.length; ++i)
                    $root.mineralchem.BuildableIngredientInteraction.encode(message.buildableIngredientInteractionList[i], writer.uint32(/* id 2, wireType 2 =*/18).fork()).ldelim();
            return writer;
        };

        /**
         * Encodes the specified BuildableLevelConfStruct message, length delimited. Does not implicitly {@link mineralchem.BuildableLevelConfStruct.verify|verify} messages.
         * @function encodeDelimited
         * @memberof mineralchem.BuildableLevelConfStruct
         * @static
         * @param {mineralchem.BuildableLevelConfStruct} message BuildableLevelConfStruct message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        BuildableLevelConfStruct.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a BuildableLevelConfStruct message from the specified reader or buffer.
         * @function decode
         * @memberof mineralchem.BuildableLevelConfStruct
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {mineralchem.BuildableLevelConfStruct} BuildableLevelConfStruct
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        BuildableLevelConfStruct.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.mineralchem.BuildableLevelConfStruct();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    if (!(message.levelConfList && message.levelConfList.length))
                        message.levelConfList = [];
                    message.levelConfList.push($root.mineralchem.BuildableLevelBinding.decode(reader, reader.uint32()));
                    break;
                case 2:
                    if (!(message.buildableIngredientInteractionList && message.buildableIngredientInteractionList.length))
                        message.buildableIngredientInteractionList = [];
                    message.buildableIngredientInteractionList.push($root.mineralchem.BuildableIngredientInteraction.decode(reader, reader.uint32()));
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a BuildableLevelConfStruct message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof mineralchem.BuildableLevelConfStruct
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {mineralchem.BuildableLevelConfStruct} BuildableLevelConfStruct
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        BuildableLevelConfStruct.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a BuildableLevelConfStruct message.
         * @function verify
         * @memberof mineralchem.BuildableLevelConfStruct
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        BuildableLevelConfStruct.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.levelConfList != null && message.hasOwnProperty("levelConfList")) {
                if (!Array.isArray(message.levelConfList))
                    return "levelConfList: array expected";
                for (var i = 0; i < message.levelConfList.length; ++i) {
                    var error = $root.mineralchem.BuildableLevelBinding.verify(message.levelConfList[i]);
                    if (error)
                        return "levelConfList." + error;
                }
            }
            if (message.buildableIngredientInteractionList != null && message.hasOwnProperty("buildableIngredientInteractionList")) {
                if (!Array.isArray(message.buildableIngredientInteractionList))
                    return "buildableIngredientInteractionList: array expected";
                for (var i = 0; i < message.buildableIngredientInteractionList.length; ++i) {
                    var error = $root.mineralchem.BuildableIngredientInteraction.verify(message.buildableIngredientInteractionList[i]);
                    if (error)
                        return "buildableIngredientInteractionList." + error;
                }
            }
            return null;
        };

        /**
         * Creates a BuildableLevelConfStruct message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof mineralchem.BuildableLevelConfStruct
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {mineralchem.BuildableLevelConfStruct} BuildableLevelConfStruct
         */
        BuildableLevelConfStruct.fromObject = function fromObject(object) {
            if (object instanceof $root.mineralchem.BuildableLevelConfStruct)
                return object;
            var message = new $root.mineralchem.BuildableLevelConfStruct();
            if (object.levelConfList) {
                if (!Array.isArray(object.levelConfList))
                    throw TypeError(".mineralchem.BuildableLevelConfStruct.levelConfList: array expected");
                message.levelConfList = [];
                for (var i = 0; i < object.levelConfList.length; ++i) {
                    if (typeof object.levelConfList[i] !== "object")
                        throw TypeError(".mineralchem.BuildableLevelConfStruct.levelConfList: object expected");
                    message.levelConfList[i] = $root.mineralchem.BuildableLevelBinding.fromObject(object.levelConfList[i]);
                }
            }
            if (object.buildableIngredientInteractionList) {
                if (!Array.isArray(object.buildableIngredientInteractionList))
                    throw TypeError(".mineralchem.BuildableLevelConfStruct.buildableIngredientInteractionList: array expected");
                message.buildableIngredientInteractionList = [];
                for (var i = 0; i < object.buildableIngredientInteractionList.length; ++i) {
                    if (typeof object.buildableIngredientInteractionList[i] !== "object")
                        throw TypeError(".mineralchem.BuildableLevelConfStruct.buildableIngredientInteractionList: object expected");
                    message.buildableIngredientInteractionList[i] = $root.mineralchem.BuildableIngredientInteraction.fromObject(object.buildableIngredientInteractionList[i]);
                }
            }
            return message;
        };

        /**
         * Creates a plain object from a BuildableLevelConfStruct message. Also converts values to other types if specified.
         * @function toObject
         * @memberof mineralchem.BuildableLevelConfStruct
         * @static
         * @param {mineralchem.BuildableLevelConfStruct} message BuildableLevelConfStruct
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        BuildableLevelConfStruct.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            var object = {};
            if (options.arrays || options.defaults) {
                object.levelConfList = [];
                object.buildableIngredientInteractionList = [];
            }
            if (message.levelConfList && message.levelConfList.length) {
                object.levelConfList = [];
                for (var j = 0; j < message.levelConfList.length; ++j)
                    object.levelConfList[j] = $root.mineralchem.BuildableLevelBinding.toObject(message.levelConfList[j], options);
            }
            if (message.buildableIngredientInteractionList && message.buildableIngredientInteractionList.length) {
                object.buildableIngredientInteractionList = [];
                for (var j = 0; j < message.buildableIngredientInteractionList.length; ++j)
                    object.buildableIngredientInteractionList[j] = $root.mineralchem.BuildableIngredientInteraction.toObject(message.buildableIngredientInteractionList[j], options);
            }
            return object;
        };

        /**
         * Converts this BuildableLevelConfStruct to JSON.
         * @function toJSON
         * @memberof mineralchem.BuildableLevelConfStruct
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        BuildableLevelConfStruct.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return BuildableLevelConfStruct;
    })();

    mineralchem.Knapsack = (function() {

        /**
         * Properties of a Knapsack.
         * @memberof mineralchem
         * @interface IKnapsack
         * @property {number|null} [ingredientId] Knapsack ingredientId
         * @property {number|null} [currentCount] Knapsack currentCount
         */

        /**
         * Constructs a new Knapsack.
         * @memberof mineralchem
         * @classdesc Represents a Knapsack.
         * @implements IKnapsack
         * @constructor
         * @param {mineralchem.IKnapsack=} [properties] Properties to set
         */
        function Knapsack(properties) {
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * Knapsack ingredientId.
         * @member {number} ingredientId
         * @memberof mineralchem.Knapsack
         * @instance
         */
        Knapsack.prototype.ingredientId = 0;

        /**
         * Knapsack currentCount.
         * @member {number} currentCount
         * @memberof mineralchem.Knapsack
         * @instance
         */
        Knapsack.prototype.currentCount = 0;

        /**
         * Creates a new Knapsack instance using the specified properties.
         * @function create
         * @memberof mineralchem.Knapsack
         * @static
         * @param {mineralchem.IKnapsack=} [properties] Properties to set
         * @returns {mineralchem.Knapsack} Knapsack instance
         */
        Knapsack.create = function create(properties) {
            return new Knapsack(properties);
        };

        /**
         * Encodes the specified Knapsack message. Does not implicitly {@link mineralchem.Knapsack.verify|verify} messages.
         * @function encode
         * @memberof mineralchem.Knapsack
         * @static
         * @param {mineralchem.Knapsack} message Knapsack message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        Knapsack.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.ingredientId != null && message.hasOwnProperty("ingredientId"))
                writer.uint32(/* id 1, wireType 0 =*/8).int32(message.ingredientId);
            if (message.currentCount != null && message.hasOwnProperty("currentCount"))
                writer.uint32(/* id 2, wireType 0 =*/16).int32(message.currentCount);
            return writer;
        };

        /**
         * Encodes the specified Knapsack message, length delimited. Does not implicitly {@link mineralchem.Knapsack.verify|verify} messages.
         * @function encodeDelimited
         * @memberof mineralchem.Knapsack
         * @static
         * @param {mineralchem.Knapsack} message Knapsack message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        Knapsack.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a Knapsack message from the specified reader or buffer.
         * @function decode
         * @memberof mineralchem.Knapsack
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {mineralchem.Knapsack} Knapsack
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        Knapsack.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.mineralchem.Knapsack();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    message.ingredientId = reader.int32();
                    break;
                case 2:
                    message.currentCount = reader.int32();
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a Knapsack message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof mineralchem.Knapsack
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {mineralchem.Knapsack} Knapsack
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        Knapsack.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a Knapsack message.
         * @function verify
         * @memberof mineralchem.Knapsack
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        Knapsack.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.ingredientId != null && message.hasOwnProperty("ingredientId"))
                if (!$util.isInteger(message.ingredientId))
                    return "ingredientId: integer expected";
            if (message.currentCount != null && message.hasOwnProperty("currentCount"))
                if (!$util.isInteger(message.currentCount))
                    return "currentCount: integer expected";
            return null;
        };

        /**
         * Creates a Knapsack message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof mineralchem.Knapsack
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {mineralchem.Knapsack} Knapsack
         */
        Knapsack.fromObject = function fromObject(object) {
            if (object instanceof $root.mineralchem.Knapsack)
                return object;
            var message = new $root.mineralchem.Knapsack();
            if (object.ingredientId != null)
                message.ingredientId = object.ingredientId | 0;
            if (object.currentCount != null)
                message.currentCount = object.currentCount | 0;
            return message;
        };

        /**
         * Creates a plain object from a Knapsack message. Also converts values to other types if specified.
         * @function toObject
         * @memberof mineralchem.Knapsack
         * @static
         * @param {mineralchem.Knapsack} message Knapsack
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        Knapsack.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            var object = {};
            if (options.defaults) {
                object.ingredientId = 0;
                object.currentCount = 0;
            }
            if (message.ingredientId != null && message.hasOwnProperty("ingredientId"))
                object.ingredientId = message.ingredientId;
            if (message.currentCount != null && message.hasOwnProperty("currentCount"))
                object.currentCount = message.currentCount;
            return object;
        };

        /**
         * Converts this Knapsack to JSON.
         * @function toJSON
         * @memberof mineralchem.Knapsack
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        Knapsack.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return Knapsack;
    })();

    mineralchem.RecipeIngredientBinding = (function() {

        /**
         * Properties of a RecipeIngredientBinding.
         * @memberof mineralchem
         * @interface IRecipeIngredientBinding
         * @property {number|null} [ingredientId] RecipeIngredientBinding ingredientId
         * @property {number|null} [count] RecipeIngredientBinding count
         * @property {string|null} [prependedBinocularOperator] RecipeIngredientBinding prependedBinocularOperator
         */

        /**
         * Constructs a new RecipeIngredientBinding.
         * @memberof mineralchem
         * @classdesc Represents a RecipeIngredientBinding.
         * @implements IRecipeIngredientBinding
         * @constructor
         * @param {mineralchem.IRecipeIngredientBinding=} [properties] Properties to set
         */
        function RecipeIngredientBinding(properties) {
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * RecipeIngredientBinding ingredientId.
         * @member {number} ingredientId
         * @memberof mineralchem.RecipeIngredientBinding
         * @instance
         */
        RecipeIngredientBinding.prototype.ingredientId = 0;

        /**
         * RecipeIngredientBinding count.
         * @member {number} count
         * @memberof mineralchem.RecipeIngredientBinding
         * @instance
         */
        RecipeIngredientBinding.prototype.count = 0;

        /**
         * RecipeIngredientBinding prependedBinocularOperator.
         * @member {string} prependedBinocularOperator
         * @memberof mineralchem.RecipeIngredientBinding
         * @instance
         */
        RecipeIngredientBinding.prototype.prependedBinocularOperator = "";

        /**
         * Creates a new RecipeIngredientBinding instance using the specified properties.
         * @function create
         * @memberof mineralchem.RecipeIngredientBinding
         * @static
         * @param {mineralchem.IRecipeIngredientBinding=} [properties] Properties to set
         * @returns {mineralchem.RecipeIngredientBinding} RecipeIngredientBinding instance
         */
        RecipeIngredientBinding.create = function create(properties) {
            return new RecipeIngredientBinding(properties);
        };

        /**
         * Encodes the specified RecipeIngredientBinding message. Does not implicitly {@link mineralchem.RecipeIngredientBinding.verify|verify} messages.
         * @function encode
         * @memberof mineralchem.RecipeIngredientBinding
         * @static
         * @param {mineralchem.RecipeIngredientBinding} message RecipeIngredientBinding message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        RecipeIngredientBinding.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.ingredientId != null && message.hasOwnProperty("ingredientId"))
                writer.uint32(/* id 1, wireType 0 =*/8).int32(message.ingredientId);
            if (message.count != null && message.hasOwnProperty("count"))
                writer.uint32(/* id 2, wireType 0 =*/16).int32(message.count);
            if (message.prependedBinocularOperator != null && message.hasOwnProperty("prependedBinocularOperator"))
                writer.uint32(/* id 3, wireType 2 =*/26).string(message.prependedBinocularOperator);
            return writer;
        };

        /**
         * Encodes the specified RecipeIngredientBinding message, length delimited. Does not implicitly {@link mineralchem.RecipeIngredientBinding.verify|verify} messages.
         * @function encodeDelimited
         * @memberof mineralchem.RecipeIngredientBinding
         * @static
         * @param {mineralchem.RecipeIngredientBinding} message RecipeIngredientBinding message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        RecipeIngredientBinding.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a RecipeIngredientBinding message from the specified reader or buffer.
         * @function decode
         * @memberof mineralchem.RecipeIngredientBinding
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {mineralchem.RecipeIngredientBinding} RecipeIngredientBinding
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        RecipeIngredientBinding.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.mineralchem.RecipeIngredientBinding();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    message.ingredientId = reader.int32();
                    break;
                case 2:
                    message.count = reader.int32();
                    break;
                case 3:
                    message.prependedBinocularOperator = reader.string();
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a RecipeIngredientBinding message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof mineralchem.RecipeIngredientBinding
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {mineralchem.RecipeIngredientBinding} RecipeIngredientBinding
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        RecipeIngredientBinding.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a RecipeIngredientBinding message.
         * @function verify
         * @memberof mineralchem.RecipeIngredientBinding
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        RecipeIngredientBinding.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.ingredientId != null && message.hasOwnProperty("ingredientId"))
                if (!$util.isInteger(message.ingredientId))
                    return "ingredientId: integer expected";
            if (message.count != null && message.hasOwnProperty("count"))
                if (!$util.isInteger(message.count))
                    return "count: integer expected";
            if (message.prependedBinocularOperator != null && message.hasOwnProperty("prependedBinocularOperator"))
                if (!$util.isString(message.prependedBinocularOperator))
                    return "prependedBinocularOperator: string expected";
            return null;
        };

        /**
         * Creates a RecipeIngredientBinding message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof mineralchem.RecipeIngredientBinding
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {mineralchem.RecipeIngredientBinding} RecipeIngredientBinding
         */
        RecipeIngredientBinding.fromObject = function fromObject(object) {
            if (object instanceof $root.mineralchem.RecipeIngredientBinding)
                return object;
            var message = new $root.mineralchem.RecipeIngredientBinding();
            if (object.ingredientId != null)
                message.ingredientId = object.ingredientId | 0;
            if (object.count != null)
                message.count = object.count | 0;
            if (object.prependedBinocularOperator != null)
                message.prependedBinocularOperator = String(object.prependedBinocularOperator);
            return message;
        };

        /**
         * Creates a plain object from a RecipeIngredientBinding message. Also converts values to other types if specified.
         * @function toObject
         * @memberof mineralchem.RecipeIngredientBinding
         * @static
         * @param {mineralchem.RecipeIngredientBinding} message RecipeIngredientBinding
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        RecipeIngredientBinding.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            var object = {};
            if (options.defaults) {
                object.ingredientId = 0;
                object.count = 0;
                object.prependedBinocularOperator = "";
            }
            if (message.ingredientId != null && message.hasOwnProperty("ingredientId"))
                object.ingredientId = message.ingredientId;
            if (message.count != null && message.hasOwnProperty("count"))
                object.count = message.count;
            if (message.prependedBinocularOperator != null && message.hasOwnProperty("prependedBinocularOperator"))
                object.prependedBinocularOperator = message.prependedBinocularOperator;
            return object;
        };

        /**
         * Converts this RecipeIngredientBinding to JSON.
         * @function toJSON
         * @memberof mineralchem.RecipeIngredientBinding
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        RecipeIngredientBinding.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return RecipeIngredientBinding;
    })();

    mineralchem.Ingredient = (function() {

        /**
         * Properties of an Ingredient.
         * @memberof mineralchem
         * @interface IIngredient
         * @property {number|null} [Id] Ingredient Id
         * @property {string|null} [Name] Ingredient Name
         * @property {number|null} [PriceCurrency] Ingredient PriceCurrency
         * @property {number|null} [PriceValue] Ingredient PriceValue
         * @property {number|null} [BaseProductionDurationMillis] Ingredient BaseProductionDurationMillis
         * @property {number|null} [ReclaimPriceCurrency] Ingredient ReclaimPriceCurrency
         * @property {number|null} [ReclaimPriceValue] Ingredient ReclaimPriceValue
         * @property {number|null} [BaseReclaimDurationMillis] Ingredient BaseReclaimDurationMillis
         * @property {number|null} [Category] Ingredient Category
         */

        /**
         * Constructs a new Ingredient.
         * @memberof mineralchem
         * @classdesc Represents an Ingredient.
         * @implements IIngredient
         * @constructor
         * @param {mineralchem.IIngredient=} [properties] Properties to set
         */
        function Ingredient(properties) {
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * Ingredient Id.
         * @member {number} Id
         * @memberof mineralchem.Ingredient
         * @instance
         */
        Ingredient.prototype.Id = 0;

        /**
         * Ingredient Name.
         * @member {string} Name
         * @memberof mineralchem.Ingredient
         * @instance
         */
        Ingredient.prototype.Name = "";

        /**
         * Ingredient PriceCurrency.
         * @member {number} PriceCurrency
         * @memberof mineralchem.Ingredient
         * @instance
         */
        Ingredient.prototype.PriceCurrency = 0;

        /**
         * Ingredient PriceValue.
         * @member {number} PriceValue
         * @memberof mineralchem.Ingredient
         * @instance
         */
        Ingredient.prototype.PriceValue = 0;

        /**
         * Ingredient BaseProductionDurationMillis.
         * @member {number} BaseProductionDurationMillis
         * @memberof mineralchem.Ingredient
         * @instance
         */
        Ingredient.prototype.BaseProductionDurationMillis = 0;

        /**
         * Ingredient ReclaimPriceCurrency.
         * @member {number} ReclaimPriceCurrency
         * @memberof mineralchem.Ingredient
         * @instance
         */
        Ingredient.prototype.ReclaimPriceCurrency = 0;

        /**
         * Ingredient ReclaimPriceValue.
         * @member {number} ReclaimPriceValue
         * @memberof mineralchem.Ingredient
         * @instance
         */
        Ingredient.prototype.ReclaimPriceValue = 0;

        /**
         * Ingredient BaseReclaimDurationMillis.
         * @member {number} BaseReclaimDurationMillis
         * @memberof mineralchem.Ingredient
         * @instance
         */
        Ingredient.prototype.BaseReclaimDurationMillis = 0;

        /**
         * Ingredient Category.
         * @member {number} Category
         * @memberof mineralchem.Ingredient
         * @instance
         */
        Ingredient.prototype.Category = 0;

        /**
         * Creates a new Ingredient instance using the specified properties.
         * @function create
         * @memberof mineralchem.Ingredient
         * @static
         * @param {mineralchem.IIngredient=} [properties] Properties to set
         * @returns {mineralchem.Ingredient} Ingredient instance
         */
        Ingredient.create = function create(properties) {
            return new Ingredient(properties);
        };

        /**
         * Encodes the specified Ingredient message. Does not implicitly {@link mineralchem.Ingredient.verify|verify} messages.
         * @function encode
         * @memberof mineralchem.Ingredient
         * @static
         * @param {mineralchem.Ingredient} message Ingredient message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        Ingredient.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.Id != null && message.hasOwnProperty("Id"))
                writer.uint32(/* id 1, wireType 0 =*/8).int32(message.Id);
            if (message.Name != null && message.hasOwnProperty("Name"))
                writer.uint32(/* id 2, wireType 2 =*/18).string(message.Name);
            if (message.PriceCurrency != null && message.hasOwnProperty("PriceCurrency"))
                writer.uint32(/* id 3, wireType 0 =*/24).int32(message.PriceCurrency);
            if (message.PriceValue != null && message.hasOwnProperty("PriceValue"))
                writer.uint32(/* id 4, wireType 0 =*/32).int32(message.PriceValue);
            if (message.BaseProductionDurationMillis != null && message.hasOwnProperty("BaseProductionDurationMillis"))
                writer.uint32(/* id 5, wireType 0 =*/40).int32(message.BaseProductionDurationMillis);
            if (message.ReclaimPriceCurrency != null && message.hasOwnProperty("ReclaimPriceCurrency"))
                writer.uint32(/* id 6, wireType 0 =*/48).int32(message.ReclaimPriceCurrency);
            if (message.ReclaimPriceValue != null && message.hasOwnProperty("ReclaimPriceValue"))
                writer.uint32(/* id 7, wireType 0 =*/56).int32(message.ReclaimPriceValue);
            if (message.BaseReclaimDurationMillis != null && message.hasOwnProperty("BaseReclaimDurationMillis"))
                writer.uint32(/* id 8, wireType 0 =*/64).int32(message.BaseReclaimDurationMillis);
            if (message.Category != null && message.hasOwnProperty("Category"))
                writer.uint32(/* id 9, wireType 0 =*/72).int32(message.Category);
            return writer;
        };

        /**
         * Encodes the specified Ingredient message, length delimited. Does not implicitly {@link mineralchem.Ingredient.verify|verify} messages.
         * @function encodeDelimited
         * @memberof mineralchem.Ingredient
         * @static
         * @param {mineralchem.Ingredient} message Ingredient message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        Ingredient.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes an Ingredient message from the specified reader or buffer.
         * @function decode
         * @memberof mineralchem.Ingredient
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {mineralchem.Ingredient} Ingredient
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        Ingredient.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.mineralchem.Ingredient();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    message.Id = reader.int32();
                    break;
                case 2:
                    message.Name = reader.string();
                    break;
                case 3:
                    message.PriceCurrency = reader.int32();
                    break;
                case 4:
                    message.PriceValue = reader.int32();
                    break;
                case 5:
                    message.BaseProductionDurationMillis = reader.int32();
                    break;
                case 6:
                    message.ReclaimPriceCurrency = reader.int32();
                    break;
                case 7:
                    message.ReclaimPriceValue = reader.int32();
                    break;
                case 8:
                    message.BaseReclaimDurationMillis = reader.int32();
                    break;
                case 9:
                    message.Category = reader.int32();
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes an Ingredient message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof mineralchem.Ingredient
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {mineralchem.Ingredient} Ingredient
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        Ingredient.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies an Ingredient message.
         * @function verify
         * @memberof mineralchem.Ingredient
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        Ingredient.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.Id != null && message.hasOwnProperty("Id"))
                if (!$util.isInteger(message.Id))
                    return "Id: integer expected";
            if (message.Name != null && message.hasOwnProperty("Name"))
                if (!$util.isString(message.Name))
                    return "Name: string expected";
            if (message.PriceCurrency != null && message.hasOwnProperty("PriceCurrency"))
                if (!$util.isInteger(message.PriceCurrency))
                    return "PriceCurrency: integer expected";
            if (message.PriceValue != null && message.hasOwnProperty("PriceValue"))
                if (!$util.isInteger(message.PriceValue))
                    return "PriceValue: integer expected";
            if (message.BaseProductionDurationMillis != null && message.hasOwnProperty("BaseProductionDurationMillis"))
                if (!$util.isInteger(message.BaseProductionDurationMillis))
                    return "BaseProductionDurationMillis: integer expected";
            if (message.ReclaimPriceCurrency != null && message.hasOwnProperty("ReclaimPriceCurrency"))
                if (!$util.isInteger(message.ReclaimPriceCurrency))
                    return "ReclaimPriceCurrency: integer expected";
            if (message.ReclaimPriceValue != null && message.hasOwnProperty("ReclaimPriceValue"))
                if (!$util.isInteger(message.ReclaimPriceValue))
                    return "ReclaimPriceValue: integer expected";
            if (message.BaseReclaimDurationMillis != null && message.hasOwnProperty("BaseReclaimDurationMillis"))
                if (!$util.isInteger(message.BaseReclaimDurationMillis))
                    return "BaseReclaimDurationMillis: integer expected";
            if (message.Category != null && message.hasOwnProperty("Category"))
                if (!$util.isInteger(message.Category))
                    return "Category: integer expected";
            return null;
        };

        /**
         * Creates an Ingredient message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof mineralchem.Ingredient
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {mineralchem.Ingredient} Ingredient
         */
        Ingredient.fromObject = function fromObject(object) {
            if (object instanceof $root.mineralchem.Ingredient)
                return object;
            var message = new $root.mineralchem.Ingredient();
            if (object.Id != null)
                message.Id = object.Id | 0;
            if (object.Name != null)
                message.Name = String(object.Name);
            if (object.PriceCurrency != null)
                message.PriceCurrency = object.PriceCurrency | 0;
            if (object.PriceValue != null)
                message.PriceValue = object.PriceValue | 0;
            if (object.BaseProductionDurationMillis != null)
                message.BaseProductionDurationMillis = object.BaseProductionDurationMillis | 0;
            if (object.ReclaimPriceCurrency != null)
                message.ReclaimPriceCurrency = object.ReclaimPriceCurrency | 0;
            if (object.ReclaimPriceValue != null)
                message.ReclaimPriceValue = object.ReclaimPriceValue | 0;
            if (object.BaseReclaimDurationMillis != null)
                message.BaseReclaimDurationMillis = object.BaseReclaimDurationMillis | 0;
            if (object.Category != null)
                message.Category = object.Category | 0;
            return message;
        };

        /**
         * Creates a plain object from an Ingredient message. Also converts values to other types if specified.
         * @function toObject
         * @memberof mineralchem.Ingredient
         * @static
         * @param {mineralchem.Ingredient} message Ingredient
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        Ingredient.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            var object = {};
            if (options.defaults) {
                object.Id = 0;
                object.Name = "";
                object.PriceCurrency = 0;
                object.PriceValue = 0;
                object.BaseProductionDurationMillis = 0;
                object.ReclaimPriceCurrency = 0;
                object.ReclaimPriceValue = 0;
                object.BaseReclaimDurationMillis = 0;
                object.Category = 0;
            }
            if (message.Id != null && message.hasOwnProperty("Id"))
                object.Id = message.Id;
            if (message.Name != null && message.hasOwnProperty("Name"))
                object.Name = message.Name;
            if (message.PriceCurrency != null && message.hasOwnProperty("PriceCurrency"))
                object.PriceCurrency = message.PriceCurrency;
            if (message.PriceValue != null && message.hasOwnProperty("PriceValue"))
                object.PriceValue = message.PriceValue;
            if (message.BaseProductionDurationMillis != null && message.hasOwnProperty("BaseProductionDurationMillis"))
                object.BaseProductionDurationMillis = message.BaseProductionDurationMillis;
            if (message.ReclaimPriceCurrency != null && message.hasOwnProperty("ReclaimPriceCurrency"))
                object.ReclaimPriceCurrency = message.ReclaimPriceCurrency;
            if (message.ReclaimPriceValue != null && message.hasOwnProperty("ReclaimPriceValue"))
                object.ReclaimPriceValue = message.ReclaimPriceValue;
            if (message.BaseReclaimDurationMillis != null && message.hasOwnProperty("BaseReclaimDurationMillis"))
                object.BaseReclaimDurationMillis = message.BaseReclaimDurationMillis;
            if (message.Category != null && message.hasOwnProperty("Category"))
                object.Category = message.Category;
            return object;
        };

        /**
         * Converts this Ingredient to JSON.
         * @function toJSON
         * @memberof mineralchem.Ingredient
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        Ingredient.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return Ingredient;
    })();

    mineralchem.Recipe = (function() {

        /**
         * Properties of a Recipe.
         * @memberof mineralchem
         * @interface IRecipe
         * @property {number|null} [id] Recipe id
         * @property {number|null} [targetIngredientId] Recipe targetIngredientId
         * @property {number|null} [targetIngredientCount] Recipe targetIngredientCount
         * @property {number|null} [durationMillis] Recipe durationMillis
         * @property {string|null} [toUnlockSimultaneouslyRecipeIdList] Recipe toUnlockSimultaneouslyRecipeIdList
         * @property {Array.<mineralchem.RecipeIngredientBinding>|null} [recipeIngredientBindingList] Recipe recipeIngredientBindingList
         */

        /**
         * Constructs a new Recipe.
         * @memberof mineralchem
         * @classdesc Represents a Recipe.
         * @implements IRecipe
         * @constructor
         * @param {mineralchem.IRecipe=} [properties] Properties to set
         */
        function Recipe(properties) {
            this.recipeIngredientBindingList = [];
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * Recipe id.
         * @member {number} id
         * @memberof mineralchem.Recipe
         * @instance
         */
        Recipe.prototype.id = 0;

        /**
         * Recipe targetIngredientId.
         * @member {number} targetIngredientId
         * @memberof mineralchem.Recipe
         * @instance
         */
        Recipe.prototype.targetIngredientId = 0;

        /**
         * Recipe targetIngredientCount.
         * @member {number} targetIngredientCount
         * @memberof mineralchem.Recipe
         * @instance
         */
        Recipe.prototype.targetIngredientCount = 0;

        /**
         * Recipe durationMillis.
         * @member {number} durationMillis
         * @memberof mineralchem.Recipe
         * @instance
         */
        Recipe.prototype.durationMillis = 0;

        /**
         * Recipe toUnlockSimultaneouslyRecipeIdList.
         * @member {string} toUnlockSimultaneouslyRecipeIdList
         * @memberof mineralchem.Recipe
         * @instance
         */
        Recipe.prototype.toUnlockSimultaneouslyRecipeIdList = "";

        /**
         * Recipe recipeIngredientBindingList.
         * @member {Array.<mineralchem.RecipeIngredientBinding>} recipeIngredientBindingList
         * @memberof mineralchem.Recipe
         * @instance
         */
        Recipe.prototype.recipeIngredientBindingList = $util.emptyArray;

        /**
         * Creates a new Recipe instance using the specified properties.
         * @function create
         * @memberof mineralchem.Recipe
         * @static
         * @param {mineralchem.IRecipe=} [properties] Properties to set
         * @returns {mineralchem.Recipe} Recipe instance
         */
        Recipe.create = function create(properties) {
            return new Recipe(properties);
        };

        /**
         * Encodes the specified Recipe message. Does not implicitly {@link mineralchem.Recipe.verify|verify} messages.
         * @function encode
         * @memberof mineralchem.Recipe
         * @static
         * @param {mineralchem.Recipe} message Recipe message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        Recipe.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.id != null && message.hasOwnProperty("id"))
                writer.uint32(/* id 1, wireType 0 =*/8).int32(message.id);
            if (message.targetIngredientId != null && message.hasOwnProperty("targetIngredientId"))
                writer.uint32(/* id 2, wireType 0 =*/16).int32(message.targetIngredientId);
            if (message.targetIngredientCount != null && message.hasOwnProperty("targetIngredientCount"))
                writer.uint32(/* id 3, wireType 0 =*/24).int32(message.targetIngredientCount);
            if (message.durationMillis != null && message.hasOwnProperty("durationMillis"))
                writer.uint32(/* id 4, wireType 0 =*/32).int32(message.durationMillis);
            if (message.toUnlockSimultaneouslyRecipeIdList != null && message.hasOwnProperty("toUnlockSimultaneouslyRecipeIdList"))
                writer.uint32(/* id 5, wireType 2 =*/42).string(message.toUnlockSimultaneouslyRecipeIdList);
            if (message.recipeIngredientBindingList != null && message.recipeIngredientBindingList.length)
                for (var i = 0; i < message.recipeIngredientBindingList.length; ++i)
                    $root.mineralchem.RecipeIngredientBinding.encode(message.recipeIngredientBindingList[i], writer.uint32(/* id 6, wireType 2 =*/50).fork()).ldelim();
            return writer;
        };

        /**
         * Encodes the specified Recipe message, length delimited. Does not implicitly {@link mineralchem.Recipe.verify|verify} messages.
         * @function encodeDelimited
         * @memberof mineralchem.Recipe
         * @static
         * @param {mineralchem.Recipe} message Recipe message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        Recipe.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a Recipe message from the specified reader or buffer.
         * @function decode
         * @memberof mineralchem.Recipe
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {mineralchem.Recipe} Recipe
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        Recipe.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.mineralchem.Recipe();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    message.id = reader.int32();
                    break;
                case 2:
                    message.targetIngredientId = reader.int32();
                    break;
                case 3:
                    message.targetIngredientCount = reader.int32();
                    break;
                case 4:
                    message.durationMillis = reader.int32();
                    break;
                case 5:
                    message.toUnlockSimultaneouslyRecipeIdList = reader.string();
                    break;
                case 6:
                    if (!(message.recipeIngredientBindingList && message.recipeIngredientBindingList.length))
                        message.recipeIngredientBindingList = [];
                    message.recipeIngredientBindingList.push($root.mineralchem.RecipeIngredientBinding.decode(reader, reader.uint32()));
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a Recipe message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof mineralchem.Recipe
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {mineralchem.Recipe} Recipe
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        Recipe.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a Recipe message.
         * @function verify
         * @memberof mineralchem.Recipe
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        Recipe.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.id != null && message.hasOwnProperty("id"))
                if (!$util.isInteger(message.id))
                    return "id: integer expected";
            if (message.targetIngredientId != null && message.hasOwnProperty("targetIngredientId"))
                if (!$util.isInteger(message.targetIngredientId))
                    return "targetIngredientId: integer expected";
            if (message.targetIngredientCount != null && message.hasOwnProperty("targetIngredientCount"))
                if (!$util.isInteger(message.targetIngredientCount))
                    return "targetIngredientCount: integer expected";
            if (message.durationMillis != null && message.hasOwnProperty("durationMillis"))
                if (!$util.isInteger(message.durationMillis))
                    return "durationMillis: integer expected";
            if (message.toUnlockSimultaneouslyRecipeIdList != null && message.hasOwnProperty("toUnlockSimultaneouslyRecipeIdList"))
                if (!$util.isString(message.toUnlockSimultaneouslyRecipeIdList))
                    return "toUnlockSimultaneouslyRecipeIdList: string expected";
            if (message.recipeIngredientBindingList != null && message.hasOwnProperty("recipeIngredientBindingList")) {
                if (!Array.isArray(message.recipeIngredientBindingList))
                    return "recipeIngredientBindingList: array expected";
                for (var i = 0; i < message.recipeIngredientBindingList.length; ++i) {
                    var error = $root.mineralchem.RecipeIngredientBinding.verify(message.recipeIngredientBindingList[i]);
                    if (error)
                        return "recipeIngredientBindingList." + error;
                }
            }
            return null;
        };

        /**
         * Creates a Recipe message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof mineralchem.Recipe
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {mineralchem.Recipe} Recipe
         */
        Recipe.fromObject = function fromObject(object) {
            if (object instanceof $root.mineralchem.Recipe)
                return object;
            var message = new $root.mineralchem.Recipe();
            if (object.id != null)
                message.id = object.id | 0;
            if (object.targetIngredientId != null)
                message.targetIngredientId = object.targetIngredientId | 0;
            if (object.targetIngredientCount != null)
                message.targetIngredientCount = object.targetIngredientCount | 0;
            if (object.durationMillis != null)
                message.durationMillis = object.durationMillis | 0;
            if (object.toUnlockSimultaneouslyRecipeIdList != null)
                message.toUnlockSimultaneouslyRecipeIdList = String(object.toUnlockSimultaneouslyRecipeIdList);
            if (object.recipeIngredientBindingList) {
                if (!Array.isArray(object.recipeIngredientBindingList))
                    throw TypeError(".mineralchem.Recipe.recipeIngredientBindingList: array expected");
                message.recipeIngredientBindingList = [];
                for (var i = 0; i < object.recipeIngredientBindingList.length; ++i) {
                    if (typeof object.recipeIngredientBindingList[i] !== "object")
                        throw TypeError(".mineralchem.Recipe.recipeIngredientBindingList: object expected");
                    message.recipeIngredientBindingList[i] = $root.mineralchem.RecipeIngredientBinding.fromObject(object.recipeIngredientBindingList[i]);
                }
            }
            return message;
        };

        /**
         * Creates a plain object from a Recipe message. Also converts values to other types if specified.
         * @function toObject
         * @memberof mineralchem.Recipe
         * @static
         * @param {mineralchem.Recipe} message Recipe
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        Recipe.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            var object = {};
            if (options.arrays || options.defaults)
                object.recipeIngredientBindingList = [];
            if (options.defaults) {
                object.id = 0;
                object.targetIngredientId = 0;
                object.targetIngredientCount = 0;
                object.durationMillis = 0;
                object.toUnlockSimultaneouslyRecipeIdList = "";
            }
            if (message.id != null && message.hasOwnProperty("id"))
                object.id = message.id;
            if (message.targetIngredientId != null && message.hasOwnProperty("targetIngredientId"))
                object.targetIngredientId = message.targetIngredientId;
            if (message.targetIngredientCount != null && message.hasOwnProperty("targetIngredientCount"))
                object.targetIngredientCount = message.targetIngredientCount;
            if (message.durationMillis != null && message.hasOwnProperty("durationMillis"))
                object.durationMillis = message.durationMillis;
            if (message.toUnlockSimultaneouslyRecipeIdList != null && message.hasOwnProperty("toUnlockSimultaneouslyRecipeIdList"))
                object.toUnlockSimultaneouslyRecipeIdList = message.toUnlockSimultaneouslyRecipeIdList;
            if (message.recipeIngredientBindingList && message.recipeIngredientBindingList.length) {
                object.recipeIngredientBindingList = [];
                for (var j = 0; j < message.recipeIngredientBindingList.length; ++j)
                    object.recipeIngredientBindingList[j] = $root.mineralchem.RecipeIngredientBinding.toObject(message.recipeIngredientBindingList[j], options);
            }
            return object;
        };

        /**
         * Converts this Recipe to JSON.
         * @function toJSON
         * @memberof mineralchem.Recipe
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        Recipe.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return Recipe;
    })();

    mineralchem.PlayerRecipe = (function() {

        /**
         * Properties of a PlayerRecipe.
         * @memberof mineralchem
         * @interface IPlayerRecipe
         * @property {number|Long|null} [recipeId] PlayerRecipe recipeId
         * @property {number|null} [state] PlayerRecipe state
         * @property {number|Long|null} [ingredientId] PlayerRecipe ingredientId
         */

        /**
         * Constructs a new PlayerRecipe.
         * @memberof mineralchem
         * @classdesc Represents a PlayerRecipe.
         * @implements IPlayerRecipe
         * @constructor
         * @param {mineralchem.IPlayerRecipe=} [properties] Properties to set
         */
        function PlayerRecipe(properties) {
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * PlayerRecipe recipeId.
         * @member {number|Long} recipeId
         * @memberof mineralchem.PlayerRecipe
         * @instance
         */
        PlayerRecipe.prototype.recipeId = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

        /**
         * PlayerRecipe state.
         * @member {number} state
         * @memberof mineralchem.PlayerRecipe
         * @instance
         */
        PlayerRecipe.prototype.state = 0;

        /**
         * PlayerRecipe ingredientId.
         * @member {number|Long} ingredientId
         * @memberof mineralchem.PlayerRecipe
         * @instance
         */
        PlayerRecipe.prototype.ingredientId = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

        /**
         * Creates a new PlayerRecipe instance using the specified properties.
         * @function create
         * @memberof mineralchem.PlayerRecipe
         * @static
         * @param {mineralchem.IPlayerRecipe=} [properties] Properties to set
         * @returns {mineralchem.PlayerRecipe} PlayerRecipe instance
         */
        PlayerRecipe.create = function create(properties) {
            return new PlayerRecipe(properties);
        };

        /**
         * Encodes the specified PlayerRecipe message. Does not implicitly {@link mineralchem.PlayerRecipe.verify|verify} messages.
         * @function encode
         * @memberof mineralchem.PlayerRecipe
         * @static
         * @param {mineralchem.PlayerRecipe} message PlayerRecipe message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        PlayerRecipe.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.recipeId != null && message.hasOwnProperty("recipeId"))
                writer.uint32(/* id 1, wireType 0 =*/8).int64(message.recipeId);
            if (message.state != null && message.hasOwnProperty("state"))
                writer.uint32(/* id 2, wireType 0 =*/16).int32(message.state);
            if (message.ingredientId != null && message.hasOwnProperty("ingredientId"))
                writer.uint32(/* id 3, wireType 0 =*/24).int64(message.ingredientId);
            return writer;
        };

        /**
         * Encodes the specified PlayerRecipe message, length delimited. Does not implicitly {@link mineralchem.PlayerRecipe.verify|verify} messages.
         * @function encodeDelimited
         * @memberof mineralchem.PlayerRecipe
         * @static
         * @param {mineralchem.PlayerRecipe} message PlayerRecipe message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        PlayerRecipe.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a PlayerRecipe message from the specified reader or buffer.
         * @function decode
         * @memberof mineralchem.PlayerRecipe
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {mineralchem.PlayerRecipe} PlayerRecipe
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        PlayerRecipe.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.mineralchem.PlayerRecipe();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    message.recipeId = reader.int64();
                    break;
                case 2:
                    message.state = reader.int32();
                    break;
                case 3:
                    message.ingredientId = reader.int64();
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a PlayerRecipe message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof mineralchem.PlayerRecipe
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {mineralchem.PlayerRecipe} PlayerRecipe
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        PlayerRecipe.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a PlayerRecipe message.
         * @function verify
         * @memberof mineralchem.PlayerRecipe
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        PlayerRecipe.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.recipeId != null && message.hasOwnProperty("recipeId"))
                if (!$util.isInteger(message.recipeId) && !(message.recipeId && $util.isInteger(message.recipeId.low) && $util.isInteger(message.recipeId.high)))
                    return "recipeId: integer|Long expected";
            if (message.state != null && message.hasOwnProperty("state"))
                if (!$util.isInteger(message.state))
                    return "state: integer expected";
            if (message.ingredientId != null && message.hasOwnProperty("ingredientId"))
                if (!$util.isInteger(message.ingredientId) && !(message.ingredientId && $util.isInteger(message.ingredientId.low) && $util.isInteger(message.ingredientId.high)))
                    return "ingredientId: integer|Long expected";
            return null;
        };

        /**
         * Creates a PlayerRecipe message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof mineralchem.PlayerRecipe
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {mineralchem.PlayerRecipe} PlayerRecipe
         */
        PlayerRecipe.fromObject = function fromObject(object) {
            if (object instanceof $root.mineralchem.PlayerRecipe)
                return object;
            var message = new $root.mineralchem.PlayerRecipe();
            if (object.recipeId != null)
                if ($util.Long)
                    (message.recipeId = $util.Long.fromValue(object.recipeId)).unsigned = false;
                else if (typeof object.recipeId === "string")
                    message.recipeId = parseInt(object.recipeId, 10);
                else if (typeof object.recipeId === "number")
                    message.recipeId = object.recipeId;
                else if (typeof object.recipeId === "object")
                    message.recipeId = new $util.LongBits(object.recipeId.low >>> 0, object.recipeId.high >>> 0).toNumber();
            if (object.state != null)
                message.state = object.state | 0;
            if (object.ingredientId != null)
                if ($util.Long)
                    (message.ingredientId = $util.Long.fromValue(object.ingredientId)).unsigned = false;
                else if (typeof object.ingredientId === "string")
                    message.ingredientId = parseInt(object.ingredientId, 10);
                else if (typeof object.ingredientId === "number")
                    message.ingredientId = object.ingredientId;
                else if (typeof object.ingredientId === "object")
                    message.ingredientId = new $util.LongBits(object.ingredientId.low >>> 0, object.ingredientId.high >>> 0).toNumber();
            return message;
        };

        /**
         * Creates a plain object from a PlayerRecipe message. Also converts values to other types if specified.
         * @function toObject
         * @memberof mineralchem.PlayerRecipe
         * @static
         * @param {mineralchem.PlayerRecipe} message PlayerRecipe
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        PlayerRecipe.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            var object = {};
            if (options.defaults) {
                if ($util.Long) {
                    var long = new $util.Long(0, 0, false);
                    object.recipeId = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
                } else
                    object.recipeId = options.longs === String ? "0" : 0;
                object.state = 0;
                if ($util.Long) {
                    var long = new $util.Long(0, 0, false);
                    object.ingredientId = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
                } else
                    object.ingredientId = options.longs === String ? "0" : 0;
            }
            if (message.recipeId != null && message.hasOwnProperty("recipeId"))
                if (typeof message.recipeId === "number")
                    object.recipeId = options.longs === String ? String(message.recipeId) : message.recipeId;
                else
                    object.recipeId = options.longs === String ? $util.Long.prototype.toString.call(message.recipeId) : options.longs === Number ? new $util.LongBits(message.recipeId.low >>> 0, message.recipeId.high >>> 0).toNumber() : message.recipeId;
            if (message.state != null && message.hasOwnProperty("state"))
                object.state = message.state;
            if (message.ingredientId != null && message.hasOwnProperty("ingredientId"))
                if (typeof message.ingredientId === "number")
                    object.ingredientId = options.longs === String ? String(message.ingredientId) : message.ingredientId;
                else
                    object.ingredientId = options.longs === String ? $util.Long.prototype.toString.call(message.ingredientId) : options.longs === Number ? new $util.LongBits(message.ingredientId.low >>> 0, message.ingredientId.high >>> 0).toNumber() : message.ingredientId;
            return object;
        };

        /**
         * Converts this PlayerRecipe to JSON.
         * @function toJSON
         * @memberof mineralchem.PlayerRecipe
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        PlayerRecipe.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return PlayerRecipe;
    })();

    mineralchem.StageBuildableLevelDependency = (function() {

        /**
         * Properties of a StageBuildableLevelDependency.
         * @memberof mineralchem
         * @interface IStageBuildableLevelDependency
         * @property {number|null} [requiredBuildableId] StageBuildableLevelDependency requiredBuildableId
         * @property {number|null} [requiredBuildableCount] StageBuildableLevelDependency requiredBuildableCount
         * @property {number|null} [requiredMinimumLevel] StageBuildableLevelDependency requiredMinimumLevel
         * @property {number|null} [targetBuildableMaxCount] StageBuildableLevelDependency targetBuildableMaxCount
         */

        /**
         * Constructs a new StageBuildableLevelDependency.
         * @memberof mineralchem
         * @classdesc Represents a StageBuildableLevelDependency.
         * @implements IStageBuildableLevelDependency
         * @constructor
         * @param {mineralchem.IStageBuildableLevelDependency=} [properties] Properties to set
         */
        function StageBuildableLevelDependency(properties) {
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * StageBuildableLevelDependency requiredBuildableId.
         * @member {number} requiredBuildableId
         * @memberof mineralchem.StageBuildableLevelDependency
         * @instance
         */
        StageBuildableLevelDependency.prototype.requiredBuildableId = 0;

        /**
         * StageBuildableLevelDependency requiredBuildableCount.
         * @member {number} requiredBuildableCount
         * @memberof mineralchem.StageBuildableLevelDependency
         * @instance
         */
        StageBuildableLevelDependency.prototype.requiredBuildableCount = 0;

        /**
         * StageBuildableLevelDependency requiredMinimumLevel.
         * @member {number} requiredMinimumLevel
         * @memberof mineralchem.StageBuildableLevelDependency
         * @instance
         */
        StageBuildableLevelDependency.prototype.requiredMinimumLevel = 0;

        /**
         * StageBuildableLevelDependency targetBuildableMaxCount.
         * @member {number} targetBuildableMaxCount
         * @memberof mineralchem.StageBuildableLevelDependency
         * @instance
         */
        StageBuildableLevelDependency.prototype.targetBuildableMaxCount = 0;

        /**
         * Creates a new StageBuildableLevelDependency instance using the specified properties.
         * @function create
         * @memberof mineralchem.StageBuildableLevelDependency
         * @static
         * @param {mineralchem.IStageBuildableLevelDependency=} [properties] Properties to set
         * @returns {mineralchem.StageBuildableLevelDependency} StageBuildableLevelDependency instance
         */
        StageBuildableLevelDependency.create = function create(properties) {
            return new StageBuildableLevelDependency(properties);
        };

        /**
         * Encodes the specified StageBuildableLevelDependency message. Does not implicitly {@link mineralchem.StageBuildableLevelDependency.verify|verify} messages.
         * @function encode
         * @memberof mineralchem.StageBuildableLevelDependency
         * @static
         * @param {mineralchem.StageBuildableLevelDependency} message StageBuildableLevelDependency message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        StageBuildableLevelDependency.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.requiredBuildableId != null && message.hasOwnProperty("requiredBuildableId"))
                writer.uint32(/* id 1, wireType 0 =*/8).int32(message.requiredBuildableId);
            if (message.requiredBuildableCount != null && message.hasOwnProperty("requiredBuildableCount"))
                writer.uint32(/* id 2, wireType 0 =*/16).int32(message.requiredBuildableCount);
            if (message.requiredMinimumLevel != null && message.hasOwnProperty("requiredMinimumLevel"))
                writer.uint32(/* id 3, wireType 0 =*/24).int32(message.requiredMinimumLevel);
            if (message.targetBuildableMaxCount != null && message.hasOwnProperty("targetBuildableMaxCount"))
                writer.uint32(/* id 4, wireType 0 =*/32).int32(message.targetBuildableMaxCount);
            return writer;
        };

        /**
         * Encodes the specified StageBuildableLevelDependency message, length delimited. Does not implicitly {@link mineralchem.StageBuildableLevelDependency.verify|verify} messages.
         * @function encodeDelimited
         * @memberof mineralchem.StageBuildableLevelDependency
         * @static
         * @param {mineralchem.StageBuildableLevelDependency} message StageBuildableLevelDependency message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        StageBuildableLevelDependency.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a StageBuildableLevelDependency message from the specified reader or buffer.
         * @function decode
         * @memberof mineralchem.StageBuildableLevelDependency
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {mineralchem.StageBuildableLevelDependency} StageBuildableLevelDependency
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        StageBuildableLevelDependency.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.mineralchem.StageBuildableLevelDependency();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    message.requiredBuildableId = reader.int32();
                    break;
                case 2:
                    message.requiredBuildableCount = reader.int32();
                    break;
                case 3:
                    message.requiredMinimumLevel = reader.int32();
                    break;
                case 4:
                    message.targetBuildableMaxCount = reader.int32();
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a StageBuildableLevelDependency message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof mineralchem.StageBuildableLevelDependency
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {mineralchem.StageBuildableLevelDependency} StageBuildableLevelDependency
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        StageBuildableLevelDependency.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a StageBuildableLevelDependency message.
         * @function verify
         * @memberof mineralchem.StageBuildableLevelDependency
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        StageBuildableLevelDependency.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.requiredBuildableId != null && message.hasOwnProperty("requiredBuildableId"))
                if (!$util.isInteger(message.requiredBuildableId))
                    return "requiredBuildableId: integer expected";
            if (message.requiredBuildableCount != null && message.hasOwnProperty("requiredBuildableCount"))
                if (!$util.isInteger(message.requiredBuildableCount))
                    return "requiredBuildableCount: integer expected";
            if (message.requiredMinimumLevel != null && message.hasOwnProperty("requiredMinimumLevel"))
                if (!$util.isInteger(message.requiredMinimumLevel))
                    return "requiredMinimumLevel: integer expected";
            if (message.targetBuildableMaxCount != null && message.hasOwnProperty("targetBuildableMaxCount"))
                if (!$util.isInteger(message.targetBuildableMaxCount))
                    return "targetBuildableMaxCount: integer expected";
            return null;
        };

        /**
         * Creates a StageBuildableLevelDependency message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof mineralchem.StageBuildableLevelDependency
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {mineralchem.StageBuildableLevelDependency} StageBuildableLevelDependency
         */
        StageBuildableLevelDependency.fromObject = function fromObject(object) {
            if (object instanceof $root.mineralchem.StageBuildableLevelDependency)
                return object;
            var message = new $root.mineralchem.StageBuildableLevelDependency();
            if (object.requiredBuildableId != null)
                message.requiredBuildableId = object.requiredBuildableId | 0;
            if (object.requiredBuildableCount != null)
                message.requiredBuildableCount = object.requiredBuildableCount | 0;
            if (object.requiredMinimumLevel != null)
                message.requiredMinimumLevel = object.requiredMinimumLevel | 0;
            if (object.targetBuildableMaxCount != null)
                message.targetBuildableMaxCount = object.targetBuildableMaxCount | 0;
            return message;
        };

        /**
         * Creates a plain object from a StageBuildableLevelDependency message. Also converts values to other types if specified.
         * @function toObject
         * @memberof mineralchem.StageBuildableLevelDependency
         * @static
         * @param {mineralchem.StageBuildableLevelDependency} message StageBuildableLevelDependency
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        StageBuildableLevelDependency.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            var object = {};
            if (options.defaults) {
                object.requiredBuildableId = 0;
                object.requiredBuildableCount = 0;
                object.requiredMinimumLevel = 0;
                object.targetBuildableMaxCount = 0;
            }
            if (message.requiredBuildableId != null && message.hasOwnProperty("requiredBuildableId"))
                object.requiredBuildableId = message.requiredBuildableId;
            if (message.requiredBuildableCount != null && message.hasOwnProperty("requiredBuildableCount"))
                object.requiredBuildableCount = message.requiredBuildableCount;
            if (message.requiredMinimumLevel != null && message.hasOwnProperty("requiredMinimumLevel"))
                object.requiredMinimumLevel = message.requiredMinimumLevel;
            if (message.targetBuildableMaxCount != null && message.hasOwnProperty("targetBuildableMaxCount"))
                object.targetBuildableMaxCount = message.targetBuildableMaxCount;
            return object;
        };

        /**
         * Converts this StageBuildableLevelDependency to JSON.
         * @function toJSON
         * @memberof mineralchem.StageBuildableLevelDependency
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        StageBuildableLevelDependency.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return StageBuildableLevelDependency;
    })();

    mineralchem.StageBuildableLevelBinding = (function() {

        /**
         * Properties of a StageBuildableLevelBinding.
         * @memberof mineralchem
         * @interface IStageBuildableLevelBinding
         * @property {number|null} [buildableId] StageBuildableLevelBinding buildableId
         * @property {number|null} [level] StageBuildableLevelBinding level
         * @property {number|null} [buildingOrUpgradingDuration] StageBuildableLevelBinding buildingOrUpgradingDuration
         * @property {number|null} [buildingOrUpgradingRequiredGold] StageBuildableLevelBinding buildingOrUpgradingRequiredGold
         * @property {number|null} [buildingOrUpgradingRequiredResidentsCount] StageBuildableLevelBinding buildingOrUpgradingRequiredResidentsCount
         * @property {number|null} [baseGoldProductionRate] StageBuildableLevelBinding baseGoldProductionRate
         * @property {number|null} [baseFoodProductionRate] StageBuildableLevelBinding baseFoodProductionRate
         * @property {number|null} [baseRiflemanProductionRequiredGold] StageBuildableLevelBinding baseRiflemanProductionRequiredGold
         * @property {number|null} [baseRiflemanProductionDuration] StageBuildableLevelBinding baseRiflemanProductionDuration
         * @property {Array.<mineralchem.StageBuildableLevelDependency>|null} [dependency] StageBuildableLevelBinding dependency
         * @property {number|null} [goldLimitAddition] StageBuildableLevelBinding goldLimitAddition
         * @property {number|null} [baseHp] StageBuildableLevelBinding baseHp
         * @property {number|null} [baseDamage] StageBuildableLevelBinding baseDamage
         */

        /**
         * Constructs a new StageBuildableLevelBinding.
         * @memberof mineralchem
         * @classdesc Represents a StageBuildableLevelBinding.
         * @implements IStageBuildableLevelBinding
         * @constructor
         * @param {mineralchem.IStageBuildableLevelBinding=} [properties] Properties to set
         */
        function StageBuildableLevelBinding(properties) {
            this.dependency = [];
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * StageBuildableLevelBinding buildableId.
         * @member {number} buildableId
         * @memberof mineralchem.StageBuildableLevelBinding
         * @instance
         */
        StageBuildableLevelBinding.prototype.buildableId = 0;

        /**
         * StageBuildableLevelBinding level.
         * @member {number} level
         * @memberof mineralchem.StageBuildableLevelBinding
         * @instance
         */
        StageBuildableLevelBinding.prototype.level = 0;

        /**
         * StageBuildableLevelBinding buildingOrUpgradingDuration.
         * @member {number} buildingOrUpgradingDuration
         * @memberof mineralchem.StageBuildableLevelBinding
         * @instance
         */
        StageBuildableLevelBinding.prototype.buildingOrUpgradingDuration = 0;

        /**
         * StageBuildableLevelBinding buildingOrUpgradingRequiredGold.
         * @member {number} buildingOrUpgradingRequiredGold
         * @memberof mineralchem.StageBuildableLevelBinding
         * @instance
         */
        StageBuildableLevelBinding.prototype.buildingOrUpgradingRequiredGold = 0;

        /**
         * StageBuildableLevelBinding buildingOrUpgradingRequiredResidentsCount.
         * @member {number} buildingOrUpgradingRequiredResidentsCount
         * @memberof mineralchem.StageBuildableLevelBinding
         * @instance
         */
        StageBuildableLevelBinding.prototype.buildingOrUpgradingRequiredResidentsCount = 0;

        /**
         * StageBuildableLevelBinding baseGoldProductionRate.
         * @member {number} baseGoldProductionRate
         * @memberof mineralchem.StageBuildableLevelBinding
         * @instance
         */
        StageBuildableLevelBinding.prototype.baseGoldProductionRate = 0;

        /**
         * StageBuildableLevelBinding baseFoodProductionRate.
         * @member {number} baseFoodProductionRate
         * @memberof mineralchem.StageBuildableLevelBinding
         * @instance
         */
        StageBuildableLevelBinding.prototype.baseFoodProductionRate = 0;

        /**
         * StageBuildableLevelBinding baseRiflemanProductionRequiredGold.
         * @member {number} baseRiflemanProductionRequiredGold
         * @memberof mineralchem.StageBuildableLevelBinding
         * @instance
         */
        StageBuildableLevelBinding.prototype.baseRiflemanProductionRequiredGold = 0;

        /**
         * StageBuildableLevelBinding baseRiflemanProductionDuration.
         * @member {number} baseRiflemanProductionDuration
         * @memberof mineralchem.StageBuildableLevelBinding
         * @instance
         */
        StageBuildableLevelBinding.prototype.baseRiflemanProductionDuration = 0;

        /**
         * StageBuildableLevelBinding dependency.
         * @member {Array.<mineralchem.StageBuildableLevelDependency>} dependency
         * @memberof mineralchem.StageBuildableLevelBinding
         * @instance
         */
        StageBuildableLevelBinding.prototype.dependency = $util.emptyArray;

        /**
         * StageBuildableLevelBinding goldLimitAddition.
         * @member {number} goldLimitAddition
         * @memberof mineralchem.StageBuildableLevelBinding
         * @instance
         */
        StageBuildableLevelBinding.prototype.goldLimitAddition = 0;

        /**
         * StageBuildableLevelBinding baseHp.
         * @member {number} baseHp
         * @memberof mineralchem.StageBuildableLevelBinding
         * @instance
         */
        StageBuildableLevelBinding.prototype.baseHp = 0;

        /**
         * StageBuildableLevelBinding baseDamage.
         * @member {number} baseDamage
         * @memberof mineralchem.StageBuildableLevelBinding
         * @instance
         */
        StageBuildableLevelBinding.prototype.baseDamage = 0;

        /**
         * Creates a new StageBuildableLevelBinding instance using the specified properties.
         * @function create
         * @memberof mineralchem.StageBuildableLevelBinding
         * @static
         * @param {mineralchem.IStageBuildableLevelBinding=} [properties] Properties to set
         * @returns {mineralchem.StageBuildableLevelBinding} StageBuildableLevelBinding instance
         */
        StageBuildableLevelBinding.create = function create(properties) {
            return new StageBuildableLevelBinding(properties);
        };

        /**
         * Encodes the specified StageBuildableLevelBinding message. Does not implicitly {@link mineralchem.StageBuildableLevelBinding.verify|verify} messages.
         * @function encode
         * @memberof mineralchem.StageBuildableLevelBinding
         * @static
         * @param {mineralchem.StageBuildableLevelBinding} message StageBuildableLevelBinding message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        StageBuildableLevelBinding.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.buildableId != null && message.hasOwnProperty("buildableId"))
                writer.uint32(/* id 1, wireType 0 =*/8).int32(message.buildableId);
            if (message.level != null && message.hasOwnProperty("level"))
                writer.uint32(/* id 2, wireType 0 =*/16).int32(message.level);
            if (message.buildingOrUpgradingDuration != null && message.hasOwnProperty("buildingOrUpgradingDuration"))
                writer.uint32(/* id 3, wireType 0 =*/24).int32(message.buildingOrUpgradingDuration);
            if (message.buildingOrUpgradingRequiredGold != null && message.hasOwnProperty("buildingOrUpgradingRequiredGold"))
                writer.uint32(/* id 4, wireType 0 =*/32).int32(message.buildingOrUpgradingRequiredGold);
            if (message.buildingOrUpgradingRequiredResidentsCount != null && message.hasOwnProperty("buildingOrUpgradingRequiredResidentsCount"))
                writer.uint32(/* id 5, wireType 0 =*/40).int32(message.buildingOrUpgradingRequiredResidentsCount);
            if (message.baseGoldProductionRate != null && message.hasOwnProperty("baseGoldProductionRate"))
                writer.uint32(/* id 6, wireType 1 =*/49).double(message.baseGoldProductionRate);
            if (message.baseFoodProductionRate != null && message.hasOwnProperty("baseFoodProductionRate"))
                writer.uint32(/* id 7, wireType 0 =*/56).int32(message.baseFoodProductionRate);
            if (message.baseRiflemanProductionRequiredGold != null && message.hasOwnProperty("baseRiflemanProductionRequiredGold"))
                writer.uint32(/* id 8, wireType 0 =*/64).int32(message.baseRiflemanProductionRequiredGold);
            if (message.baseRiflemanProductionDuration != null && message.hasOwnProperty("baseRiflemanProductionDuration"))
                writer.uint32(/* id 9, wireType 0 =*/72).int32(message.baseRiflemanProductionDuration);
            if (message.dependency != null && message.dependency.length)
                for (var i = 0; i < message.dependency.length; ++i)
                    $root.mineralchem.StageBuildableLevelDependency.encode(message.dependency[i], writer.uint32(/* id 10, wireType 2 =*/82).fork()).ldelim();
            if (message.goldLimitAddition != null && message.hasOwnProperty("goldLimitAddition"))
                writer.uint32(/* id 11, wireType 0 =*/88).int32(message.goldLimitAddition);
            if (message.baseHp != null && message.hasOwnProperty("baseHp"))
                writer.uint32(/* id 12, wireType 0 =*/96).int32(message.baseHp);
            if (message.baseDamage != null && message.hasOwnProperty("baseDamage"))
                writer.uint32(/* id 13, wireType 0 =*/104).int32(message.baseDamage);
            return writer;
        };

        /**
         * Encodes the specified StageBuildableLevelBinding message, length delimited. Does not implicitly {@link mineralchem.StageBuildableLevelBinding.verify|verify} messages.
         * @function encodeDelimited
         * @memberof mineralchem.StageBuildableLevelBinding
         * @static
         * @param {mineralchem.StageBuildableLevelBinding} message StageBuildableLevelBinding message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        StageBuildableLevelBinding.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a StageBuildableLevelBinding message from the specified reader or buffer.
         * @function decode
         * @memberof mineralchem.StageBuildableLevelBinding
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {mineralchem.StageBuildableLevelBinding} StageBuildableLevelBinding
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        StageBuildableLevelBinding.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.mineralchem.StageBuildableLevelBinding();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    message.buildableId = reader.int32();
                    break;
                case 2:
                    message.level = reader.int32();
                    break;
                case 3:
                    message.buildingOrUpgradingDuration = reader.int32();
                    break;
                case 4:
                    message.buildingOrUpgradingRequiredGold = reader.int32();
                    break;
                case 5:
                    message.buildingOrUpgradingRequiredResidentsCount = reader.int32();
                    break;
                case 6:
                    message.baseGoldProductionRate = reader.double();
                    break;
                case 7:
                    message.baseFoodProductionRate = reader.int32();
                    break;
                case 8:
                    message.baseRiflemanProductionRequiredGold = reader.int32();
                    break;
                case 9:
                    message.baseRiflemanProductionDuration = reader.int32();
                    break;
                case 10:
                    if (!(message.dependency && message.dependency.length))
                        message.dependency = [];
                    message.dependency.push($root.mineralchem.StageBuildableLevelDependency.decode(reader, reader.uint32()));
                    break;
                case 11:
                    message.goldLimitAddition = reader.int32();
                    break;
                case 12:
                    message.baseHp = reader.int32();
                    break;
                case 13:
                    message.baseDamage = reader.int32();
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a StageBuildableLevelBinding message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof mineralchem.StageBuildableLevelBinding
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {mineralchem.StageBuildableLevelBinding} StageBuildableLevelBinding
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        StageBuildableLevelBinding.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a StageBuildableLevelBinding message.
         * @function verify
         * @memberof mineralchem.StageBuildableLevelBinding
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        StageBuildableLevelBinding.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.buildableId != null && message.hasOwnProperty("buildableId"))
                if (!$util.isInteger(message.buildableId))
                    return "buildableId: integer expected";
            if (message.level != null && message.hasOwnProperty("level"))
                if (!$util.isInteger(message.level))
                    return "level: integer expected";
            if (message.buildingOrUpgradingDuration != null && message.hasOwnProperty("buildingOrUpgradingDuration"))
                if (!$util.isInteger(message.buildingOrUpgradingDuration))
                    return "buildingOrUpgradingDuration: integer expected";
            if (message.buildingOrUpgradingRequiredGold != null && message.hasOwnProperty("buildingOrUpgradingRequiredGold"))
                if (!$util.isInteger(message.buildingOrUpgradingRequiredGold))
                    return "buildingOrUpgradingRequiredGold: integer expected";
            if (message.buildingOrUpgradingRequiredResidentsCount != null && message.hasOwnProperty("buildingOrUpgradingRequiredResidentsCount"))
                if (!$util.isInteger(message.buildingOrUpgradingRequiredResidentsCount))
                    return "buildingOrUpgradingRequiredResidentsCount: integer expected";
            if (message.baseGoldProductionRate != null && message.hasOwnProperty("baseGoldProductionRate"))
                if (typeof message.baseGoldProductionRate !== "number")
                    return "baseGoldProductionRate: number expected";
            if (message.baseFoodProductionRate != null && message.hasOwnProperty("baseFoodProductionRate"))
                if (!$util.isInteger(message.baseFoodProductionRate))
                    return "baseFoodProductionRate: integer expected";
            if (message.baseRiflemanProductionRequiredGold != null && message.hasOwnProperty("baseRiflemanProductionRequiredGold"))
                if (!$util.isInteger(message.baseRiflemanProductionRequiredGold))
                    return "baseRiflemanProductionRequiredGold: integer expected";
            if (message.baseRiflemanProductionDuration != null && message.hasOwnProperty("baseRiflemanProductionDuration"))
                if (!$util.isInteger(message.baseRiflemanProductionDuration))
                    return "baseRiflemanProductionDuration: integer expected";
            if (message.dependency != null && message.hasOwnProperty("dependency")) {
                if (!Array.isArray(message.dependency))
                    return "dependency: array expected";
                for (var i = 0; i < message.dependency.length; ++i) {
                    var error = $root.mineralchem.StageBuildableLevelDependency.verify(message.dependency[i]);
                    if (error)
                        return "dependency." + error;
                }
            }
            if (message.goldLimitAddition != null && message.hasOwnProperty("goldLimitAddition"))
                if (!$util.isInteger(message.goldLimitAddition))
                    return "goldLimitAddition: integer expected";
            if (message.baseHp != null && message.hasOwnProperty("baseHp"))
                if (!$util.isInteger(message.baseHp))
                    return "baseHp: integer expected";
            if (message.baseDamage != null && message.hasOwnProperty("baseDamage"))
                if (!$util.isInteger(message.baseDamage))
                    return "baseDamage: integer expected";
            return null;
        };

        /**
         * Creates a StageBuildableLevelBinding message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof mineralchem.StageBuildableLevelBinding
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {mineralchem.StageBuildableLevelBinding} StageBuildableLevelBinding
         */
        StageBuildableLevelBinding.fromObject = function fromObject(object) {
            if (object instanceof $root.mineralchem.StageBuildableLevelBinding)
                return object;
            var message = new $root.mineralchem.StageBuildableLevelBinding();
            if (object.buildableId != null)
                message.buildableId = object.buildableId | 0;
            if (object.level != null)
                message.level = object.level | 0;
            if (object.buildingOrUpgradingDuration != null)
                message.buildingOrUpgradingDuration = object.buildingOrUpgradingDuration | 0;
            if (object.buildingOrUpgradingRequiredGold != null)
                message.buildingOrUpgradingRequiredGold = object.buildingOrUpgradingRequiredGold | 0;
            if (object.buildingOrUpgradingRequiredResidentsCount != null)
                message.buildingOrUpgradingRequiredResidentsCount = object.buildingOrUpgradingRequiredResidentsCount | 0;
            if (object.baseGoldProductionRate != null)
                message.baseGoldProductionRate = Number(object.baseGoldProductionRate);
            if (object.baseFoodProductionRate != null)
                message.baseFoodProductionRate = object.baseFoodProductionRate | 0;
            if (object.baseRiflemanProductionRequiredGold != null)
                message.baseRiflemanProductionRequiredGold = object.baseRiflemanProductionRequiredGold | 0;
            if (object.baseRiflemanProductionDuration != null)
                message.baseRiflemanProductionDuration = object.baseRiflemanProductionDuration | 0;
            if (object.dependency) {
                if (!Array.isArray(object.dependency))
                    throw TypeError(".mineralchem.StageBuildableLevelBinding.dependency: array expected");
                message.dependency = [];
                for (var i = 0; i < object.dependency.length; ++i) {
                    if (typeof object.dependency[i] !== "object")
                        throw TypeError(".mineralchem.StageBuildableLevelBinding.dependency: object expected");
                    message.dependency[i] = $root.mineralchem.StageBuildableLevelDependency.fromObject(object.dependency[i]);
                }
            }
            if (object.goldLimitAddition != null)
                message.goldLimitAddition = object.goldLimitAddition | 0;
            if (object.baseHp != null)
                message.baseHp = object.baseHp | 0;
            if (object.baseDamage != null)
                message.baseDamage = object.baseDamage | 0;
            return message;
        };

        /**
         * Creates a plain object from a StageBuildableLevelBinding message. Also converts values to other types if specified.
         * @function toObject
         * @memberof mineralchem.StageBuildableLevelBinding
         * @static
         * @param {mineralchem.StageBuildableLevelBinding} message StageBuildableLevelBinding
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        StageBuildableLevelBinding.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            var object = {};
            if (options.arrays || options.defaults)
                object.dependency = [];
            if (options.defaults) {
                object.buildableId = 0;
                object.level = 0;
                object.buildingOrUpgradingDuration = 0;
                object.buildingOrUpgradingRequiredGold = 0;
                object.buildingOrUpgradingRequiredResidentsCount = 0;
                object.baseGoldProductionRate = 0;
                object.baseFoodProductionRate = 0;
                object.baseRiflemanProductionRequiredGold = 0;
                object.baseRiflemanProductionDuration = 0;
                object.goldLimitAddition = 0;
                object.baseHp = 0;
                object.baseDamage = 0;
            }
            if (message.buildableId != null && message.hasOwnProperty("buildableId"))
                object.buildableId = message.buildableId;
            if (message.level != null && message.hasOwnProperty("level"))
                object.level = message.level;
            if (message.buildingOrUpgradingDuration != null && message.hasOwnProperty("buildingOrUpgradingDuration"))
                object.buildingOrUpgradingDuration = message.buildingOrUpgradingDuration;
            if (message.buildingOrUpgradingRequiredGold != null && message.hasOwnProperty("buildingOrUpgradingRequiredGold"))
                object.buildingOrUpgradingRequiredGold = message.buildingOrUpgradingRequiredGold;
            if (message.buildingOrUpgradingRequiredResidentsCount != null && message.hasOwnProperty("buildingOrUpgradingRequiredResidentsCount"))
                object.buildingOrUpgradingRequiredResidentsCount = message.buildingOrUpgradingRequiredResidentsCount;
            if (message.baseGoldProductionRate != null && message.hasOwnProperty("baseGoldProductionRate"))
                object.baseGoldProductionRate = options.json && !isFinite(message.baseGoldProductionRate) ? String(message.baseGoldProductionRate) : message.baseGoldProductionRate;
            if (message.baseFoodProductionRate != null && message.hasOwnProperty("baseFoodProductionRate"))
                object.baseFoodProductionRate = message.baseFoodProductionRate;
            if (message.baseRiflemanProductionRequiredGold != null && message.hasOwnProperty("baseRiflemanProductionRequiredGold"))
                object.baseRiflemanProductionRequiredGold = message.baseRiflemanProductionRequiredGold;
            if (message.baseRiflemanProductionDuration != null && message.hasOwnProperty("baseRiflemanProductionDuration"))
                object.baseRiflemanProductionDuration = message.baseRiflemanProductionDuration;
            if (message.dependency && message.dependency.length) {
                object.dependency = [];
                for (var j = 0; j < message.dependency.length; ++j)
                    object.dependency[j] = $root.mineralchem.StageBuildableLevelDependency.toObject(message.dependency[j], options);
            }
            if (message.goldLimitAddition != null && message.hasOwnProperty("goldLimitAddition"))
                object.goldLimitAddition = message.goldLimitAddition;
            if (message.baseHp != null && message.hasOwnProperty("baseHp"))
                object.baseHp = message.baseHp;
            if (message.baseDamage != null && message.hasOwnProperty("baseDamage"))
                object.baseDamage = message.baseDamage;
            return object;
        };

        /**
         * Converts this StageBuildableLevelBinding to JSON.
         * @function toJSON
         * @memberof mineralchem.StageBuildableLevelBinding
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        StageBuildableLevelBinding.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return StageBuildableLevelBinding;
    })();

    mineralchem.StageGoalQuest = (function() {

        /**
         * Properties of a StageGoalQuest.
         * @memberof mineralchem
         * @interface IStageGoalQuest
         * @property {number|null} [resourceType] StageGoalQuest resourceType
         * @property {number|null} [resourceTargetId] StageGoalQuest resourceTargetId
         * @property {number|null} [resourceTargetQuantity] StageGoalQuest resourceTargetQuantity
         * @property {number|null} [completedCountRequired] StageGoalQuest completedCountRequired
         * @property {number|null} [forFailing] StageGoalQuest forFailing
         */

        /**
         * Constructs a new StageGoalQuest.
         * @memberof mineralchem
         * @classdesc Represents a StageGoalQuest.
         * @implements IStageGoalQuest
         * @constructor
         * @param {mineralchem.IStageGoalQuest=} [properties] Properties to set
         */
        function StageGoalQuest(properties) {
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * StageGoalQuest resourceType.
         * @member {number} resourceType
         * @memberof mineralchem.StageGoalQuest
         * @instance
         */
        StageGoalQuest.prototype.resourceType = 0;

        /**
         * StageGoalQuest resourceTargetId.
         * @member {number} resourceTargetId
         * @memberof mineralchem.StageGoalQuest
         * @instance
         */
        StageGoalQuest.prototype.resourceTargetId = 0;

        /**
         * StageGoalQuest resourceTargetQuantity.
         * @member {number} resourceTargetQuantity
         * @memberof mineralchem.StageGoalQuest
         * @instance
         */
        StageGoalQuest.prototype.resourceTargetQuantity = 0;

        /**
         * StageGoalQuest completedCountRequired.
         * @member {number} completedCountRequired
         * @memberof mineralchem.StageGoalQuest
         * @instance
         */
        StageGoalQuest.prototype.completedCountRequired = 0;

        /**
         * StageGoalQuest forFailing.
         * @member {number} forFailing
         * @memberof mineralchem.StageGoalQuest
         * @instance
         */
        StageGoalQuest.prototype.forFailing = 0;

        /**
         * Creates a new StageGoalQuest instance using the specified properties.
         * @function create
         * @memberof mineralchem.StageGoalQuest
         * @static
         * @param {mineralchem.IStageGoalQuest=} [properties] Properties to set
         * @returns {mineralchem.StageGoalQuest} StageGoalQuest instance
         */
        StageGoalQuest.create = function create(properties) {
            return new StageGoalQuest(properties);
        };

        /**
         * Encodes the specified StageGoalQuest message. Does not implicitly {@link mineralchem.StageGoalQuest.verify|verify} messages.
         * @function encode
         * @memberof mineralchem.StageGoalQuest
         * @static
         * @param {mineralchem.StageGoalQuest} message StageGoalQuest message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        StageGoalQuest.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.resourceType != null && message.hasOwnProperty("resourceType"))
                writer.uint32(/* id 1, wireType 0 =*/8).int32(message.resourceType);
            if (message.resourceTargetId != null && message.hasOwnProperty("resourceTargetId"))
                writer.uint32(/* id 2, wireType 0 =*/16).int32(message.resourceTargetId);
            if (message.resourceTargetQuantity != null && message.hasOwnProperty("resourceTargetQuantity"))
                writer.uint32(/* id 3, wireType 0 =*/24).int32(message.resourceTargetQuantity);
            if (message.completedCountRequired != null && message.hasOwnProperty("completedCountRequired"))
                writer.uint32(/* id 4, wireType 0 =*/32).int32(message.completedCountRequired);
            if (message.forFailing != null && message.hasOwnProperty("forFailing"))
                writer.uint32(/* id 5, wireType 0 =*/40).int32(message.forFailing);
            return writer;
        };

        /**
         * Encodes the specified StageGoalQuest message, length delimited. Does not implicitly {@link mineralchem.StageGoalQuest.verify|verify} messages.
         * @function encodeDelimited
         * @memberof mineralchem.StageGoalQuest
         * @static
         * @param {mineralchem.StageGoalQuest} message StageGoalQuest message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        StageGoalQuest.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a StageGoalQuest message from the specified reader or buffer.
         * @function decode
         * @memberof mineralchem.StageGoalQuest
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {mineralchem.StageGoalQuest} StageGoalQuest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        StageGoalQuest.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.mineralchem.StageGoalQuest();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    message.resourceType = reader.int32();
                    break;
                case 2:
                    message.resourceTargetId = reader.int32();
                    break;
                case 3:
                    message.resourceTargetQuantity = reader.int32();
                    break;
                case 4:
                    message.completedCountRequired = reader.int32();
                    break;
                case 5:
                    message.forFailing = reader.int32();
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a StageGoalQuest message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof mineralchem.StageGoalQuest
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {mineralchem.StageGoalQuest} StageGoalQuest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        StageGoalQuest.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a StageGoalQuest message.
         * @function verify
         * @memberof mineralchem.StageGoalQuest
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        StageGoalQuest.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.resourceType != null && message.hasOwnProperty("resourceType"))
                if (!$util.isInteger(message.resourceType))
                    return "resourceType: integer expected";
            if (message.resourceTargetId != null && message.hasOwnProperty("resourceTargetId"))
                if (!$util.isInteger(message.resourceTargetId))
                    return "resourceTargetId: integer expected";
            if (message.resourceTargetQuantity != null && message.hasOwnProperty("resourceTargetQuantity"))
                if (!$util.isInteger(message.resourceTargetQuantity))
                    return "resourceTargetQuantity: integer expected";
            if (message.completedCountRequired != null && message.hasOwnProperty("completedCountRequired"))
                if (!$util.isInteger(message.completedCountRequired))
                    return "completedCountRequired: integer expected";
            if (message.forFailing != null && message.hasOwnProperty("forFailing"))
                if (!$util.isInteger(message.forFailing))
                    return "forFailing: integer expected";
            return null;
        };

        /**
         * Creates a StageGoalQuest message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof mineralchem.StageGoalQuest
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {mineralchem.StageGoalQuest} StageGoalQuest
         */
        StageGoalQuest.fromObject = function fromObject(object) {
            if (object instanceof $root.mineralchem.StageGoalQuest)
                return object;
            var message = new $root.mineralchem.StageGoalQuest();
            if (object.resourceType != null)
                message.resourceType = object.resourceType | 0;
            if (object.resourceTargetId != null)
                message.resourceTargetId = object.resourceTargetId | 0;
            if (object.resourceTargetQuantity != null)
                message.resourceTargetQuantity = object.resourceTargetQuantity | 0;
            if (object.completedCountRequired != null)
                message.completedCountRequired = object.completedCountRequired | 0;
            if (object.forFailing != null)
                message.forFailing = object.forFailing | 0;
            return message;
        };

        /**
         * Creates a plain object from a StageGoalQuest message. Also converts values to other types if specified.
         * @function toObject
         * @memberof mineralchem.StageGoalQuest
         * @static
         * @param {mineralchem.StageGoalQuest} message StageGoalQuest
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        StageGoalQuest.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            var object = {};
            if (options.defaults) {
                object.resourceType = 0;
                object.resourceTargetId = 0;
                object.resourceTargetQuantity = 0;
                object.completedCountRequired = 0;
                object.forFailing = 0;
            }
            if (message.resourceType != null && message.hasOwnProperty("resourceType"))
                object.resourceType = message.resourceType;
            if (message.resourceTargetId != null && message.hasOwnProperty("resourceTargetId"))
                object.resourceTargetId = message.resourceTargetId;
            if (message.resourceTargetQuantity != null && message.hasOwnProperty("resourceTargetQuantity"))
                object.resourceTargetQuantity = message.resourceTargetQuantity;
            if (message.completedCountRequired != null && message.hasOwnProperty("completedCountRequired"))
                object.completedCountRequired = message.completedCountRequired;
            if (message.forFailing != null && message.hasOwnProperty("forFailing"))
                object.forFailing = message.forFailing;
            return object;
        };

        /**
         * Converts this StageGoalQuest to JSON.
         * @function toJSON
         * @memberof mineralchem.StageGoalQuest
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        StageGoalQuest.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return StageGoalQuest;
    })();

    mineralchem.StageGoal = (function() {

        /**
         * Properties of a StageGoal.
         * @memberof mineralchem
         * @interface IStageGoal
         * @property {number|null} [passScore] StageGoal passScore
         * @property {number|null} [timeLimitSeconds] StageGoal timeLimitSeconds
         * @property {Array.<mineralchem.StageGoalQuest>|null} [questList] StageGoal questList
         */

        /**
         * Constructs a new StageGoal.
         * @memberof mineralchem
         * @classdesc Represents a StageGoal.
         * @implements IStageGoal
         * @constructor
         * @param {mineralchem.IStageGoal=} [properties] Properties to set
         */
        function StageGoal(properties) {
            this.questList = [];
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * StageGoal passScore.
         * @member {number} passScore
         * @memberof mineralchem.StageGoal
         * @instance
         */
        StageGoal.prototype.passScore = 0;

        /**
         * StageGoal timeLimitSeconds.
         * @member {number} timeLimitSeconds
         * @memberof mineralchem.StageGoal
         * @instance
         */
        StageGoal.prototype.timeLimitSeconds = 0;

        /**
         * StageGoal questList.
         * @member {Array.<mineralchem.StageGoalQuest>} questList
         * @memberof mineralchem.StageGoal
         * @instance
         */
        StageGoal.prototype.questList = $util.emptyArray;

        /**
         * Creates a new StageGoal instance using the specified properties.
         * @function create
         * @memberof mineralchem.StageGoal
         * @static
         * @param {mineralchem.IStageGoal=} [properties] Properties to set
         * @returns {mineralchem.StageGoal} StageGoal instance
         */
        StageGoal.create = function create(properties) {
            return new StageGoal(properties);
        };

        /**
         * Encodes the specified StageGoal message. Does not implicitly {@link mineralchem.StageGoal.verify|verify} messages.
         * @function encode
         * @memberof mineralchem.StageGoal
         * @static
         * @param {mineralchem.StageGoal} message StageGoal message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        StageGoal.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.passScore != null && message.hasOwnProperty("passScore"))
                writer.uint32(/* id 1, wireType 0 =*/8).int32(message.passScore);
            if (message.timeLimitSeconds != null && message.hasOwnProperty("timeLimitSeconds"))
                writer.uint32(/* id 2, wireType 0 =*/16).int32(message.timeLimitSeconds);
            if (message.questList != null && message.questList.length)
                for (var i = 0; i < message.questList.length; ++i)
                    $root.mineralchem.StageGoalQuest.encode(message.questList[i], writer.uint32(/* id 3, wireType 2 =*/26).fork()).ldelim();
            return writer;
        };

        /**
         * Encodes the specified StageGoal message, length delimited. Does not implicitly {@link mineralchem.StageGoal.verify|verify} messages.
         * @function encodeDelimited
         * @memberof mineralchem.StageGoal
         * @static
         * @param {mineralchem.StageGoal} message StageGoal message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        StageGoal.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a StageGoal message from the specified reader or buffer.
         * @function decode
         * @memberof mineralchem.StageGoal
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {mineralchem.StageGoal} StageGoal
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        StageGoal.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.mineralchem.StageGoal();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    message.passScore = reader.int32();
                    break;
                case 2:
                    message.timeLimitSeconds = reader.int32();
                    break;
                case 3:
                    if (!(message.questList && message.questList.length))
                        message.questList = [];
                    message.questList.push($root.mineralchem.StageGoalQuest.decode(reader, reader.uint32()));
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a StageGoal message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof mineralchem.StageGoal
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {mineralchem.StageGoal} StageGoal
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        StageGoal.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a StageGoal message.
         * @function verify
         * @memberof mineralchem.StageGoal
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        StageGoal.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.passScore != null && message.hasOwnProperty("passScore"))
                if (!$util.isInteger(message.passScore))
                    return "passScore: integer expected";
            if (message.timeLimitSeconds != null && message.hasOwnProperty("timeLimitSeconds"))
                if (!$util.isInteger(message.timeLimitSeconds))
                    return "timeLimitSeconds: integer expected";
            if (message.questList != null && message.hasOwnProperty("questList")) {
                if (!Array.isArray(message.questList))
                    return "questList: array expected";
                for (var i = 0; i < message.questList.length; ++i) {
                    var error = $root.mineralchem.StageGoalQuest.verify(message.questList[i]);
                    if (error)
                        return "questList." + error;
                }
            }
            return null;
        };

        /**
         * Creates a StageGoal message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof mineralchem.StageGoal
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {mineralchem.StageGoal} StageGoal
         */
        StageGoal.fromObject = function fromObject(object) {
            if (object instanceof $root.mineralchem.StageGoal)
                return object;
            var message = new $root.mineralchem.StageGoal();
            if (object.passScore != null)
                message.passScore = object.passScore | 0;
            if (object.timeLimitSeconds != null)
                message.timeLimitSeconds = object.timeLimitSeconds | 0;
            if (object.questList) {
                if (!Array.isArray(object.questList))
                    throw TypeError(".mineralchem.StageGoal.questList: array expected");
                message.questList = [];
                for (var i = 0; i < object.questList.length; ++i) {
                    if (typeof object.questList[i] !== "object")
                        throw TypeError(".mineralchem.StageGoal.questList: object expected");
                    message.questList[i] = $root.mineralchem.StageGoalQuest.fromObject(object.questList[i]);
                }
            }
            return message;
        };

        /**
         * Creates a plain object from a StageGoal message. Also converts values to other types if specified.
         * @function toObject
         * @memberof mineralchem.StageGoal
         * @static
         * @param {mineralchem.StageGoal} message StageGoal
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        StageGoal.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            var object = {};
            if (options.arrays || options.defaults)
                object.questList = [];
            if (options.defaults) {
                object.passScore = 0;
                object.timeLimitSeconds = 0;
            }
            if (message.passScore != null && message.hasOwnProperty("passScore"))
                object.passScore = message.passScore;
            if (message.timeLimitSeconds != null && message.hasOwnProperty("timeLimitSeconds"))
                object.timeLimitSeconds = message.timeLimitSeconds;
            if (message.questList && message.questList.length) {
                object.questList = [];
                for (var j = 0; j < message.questList.length; ++j)
                    object.questList[j] = $root.mineralchem.StageGoalQuest.toObject(message.questList[j], options);
            }
            return object;
        };

        /**
         * Converts this StageGoal to JSON.
         * @function toJSON
         * @memberof mineralchem.StageGoal
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        StageGoal.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return StageGoal;
    })();

    mineralchem.AttackWave = (function() {

        /**
         * Properties of an AttackWave.
         * @memberof mineralchem
         * @interface IAttackWave
         * @property {number|null} [millisFromStart] AttackWave millisFromStart
         * @property {Object.<string,number>|null} [speciesCount] AttackWave speciesCount
         */

        /**
         * Constructs a new AttackWave.
         * @memberof mineralchem
         * @classdesc Represents an AttackWave.
         * @implements IAttackWave
         * @constructor
         * @param {mineralchem.IAttackWave=} [properties] Properties to set
         */
        function AttackWave(properties) {
            this.speciesCount = {};
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * AttackWave millisFromStart.
         * @member {number} millisFromStart
         * @memberof mineralchem.AttackWave
         * @instance
         */
        AttackWave.prototype.millisFromStart = 0;

        /**
         * AttackWave speciesCount.
         * @member {Object.<string,number>} speciesCount
         * @memberof mineralchem.AttackWave
         * @instance
         */
        AttackWave.prototype.speciesCount = $util.emptyObject;

        /**
         * Creates a new AttackWave instance using the specified properties.
         * @function create
         * @memberof mineralchem.AttackWave
         * @static
         * @param {mineralchem.IAttackWave=} [properties] Properties to set
         * @returns {mineralchem.AttackWave} AttackWave instance
         */
        AttackWave.create = function create(properties) {
            return new AttackWave(properties);
        };

        /**
         * Encodes the specified AttackWave message. Does not implicitly {@link mineralchem.AttackWave.verify|verify} messages.
         * @function encode
         * @memberof mineralchem.AttackWave
         * @static
         * @param {mineralchem.AttackWave} message AttackWave message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        AttackWave.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.millisFromStart != null && message.hasOwnProperty("millisFromStart"))
                writer.uint32(/* id 1, wireType 0 =*/8).int32(message.millisFromStart);
            if (message.speciesCount != null && message.hasOwnProperty("speciesCount"))
                for (var keys = Object.keys(message.speciesCount), i = 0; i < keys.length; ++i)
                    writer.uint32(/* id 2, wireType 2 =*/18).fork().uint32(/* id 1, wireType 2 =*/10).string(keys[i]).uint32(/* id 2, wireType 0 =*/16).int32(message.speciesCount[keys[i]]).ldelim();
            return writer;
        };

        /**
         * Encodes the specified AttackWave message, length delimited. Does not implicitly {@link mineralchem.AttackWave.verify|verify} messages.
         * @function encodeDelimited
         * @memberof mineralchem.AttackWave
         * @static
         * @param {mineralchem.AttackWave} message AttackWave message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        AttackWave.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes an AttackWave message from the specified reader or buffer.
         * @function decode
         * @memberof mineralchem.AttackWave
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {mineralchem.AttackWave} AttackWave
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        AttackWave.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.mineralchem.AttackWave(), key;
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    message.millisFromStart = reader.int32();
                    break;
                case 2:
                    reader.skip().pos++;
                    if (message.speciesCount === $util.emptyObject)
                        message.speciesCount = {};
                    key = reader.string();
                    reader.pos++;
                    message.speciesCount[key] = reader.int32();
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes an AttackWave message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof mineralchem.AttackWave
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {mineralchem.AttackWave} AttackWave
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        AttackWave.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies an AttackWave message.
         * @function verify
         * @memberof mineralchem.AttackWave
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        AttackWave.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.millisFromStart != null && message.hasOwnProperty("millisFromStart"))
                if (!$util.isInteger(message.millisFromStart))
                    return "millisFromStart: integer expected";
            if (message.speciesCount != null && message.hasOwnProperty("speciesCount")) {
                if (!$util.isObject(message.speciesCount))
                    return "speciesCount: object expected";
                var key = Object.keys(message.speciesCount);
                for (var i = 0; i < key.length; ++i)
                    if (!$util.isInteger(message.speciesCount[key[i]]))
                        return "speciesCount: integer{k:string} expected";
            }
            return null;
        };

        /**
         * Creates an AttackWave message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof mineralchem.AttackWave
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {mineralchem.AttackWave} AttackWave
         */
        AttackWave.fromObject = function fromObject(object) {
            if (object instanceof $root.mineralchem.AttackWave)
                return object;
            var message = new $root.mineralchem.AttackWave();
            if (object.millisFromStart != null)
                message.millisFromStart = object.millisFromStart | 0;
            if (object.speciesCount) {
                if (typeof object.speciesCount !== "object")
                    throw TypeError(".mineralchem.AttackWave.speciesCount: object expected");
                message.speciesCount = {};
                for (var keys = Object.keys(object.speciesCount), i = 0; i < keys.length; ++i)
                    message.speciesCount[keys[i]] = object.speciesCount[keys[i]] | 0;
            }
            return message;
        };

        /**
         * Creates a plain object from an AttackWave message. Also converts values to other types if specified.
         * @function toObject
         * @memberof mineralchem.AttackWave
         * @static
         * @param {mineralchem.AttackWave} message AttackWave
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        AttackWave.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            var object = {};
            if (options.objects || options.defaults)
                object.speciesCount = {};
            if (options.defaults)
                object.millisFromStart = 0;
            if (message.millisFromStart != null && message.hasOwnProperty("millisFromStart"))
                object.millisFromStart = message.millisFromStart;
            var keys2;
            if (message.speciesCount && (keys2 = Object.keys(message.speciesCount)).length) {
                object.speciesCount = {};
                for (var j = 0; j < keys2.length; ++j)
                    object.speciesCount[keys2[j]] = message.speciesCount[keys2[j]];
            }
            return object;
        };

        /**
         * Converts this AttackWave to JSON.
         * @function toJSON
         * @memberof mineralchem.AttackWave
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        AttackWave.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return AttackWave;
    })();

    mineralchem.GuardSoldier = (function() {

        /**
         * Properties of a GuardSoldier.
         * @memberof mineralchem
         * @interface IGuardSoldier
         * @property {string|null} [species] GuardSoldier species
         * @property {number|null} [tileDiscretePositionX] GuardSoldier tileDiscretePositionX
         * @property {number|null} [tileDiscretePositionY] GuardSoldier tileDiscretePositionY
         * @property {number|null} [teamId] GuardSoldier teamId
         */

        /**
         * Constructs a new GuardSoldier.
         * @memberof mineralchem
         * @classdesc Represents a GuardSoldier.
         * @implements IGuardSoldier
         * @constructor
         * @param {mineralchem.IGuardSoldier=} [properties] Properties to set
         */
        function GuardSoldier(properties) {
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * GuardSoldier species.
         * @member {string} species
         * @memberof mineralchem.GuardSoldier
         * @instance
         */
        GuardSoldier.prototype.species = "";

        /**
         * GuardSoldier tileDiscretePositionX.
         * @member {number} tileDiscretePositionX
         * @memberof mineralchem.GuardSoldier
         * @instance
         */
        GuardSoldier.prototype.tileDiscretePositionX = 0;

        /**
         * GuardSoldier tileDiscretePositionY.
         * @member {number} tileDiscretePositionY
         * @memberof mineralchem.GuardSoldier
         * @instance
         */
        GuardSoldier.prototype.tileDiscretePositionY = 0;

        /**
         * GuardSoldier teamId.
         * @member {number} teamId
         * @memberof mineralchem.GuardSoldier
         * @instance
         */
        GuardSoldier.prototype.teamId = 0;

        /**
         * Creates a new GuardSoldier instance using the specified properties.
         * @function create
         * @memberof mineralchem.GuardSoldier
         * @static
         * @param {mineralchem.IGuardSoldier=} [properties] Properties to set
         * @returns {mineralchem.GuardSoldier} GuardSoldier instance
         */
        GuardSoldier.create = function create(properties) {
            return new GuardSoldier(properties);
        };

        /**
         * Encodes the specified GuardSoldier message. Does not implicitly {@link mineralchem.GuardSoldier.verify|verify} messages.
         * @function encode
         * @memberof mineralchem.GuardSoldier
         * @static
         * @param {mineralchem.GuardSoldier} message GuardSoldier message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        GuardSoldier.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.species != null && message.hasOwnProperty("species"))
                writer.uint32(/* id 1, wireType 2 =*/10).string(message.species);
            if (message.tileDiscretePositionX != null && message.hasOwnProperty("tileDiscretePositionX"))
                writer.uint32(/* id 2, wireType 0 =*/16).int32(message.tileDiscretePositionX);
            if (message.tileDiscretePositionY != null && message.hasOwnProperty("tileDiscretePositionY"))
                writer.uint32(/* id 3, wireType 0 =*/24).int32(message.tileDiscretePositionY);
            if (message.teamId != null && message.hasOwnProperty("teamId"))
                writer.uint32(/* id 4, wireType 0 =*/32).int32(message.teamId);
            return writer;
        };

        /**
         * Encodes the specified GuardSoldier message, length delimited. Does not implicitly {@link mineralchem.GuardSoldier.verify|verify} messages.
         * @function encodeDelimited
         * @memberof mineralchem.GuardSoldier
         * @static
         * @param {mineralchem.GuardSoldier} message GuardSoldier message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        GuardSoldier.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a GuardSoldier message from the specified reader or buffer.
         * @function decode
         * @memberof mineralchem.GuardSoldier
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {mineralchem.GuardSoldier} GuardSoldier
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        GuardSoldier.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.mineralchem.GuardSoldier();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    message.species = reader.string();
                    break;
                case 2:
                    message.tileDiscretePositionX = reader.int32();
                    break;
                case 3:
                    message.tileDiscretePositionY = reader.int32();
                    break;
                case 4:
                    message.teamId = reader.int32();
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a GuardSoldier message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof mineralchem.GuardSoldier
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {mineralchem.GuardSoldier} GuardSoldier
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        GuardSoldier.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a GuardSoldier message.
         * @function verify
         * @memberof mineralchem.GuardSoldier
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        GuardSoldier.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.species != null && message.hasOwnProperty("species"))
                if (!$util.isString(message.species))
                    return "species: string expected";
            if (message.tileDiscretePositionX != null && message.hasOwnProperty("tileDiscretePositionX"))
                if (!$util.isInteger(message.tileDiscretePositionX))
                    return "tileDiscretePositionX: integer expected";
            if (message.tileDiscretePositionY != null && message.hasOwnProperty("tileDiscretePositionY"))
                if (!$util.isInteger(message.tileDiscretePositionY))
                    return "tileDiscretePositionY: integer expected";
            if (message.teamId != null && message.hasOwnProperty("teamId"))
                if (!$util.isInteger(message.teamId))
                    return "teamId: integer expected";
            return null;
        };

        /**
         * Creates a GuardSoldier message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof mineralchem.GuardSoldier
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {mineralchem.GuardSoldier} GuardSoldier
         */
        GuardSoldier.fromObject = function fromObject(object) {
            if (object instanceof $root.mineralchem.GuardSoldier)
                return object;
            var message = new $root.mineralchem.GuardSoldier();
            if (object.species != null)
                message.species = String(object.species);
            if (object.tileDiscretePositionX != null)
                message.tileDiscretePositionX = object.tileDiscretePositionX | 0;
            if (object.tileDiscretePositionY != null)
                message.tileDiscretePositionY = object.tileDiscretePositionY | 0;
            if (object.teamId != null)
                message.teamId = object.teamId | 0;
            return message;
        };

        /**
         * Creates a plain object from a GuardSoldier message. Also converts values to other types if specified.
         * @function toObject
         * @memberof mineralchem.GuardSoldier
         * @static
         * @param {mineralchem.GuardSoldier} message GuardSoldier
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        GuardSoldier.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            var object = {};
            if (options.defaults) {
                object.species = "";
                object.tileDiscretePositionX = 0;
                object.tileDiscretePositionY = 0;
                object.teamId = 0;
            }
            if (message.species != null && message.hasOwnProperty("species"))
                object.species = message.species;
            if (message.tileDiscretePositionX != null && message.hasOwnProperty("tileDiscretePositionX"))
                object.tileDiscretePositionX = message.tileDiscretePositionX;
            if (message.tileDiscretePositionY != null && message.hasOwnProperty("tileDiscretePositionY"))
                object.tileDiscretePositionY = message.tileDiscretePositionY;
            if (message.teamId != null && message.hasOwnProperty("teamId"))
                object.teamId = message.teamId;
            return object;
        };

        /**
         * Converts this GuardSoldier to JSON.
         * @function toJSON
         * @memberof mineralchem.GuardSoldier
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        GuardSoldier.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return GuardSoldier;
    })();

    mineralchem.StageInitialState = (function() {

        /**
         * Properties of a StageInitialState.
         * @memberof mineralchem
         * @interface IStageInitialState
         * @property {number|null} [stageId] StageInitialState stageId
         * @property {Array.<mineralchem.Knapsack>|null} [knapsack] StageInitialState knapsack
         * @property {Array.<mineralchem.PlayerRecipe>|null} [playerRecipeList] StageInitialState playerRecipeList
         * @property {Array.<mineralchem.StageBuildableLevelBinding>|null} [stageBuildableLevelBindingList] StageInitialState stageBuildableLevelBindingList
         * @property {mineralchem.SyncDataStruct|null} [syncData] StageInitialState syncData
         * @property {mineralchem.StageGoal|null} [goal] StageInitialState goal
         * @property {number|null} [diamondPrice] StageInitialState diamondPrice
         * @property {number|null} [starPrice] StageInitialState starPrice
         * @property {Array.<mineralchem.AttackWave>|null} [attackWaveList] StageInitialState attackWaveList
         * @property {Array.<mineralchem.GuardSoldier>|null} [guardSoldierList] StageInitialState guardSoldierList
         * @property {number|null} [ticketPrice] StageInitialState ticketPrice
         */

        /**
         * Constructs a new StageInitialState.
         * @memberof mineralchem
         * @classdesc Represents a StageInitialState.
         * @implements IStageInitialState
         * @constructor
         * @param {mineralchem.IStageInitialState=} [properties] Properties to set
         */
        function StageInitialState(properties) {
            this.knapsack = [];
            this.playerRecipeList = [];
            this.stageBuildableLevelBindingList = [];
            this.attackWaveList = [];
            this.guardSoldierList = [];
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * StageInitialState stageId.
         * @member {number} stageId
         * @memberof mineralchem.StageInitialState
         * @instance
         */
        StageInitialState.prototype.stageId = 0;

        /**
         * StageInitialState knapsack.
         * @member {Array.<mineralchem.Knapsack>} knapsack
         * @memberof mineralchem.StageInitialState
         * @instance
         */
        StageInitialState.prototype.knapsack = $util.emptyArray;

        /**
         * StageInitialState playerRecipeList.
         * @member {Array.<mineralchem.PlayerRecipe>} playerRecipeList
         * @memberof mineralchem.StageInitialState
         * @instance
         */
        StageInitialState.prototype.playerRecipeList = $util.emptyArray;

        /**
         * StageInitialState stageBuildableLevelBindingList.
         * @member {Array.<mineralchem.StageBuildableLevelBinding>} stageBuildableLevelBindingList
         * @memberof mineralchem.StageInitialState
         * @instance
         */
        StageInitialState.prototype.stageBuildableLevelBindingList = $util.emptyArray;

        /**
         * StageInitialState syncData.
         * @member {mineralchem.SyncDataStruct|null|undefined} syncData
         * @memberof mineralchem.StageInitialState
         * @instance
         */
        StageInitialState.prototype.syncData = null;

        /**
         * StageInitialState goal.
         * @member {mineralchem.StageGoal|null|undefined} goal
         * @memberof mineralchem.StageInitialState
         * @instance
         */
        StageInitialState.prototype.goal = null;

        /**
         * StageInitialState diamondPrice.
         * @member {number} diamondPrice
         * @memberof mineralchem.StageInitialState
         * @instance
         */
        StageInitialState.prototype.diamondPrice = 0;

        /**
         * StageInitialState starPrice.
         * @member {number} starPrice
         * @memberof mineralchem.StageInitialState
         * @instance
         */
        StageInitialState.prototype.starPrice = 0;

        /**
         * StageInitialState attackWaveList.
         * @member {Array.<mineralchem.AttackWave>} attackWaveList
         * @memberof mineralchem.StageInitialState
         * @instance
         */
        StageInitialState.prototype.attackWaveList = $util.emptyArray;

        /**
         * StageInitialState guardSoldierList.
         * @member {Array.<mineralchem.GuardSoldier>} guardSoldierList
         * @memberof mineralchem.StageInitialState
         * @instance
         */
        StageInitialState.prototype.guardSoldierList = $util.emptyArray;

        /**
         * StageInitialState ticketPrice.
         * @member {number} ticketPrice
         * @memberof mineralchem.StageInitialState
         * @instance
         */
        StageInitialState.prototype.ticketPrice = 0;

        /**
         * Creates a new StageInitialState instance using the specified properties.
         * @function create
         * @memberof mineralchem.StageInitialState
         * @static
         * @param {mineralchem.IStageInitialState=} [properties] Properties to set
         * @returns {mineralchem.StageInitialState} StageInitialState instance
         */
        StageInitialState.create = function create(properties) {
            return new StageInitialState(properties);
        };

        /**
         * Encodes the specified StageInitialState message. Does not implicitly {@link mineralchem.StageInitialState.verify|verify} messages.
         * @function encode
         * @memberof mineralchem.StageInitialState
         * @static
         * @param {mineralchem.StageInitialState} message StageInitialState message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        StageInitialState.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.stageId != null && message.hasOwnProperty("stageId"))
                writer.uint32(/* id 1, wireType 0 =*/8).int32(message.stageId);
            if (message.knapsack != null && message.knapsack.length)
                for (var i = 0; i < message.knapsack.length; ++i)
                    $root.mineralchem.Knapsack.encode(message.knapsack[i], writer.uint32(/* id 2, wireType 2 =*/18).fork()).ldelim();
            if (message.playerRecipeList != null && message.playerRecipeList.length)
                for (var i = 0; i < message.playerRecipeList.length; ++i)
                    $root.mineralchem.PlayerRecipe.encode(message.playerRecipeList[i], writer.uint32(/* id 3, wireType 2 =*/26).fork()).ldelim();
            if (message.stageBuildableLevelBindingList != null && message.stageBuildableLevelBindingList.length)
                for (var i = 0; i < message.stageBuildableLevelBindingList.length; ++i)
                    $root.mineralchem.StageBuildableLevelBinding.encode(message.stageBuildableLevelBindingList[i], writer.uint32(/* id 4, wireType 2 =*/34).fork()).ldelim();
            if (message.syncData != null && message.hasOwnProperty("syncData"))
                $root.mineralchem.SyncDataStruct.encode(message.syncData, writer.uint32(/* id 5, wireType 2 =*/42).fork()).ldelim();
            if (message.goal != null && message.hasOwnProperty("goal"))
                $root.mineralchem.StageGoal.encode(message.goal, writer.uint32(/* id 6, wireType 2 =*/50).fork()).ldelim();
            if (message.diamondPrice != null && message.hasOwnProperty("diamondPrice"))
                writer.uint32(/* id 7, wireType 0 =*/56).int32(message.diamondPrice);
            if (message.starPrice != null && message.hasOwnProperty("starPrice"))
                writer.uint32(/* id 8, wireType 0 =*/64).int32(message.starPrice);
            if (message.attackWaveList != null && message.attackWaveList.length)
                for (var i = 0; i < message.attackWaveList.length; ++i)
                    $root.mineralchem.AttackWave.encode(message.attackWaveList[i], writer.uint32(/* id 9, wireType 2 =*/74).fork()).ldelim();
            if (message.guardSoldierList != null && message.guardSoldierList.length)
                for (var i = 0; i < message.guardSoldierList.length; ++i)
                    $root.mineralchem.GuardSoldier.encode(message.guardSoldierList[i], writer.uint32(/* id 10, wireType 2 =*/82).fork()).ldelim();
            if (message.ticketPrice != null && message.hasOwnProperty("ticketPrice"))
                writer.uint32(/* id 11, wireType 0 =*/88).int32(message.ticketPrice);
            return writer;
        };

        /**
         * Encodes the specified StageInitialState message, length delimited. Does not implicitly {@link mineralchem.StageInitialState.verify|verify} messages.
         * @function encodeDelimited
         * @memberof mineralchem.StageInitialState
         * @static
         * @param {mineralchem.StageInitialState} message StageInitialState message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        StageInitialState.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a StageInitialState message from the specified reader or buffer.
         * @function decode
         * @memberof mineralchem.StageInitialState
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {mineralchem.StageInitialState} StageInitialState
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        StageInitialState.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.mineralchem.StageInitialState();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    message.stageId = reader.int32();
                    break;
                case 2:
                    if (!(message.knapsack && message.knapsack.length))
                        message.knapsack = [];
                    message.knapsack.push($root.mineralchem.Knapsack.decode(reader, reader.uint32()));
                    break;
                case 3:
                    if (!(message.playerRecipeList && message.playerRecipeList.length))
                        message.playerRecipeList = [];
                    message.playerRecipeList.push($root.mineralchem.PlayerRecipe.decode(reader, reader.uint32()));
                    break;
                case 4:
                    if (!(message.stageBuildableLevelBindingList && message.stageBuildableLevelBindingList.length))
                        message.stageBuildableLevelBindingList = [];
                    message.stageBuildableLevelBindingList.push($root.mineralchem.StageBuildableLevelBinding.decode(reader, reader.uint32()));
                    break;
                case 5:
                    message.syncData = $root.mineralchem.SyncDataStruct.decode(reader, reader.uint32());
                    break;
                case 6:
                    message.goal = $root.mineralchem.StageGoal.decode(reader, reader.uint32());
                    break;
                case 7:
                    message.diamondPrice = reader.int32();
                    break;
                case 8:
                    message.starPrice = reader.int32();
                    break;
                case 9:
                    if (!(message.attackWaveList && message.attackWaveList.length))
                        message.attackWaveList = [];
                    message.attackWaveList.push($root.mineralchem.AttackWave.decode(reader, reader.uint32()));
                    break;
                case 10:
                    if (!(message.guardSoldierList && message.guardSoldierList.length))
                        message.guardSoldierList = [];
                    message.guardSoldierList.push($root.mineralchem.GuardSoldier.decode(reader, reader.uint32()));
                    break;
                case 11:
                    message.ticketPrice = reader.int32();
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a StageInitialState message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof mineralchem.StageInitialState
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {mineralchem.StageInitialState} StageInitialState
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        StageInitialState.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a StageInitialState message.
         * @function verify
         * @memberof mineralchem.StageInitialState
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        StageInitialState.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.stageId != null && message.hasOwnProperty("stageId"))
                if (!$util.isInteger(message.stageId))
                    return "stageId: integer expected";
            if (message.knapsack != null && message.hasOwnProperty("knapsack")) {
                if (!Array.isArray(message.knapsack))
                    return "knapsack: array expected";
                for (var i = 0; i < message.knapsack.length; ++i) {
                    var error = $root.mineralchem.Knapsack.verify(message.knapsack[i]);
                    if (error)
                        return "knapsack." + error;
                }
            }
            if (message.playerRecipeList != null && message.hasOwnProperty("playerRecipeList")) {
                if (!Array.isArray(message.playerRecipeList))
                    return "playerRecipeList: array expected";
                for (var i = 0; i < message.playerRecipeList.length; ++i) {
                    var error = $root.mineralchem.PlayerRecipe.verify(message.playerRecipeList[i]);
                    if (error)
                        return "playerRecipeList." + error;
                }
            }
            if (message.stageBuildableLevelBindingList != null && message.hasOwnProperty("stageBuildableLevelBindingList")) {
                if (!Array.isArray(message.stageBuildableLevelBindingList))
                    return "stageBuildableLevelBindingList: array expected";
                for (var i = 0; i < message.stageBuildableLevelBindingList.length; ++i) {
                    var error = $root.mineralchem.StageBuildableLevelBinding.verify(message.stageBuildableLevelBindingList[i]);
                    if (error)
                        return "stageBuildableLevelBindingList." + error;
                }
            }
            if (message.syncData != null && message.hasOwnProperty("syncData")) {
                var error = $root.mineralchem.SyncDataStruct.verify(message.syncData);
                if (error)
                    return "syncData." + error;
            }
            if (message.goal != null && message.hasOwnProperty("goal")) {
                var error = $root.mineralchem.StageGoal.verify(message.goal);
                if (error)
                    return "goal." + error;
            }
            if (message.diamondPrice != null && message.hasOwnProperty("diamondPrice"))
                if (!$util.isInteger(message.diamondPrice))
                    return "diamondPrice: integer expected";
            if (message.starPrice != null && message.hasOwnProperty("starPrice"))
                if (!$util.isInteger(message.starPrice))
                    return "starPrice: integer expected";
            if (message.attackWaveList != null && message.hasOwnProperty("attackWaveList")) {
                if (!Array.isArray(message.attackWaveList))
                    return "attackWaveList: array expected";
                for (var i = 0; i < message.attackWaveList.length; ++i) {
                    var error = $root.mineralchem.AttackWave.verify(message.attackWaveList[i]);
                    if (error)
                        return "attackWaveList." + error;
                }
            }
            if (message.guardSoldierList != null && message.hasOwnProperty("guardSoldierList")) {
                if (!Array.isArray(message.guardSoldierList))
                    return "guardSoldierList: array expected";
                for (var i = 0; i < message.guardSoldierList.length; ++i) {
                    var error = $root.mineralchem.GuardSoldier.verify(message.guardSoldierList[i]);
                    if (error)
                        return "guardSoldierList." + error;
                }
            }
            if (message.ticketPrice != null && message.hasOwnProperty("ticketPrice"))
                if (!$util.isInteger(message.ticketPrice))
                    return "ticketPrice: integer expected";
            return null;
        };

        /**
         * Creates a StageInitialState message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof mineralchem.StageInitialState
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {mineralchem.StageInitialState} StageInitialState
         */
        StageInitialState.fromObject = function fromObject(object) {
            if (object instanceof $root.mineralchem.StageInitialState)
                return object;
            var message = new $root.mineralchem.StageInitialState();
            if (object.stageId != null)
                message.stageId = object.stageId | 0;
            if (object.knapsack) {
                if (!Array.isArray(object.knapsack))
                    throw TypeError(".mineralchem.StageInitialState.knapsack: array expected");
                message.knapsack = [];
                for (var i = 0; i < object.knapsack.length; ++i) {
                    if (typeof object.knapsack[i] !== "object")
                        throw TypeError(".mineralchem.StageInitialState.knapsack: object expected");
                    message.knapsack[i] = $root.mineralchem.Knapsack.fromObject(object.knapsack[i]);
                }
            }
            if (object.playerRecipeList) {
                if (!Array.isArray(object.playerRecipeList))
                    throw TypeError(".mineralchem.StageInitialState.playerRecipeList: array expected");
                message.playerRecipeList = [];
                for (var i = 0; i < object.playerRecipeList.length; ++i) {
                    if (typeof object.playerRecipeList[i] !== "object")
                        throw TypeError(".mineralchem.StageInitialState.playerRecipeList: object expected");
                    message.playerRecipeList[i] = $root.mineralchem.PlayerRecipe.fromObject(object.playerRecipeList[i]);
                }
            }
            if (object.stageBuildableLevelBindingList) {
                if (!Array.isArray(object.stageBuildableLevelBindingList))
                    throw TypeError(".mineralchem.StageInitialState.stageBuildableLevelBindingList: array expected");
                message.stageBuildableLevelBindingList = [];
                for (var i = 0; i < object.stageBuildableLevelBindingList.length; ++i) {
                    if (typeof object.stageBuildableLevelBindingList[i] !== "object")
                        throw TypeError(".mineralchem.StageInitialState.stageBuildableLevelBindingList: object expected");
                    message.stageBuildableLevelBindingList[i] = $root.mineralchem.StageBuildableLevelBinding.fromObject(object.stageBuildableLevelBindingList[i]);
                }
            }
            if (object.syncData != null) {
                if (typeof object.syncData !== "object")
                    throw TypeError(".mineralchem.StageInitialState.syncData: object expected");
                message.syncData = $root.mineralchem.SyncDataStruct.fromObject(object.syncData);
            }
            if (object.goal != null) {
                if (typeof object.goal !== "object")
                    throw TypeError(".mineralchem.StageInitialState.goal: object expected");
                message.goal = $root.mineralchem.StageGoal.fromObject(object.goal);
            }
            if (object.diamondPrice != null)
                message.diamondPrice = object.diamondPrice | 0;
            if (object.starPrice != null)
                message.starPrice = object.starPrice | 0;
            if (object.attackWaveList) {
                if (!Array.isArray(object.attackWaveList))
                    throw TypeError(".mineralchem.StageInitialState.attackWaveList: array expected");
                message.attackWaveList = [];
                for (var i = 0; i < object.attackWaveList.length; ++i) {
                    if (typeof object.attackWaveList[i] !== "object")
                        throw TypeError(".mineralchem.StageInitialState.attackWaveList: object expected");
                    message.attackWaveList[i] = $root.mineralchem.AttackWave.fromObject(object.attackWaveList[i]);
                }
            }
            if (object.guardSoldierList) {
                if (!Array.isArray(object.guardSoldierList))
                    throw TypeError(".mineralchem.StageInitialState.guardSoldierList: array expected");
                message.guardSoldierList = [];
                for (var i = 0; i < object.guardSoldierList.length; ++i) {
                    if (typeof object.guardSoldierList[i] !== "object")
                        throw TypeError(".mineralchem.StageInitialState.guardSoldierList: object expected");
                    message.guardSoldierList[i] = $root.mineralchem.GuardSoldier.fromObject(object.guardSoldierList[i]);
                }
            }
            if (object.ticketPrice != null)
                message.ticketPrice = object.ticketPrice | 0;
            return message;
        };

        /**
         * Creates a plain object from a StageInitialState message. Also converts values to other types if specified.
         * @function toObject
         * @memberof mineralchem.StageInitialState
         * @static
         * @param {mineralchem.StageInitialState} message StageInitialState
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        StageInitialState.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            var object = {};
            if (options.arrays || options.defaults) {
                object.knapsack = [];
                object.playerRecipeList = [];
                object.stageBuildableLevelBindingList = [];
                object.attackWaveList = [];
                object.guardSoldierList = [];
            }
            if (options.defaults) {
                object.stageId = 0;
                object.syncData = null;
                object.goal = null;
                object.diamondPrice = 0;
                object.starPrice = 0;
                object.ticketPrice = 0;
            }
            if (message.stageId != null && message.hasOwnProperty("stageId"))
                object.stageId = message.stageId;
            if (message.knapsack && message.knapsack.length) {
                object.knapsack = [];
                for (var j = 0; j < message.knapsack.length; ++j)
                    object.knapsack[j] = $root.mineralchem.Knapsack.toObject(message.knapsack[j], options);
            }
            if (message.playerRecipeList && message.playerRecipeList.length) {
                object.playerRecipeList = [];
                for (var j = 0; j < message.playerRecipeList.length; ++j)
                    object.playerRecipeList[j] = $root.mineralchem.PlayerRecipe.toObject(message.playerRecipeList[j], options);
            }
            if (message.stageBuildableLevelBindingList && message.stageBuildableLevelBindingList.length) {
                object.stageBuildableLevelBindingList = [];
                for (var j = 0; j < message.stageBuildableLevelBindingList.length; ++j)
                    object.stageBuildableLevelBindingList[j] = $root.mineralchem.StageBuildableLevelBinding.toObject(message.stageBuildableLevelBindingList[j], options);
            }
            if (message.syncData != null && message.hasOwnProperty("syncData"))
                object.syncData = $root.mineralchem.SyncDataStruct.toObject(message.syncData, options);
            if (message.goal != null && message.hasOwnProperty("goal"))
                object.goal = $root.mineralchem.StageGoal.toObject(message.goal, options);
            if (message.diamondPrice != null && message.hasOwnProperty("diamondPrice"))
                object.diamondPrice = message.diamondPrice;
            if (message.starPrice != null && message.hasOwnProperty("starPrice"))
                object.starPrice = message.starPrice;
            if (message.attackWaveList && message.attackWaveList.length) {
                object.attackWaveList = [];
                for (var j = 0; j < message.attackWaveList.length; ++j)
                    object.attackWaveList[j] = $root.mineralchem.AttackWave.toObject(message.attackWaveList[j], options);
            }
            if (message.guardSoldierList && message.guardSoldierList.length) {
                object.guardSoldierList = [];
                for (var j = 0; j < message.guardSoldierList.length; ++j)
                    object.guardSoldierList[j] = $root.mineralchem.GuardSoldier.toObject(message.guardSoldierList[j], options);
            }
            if (message.ticketPrice != null && message.hasOwnProperty("ticketPrice"))
                object.ticketPrice = message.ticketPrice;
            return object;
        };

        /**
         * Converts this StageInitialState to JSON.
         * @function toJSON
         * @memberof mineralchem.StageInitialState
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        StageInitialState.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return StageInitialState;
    })();

    mineralchem.GraphSuccessorList = (function() {

        /**
         * Properties of a GraphSuccessorList.
         * @memberof mineralchem
         * @interface IGraphSuccessorList
         * @property {Array.<number>|null} [listContent] GraphSuccessorList listContent
         */

        /**
         * Constructs a new GraphSuccessorList.
         * @memberof mineralchem
         * @classdesc Represents a GraphSuccessorList.
         * @implements IGraphSuccessorList
         * @constructor
         * @param {mineralchem.IGraphSuccessorList=} [properties] Properties to set
         */
        function GraphSuccessorList(properties) {
            this.listContent = [];
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * GraphSuccessorList listContent.
         * @member {Array.<number>} listContent
         * @memberof mineralchem.GraphSuccessorList
         * @instance
         */
        GraphSuccessorList.prototype.listContent = $util.emptyArray;

        /**
         * Creates a new GraphSuccessorList instance using the specified properties.
         * @function create
         * @memberof mineralchem.GraphSuccessorList
         * @static
         * @param {mineralchem.IGraphSuccessorList=} [properties] Properties to set
         * @returns {mineralchem.GraphSuccessorList} GraphSuccessorList instance
         */
        GraphSuccessorList.create = function create(properties) {
            return new GraphSuccessorList(properties);
        };

        /**
         * Encodes the specified GraphSuccessorList message. Does not implicitly {@link mineralchem.GraphSuccessorList.verify|verify} messages.
         * @function encode
         * @memberof mineralchem.GraphSuccessorList
         * @static
         * @param {mineralchem.GraphSuccessorList} message GraphSuccessorList message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        GraphSuccessorList.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.listContent != null && message.listContent.length) {
                writer.uint32(/* id 1, wireType 2 =*/10).fork();
                for (var i = 0; i < message.listContent.length; ++i)
                    writer.int32(message.listContent[i]);
                writer.ldelim();
            }
            return writer;
        };

        /**
         * Encodes the specified GraphSuccessorList message, length delimited. Does not implicitly {@link mineralchem.GraphSuccessorList.verify|verify} messages.
         * @function encodeDelimited
         * @memberof mineralchem.GraphSuccessorList
         * @static
         * @param {mineralchem.GraphSuccessorList} message GraphSuccessorList message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        GraphSuccessorList.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a GraphSuccessorList message from the specified reader or buffer.
         * @function decode
         * @memberof mineralchem.GraphSuccessorList
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {mineralchem.GraphSuccessorList} GraphSuccessorList
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        GraphSuccessorList.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.mineralchem.GraphSuccessorList();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    if (!(message.listContent && message.listContent.length))
                        message.listContent = [];
                    if ((tag & 7) === 2) {
                        var end2 = reader.uint32() + reader.pos;
                        while (reader.pos < end2)
                            message.listContent.push(reader.int32());
                    } else
                        message.listContent.push(reader.int32());
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a GraphSuccessorList message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof mineralchem.GraphSuccessorList
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {mineralchem.GraphSuccessorList} GraphSuccessorList
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        GraphSuccessorList.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a GraphSuccessorList message.
         * @function verify
         * @memberof mineralchem.GraphSuccessorList
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        GraphSuccessorList.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.listContent != null && message.hasOwnProperty("listContent")) {
                if (!Array.isArray(message.listContent))
                    return "listContent: array expected";
                for (var i = 0; i < message.listContent.length; ++i)
                    if (!$util.isInteger(message.listContent[i]))
                        return "listContent: integer[] expected";
            }
            return null;
        };

        /**
         * Creates a GraphSuccessorList message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof mineralchem.GraphSuccessorList
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {mineralchem.GraphSuccessorList} GraphSuccessorList
         */
        GraphSuccessorList.fromObject = function fromObject(object) {
            if (object instanceof $root.mineralchem.GraphSuccessorList)
                return object;
            var message = new $root.mineralchem.GraphSuccessorList();
            if (object.listContent) {
                if (!Array.isArray(object.listContent))
                    throw TypeError(".mineralchem.GraphSuccessorList.listContent: array expected");
                message.listContent = [];
                for (var i = 0; i < object.listContent.length; ++i)
                    message.listContent[i] = object.listContent[i] | 0;
            }
            return message;
        };

        /**
         * Creates a plain object from a GraphSuccessorList message. Also converts values to other types if specified.
         * @function toObject
         * @memberof mineralchem.GraphSuccessorList
         * @static
         * @param {mineralchem.GraphSuccessorList} message GraphSuccessorList
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        GraphSuccessorList.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            var object = {};
            if (options.arrays || options.defaults)
                object.listContent = [];
            if (message.listContent && message.listContent.length) {
                object.listContent = [];
                for (var j = 0; j < message.listContent.length; ++j)
                    object.listContent[j] = message.listContent[j];
            }
            return object;
        };

        /**
         * Converts this GraphSuccessorList to JSON.
         * @function toJSON
         * @memberof mineralchem.GraphSuccessorList
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        GraphSuccessorList.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return GraphSuccessorList;
    })();

    mineralchem.GraphSuccessorListDict = (function() {

        /**
         * Properties of a GraphSuccessorListDict.
         * @memberof mineralchem
         * @interface IGraphSuccessorListDict
         * @property {Object.<string,mineralchem.GraphSuccessorList>|null} [dictContent] GraphSuccessorListDict dictContent
         */

        /**
         * Constructs a new GraphSuccessorListDict.
         * @memberof mineralchem
         * @classdesc Represents a GraphSuccessorListDict.
         * @implements IGraphSuccessorListDict
         * @constructor
         * @param {mineralchem.IGraphSuccessorListDict=} [properties] Properties to set
         */
        function GraphSuccessorListDict(properties) {
            this.dictContent = {};
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * GraphSuccessorListDict dictContent.
         * @member {Object.<string,mineralchem.GraphSuccessorList>} dictContent
         * @memberof mineralchem.GraphSuccessorListDict
         * @instance
         */
        GraphSuccessorListDict.prototype.dictContent = $util.emptyObject;

        /**
         * Creates a new GraphSuccessorListDict instance using the specified properties.
         * @function create
         * @memberof mineralchem.GraphSuccessorListDict
         * @static
         * @param {mineralchem.IGraphSuccessorListDict=} [properties] Properties to set
         * @returns {mineralchem.GraphSuccessorListDict} GraphSuccessorListDict instance
         */
        GraphSuccessorListDict.create = function create(properties) {
            return new GraphSuccessorListDict(properties);
        };

        /**
         * Encodes the specified GraphSuccessorListDict message. Does not implicitly {@link mineralchem.GraphSuccessorListDict.verify|verify} messages.
         * @function encode
         * @memberof mineralchem.GraphSuccessorListDict
         * @static
         * @param {mineralchem.GraphSuccessorListDict} message GraphSuccessorListDict message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        GraphSuccessorListDict.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.dictContent != null && message.hasOwnProperty("dictContent"))
                for (var keys = Object.keys(message.dictContent), i = 0; i < keys.length; ++i) {
                    writer.uint32(/* id 1, wireType 2 =*/10).fork().uint32(/* id 1, wireType 0 =*/8).int32(keys[i]);
                    $root.mineralchem.GraphSuccessorList.encode(message.dictContent[keys[i]], writer.uint32(/* id 2, wireType 2 =*/18).fork()).ldelim().ldelim();
                }
            return writer;
        };

        /**
         * Encodes the specified GraphSuccessorListDict message, length delimited. Does not implicitly {@link mineralchem.GraphSuccessorListDict.verify|verify} messages.
         * @function encodeDelimited
         * @memberof mineralchem.GraphSuccessorListDict
         * @static
         * @param {mineralchem.GraphSuccessorListDict} message GraphSuccessorListDict message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        GraphSuccessorListDict.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a GraphSuccessorListDict message from the specified reader or buffer.
         * @function decode
         * @memberof mineralchem.GraphSuccessorListDict
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {mineralchem.GraphSuccessorListDict} GraphSuccessorListDict
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        GraphSuccessorListDict.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.mineralchem.GraphSuccessorListDict(), key;
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    reader.skip().pos++;
                    if (message.dictContent === $util.emptyObject)
                        message.dictContent = {};
                    key = reader.int32();
                    reader.pos++;
                    message.dictContent[key] = $root.mineralchem.GraphSuccessorList.decode(reader, reader.uint32());
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a GraphSuccessorListDict message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof mineralchem.GraphSuccessorListDict
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {mineralchem.GraphSuccessorListDict} GraphSuccessorListDict
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        GraphSuccessorListDict.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a GraphSuccessorListDict message.
         * @function verify
         * @memberof mineralchem.GraphSuccessorListDict
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        GraphSuccessorListDict.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.dictContent != null && message.hasOwnProperty("dictContent")) {
                if (!$util.isObject(message.dictContent))
                    return "dictContent: object expected";
                var key = Object.keys(message.dictContent);
                for (var i = 0; i < key.length; ++i) {
                    if (!$util.key32Re.test(key[i]))
                        return "dictContent: integer key{k:int32} expected";
                    {
                        var error = $root.mineralchem.GraphSuccessorList.verify(message.dictContent[key[i]]);
                        if (error)
                            return "dictContent." + error;
                    }
                }
            }
            return null;
        };

        /**
         * Creates a GraphSuccessorListDict message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof mineralchem.GraphSuccessorListDict
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {mineralchem.GraphSuccessorListDict} GraphSuccessorListDict
         */
        GraphSuccessorListDict.fromObject = function fromObject(object) {
            if (object instanceof $root.mineralchem.GraphSuccessorListDict)
                return object;
            var message = new $root.mineralchem.GraphSuccessorListDict();
            if (object.dictContent) {
                if (typeof object.dictContent !== "object")
                    throw TypeError(".mineralchem.GraphSuccessorListDict.dictContent: object expected");
                message.dictContent = {};
                for (var keys = Object.keys(object.dictContent), i = 0; i < keys.length; ++i) {
                    if (typeof object.dictContent[keys[i]] !== "object")
                        throw TypeError(".mineralchem.GraphSuccessorListDict.dictContent: object expected");
                    message.dictContent[keys[i]] = $root.mineralchem.GraphSuccessorList.fromObject(object.dictContent[keys[i]]);
                }
            }
            return message;
        };

        /**
         * Creates a plain object from a GraphSuccessorListDict message. Also converts values to other types if specified.
         * @function toObject
         * @memberof mineralchem.GraphSuccessorListDict
         * @static
         * @param {mineralchem.GraphSuccessorListDict} message GraphSuccessorListDict
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        GraphSuccessorListDict.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            var object = {};
            if (options.objects || options.defaults)
                object.dictContent = {};
            var keys2;
            if (message.dictContent && (keys2 = Object.keys(message.dictContent)).length) {
                object.dictContent = {};
                for (var j = 0; j < keys2.length; ++j)
                    object.dictContent[keys2[j]] = $root.mineralchem.GraphSuccessorList.toObject(message.dictContent[keys2[j]], options);
            }
            return object;
        };

        /**
         * Converts this GraphSuccessorListDict to JSON.
         * @function toJSON
         * @memberof mineralchem.GraphSuccessorListDict
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        GraphSuccessorListDict.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return GraphSuccessorListDict;
    })();

    mineralchem.InterruptTutorialMask = (function() {

        /**
         * Properties of an InterruptTutorialMask.
         * @memberof mineralchem
         * @interface IInterruptTutorialMask
         * @property {Object.<string,mineralchem.GraphSuccessorListDict>|null} [visitedGroups] InterruptTutorialMask visitedGroups
         */

        /**
         * Constructs a new InterruptTutorialMask.
         * @memberof mineralchem
         * @classdesc Represents an InterruptTutorialMask.
         * @implements IInterruptTutorialMask
         * @constructor
         * @param {mineralchem.IInterruptTutorialMask=} [properties] Properties to set
         */
        function InterruptTutorialMask(properties) {
            this.visitedGroups = {};
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * InterruptTutorialMask visitedGroups.
         * @member {Object.<string,mineralchem.GraphSuccessorListDict>} visitedGroups
         * @memberof mineralchem.InterruptTutorialMask
         * @instance
         */
        InterruptTutorialMask.prototype.visitedGroups = $util.emptyObject;

        /**
         * Creates a new InterruptTutorialMask instance using the specified properties.
         * @function create
         * @memberof mineralchem.InterruptTutorialMask
         * @static
         * @param {mineralchem.IInterruptTutorialMask=} [properties] Properties to set
         * @returns {mineralchem.InterruptTutorialMask} InterruptTutorialMask instance
         */
        InterruptTutorialMask.create = function create(properties) {
            return new InterruptTutorialMask(properties);
        };

        /**
         * Encodes the specified InterruptTutorialMask message. Does not implicitly {@link mineralchem.InterruptTutorialMask.verify|verify} messages.
         * @function encode
         * @memberof mineralchem.InterruptTutorialMask
         * @static
         * @param {mineralchem.InterruptTutorialMask} message InterruptTutorialMask message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        InterruptTutorialMask.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.visitedGroups != null && message.hasOwnProperty("visitedGroups"))
                for (var keys = Object.keys(message.visitedGroups), i = 0; i < keys.length; ++i) {
                    writer.uint32(/* id 1, wireType 2 =*/10).fork().uint32(/* id 1, wireType 0 =*/8).int32(keys[i]);
                    $root.mineralchem.GraphSuccessorListDict.encode(message.visitedGroups[keys[i]], writer.uint32(/* id 2, wireType 2 =*/18).fork()).ldelim().ldelim();
                }
            return writer;
        };

        /**
         * Encodes the specified InterruptTutorialMask message, length delimited. Does not implicitly {@link mineralchem.InterruptTutorialMask.verify|verify} messages.
         * @function encodeDelimited
         * @memberof mineralchem.InterruptTutorialMask
         * @static
         * @param {mineralchem.InterruptTutorialMask} message InterruptTutorialMask message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        InterruptTutorialMask.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes an InterruptTutorialMask message from the specified reader or buffer.
         * @function decode
         * @memberof mineralchem.InterruptTutorialMask
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {mineralchem.InterruptTutorialMask} InterruptTutorialMask
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        InterruptTutorialMask.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.mineralchem.InterruptTutorialMask(), key;
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    reader.skip().pos++;
                    if (message.visitedGroups === $util.emptyObject)
                        message.visitedGroups = {};
                    key = reader.int32();
                    reader.pos++;
                    message.visitedGroups[key] = $root.mineralchem.GraphSuccessorListDict.decode(reader, reader.uint32());
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes an InterruptTutorialMask message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof mineralchem.InterruptTutorialMask
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {mineralchem.InterruptTutorialMask} InterruptTutorialMask
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        InterruptTutorialMask.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies an InterruptTutorialMask message.
         * @function verify
         * @memberof mineralchem.InterruptTutorialMask
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        InterruptTutorialMask.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.visitedGroups != null && message.hasOwnProperty("visitedGroups")) {
                if (!$util.isObject(message.visitedGroups))
                    return "visitedGroups: object expected";
                var key = Object.keys(message.visitedGroups);
                for (var i = 0; i < key.length; ++i) {
                    if (!$util.key32Re.test(key[i]))
                        return "visitedGroups: integer key{k:int32} expected";
                    {
                        var error = $root.mineralchem.GraphSuccessorListDict.verify(message.visitedGroups[key[i]]);
                        if (error)
                            return "visitedGroups." + error;
                    }
                }
            }
            return null;
        };

        /**
         * Creates an InterruptTutorialMask message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof mineralchem.InterruptTutorialMask
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {mineralchem.InterruptTutorialMask} InterruptTutorialMask
         */
        InterruptTutorialMask.fromObject = function fromObject(object) {
            if (object instanceof $root.mineralchem.InterruptTutorialMask)
                return object;
            var message = new $root.mineralchem.InterruptTutorialMask();
            if (object.visitedGroups) {
                if (typeof object.visitedGroups !== "object")
                    throw TypeError(".mineralchem.InterruptTutorialMask.visitedGroups: object expected");
                message.visitedGroups = {};
                for (var keys = Object.keys(object.visitedGroups), i = 0; i < keys.length; ++i) {
                    if (typeof object.visitedGroups[keys[i]] !== "object")
                        throw TypeError(".mineralchem.InterruptTutorialMask.visitedGroups: object expected");
                    message.visitedGroups[keys[i]] = $root.mineralchem.GraphSuccessorListDict.fromObject(object.visitedGroups[keys[i]]);
                }
            }
            return message;
        };

        /**
         * Creates a plain object from an InterruptTutorialMask message. Also converts values to other types if specified.
         * @function toObject
         * @memberof mineralchem.InterruptTutorialMask
         * @static
         * @param {mineralchem.InterruptTutorialMask} message InterruptTutorialMask
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        InterruptTutorialMask.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            var object = {};
            if (options.objects || options.defaults)
                object.visitedGroups = {};
            var keys2;
            if (message.visitedGroups && (keys2 = Object.keys(message.visitedGroups)).length) {
                object.visitedGroups = {};
                for (var j = 0; j < keys2.length; ++j)
                    object.visitedGroups[keys2[j]] = $root.mineralchem.GraphSuccessorListDict.toObject(message.visitedGroups[keys2[j]], options);
            }
            return object;
        };

        /**
         * Converts this InterruptTutorialMask to JSON.
         * @function toJSON
         * @memberof mineralchem.InterruptTutorialMask
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        InterruptTutorialMask.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return InterruptTutorialMask;
    })();

    mineralchem.AccumulatedResource = (function() {

        /**
         * Properties of an AccumulatedResource.
         * @memberof mineralchem
         * @interface IAccumulatedResource
         * @property {number|null} [servedCustomer] AccumulatedResource servedCustomer
         * @property {number|null} [dishSold] AccumulatedResource dishSold
         * @property {Object.<string,number>|null} [ingredientProduced] AccumulatedResource ingredientProduced
         * @property {number|null} [freeOrderIncome] AccumulatedResource freeOrderIncome
         */

        /**
         * Constructs a new AccumulatedResource.
         * @memberof mineralchem
         * @classdesc Represents an AccumulatedResource.
         * @implements IAccumulatedResource
         * @constructor
         * @param {mineralchem.IAccumulatedResource=} [properties] Properties to set
         */
        function AccumulatedResource(properties) {
            this.ingredientProduced = {};
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * AccumulatedResource servedCustomer.
         * @member {number} servedCustomer
         * @memberof mineralchem.AccumulatedResource
         * @instance
         */
        AccumulatedResource.prototype.servedCustomer = 0;

        /**
         * AccumulatedResource dishSold.
         * @member {number} dishSold
         * @memberof mineralchem.AccumulatedResource
         * @instance
         */
        AccumulatedResource.prototype.dishSold = 0;

        /**
         * AccumulatedResource ingredientProduced.
         * @member {Object.<string,number>} ingredientProduced
         * @memberof mineralchem.AccumulatedResource
         * @instance
         */
        AccumulatedResource.prototype.ingredientProduced = $util.emptyObject;

        /**
         * AccumulatedResource freeOrderIncome.
         * @member {number} freeOrderIncome
         * @memberof mineralchem.AccumulatedResource
         * @instance
         */
        AccumulatedResource.prototype.freeOrderIncome = 0;

        /**
         * Creates a new AccumulatedResource instance using the specified properties.
         * @function create
         * @memberof mineralchem.AccumulatedResource
         * @static
         * @param {mineralchem.IAccumulatedResource=} [properties] Properties to set
         * @returns {mineralchem.AccumulatedResource} AccumulatedResource instance
         */
        AccumulatedResource.create = function create(properties) {
            return new AccumulatedResource(properties);
        };

        /**
         * Encodes the specified AccumulatedResource message. Does not implicitly {@link mineralchem.AccumulatedResource.verify|verify} messages.
         * @function encode
         * @memberof mineralchem.AccumulatedResource
         * @static
         * @param {mineralchem.AccumulatedResource} message AccumulatedResource message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        AccumulatedResource.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.servedCustomer != null && message.hasOwnProperty("servedCustomer"))
                writer.uint32(/* id 5, wireType 0 =*/40).int32(message.servedCustomer);
            if (message.dishSold != null && message.hasOwnProperty("dishSold"))
                writer.uint32(/* id 6, wireType 0 =*/48).int32(message.dishSold);
            if (message.ingredientProduced != null && message.hasOwnProperty("ingredientProduced"))
                for (var keys = Object.keys(message.ingredientProduced), i = 0; i < keys.length; ++i)
                    writer.uint32(/* id 7, wireType 2 =*/58).fork().uint32(/* id 1, wireType 0 =*/8).int32(keys[i]).uint32(/* id 2, wireType 0 =*/16).int32(message.ingredientProduced[keys[i]]).ldelim();
            if (message.freeOrderIncome != null && message.hasOwnProperty("freeOrderIncome"))
                writer.uint32(/* id 8, wireType 0 =*/64).int32(message.freeOrderIncome);
            return writer;
        };

        /**
         * Encodes the specified AccumulatedResource message, length delimited. Does not implicitly {@link mineralchem.AccumulatedResource.verify|verify} messages.
         * @function encodeDelimited
         * @memberof mineralchem.AccumulatedResource
         * @static
         * @param {mineralchem.AccumulatedResource} message AccumulatedResource message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        AccumulatedResource.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes an AccumulatedResource message from the specified reader or buffer.
         * @function decode
         * @memberof mineralchem.AccumulatedResource
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {mineralchem.AccumulatedResource} AccumulatedResource
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        AccumulatedResource.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.mineralchem.AccumulatedResource(), key;
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                case 5:
                    message.servedCustomer = reader.int32();
                    break;
                case 6:
                    message.dishSold = reader.int32();
                    break;
                case 7:
                    reader.skip().pos++;
                    if (message.ingredientProduced === $util.emptyObject)
                        message.ingredientProduced = {};
                    key = reader.int32();
                    reader.pos++;
                    message.ingredientProduced[key] = reader.int32();
                    break;
                case 8:
                    message.freeOrderIncome = reader.int32();
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes an AccumulatedResource message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof mineralchem.AccumulatedResource
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {mineralchem.AccumulatedResource} AccumulatedResource
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        AccumulatedResource.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies an AccumulatedResource message.
         * @function verify
         * @memberof mineralchem.AccumulatedResource
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        AccumulatedResource.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.servedCustomer != null && message.hasOwnProperty("servedCustomer"))
                if (!$util.isInteger(message.servedCustomer))
                    return "servedCustomer: integer expected";
            if (message.dishSold != null && message.hasOwnProperty("dishSold"))
                if (!$util.isInteger(message.dishSold))
                    return "dishSold: integer expected";
            if (message.ingredientProduced != null && message.hasOwnProperty("ingredientProduced")) {
                if (!$util.isObject(message.ingredientProduced))
                    return "ingredientProduced: object expected";
                var key = Object.keys(message.ingredientProduced);
                for (var i = 0; i < key.length; ++i) {
                    if (!$util.key32Re.test(key[i]))
                        return "ingredientProduced: integer key{k:int32} expected";
                    if (!$util.isInteger(message.ingredientProduced[key[i]]))
                        return "ingredientProduced: integer{k:int32} expected";
                }
            }
            if (message.freeOrderIncome != null && message.hasOwnProperty("freeOrderIncome"))
                if (!$util.isInteger(message.freeOrderIncome))
                    return "freeOrderIncome: integer expected";
            return null;
        };

        /**
         * Creates an AccumulatedResource message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof mineralchem.AccumulatedResource
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {mineralchem.AccumulatedResource} AccumulatedResource
         */
        AccumulatedResource.fromObject = function fromObject(object) {
            if (object instanceof $root.mineralchem.AccumulatedResource)
                return object;
            var message = new $root.mineralchem.AccumulatedResource();
            if (object.servedCustomer != null)
                message.servedCustomer = object.servedCustomer | 0;
            if (object.dishSold != null)
                message.dishSold = object.dishSold | 0;
            if (object.ingredientProduced) {
                if (typeof object.ingredientProduced !== "object")
                    throw TypeError(".mineralchem.AccumulatedResource.ingredientProduced: object expected");
                message.ingredientProduced = {};
                for (var keys = Object.keys(object.ingredientProduced), i = 0; i < keys.length; ++i)
                    message.ingredientProduced[keys[i]] = object.ingredientProduced[keys[i]] | 0;
            }
            if (object.freeOrderIncome != null)
                message.freeOrderIncome = object.freeOrderIncome | 0;
            return message;
        };

        /**
         * Creates a plain object from an AccumulatedResource message. Also converts values to other types if specified.
         * @function toObject
         * @memberof mineralchem.AccumulatedResource
         * @static
         * @param {mineralchem.AccumulatedResource} message AccumulatedResource
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        AccumulatedResource.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            var object = {};
            if (options.objects || options.defaults)
                object.ingredientProduced = {};
            if (options.defaults) {
                object.servedCustomer = 0;
                object.dishSold = 0;
                object.freeOrderIncome = 0;
            }
            if (message.servedCustomer != null && message.hasOwnProperty("servedCustomer"))
                object.servedCustomer = message.servedCustomer;
            if (message.dishSold != null && message.hasOwnProperty("dishSold"))
                object.dishSold = message.dishSold;
            var keys2;
            if (message.ingredientProduced && (keys2 = Object.keys(message.ingredientProduced)).length) {
                object.ingredientProduced = {};
                for (var j = 0; j < keys2.length; ++j)
                    object.ingredientProduced[keys2[j]] = message.ingredientProduced[keys2[j]];
            }
            if (message.freeOrderIncome != null && message.hasOwnProperty("freeOrderIncome"))
                object.freeOrderIncome = message.freeOrderIncome;
            return object;
        };

        /**
         * Converts this AccumulatedResource to JSON.
         * @function toJSON
         * @memberof mineralchem.AccumulatedResource
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        AccumulatedResource.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return AccumulatedResource;
    })();

    return mineralchem;
})();

module.exports = $root;
