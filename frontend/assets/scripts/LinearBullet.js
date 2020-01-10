const Bullet = require('./Bullet');

cc.Class({
  extends: Bullet,  

  onLoad() {
    switch (this.explosionType) {
    case constants.BULLET_EXPLOSION_TYPE.INVISIBLE:
      this.tailParticleSystem.stopSystem();
    break;
    case constants.BULLET_EXPLOSION_TYPE.SINGLE_TARGET:
      if (null != this.npcDefaultTailParticleSpriteFrame) {
        this.tailParticleSystem.spriteFrame = this.npcDefaultTailParticleSpriteFrame;
      }
    break;
    default:
    break;
    }

    if (null != this.targetScriptIns) {
      let diffVec = this.targetScriptIns.node.position.sub(this.node.position);
      let diffVecMag = diffVec.mag(); 
      if (diffVecMag >= this.bulletMaxDist) {
        diffVec = diffVec.mul(this.bulletMaxDist/diffVecMag);
      }   

      const sDir = {
        dx: diffVec.x,
        dy: diffVec.y,
      };
      this.scheduleNewDirection(sDir);
      let durationSeconds = diffVec.mag()/this.linearSpeed;

      const self = this;
      const actionSeq = cc.sequence([
          cc.moveTo(durationSeconds, this.targetScriptIns.node.position)
            //.easing(cc.easeInOut(3.0))  // Use easing to mimic the "gravity on arrow" effect. -- YFLu, 2019-11-05.
          ,
          cc.callFunc(() => {
            if (self.node && self.node.parent) {
              self.node.removeFromParent();
            } 
          })
      ]);
      this.node.runAction(actionSeq);

      if (0 == this.activeDirection.dx && 0 == this.activeDirection.dy) {
        console.warn("You must set `activeDirection` of a LinearBullet before mounting it to scene!");
      }

    } else {
      console.warn("You must set `targetScriptIns` of a LinearBullet before mounting it to scene!");
    }
  },

  _calculateAngle(dx, dy) {
    if (dx == 0) {
      if (dy > 0) {
        return 90;
      }
      if (dy < 0) {
        return -90;
      }
    } 

    return 180*Math.atan(dy/dx)/Math.PI;
  },

  scheduleNewDirection(sDir) {
    this.activeDirection.dx = sDir.dx;
    this.activeDirection.dy = sDir.dy;

    const baseAngle = 0;
    const angleToRotate = baseAngle - this._calculateAngle(sDir.dx, sDir.dy);
    if (null == angleToRotate) {
      return false;
    }
    set2dRotation(this.node, angleToRotate); 
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
  },
  
});
