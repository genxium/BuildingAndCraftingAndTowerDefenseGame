var scene = new cc.Scene();

var root = new cc.Node();
var canvas = root.addComponent(cc.Canvas);
root.parent = scene;

var node = new cc.Node();
var label = node.addComponent(cc.Label);
label.node.opacity = 0;
label.verticalAlign = cc.Label.VerticalAlign.CENTER;
label.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
label.fontFamily = "Italic";
label.fontSize = 24;
/*
 * Ascii art from https://www.asciiart.eu/buildings-and-places/monuments/eiffel-tower. 
 *
 * Escaped by https://onlinestringtools.com/escape-string.
 */
label.string = `LOKCOL STUDIO`; 
node.parent = root;

var fadeInAndOut = cc.sequence([
    cc.fadeIn(0.5),
    cc.scaleTo(1.0, 1.0),
    cc.fadeOut(1.0),
]);
label.node.runAction(fadeInAndOut);
module.exports = scene;

