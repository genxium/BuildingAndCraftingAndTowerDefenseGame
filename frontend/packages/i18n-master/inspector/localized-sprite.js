'use strict';

Vue.component('localized-sprite', {
  template: `
    <cc-array-prop :target.sync="target.spriteFrameSet"></cc-array-prop>
    <ui-prop name="Update Scene">
        <ui-button
        class="green tiny"
        @confirm="refresh"
        >
        Refresh
        </ui-button>
    </ui-prop>
  `,

  props: {
    target: {
      twoWay: true,
      type: Object,
    },
  },

  methods: {
    refresh: function () {
        let i18n = window.require('LanguageData');
        i18n.updateSceneRenderers();
    }
  }
});