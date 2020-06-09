'use strict';

const Fs = require('fs');

const Event = Editor.require('packages://i18n/utils/event');

const Home = Editor.require('packages://i18n/panel/component/home');

Editor.Panel.extend({

    style: Fs.readFileSync(Editor.url('packages://i18n/panel/style/home.css')),

    template: Home.template,

    $: {},

    ready () {
        if (!window.Vue) {
            // todo 错误信息
            return;
        }
        Home.el = this.shadowRoot;
        Home.data = Home.data();
        delete Home.props;
        delete Home.template;
        Home.components = {};
        this._vm = new Vue(Home);
        window.vm = this._vm
        
        let profile = this.profiles.project;
        if (profile.data.languages) {
            profile.data.languages.forEach((name) => {
                this._vm.languages.push(name)
            });
        }

        let current = profile.data['default_language'];
        if (this._vm.languages.indexOf(current) === -1) {
            this._vm.current = this._vm.languages[0];
            Editor.warn(`Language is not found - ${current}`);
        } else {
            this._vm.current = current;
        }

        Event.on('language-changed', (name) => {
            profile.data['default_language'] = name;
            profile.save();
            Editor.Scene.callSceneScript('i18n', 'update-default-language', name, function (err, result) {
                // console.log(result);
            });
        });

        Event.on('languages-changed', (languages) => {
            profile.data.languages = languages.map((name) => {
                return name;
            });
            profile.save();
        })
    },
});