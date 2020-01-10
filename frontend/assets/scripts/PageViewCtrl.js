cc.Class({
  extends: cc.Component,
  properties: {
    target: cc.PageView,
    indicator: {
      type: cc.PageViewIndicator,
      default: null,
      visible: function() {
        return !this.useNumberIndicator;
      },
    },
    toPrevPageButton: cc.Button,
    toNextPageButton: cc.Button,
    useNumberIndicator: false,
    indexLabel: {
      type: cc.Label,
      default: null,
      visible: function() {
        return this.useNumberIndicator;
      },
    }
  },
  onLoad() {
    const self = this;
    // Initialization of ControllerButton. [begins].
    self.toPrevPageButton.node.on('click', function() {
      let index = self.target.getCurrentPageIndex();
      self.target.scrollToPage(index - 1);
      self.refreshIndex();
    });
    self.toNextPageButton.node.on('click', function() {
      let index = self.target.getCurrentPageIndex();
      self.target.scrollToPage(index + 1);
      self.refreshIndex();
    });
    // Initialization of ControllerButton. [ends].

    self.refreshIndex();
    self.toPrevPageButton.node.active = true;
    self.toNextPageButton.node.active = true;
    self.toPrevPageButton.enableAutoGrayEffect = true;
    self.toNextPageButton.enableAutoGrayEffect = true;
  },

  refreshIndex() {
    const self = this;
    let length = self.target.getPages().length,
        index = self.target.getCurrentPageIndex();
    self.toPrevPageButton.interactable = true;
    self.toNextPageButton.interactable = true;
    if (index <= 0) {
      self.toPrevPageButton.interactable = false;
    }
    if (index >= length - 1) {
      self.toNextPageButton.interactable = false;
    }
    
    if (self.useNumberIndicator) {
      self.indexLabel.string = length ? `${index + 1}/${length}` : `0/0`;
    }
    if (length <= 1) {
      self.toNextPageButton.node.opacity = self.toPrevPageButton.node.opacity = 0;
    } else {
      self.toNextPageButton.node.opacity = self.toPrevPageButton.node.opacity = 255;
    }
  },
});
