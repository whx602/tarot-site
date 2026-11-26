/**
 * 入口（main.js）—— 初始化各模块、绑定顶部导航与操作按钮、切换牌阵
 */
(function () {
  'use strict';
  var App = window.TarotApp = window.TarotApp || {};

  var LS_SETTINGS = 'tarot_settings';

  // 全局设置（允许逆位 / 动画开关）
  App.settings = { allowReversed: true, animations: true };

  App.saveSettings = function () {
    App.storage.setJSON(LS_SETTINGS, App.settings);
  };

  function loadSettings() {
    var s = App.storage.getJSON(LS_SETTINGS, null);
    if (s && typeof s === 'object') {
      App.settings.allowReversed = s.allowReversed !== false;
      App.settings.animations = s.animations !== false;
    }
  }

  var currentSpreadId = null;

  /** 根据 App.spreads 渲染顶部玩法 Tab（新增牌阵只需在 spreads.js 加对象） */
  function renderTabs() {
    var nav = document.getElementById('tabs');
    nav.innerHTML = '';
    App.spreads.forEach(function (sp) {
      var btn = document.createElement('button');
      btn.className = 'tab' + (sp.id === currentSpreadId ? ' active' : '');
      btn.textContent = sp.name;
      btn.setAttribute('data-spread-id', sp.id);
      btn.addEventListener('click', function () { selectSpread(sp.id); });
      nav.appendChild(btn);
    });
  }

  function selectSpread(id) {
    var changed = currentSpreadId !== id;
    currentSpreadId = id;
    App.render.showSpread(App.getSpread(id));
    if (changed) {
      var q = document.getElementById('questionInput');
      if (q) q.value = '';
    }
    Array.prototype.forEach.call(document.querySelectorAll('#tabs .tab'), function (b) {
      b.classList.toggle('active', b.getAttribute('data-spread-id') === id);
    });
  }

  /** 复制文本到剪贴板（file:// 下 navigator.clipboard 不可用时用 execCommand 兜底） */
  function copyText(text) {
    function fallback() {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.top = '0';
      ta.style.left = '0';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      try { document.execCommand('copy'); } catch (e) { /* 忽略 */ }
      document.body.removeChild(ta);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(flashCopied).catch(function () {
        fallback();
        flashCopied();
      });
    } else {
      fallback();
      flashCopied();
    }
  }

  function flashCopied() {
    var btn = document.getElementById('copyResultBtn');
    if (!btn) return;
    var old = btn.textContent;
    btn.textContent = '已复制 ✓';
    setTimeout(function () { btn.textContent = old; }, 1500);
  }

  function updateSkinLabel() {
    var cur = App.skins.getCurrent();
    var el = document.getElementById('skinCurrentName');
    if (el) el.textContent = cur ? cur.name : '—';
  }

  function applyBodyAnimClass() {
    document.body.classList.toggle('no-anim', !App.settings.animations);
  }

  /** 生成星空/星尘背景（纯 JS 注入小星星，含少量流星） */
  function generateStars() {
    var wrap = document.getElementById('stars');
    if (!wrap) return;
    var frag = document.createDocumentFragment();
    for (var i = 0; i < 140; i++) {
      var s = document.createElement('span');
      s.className = 'star';
      s.style.left = (Math.random() * 100) + '%';
      s.style.top = (Math.random() * 100) + '%';
      s.style.width = s.style.height = (1 + Math.random() * 2.2).toFixed(1) + 'px';
      s.style.animationDelay = (Math.random() * 6).toFixed(2) + 's';
      s.style.animationDuration = (2.5 + Math.random() * 4).toFixed(2) + 's';
      frag.appendChild(s);
    }
    for (var j = 0; j < 3; j++) {
      var m = document.createElement('span');
      m.className = 'shooting-star';
      m.style.top = (10 + Math.random() * 40) + '%';
      m.style.left = (20 + Math.random() * 60) + '%';
      m.style.animationDelay = (4 + Math.random() * 10) + 's';
      frag.appendChild(m);
    }
    wrap.appendChild(frag);
  }

  function init() {
    App.storage.init();
    loadSettings();
    App.skins.init();
    applyBodyAnimClass();
    generateStars();

    updateSkinLabel();
    renderTabs();

    // 默认选中第一个牌阵
    if (App.spreads.length) selectSpread(App.spreads[0].id);

    // 操作按钮
    document.getElementById('drawBtn').addEventListener('click', function () { App.render.startDraw(); });
    document.getElementById('revealAllBtn').addEventListener('click', function () { App.render.revealAll(); });
    document.getElementById('reshuffleBtn').addEventListener('click', function () { App.render.reshuffle(); });
    document.getElementById('resetBtn').addEventListener('click', function () { App.render.reset(); });

    // 顶部入口
    document.getElementById('skinBtn').addEventListener('click', function () { App.modal.openSkin(); });
    document.getElementById('settingsBtn').addEventListener('click', function () { App.modal.openSettings(); });

    // 一键复制占卜结果
    document.getElementById('copyResultBtn').addEventListener('click', function () {
      copyText(App.render.getResultText());
    });

    // 自由抽牌：张数变化时重建位置
    var freeCount = document.getElementById('freeCount');
    if (freeCount) {
      freeCount.addEventListener('input', function () {
        var sp = currentSpreadId ? App.getSpread(currentSpreadId) : null;
        if (sp && sp.free) App.render.showSpread(sp);
      });
    }
  }

  App.updateSkinLabel = updateSkinLabel;
  App.applyBodyAnimClass = applyBodyAnimClass;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
