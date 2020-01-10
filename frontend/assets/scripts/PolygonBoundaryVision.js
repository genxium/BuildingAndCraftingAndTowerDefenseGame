const PolygonBoundaryDefender = require('./PolygonBoundaryDefender');

cc.Class({
  extends: PolygonBoundaryDefender,
  
  properties: {
  },

  // LIFE-CYCLE CALLBACKS:
  ctor() {
    // According to CocosCreator API convention, "cc.Class" will automatically call super constructor of "PolygonBoundaryVision", you should not call it manually.

    /*
    * The difference between "Vision" and "Defender" is that the "inRangeToAttackTargets" for the latter is "immediately shootable". 
    *
    * -- YFLu, 2019-11-19.
    */
  },

  onCollisionEnter(other, self) {
    if (null != this.emitterStatefulBuildable) {
      const targetScriptIns = other.getComponent(other.node.name);
      switch (other.node.name) {
        case "EscapingAttackingNpc":
          if (targetScriptIns.teamId == this.emitterStatefulBuildable.teamId) {
            break;
          }
          this.inRangeToAttackTargets[targetScriptIns.node.uuid] = targetScriptIns; 
          break;
        default:
        break;
      }
      return;
    }

    if (null != this.emitterCharacter) {
      const playerScriptIns = this.emitterCharacter;
      const targetScriptIns = other.getComponent(other.node.name);
      switch (other.node.name) {
        case "EscapingAttackingNpc":
          if (playerScriptIns.teamId == targetScriptIns.teamId) {
            break;
          }
          this.inRangeToAttackTargets[targetScriptIns.node.uuid] = targetScriptIns; 
          playerScriptIns.transitToTracingTargetInVisionIfNotAttackingAndNoAttackable();
          break;
        case "StatefulBuildableInstance":
          if (playerScriptIns.teamId == targetScriptIns.teamId) {
            break;
          }
          if (false == targetScriptIns.shouldColliderWithAttackingNpcDefender()) {
            break;
          }
          this.inRangeToAttackTargets[targetScriptIns.node.uuid] = targetScriptIns; 
          playerScriptIns.transitToTracingTargetInVisionIfNotAttackingAndNoAttackable();
          break;
        default:
        break;
      }
      return;
    }
  },

  onCollisionStay(other, self) {
    // TBD.
  },

  onCollisionExit(other, self) {
    if (null != this.emitterStatefulBuildable) {
      const playerScriptIns = other.getComponent(other.node.name);
      switch (other.node.name) {
        case "EscapingAttackingNpc":
          if (null != this.inRangeToAttackTargets[playerScriptIns.node.uuid]) {
            delete this.inRangeToAttackTargets[playerScriptIns.node.uuid]; 
          }
          break;
        default:
        break;
      }
      return;
    }

    if (null != this.emitterCharacter) {
      const playerScriptIns = self.getComponent(self.node.name);
      const targetScriptIns = other.getComponent(other.node.name);
      switch (other.node.name) {
        case "EscapingAttackingNpc":
        case "StatefulBuildableInstance":
          if (null != this.inRangeToAttackTargets[targetScriptIns.node.uuid]) {
            delete this.inRangeToAttackTargets[targetScriptIns.node.uuid]; 
          } 
          break;
        default:
        break;
      }
      return;
    }
  },
});
