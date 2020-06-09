'use strict';

const Fs = require('fire-fs');
const Path = require('path');

// adapter project path
let projectPath = Editor.projectPath;
if (!projectPath) {
   projectPath = Editor.Project.path;
}

let PATH = Path.join(projectPath, './assets/resources/i18n');

let mount = function () {
    // 创建目录，保证目录存在
    Fs.ensureDirSync(PATH);
};

let unmount = function () {
    // 如果目录为空则删除目录
    if (!Fs.existsSync(PATH)) {
        return;
    }
    if (Fs.readdirSync(PATH).length === 0) {
        Fs.unlink(PATH);
    }
};

let metrics = function () {
    Editor.Metrics.trackEvent({
        category: 'Packages',
        label: 'i18n',
        action: 'Panel Open'
    }, null);
};

exports.mount = mount;
exports.unmount = unmount;
exports.metrics = metrics;
