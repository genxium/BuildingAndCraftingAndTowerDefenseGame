const Polyglot = require('polyglot.min');

let polyInst = null;
if (!window.i18n) {
    window.i18n = {
        languages: {},
        curLang:''
    };
}

if (CC_EDITOR) {
    Editor.Profile.load('profile://project/i18n.json', (err, profile) => {
        window.i18n.curLang = profile.data['default_language'];
        if (polyInst) {
            let data = loadLanguageData(window.i18n.curLang) || {};
            initPolyglot(data);
        }
    });
}

function loadLanguageData (language) {
    return window.i18n.languages[language];
}

function initPolyglot (data) {
    if (data) {
        if (polyInst) {
            polyInst.replace(data);
        } else {
            polyInst = new Polyglot({ phrases: data, allowMissing: true });
        }
    }
}

module.exports = {
    /**
     * This method allow you to switch language during runtime, language argument should be the same as your data file name
     * such as when language is 'zh', it will load your 'zh.js' data source.
     * @method init
     * @param language - the language specific data file name, such as 'zh' to load 'zh.js'
     */
    init (language) {
        if (language === window.i18n.curLang) {
            return;
        }
        let data = loadLanguageData(language) || {};
        window.i18n.curLang = language;
        initPolyglot(data);
        this.inst = polyInst;
    },
    /**
     * this method takes a text key as input, and return the localized string
     * Please read https://github.com/airbnb/polyglot.js for details
     * @method t
     * @return {String} localized string
     * @example
     *
     * var myText = i18n.t('MY_TEXT_KEY');
     *
     * // if your data source is defined as
     * // {"hello_name": "Hello, %{name}"}
     * // you can use the following to interpolate the text
     * var greetingText = i18n.t('hello_name', {name: 'nantas'}); // Hello, nantas
     */
    t (key, opt) {
        if (polyInst) {
            return polyInst.t(key, opt);
        }
    },

    inst: polyInst,

    updateSceneRenderers () { // very costly iterations
        let rootNodes = cc.director.getScene().children;
        // walk all nodes with localize label and update
        let allLocalizedLabels = [];
        for (let i = 0; i < rootNodes.length; ++i) {
            let labels = rootNodes[i].getComponentsInChildren('LocalizedLabel');
            Array.prototype.push.apply(allLocalizedLabels, labels);
        }
        for (let i = 0; i < allLocalizedLabels.length; ++i) {
            let label = allLocalizedLabels[i];
            if(!label.node.active)continue;
            label.updateLabel();
        }
        // walk all nodes with localize sprite and update
        let allLocalizedSprites = [];
        for (let i = 0; i < rootNodes.length; ++i) {
            let sprites = rootNodes[i].getComponentsInChildren('LocalizedSprite');
            Array.prototype.push.apply(allLocalizedSprites, sprites);
        }
        for (let i = 0; i < allLocalizedSprites.length; ++i) {
            let sprite = allLocalizedSprites[i];
            if(!sprite.node.active)continue;
            sprite.updateSprite(window.i18n.curLang);
        }
    }
};