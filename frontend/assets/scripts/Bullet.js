 module.export = cc.Class({
  extends: cc.Component,

  properties: {
    localIdInBattle: {
      default: null, 
    },
    linearSpeed: {
      default: 0.0,
    },
    bulletMaxDist: {
      default: 500.0,
    },
    explosionNode: {
      type: cc.Node,
      default: null,
    },
    tailNode: {
      type: cc.Node,
      default: null,
    },
    tailParticleSystem: {
      // Since CocosCreator v2.2, this must be the uppermost node, otherwise the "MotionStreak effect of ParticleSystem" will disappear!
      type: cc.ParticleSystem,
      default: null,
    },
  },
    
  ctor() {
    this.mapIns = null;
    this.explosionType = constants.BULLET_EXPLOSION_TYPE.NONE;
    this.activeDirection = {dx: 0, dy: 0};
    this.targetScriptIns = null;
    
    this.emitterStatefulBuildable = null;
    this.emitterChararcter = null;
    this.culmulatedMovedDist = 0;
    this.alreadyHitSth = false;

    this.explosionRadius = 128;
    this.baseDamage = 0;

    this.delayRemoveTimer = null;

    this.teamId = null;
  },

  onLoad() {
  },

  onDestroy() {
    clearTimeout(this.delayRemoveTimer);
  },

  _calculateVecToMoveByWithChosenDir(elapsedTime, sDir) {
    if (0 == sDir.dx && 0 == sDir.dy) {
      return cc.v2();
    }
    const self = this;
    const distanceToMove = (self.linearSpeed * elapsedTime);
    const denominator = Math.sqrt(sDir.dx * sDir.dx + sDir.dy * sDir.dy);
    const unitProjDx = (sDir.dx / denominator);
    const unitProjDy = (sDir.dy / denominator);
    return cc.v2(
      distanceToMove * unitProjDx,
      distanceToMove * unitProjDy,
    );
  },

  _calculateVecToMoveBy(elapsedTime) {
    const self = this;
    if (null == self.activeDirection) {
      return null;
    }
    // Note that `sDir` used in this method MUST BE a copy in RAM.
    let sDir = {
      dx: self.activeDirection.dx,
      dy: self.activeDirection.dy,
    };

    if (0 == sDir.dx && 0 == sDir.dy) {
      return cc.v2();
    }

    return self._calculateVecToMoveByWithChosenDir(elapsedTime, sDir);
  },

  _canMoveBy(vecToMoveBy) {
    return true;
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

    if (null == this.targetScriptIns || null == this.targetScriptIns.node) {
      if (this.node.parent) {
        this.node.removeFromParent();  
      }
      return;
    }  

    const self = this;
  
    if (null != self.bulletMaxDist) {
      self.node.opacity = 255*(1 - self.culmulatedMovedDist/self.bulletMaxDist);
    }
    
    // Tracing the target.
    const newDir = self.targetScriptIns.node.position.sub(self.node.position);   
    self.activeDirection.dx = newDir.x;
    self.activeDirection.dy = newDir.y;

    const vecToMoveBy = self._calculateVecToMoveBy(dt);
    if (null == vecToMoveBy) {
      return;
    }
    if (self._canMoveBy(vecToMoveBy)) {
      self.culmulatedMovedDist += vecToMoveBy.mag(); 
      if (self.bulletMaxDist <= self.culmulatedMovedDist) {
        if (self.node.parent) {
          self.node.removeFromParent();
        }
      }
      self.node.position = self.node.position.add(vecToMoveBy);
    }
  },

  onCollisionEnter(other, self) {
    const theOtherScriptIns = other.getComponent(other.node.name);
    if (null == this.targetScriptIns || null == this.targetScriptIns.node) {
      if (this.node.parent) {
        this.node.removeFromParent();  
      }
      return;
    }
    if (this.teamId == theOtherScriptIns.teamId) {
      return;
    }
    if (theOtherScriptIns.node.uuid != this.targetScriptIns.node.uuid) {
      return;
    }
    const thisBulletScriptIns = this;
    this.alreadyHitSth = true;
    this.tailNode.active = false;
  
    switch (this.explosionType) {
    case constants.BULLET_EXPLOSION_TYPE.AOE:
      thisBulletScriptIns.explodeOnMap(500);
      const explosionPosition = thisBulletScriptIns.node.position;
      const aoeBulletNode = cc.instantiate(thisBulletScriptIns.mapIns.aoeBulletPrefab);
      const aoeBulletScriptIns = aoeBulletNode.getComponent("AoeBullet"); 
      aoeBulletScriptIns.baseDamage = thisBulletScriptIns.baseDamage; 
      aoeBulletScriptIns.getComponent(cc.CircleCollider).radius =  thisBulletScriptIns.explosionRadius;  
      aoeBulletScriptIns.mapIns = thisBulletScriptIns.mapIns;
      aoeBulletScriptIns.explosionType = thisBulletScriptIns.explosionType;
      aoeBulletScriptIns.emitterStatefulBuildable = thisBulletScriptIns.emitterStatefulBuildable;
      aoeBulletScriptIns.emitterChararcter = thisBulletScriptIns.emitterChararcter;
      aoeBulletScriptIns.teamId = this.teamId;

      aoeBulletNode.setPosition(explosionPosition);
      safelyAddChild(this.mapIns.node, aoeBulletNode);
      setLocalZOrder(aoeBulletNode, window.CORE_LAYER_Z_INDEX.UN_HIGHLIGHTED_STATEFUL_BUILDABLE_INSTANCE);
      thisBulletScriptIns.mapIns.playEffectBulletLinearAoe(this.targetScriptIns);
      // Damage is yielded later within "AoeBullet.boom".
    break;
    case constants.BULLET_EXPLOSION_TYPE.SINGLE_TARGET:
      thisBulletScriptIns.explodeOnMap(500);
      // Damage is yielded at single target.
      this.targetScriptIns.onShotByBullet(this);
      thisBulletScriptIns.mapIns.playEffectBulletLinearSingle(this.targetScriptIns);
    break;
    case constants.BULLET_EXPLOSION_TYPE.INVISIBLE:
      thisBulletScriptIns.explodeOnMap(0, true);
      // Damage is yielded at single target.
      this.targetScriptIns.onShotByBullet(this);
      thisBulletScriptIns.mapIns.playEffectBulletInvisible(this.targetScriptIns);
    break;
    default:
      thisBulletScriptIns.explodeOnMap(0, true);
      // Damage is yielded at single target.
      this.targetScriptIns.onShotByBullet(this);
    break;
    }

  },

  onCollisionStay(other, self) {
    // TBD.
  },

  onCollisionExit(other, self) {
    // TBD.
  },

  explodeOnMap(delayedMillisToRemove, shouldHideExplosionNode) {
    const self = this;
    const explosionPosition = self.node.position;
    const explosionNode = self.explosionNode;
    if (null != self.node.parent && true != shouldHideExplosionNode) {
      explosionNode.parent = self.node.parent;
      explosionNode.setPosition(explosionPosition);
      explosionNode.active = true;
      self.delayRemoveTimer = setTimeout(() => {
        if (null != explosionNode) {
          explosionNode.removeFromParent();  
        }
      }, delayedMillisToRemove);
    }

    if (null != self.node) {
      self.node.removeFromParent();  
    }
  },
});
