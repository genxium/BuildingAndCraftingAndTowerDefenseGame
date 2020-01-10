const i18n = require('LanguageData');
i18n.init(window.language); // languageID should be equal to the one we input in New Language ID input field

function i18nExtend(prefix='') {
  this.prefix = prefix;
}

i18nExtend.prototype.render = function(key) {
  // '{{' and '}}' would be ignored.
  let args = [].slice.call(arguments, 1), ctx = args[0];
  let str = i18n.t(this.prefix ? [this.prefix, key].join('.') : key);
  if (!args.length) {
    return str;
  }
  let useCtx = typeof ctx === 'object';
  let len = str.length, argIndex = 0;
  return str.replace(/{([^{}]+)}/g, function (matchedStr, key, index) {
    let countL = 0, cli = index - 1,
        countR = 0, cri = index + matchedStr.length;
    while (cli >= 0 && str[cli] == '{') {
      cli--;
      countL++;
    }
    while (cri < len && str[cri] == '}') {
      cri++;
      countR++;
    }
    if (countL % 2 == 0 && countR % 2 == 0) {
      return (useCtx && ctx.hasOwnProperty(key)) ?
        ctx[key] : (
          useCtx ? matchedStr : (typeof args[argIndex++] != 'undefined' ? args[argIndex-1] : matchedStr)
        );
    }
    return matchedStr;
  }).replace(/{{/g, '{').replace(/}}/g, '}');
}

i18nExtend.render = function(key, args) {
  let obj = new i18nExtend('');
  return obj.render.apply(obj, arguments);
}

window.i18nExtend = i18nExtend;

module.exports = i18nExtend;
