const StatefulBuildableInstance = require('./StatefulBuildableInstance');

cc.Class({
  extends: StatefulBuildableInstance,

  loadAnimationClips() {
    const self = this;
    const targetNode = self.node.getChildByName(cc.js.formatStr("%sAnimationNode", self.displayName));
    if (self.animationClipsLoaded) {
      return;
    }
    self.animationClipsLoaded = true;
    const animation = self.node.getComponent(cc.Animation);
    if (!targetNode) {
      console.warn("Lacking animationNode for:", self.displayName);
      return;
    }

    let index = 0;
    // load skeletalAnimationTargetIns [begin].
    let skeletalAnimationNode = targetNode;
    if (null != skeletalAnimationNode) {
      // try load dragonBones
      self.skeletalAnimationTargetIns = skeletalAnimationNode.getComponent(dragonBones.ArmatureDisplay);
      const skeletalAnimationTargetIns = self.skeletalAnimationTargetIns; 
      let called = false;
      const onStartPlay = () => {
        if (called) {
          return;
        }
        called = true;
        skeletalAnimationTargetIns.scheduleOnce(function() {
          self._correctSize();
          self.onSkeletalAnimationStartPlay && self.onSkeletalAnimationStartPlay(skeletalAnimationTargetIns);
        });
        
        if (self.isNewing()) {
          if (skeletalAnimationTargetIns instanceof dragonBones.ArmatureDisplay) {
            skeletalAnimationTargetIns._playing = false;
          } 
        }
      }

      if (null != skeletalAnimationTargetIns != null) {
        skeletalAnimationTargetIns.on(dragonBones.EventObject.START, onStartPlay);
      } 

      if (null == skeletalAnimationTargetIns) {
        console.warn(cc.js.formatStr('There is no dragonBones or spine `skeletalAnimationTargetIns` for %s', targetNode.name));
      }
    }
    // load skeletalAnimationTargetIns [end].
  },
  
  showSkeletalAnimation(lv) {
    const self = this;
    if (null == self.skeletalAnimationTargetIns) {
      return false;
    }
    const armatureName = cc.js.formatStr('Level_%s', self.currentLevel);
    self.showStatelessBuildableAppearance(lv == 0 ? 1 : lv);
    self.skeletalAnimationTargetIns.armatureName = armatureName;
    let skeletalAnimationTargetIns = self.skeletalAnimationTargetIns;
    if (null == skeletalAnimationTargetIns) {
      console.warn(cc.js.formatStr("The expected skeletalAnimation is not found for %s, level is %s", self.displayName, lv));
      return false;
    }
    self.node.getComponent(cc.Sprite).spriteFrame = null;
    if (true == skeletalAnimationTargetIns.node.active) {
      return true;
    }
    self.stopCurrentBuildableAnimation();
    self._playBuildableSkeletalAnimation(skeletalAnimationTargetIns);
    self._correctSize();
    return true;
  },

  _playBuildableSkeletalAnimation(skeletalAnimationTargetIns) {
    const self = this;
    skeletalAnimationTargetIns.node.active = true;
    if (skeletalAnimationTargetIns instanceof dragonBones.ArmatureDisplay) {
      const armatureName = cc.js.formatStr('Level_%s', self.currentLevel);
      let animationName = 'Idle';
      skeletalAnimationTargetIns._init();
      const existingAnimNames = skeletalAnimationTargetIns.getAnimationNames(armatureName);  
      // console.log("Of self.id == ", self.id, ", armatureName == ", armatureName, ", existingAnimNames == ", existingAnimNames, ", count(existingAnimNames) == ", Object.keys(existingAnimNames).length);
      if (existingAnimNames.indexOf(animationName) == -1) {
        animationName = 'Idle'; // hardcode temporarily
      }
      if (
          existingAnimNames.indexOf('Producing') != -1
          &&
          self.couldShowProducingAnimation()
          &&
          self.mapIns.isStatefulBuildableInstanceProducingSomething(self)
      ) {
        animationName = 'Producing';
      }
      skeletalAnimationTargetIns.playAnimation(animationName, 0);
    }
  },
}); 
