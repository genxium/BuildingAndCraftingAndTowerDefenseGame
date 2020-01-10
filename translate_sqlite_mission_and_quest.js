const process = require('process');
const fs = require('fs');
const singleton = Symbol();
const singletonEnforcer = Symbol();

const sequelize = require('sequelize');

const baseAbsPath = __dirname + '/';

const cmdArgs = process.argv.slice(2);
if (3 != cmdArgs.length) {
  console.error("Please specify exactly 3 parameters as the path of the target SQLite file, where the second param must be 'zh_cn', and the third param must be 'en_us', without quotes");
  process.exit(1);
}

const fromLang = cmdArgs[1]; 
const toLang = cmdArgs[2]; 

if ("zh_cn" != fromLang || "en_us" != toLang) {
  console.error(fromLang, " -> ", toLang, " is currently not supported.");
  process.exit(1);
}

const sqliteFilePath = cmdArgs[0];
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
      logging: false, 
      dialect: 'sqlite',
      storage: sqlitePath 
    });
  }

  testConnectionAsync() {
    const instance = this;
    return instance.dbRef.authenticate();
  }
}

SQLiteManager.instance.initConnection(sqliteFilePath);

global.window = {}; // A trick to circumvent the "ReferenceError: ... is not defined" in Nodejs for variable named "window".
const zhCnScript = require('./frontend/assets/resources/i18n/zh');
const enUsScript = require('./frontend/assets/resources/i18n/en');
 
const regexList = [
  /累计接待([0-9]+)个客人/,
  /累计上菜([0-9]+)次/,
  /累计生产([0-9]+)个([\S]+)/,
  /建造([0-9]+)间([\S]+)/,
  /([\S]+)升级到lv([0-9]+)/,
  /解锁([\S]+)/,
  /累计收入([0-9]+)金币/
];

function buildableNameZhCnToEnUs(zhName) {
  for (let k in window.i18n.languages['zh'].BuildingInfo.DisplayName) {
    const candidateName = window.i18n.languages['zh'].BuildingInfo.DisplayName[k]; 
    if (candidateName == zhName) {
      enName = window.i18n.languages['en'].BuildingInfo.DisplayName[k];
      return enName;
    }
  }
  console.log("Can't find English version of ", zhName);
  return null;
}

function ingredientNameZhCnToEnUs(zhName) {
  for (let k in window.i18n.languages['zh'].Ingredient.DisplayName) {
    const candidateName = window.i18n.languages['zh'].Ingredient.DisplayName[k]; 
    if (candidateName == zhName) {
      const enName = window.i18n.languages['en'].Ingredient.DisplayName[k];
      return enName;
    }
  }
  console.log("Can't find English version of ", zhName);
  return null;
}

function translateTextFromZhCnToEnUs(textStr) {
  let matchedGroups = null;
  let enName = null;

  for (let i in regexList) {
    matchedGroups = (textStr).match(regexList[i]); 
    if (null != matchedGroups && 0 < matchedGroups.length) {
      // console.log(textStr + " matches " + regexList[i] + "\nat i == " + i);
      let toRet = null;
      const intIndice = parseInt(i);
      switch (intIndice) {
      case 0:
      toRet = "Serve " + matchedGroups[1] + " guests.";
      return toRet;
      case 1:
      toRet = "Serve " + matchedGroups[1] + " dishes."; 
      return toRet;
      case 2:
      enName = ingredientNameZhCnToEnUs(matchedGroups[2]);
      if (null == enName) {
        return null;
      } else {
        toRet = "Produce " + matchedGroups[1] + " \"" + enName + "\".";
        return toRet;
      }
      return toRet;
      case 3:
      enName = buildableNameZhCnToEnUs(matchedGroups[2]);
      if (null == enName) {
        return null;
      } else {
        toRet = "Build " + matchedGroups[1] + " \"" + enName + "\".";
        return toRet;
      }
      case 4:
      enName = buildableNameZhCnToEnUs(matchedGroups[1]);
      if (null == enName) {
        return null;
      } else {
        toRet = "Upgrade \"" + enName + "\" to level " + matchedGroups[2] + ".";
        return toRet;
      }
      return toRet;
      case 5:
      enName = ingredientNameZhCnToEnUs(matchedGroups[1]);
      if (null == enName) {
        return null;
      } else {
        toRet = "Learn to serve \"" + enName + "\".";
        return toRet;
      }
      case 6:
      toRet = "Earn " + matchedGroups[1] + " gold.";
      return toRet;
      default:
      return null; 
      }
    }  
  }

  return null;
}

SQLiteManager.instance.dbRef.query('SELECT * FROM mission', {type: sequelize.QueryTypes.SELECT}).then((missionList) => {
  for (let k in missionList) {
    const mission = missionList[k]; 
    const translatedDescription = translateTextFromZhCnToEnUs(mission.description);

    if (null == translatedDescription) {
      continue;
    } 

    console.log(mission.id, mission.description, " => ", translatedDescription); 

    SQLiteManager.instance.dbRef.query('UPDATE mission SET description=? WHERE id=?', {replacements: [translatedDescription, mission.id], type: sequelize.QueryTypes.UPDATE})
    .then(([results, metadata]) => {
    });

    SQLiteManager.instance.dbRef.query('SELECT * FROM quest WHERE mission_id = ?', {replacements: [mission.id], type: sequelize.QueryTypes.SELECT})
    .then((questListOfThisMission) => {
      for (let kk in questListOfThisMission) {
        const quest = questListOfThisMission[kk]; 
        const translatedContent = translateTextFromZhCnToEnUs(quest.content); 
        if (null == translatedContent) {
          continue;
        } 

        console.log(quest.id, quest.content, " => ", translatedContent); 
        SQLiteManager.instance.dbRef.query('UPDATE quest SET content=? WHERE id=?', {replacements: [translatedContent, quest.id], type: sequelize.QueryTypes.UPDATE})
        .then(([results2, metadata2]) => {
        });
      }
    });
  }
});
