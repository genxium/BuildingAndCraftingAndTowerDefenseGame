const baseAbsPath = __dirname + '/';

const request = require('request'); 
const fs = require('fs');

const sioConfFilePath = baseAbsPath + './battle_srv/configs/sio.json';
const origSioConfJsonStr = fs.readFileSync(sioConfFilePath, "utf8");
const sioConfJsonObj = JSON.parse(origSioConfJsonStr);
const serverPort = sioConfJsonObj.port;  

const globalConfFilePath = baseAbsPath + './battle_srv/configs/global_conf.json';
const origGlobalConfJsonStr = fs.readFileSync(globalConfFilePath, "utf8");
const globalConfJsonObj = JSON.parse(origGlobalConfJsonStr);

const reqFormObj = {};
for (let k in globalConfJsonObj) {
  const candidate = globalConfJsonObj[k];
  if (typeof candidate == 'number' || typeof candidate == 'string') {
    reqFormObj[k] = candidate; 
  }
}

console.log("reqFormObj is ", reqFormObj);
request.post('http://localhost:' + serverPort + '/api/v1/Global/Conf/Modify', {
  form: reqFormObj
}, function (error, response, body) {
  console.log('error:', error); // Print the error if one occurred
  console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
  console.log('body:', body); // Print the HTML for the Google homepage.
});
