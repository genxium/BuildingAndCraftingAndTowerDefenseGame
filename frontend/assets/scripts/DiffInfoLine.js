const i18n = require('LanguageData');
i18n.init(window.language);

cc.Class({
    extends: cc.Component,

    properties: {
      goldStorage: {
        type: cc.Node,
        default: null,
      },
      goldStorageLabel: {
        type: cc.Label,
        default: null,
      },
      goldStorageAdditionLabel: cc.Label,
      chairNode: cc.Node,
      chairCountLabel: cc.Label,
      chairCountAdditionLabel: cc.Label,
      baseGoldProductionRateNode: cc.Node,
      baseGoldProductionRateLabel: cc.Label,
      baseGoldProductionRateAdditionLabel: cc.Label,
      baseFoodProductionRateNode: cc.Node,
      baseFoodProductionRateLabel: cc.Label,
      baseFoodProductionRateAdditionLabel: cc.Label,
      onDutyDurationNode: cc.Node,
      onDutyDurationLabel: cc.Label,
      onDutyDurationAdditionRichText: cc.RichText,
      restDurationNode: cc.Node,
      restDurationLabel: cc.Label,
      restDurationAdditionRichText: cc.RichText,
    },
    
    // The return value means some diff is rendered.
    render(type, msg) {
      const self = this;
      self.goldStorage.active = false;
      self.chairNode.active = false;
      self.baseGoldProductionRateNode.active = false;
      self.baseFoodProductionRateNode.active = false;
      self.onDutyDurationNode.active = false;
      self.restDurationNode.active = false;
      let rendered = true;
      switch (type) {
        case 'goldLimitAddition':
          rendered = self.renderGoldStorage(msg);
          break;
        case 'chairCountAddition':
          rendered = self.renderChairCountAddition(msg);
          break;
        case 'baseGoldProductionRate':
          rendered = self.renderBaseGoldProductionRate(msg);
          break;
        case 'baseFoodProductionRate':
          rendered = self.renderBaseFoodProductionRate(msg);
          break;
        case 'onDutyDuration':
          rendered = self.renderOnDutyDuration(msg);
          break;
        case 'restDuration':
          rendered = self.renderRestDuration(msg);
          break;
        default:
          rendered = false;
          cc.warn('Unknown DiffInfoLine type: ' + type);
          break;
      }
      return rendered;
    },

    renderGoldStorage({gold, oldValue, newValue, diff}) {
      const self = this;
      if (diff == 0) {
        return false;
      }
      self.goldStorage.active = true;
      self.goldStorageLabel.string = cc.js.formatStr(i18n.t("DiffInfoLine.Tip.goldStorage"), oldValue);
      self.goldStorageAdditionLabel.string = cc.js.formatStr(i18n.t("Tip.additionTip"), diff);
      return true;
    },
    renderChairCountAddition([oldValue, newValue]) {
      const self = this;
      if (oldValue == newValue) {
        return false;
      }
      self.chairNode.active = true;
      self.chairCountLabel.string = cc.js.formatStr(i18n.t("DiffInfoLine.Tip.chairCount"), oldValue);
      self.chairCountAdditionLabel.string = cc.js.formatStr(i18n.t("Tip.additionTip"), newValue - oldValue);
      return true;
    },
    renderBaseGoldProductionRate([oldValue, newValue]) {
      const self = this;
      if (oldValue == newValue) {
        return false;
      }
      self.baseGoldProductionRateNode.active = true;
      self.baseGoldProductionRateLabel.string = cc.js.formatStr(i18n.t("DiffInfoLine.Tip.idleGameGoldProductionRate"), oldValue);
      self.baseGoldProductionRateAdditionLabel.string = cc.js.formatStr(i18n.t("Tip.additionTip"), newValue - oldValue);
      return true;
    },
    renderBaseFoodProductionRate([oldValue, newValue]) {
      const self = this;
      if (oldValue == newValue) {
        return false;
      }
      self.baseFoodProductionRateNode.active = true;
      self.baseFoodProductionRateLabel.string = cc.js.formatStr(i18n.t("DiffInfoLine.Tip.idleGameFoodProductionRate"), oldValue);
      self.baseFoodProductionRateAdditionLabel.string = cc.js.formatStr(i18n.t("Tip.additionTip"), newValue - oldValue);
      return true;
    },
    renderOnDutyDuration([oldValue, newValue]) {
      const self = this;
      self.onDutyDurationNode.active = true;
      self.onDutyDurationLabel.string = window.secondsToNaturalExp(oldValue);
      if (oldValue == newValue) {
        self.onDutyDurationAdditionRichText.string = '';
      } else {
        self.onDutyDurationAdditionRichText.string = cc.js.formatStr(
          i18n.t('Tip.boldFont'), 
          cc.js.formatStr(
            i18n.t(newValue > oldValue ? 'Tip.additionTip' : 'Tip.additionMinusTip'), 
            window.secondsToNaturalExp(Math.abs(newValue - oldValue))
          )
        );
      }
      return true;
    },
    renderRestDuration([oldValue, newValue]) {
      const self = this;
      self.restDurationNode.active = true;
      self.restDurationLabel.string = window.secondsToNaturalExp(oldValue);
      if (oldValue == newValue) {
        self.restDurationAdditionRichText.string = '';
      } else {
        self.restDurationAdditionRichText.string = cc.js.formatStr(
          i18n.t('Tip.boldFont'),
          cc.js.formatStr(
            i18n.t(newValue > oldValue ? 'Tip.additionTip' : 'Tip.additionMinusTip'),
            window.secondsToNaturalExp(Math.abs(newValue - oldValue))
          )
        );
      }
      return true;
    },
});
