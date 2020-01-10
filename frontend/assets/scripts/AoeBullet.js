/*
 * 这是一次性的，同时非持续性伤害的范围性攻击Npc的Bullet.
 *    --guoyl6, 2019/10/21 3:53
 */


cc.Class({
  extends: cc.Component,

  properties: {
    animationNode: cc.Node,
  },

  onLoad() {
    const self = this;
    setTimeout(() => {
      self.boom();
      for (let k in self.targetScriptInsDict) {
        delete self.targetScriptInsDict[k]; 
      }
      if (self.node && self.node.parent) {
        self.node.removeFromParent(); 
      }
    }, 100 /* Hardcoded temporarily -- YFLu, 2019-11-08. */);
  },

  ctor() {
    this.mapIns = null;
    this.explosionType = constants.BULLET_EXPLOSION_TYPE.AOE;
    this.targetScriptInsDict = {};

    this.emitterStatefulBuildable = null;
    this.emitterChararcter = null;
    this.emitterIngredient = null;

    this.alreadyHitSth = false;
    this.teamId = null;

  },

  update(dt) {

    if (this.mapIns.isPaused()) {
      this.node.pauseAllActions();
      return;
    } else {
      this.node.resumeAllActions();
    }

    if (this.alreadyHitSth) {
      return;
    }
  },

  onCollisionEnter(other, self) {
    const thisBulletScriptIns = this;
    if (this.alreadyHitSth) {
      return;
    }
    const theOtherScriptIns = other.getComponent(other.node.name);
    if (this.teamId == theOtherScriptIns.teamId) {
      return;
    }
    switch (other.node.name) {
      case "StatefulBuildableAttackingNpc":
      case "EscapingAttackingNpc":
      case "StatefulBuildableInstance":
        this.targetScriptInsDict[other.node.uuid] = theOtherScriptIns;
        break;
      default:
      break;
    }
  },

  onCollisionStay(other, self) {
    // TBD.
  },

  onCollisionExit(other, self) {
    const thisBulletScriptIns = this;
    if (self.alreadyHitSth) {
      return;
    }
    const theOtherScriptIns = other.getComponent(other.node.name);
    if (this.teamId == theOtherScriptIns.teamId) {
      return;
    }
    switch (other.node.name) {
      case "StatefulBuildableAttackingNpc":
      case "EscapingAttackingNpc":
      case "StatefulBuildableInstance":
        delete this.targetScriptInsDict[other.node.uuid];
        break;
      default:
      break;
    }
  },

  boom() {
    const self = this;
    if (self.alreadyHitSth) {
      return;
    }
    if (null == self.animationNode) {
      return;
    }
    self.animationNode.active = true;
    for (let uuid in this.targetScriptInsDict) {
      const targetScriptIns = this.targetScriptInsDict[uuid];
      if (cc.isValid(targetScriptIns.node) && null != targetScriptIns.node.parent) {
        targetScriptIns.onShotByBullet(self);
      }
    }
    self.alreadyHitSth = true;
  },
  
});
