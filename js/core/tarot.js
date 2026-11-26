/**
 * 抽牌与解读核心逻辑（纯数据，与视图无关）
 */
(function () {
  'use strict';
  var App = window.TarotApp = window.TarotApp || {};

  var core = {
    /** Fisher-Yates 洗牌（不修改原数组） */
    shuffle: function (arr) {
      var a = arr.slice();
      for (var i = a.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var t = a[i]; a[i] = a[j]; a[j] = t;
      }
      return a;
    },

    /**
     * 抽牌
     * @param {number} count        张数
     * @param {boolean} allowReversed 是否允许逆位
     * @returns {Array<{card:object, reversed:boolean}>}
     */
    draw: function (count, allowReversed) {
      var deck = this.shuffle(App.cards);
      var drawn = deck.slice(0, count);
      return drawn.map(function (c) {
        return { card: c, reversed: !!allowReversed && Math.random() < 0.5 };
      });
    },

    /**
     * 生成可一键复制的占卜结果文本（纯文本，\n 换行）
     * 内容：玩法名 + 问题（如有）+ 各位置的牌名/正逆位/关键词/含义
     * @param {object} spread    牌阵配置
     * @param {Array}  drawn     抽牌结果
     * @param {string} question  用户问题（可为空）
     * @param {Array}  positions 实际位置数组（自由抽牌运行时生成）
     * @returns {string}
     */
    buildResult: function (spread, drawn, question, positions) {
      var lines = [];
      lines.push('玩法：' + spread.name);
      if (question && question.trim()) {
        lines.push('问题：' + question.trim());
      }
      lines.push('');

      var posArr = positions || spread.positions || [];
      drawn.forEach(function (d, i) {
        var pos = posArr[i] || { label: '第 ' + (i + 1) + ' 张' };
        var orient = d.reversed ? '逆位' : '正位';
        var meaning = d.reversed ? d.card.meaningReversed : d.card.meaningUpright;
        var kws = d.card.keywords.join(' · ');
        lines.push('【' + pos.label + '】' + d.card.nameZh + '（' + orient + '）');
        lines.push('关键词：' + kws);
        lines.push('含义：' + meaning);
        lines.push('');
      });

      return lines.join('\n').replace(/\n+$/, '');
    }
  };

  App.core = core;
})();
