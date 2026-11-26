/**
 * 牌阵配置（数据与视图分离）
 *
 * 新增一个牌阵只需在 SPREADS 数组中加一个对象，视图与逻辑会自动渲染。
 *
 * 字段说明：
 *  - id            唯一 ID
 *  - name          玩法名称（Tab 显示）
 *  - subtitle      副标题
 *  - count         抽牌张数（自由抽牌为 null，运行时由用户指定）
 *  - layout        布局类型：'line'（横排/网格流式）| 'choice'（左右对比）| 'cross'（凯尔特十字）
 *  - free          是否为自由抽牌
 *  - reversed      该牌阵是否允许逆位（受全局设置约束）
 *  - question      是否需要前置问题输入框
 *  - positions     位置数组：{ id, label（位置含义名）, meaning（解释用描述） }
 *                  cross 布局额外用 x/y 由 render.js 中的 COORDS 表按 id 映射
 */
(function () {
  'use strict';
  var App = window.TarotApp = window.TarotApp || {};

  var SPREADS = [
    {
      id: 'daily',
      name: '单张牌',
      subtitle: '每日指引 · 抽 1 张',
      count: 1,
      layout: 'line',
      free: false,
      reversed: true,
      question: false,
      positions: [
        { id: 'p0', label: '今日指引', meaning: '今天的主题与能量指引' }
      ]
    },
    {
      id: 'triangle',
      name: '圣三角',
      subtitle: '过去 · 现在 · 未来',
      count: 3,
      layout: 'line',
      free: false,
      reversed: true,
      question: true,
      positions: [
        { id: 'p0', label: '过去', meaning: '影响现状的过去因素' },
        { id: 'p1', label: '现在', meaning: '当下的核心状况' },
        { id: 'p2', label: '未来', meaning: '可能的发展趋势' }
      ]
    },
    {
      id: 'choice',
      name: '二选一',
      subtitle: '抉择牌阵 · 左右对比',
      count: 2,
      layout: 'choice',
      free: false,
      reversed: true,
      question: true,
      positions: [
        { id: 'p0', label: '选择 A', meaning: '选择 A 的走向与结果' },
        { id: 'p1', label: '选择 B', meaning: '选择 B 的走向与结果' }
      ]
    },
    {
      id: 'celtic',
      name: '凯尔特十字',
      subtitle: '十张牌 · 经典牌阵',
      count: 10,
      layout: 'cross',
      free: false,
      reversed: true,
      question: true,
      positions: [
        { id: 'p0', label: '现状', meaning: '当前的核心状况' },
        { id: 'p1', label: '挑战', meaning: '面前的挑战或阻力' },
        { id: 'p2', label: '过去', meaning: '影响现在的过去基础' },
        { id: 'p3', label: '未来', meaning: '即将到来的近期发展' },
        { id: 'p4', label: '意识', meaning: '你清醒认知到的目标与想法' },
        { id: 'p5', label: '潜意识', meaning: '隐藏的内心动力与根基' },
        { id: 'p6', label: '建议', meaning: '给你的行动建议' },
        { id: 'p7', label: '外部环境', meaning: '外界的他人与环境因素' },
        { id: 'p8', label: '希望与恐惧', meaning: '内心的期望与担忧' },
        { id: 'p9', label: '结果', meaning: '综合走向与最终结果' }
      ]
    },
    {
      id: 'relationship',
      name: '关系牌阵',
      subtitle: '五张 · 关系解读',
      count: 5,
      layout: 'line',
      free: false,
      reversed: true,
      question: true,
      positions: [
        { id: 'p0', label: '你', meaning: '你在这段关系中的状态' },
        { id: 'p1', label: '对方', meaning: '对方的状态与态度' },
        { id: 'p2', label: '关系现状', meaning: '两人之间的实际状况' },
        { id: 'p3', label: '阻碍', meaning: '关系中的障碍与问题' },
        { id: 'p4', label: '建议', meaning: '改善关系的建议' }
      ]
    },
    {
      id: 'free',
      name: '自由抽牌',
      subtitle: '自定义张数 · 1~10',
      count: null,
      layout: 'line',
      free: true,
      reversed: true,
      question: true,
      positions: null
    }
  ];

  App.spreads = SPREADS;
  App.getSpread = function (id) {
    return SPREADS.find(function (s) { return s.id === id; }) || null;
  };
})();
