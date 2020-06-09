'use strict';

const Fs = require('fs');
const Path = require('path');

let template = Fs.readFileSync(Path.join(__dirname, './template.txt'), 'utf-8');

/**
 * 创建新的语言包
 * @param {string} name 
 * @return {Promise}
 */
let create = function (name) {
    let js = template.replace('{{name}}', name);
    let url = `db://assets/resources/i18n/${name}.js`;
    return new Promise((resolve, reject) => {
        Editor.assetdb.create(url, js, (error) => {
            if (error) {
                Editor.assetdb.error('Failed to create asset %s, %s', url, error.stack);
                reject();
                return;
            }
            resolve();
        });
    });
};

/**
 * 删除语言包
 * @param {string} name 
 */
let remove = function (name) {
    let url = `db://assets/resources/i18n/${name}.js`;
    return new Promise((resolve, reject) => {
        Editor.assetdb.delete([url], (error, results) => {
            if (error) {
                Editor.assetdb.error('Failed to delete asset %s, %s', path, error.stack);
                reject();
                return;
            }
            resolve();
        });
    });

};

exports.create = create;
exports.remove = remove;