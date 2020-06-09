'use strcit';

const Fs = require('fs');
const Path = require('path');

const Language = require('../../utils/language');
const Event = require('../../utils/event');

exports.template = Fs.readFileSync(Path.join(__dirname, '../template/home.html'), 'utf-8');

exports.props = [];

exports.data = function () {
    return {
        state: 'normal',

        languages: [],
        current: '',

        _language: '',
    }
};

exports.watch = {
    current () {
        Event.emit('language-changed', this.current);
    }
};

exports.methods = {
    _t (key) {
        return Editor.T(`i18n.${key}`);
    },

    _getLanguagePath (language) {
        return Path.join('resources/i18n/', `${language}.js`);
    },

    changeEdit () {
        if (this.state === 'edit') {
            this.state = 'normal';
        } else {
            this.state = 'edit';
        }
    },

    changeCreate () {
        if (this.state === 'create') {
            this.state = 'normal';
            this._language = '';
        } else {
            this.state = 'create';
            this._language = '';
        }
    },

    /**
     * 创建一个新的语言包
     * @param {string} name 
     */
    createLanguage (name) {
        // 检查是否不存在
        if (!name) {
            return alert('创建语言失败 - 名称不能为空');
        }
        // 检查是否重名
        if (this.languages.indexOf(name) !== -1) {
            return alert('创建语言失败 - 该语言已经存在');
        }

        Language.create(name).then(() => {
            this.languages.push(name);
            if (!this.current) {
                this.current = this.languages[0];
            }
            Event.emit('languages-changed', this.languages);
            this._language = '';
            this.state = 'normal';
        }).catch(() => {
            this._language = '';
            this.state = 'normal';
            // todo 错误提示
        });
    },

    /**
     * 删除一个已存在的语言包
     * @param {string} name 
     */
    deleteLanguage (name) {
        // 检查是否存在
        if (this.languages.indexOf(name) === -1) {
            return alert('删除语言失败 - 该语言不存在');
        }

        // 弹窗提示
        let code = Editor.Dialog.messageBox({
            type: 'warning',
            buttons: ['Cancel', 'OK'],
            title: 'Delete Language Data',
            message: 'Delete i18n language data, this cannot be undone!',
            detail: name,
            noLink: true
        });

        if (code === 0) {
            return;
        }
        // 删除 profile
        Language.remove(name).then(() => {
            let index = this.languages.indexOf(name);
            this.languages.splice(index, 1);
            Event.emit('languages-changed', this.languages);
            if (name === this.current) {
                this.current = this.languages[0] || '';
            }
        }).catch(() => {
            // todo 错误提示
        });
    },
};

exports.ready = function () {};