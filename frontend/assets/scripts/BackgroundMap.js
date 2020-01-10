const NarrativeSceneManagerDelegate = require('./NarrativeScenes/NarrativeSceneManagerDelegate');

cc.Class({
  extends: NarrativeSceneManagerDelegate,
  properties:{
  },

  onLoad(){
    NarrativeSceneManagerDelegate.prototype.onLoad.call(this);
  },
});
