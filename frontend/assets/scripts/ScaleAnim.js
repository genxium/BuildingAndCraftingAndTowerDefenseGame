cc.Class({
  extends: cc.Component,

  properties: {
    durationMillis: {
      default: 1500 
    },
    maxScale : 1.5,
    minScale : 1, 
  },
 

  // LIFE-CYCLE CALLBACKS:
  update (dt) {
    const changingNode = this.node;
    const elapsedMillis = Date.now() - this.startedAtMillis; 
    if(elapsedMillis >= this.durationMillis) {
      this.startedAtMillis = Date.now();
      changingNode.scale = this.minScale;
      return;
    }
    if (elapsedMillis <= this.firstDurationMillis) {
      changingNode.scale += (this.scaleIncreaseSpeed*dt); 
    } else {
      changingNode.scale -= (this.scaleDecreaseSpeed*dt); 
    }
  },

  onLoad() {
    this.startedAtMillis = Date.now();

    this.firstDurationMillis = (0.6*this.durationMillis);
    this.scaleIncreaseSpeed = ((this.maxScale - this.minScale) * 1000/this.firstDurationMillis);

    this.secondDurationMillis = (0.4 * this.durationMillis );
    this.scaleDecreaseSpeed = ((this.maxScale - this.minScale) * 1000/this.secondDurationMillis);
  }
});
