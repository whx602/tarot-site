/**
 * 弹窗模块（modal.js）—— 牌义详情、皮肤管理、设置、图片上传
 *
 * 公开 API（供 render.js / main.js 调用）：
 *  - openCard(drawn)        打开单张牌详情弹窗
 *  - openSkin()             打开皮肤管理弹窗
 *  - openSettings()         打开设置弹窗
 *  - openUpload(card)       打开单张牌图片上传弹窗
 *  - close(id)              关闭指定弹窗（默认关当前所有）
 *  - processImage(file)     图片处理：cover 裁剪 2:3 → 600×900 → JPEG
 */
(function () {
  'use strict';
  var App = window.TarotApp = window.TarotApp || {};

  var ROMAN = ['0', 'Ⅰ', 'Ⅱ', 'Ⅲ', 'Ⅳ', 'Ⅴ', 'Ⅵ', 'Ⅶ', 'Ⅷ', 'Ⅸ', 'Ⅹ',
    'Ⅺ', 'Ⅻ', 'ⅩⅢ', 'ⅩⅣ', 'ⅩⅤ', 'ⅩⅥ', 'ⅩⅦ', 'ⅩⅧ', 'ⅩⅨ', 'ⅩⅩ', 'ⅩⅪ'];

  var TARGET_W = 600, TARGET_H = 900, JPEG_Q = 0.82;

  // ---------------- 工具 ----------------

  function el(id) { return document.getElementById(id); }

  function h(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function numLabel(card) {
    if (card.arcana === 'major') return ROMAN[card.num] || String(card.num);
    if (card.num === 1) return 'A';
    if (card.num === 11) return '侍';
    if (card.num === 12) return '骑';
    if (card.num === 13) return '后';
    if (card.num === 14) return '王';
    return String(card.num);
  }

  // ---------------- 弹窗基础 ----------------

  function show(id) {
    var m = el(id);
    if (m) m.classList.add('show');
  }

  function close(id) {
    if (id) {
      var m = el(id);
      if (m) m.classList.remove('show');
      return;
    }
    Array.prototype.forEach.call(document.querySelectorAll('.modal.show'), function (m) {
      m.classList.remove('show');
    });
  }

  // 点击遮罩关闭
  function bindOverlayClose() {
    document.addEventListener('click', function (e) {
      if (e.target.classList && e.target.classList.contains('modal')) {
        e.target.classList.remove('show');
      }
    });
  }

  // ---------------- 图片处理 ----------------

  function loadImage(src) {
    return new Promise(function (resolve, reject) {
      var img = new Image();
      img.onload = function () { resolve(img); };
      img.onerror = reject;
      img.src = src;
    });
  }

  // cover 裁剪：保持 2:3，取中心最大区域，缩放至 600×900，输出 JPEG
  function processImage(file) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onerror = reject;
      reader.onload = function () {
        loadImage(reader.result).then(function (img) {
          var ratio = 2 / 3;
          var iw = img.naturalWidth, ih = img.naturalHeight;
          var srcW, srcH, sx, sy;
          if (iw / ih > ratio) {
            srcH = ih;
            srcW = ih * ratio;
            sx = (iw - srcW) / 2;
            sy = 0;
          } else {
            srcW = iw;
            srcH = iw / ratio;
            sx = 0;
            sy = (ih - srcH) / 2;
          }
          var canvas = document.createElement('canvas');
          canvas.width = TARGET_W;
          canvas.height = TARGET_H;
          var ctx = canvas.getContext('2d');
          ctx.drawImage(img, sx, sy, srcW, srcH, 0, 0, TARGET_W, TARGET_H);
          resolve(canvas.toDataURL('image/jpeg', JPEG_Q));
        }).catch(reject);
      };
      reader.readAsDataURL(file);
    });
  }

  // ---------------- 牌义详情弹窗 ----------------

  function openCard(drawn, positionLabel) {
    var card = drawn.card;
    var posText = positionLabel || (drawn.positionLabel ? drawn.positionLabel : '');
    var imgHTML = drawn.img
      ? '<img class="detail-img" src="' + drawn.img + '" alt="' + h(card.nameZh) + '">'
      : '<div class="detail-img-wrap">' + App.render.placeholderHTML(card) + '</div>';

    var suitLine = '';
    if (card.arcana === 'minor') {
      suitLine = '<span class="tag">元素 · ' + h(App.SUITS[card.suit].element) + '</span>';
      if (card.zodiac) suitLine += '<span class="tag">' + h(card.zodiac) + '</span>';
    } else {
      suitLine = '<span class="tag">大阿卡纳</span>';
    }

    var keywords = card.keywords.map(function (k) {
      return '<span class="kw">' + h(k) + '</span>';
    }).join('');

    el('cardModalBody').innerHTML =
      '<div class="detail-top">' +
        '<div class="detail-left">' + imgHTML + '</div>' +
        '<div class="detail-right">' +
          '<div class="detail-name">' + h(card.nameZh) + '</div>' +
          '<div class="detail-en">' + h(card.nameEn) + '</div>' +
          '<div class="detail-num">' + numLabel(card) + ' · ' + (drawn.reversed ? '逆位' : '正位') + '</div>' +
          (posText ? '<div class="detail-pos">位置 · ' + h(posText) + '</div>' : '') +
          '<div class="detail-tags">' + suitLine + '</div>' +
          '<div class="detail-kw">' + keywords + '</div>' +
        '</div>' +
      '</div>' +
      '<div class="detail-mean">' +
        '<div class="mean-block"><h4>正位含义</h4><p>' + h(card.meaningUpright) + '</p></div>' +
        '<div class="mean-block"><h4>逆位含义</h4><p>' + h(card.meaningReversed) + '</p></div>' +
      '</div>' +
      '<div class="detail-advice"><h4>✦ 建议</h4><p>' + h(card.advice) + '</p></div>';

    show('cardModal');
  }

  // ---------------- 皮肤管理弹窗 ----------------

  function openSkin() {
    renderSkinList();
    renderGallery();
    show('skinModal');
  }

  function renderSkinList() {
    var list = el('skinList');
    var cur = App.skins.getCurrent();
    var html = '';
    App.skins.all().forEach(function (s) {
      var active = s.id === cur.id;
      html += '<div class="skin-item' + (active ? ' active' : '') + '" data-skin-id="' + h(s.id) + '">' +
        '<div class="skin-item-name">' + h(s.name) + (active ? ' <span class="skin-cur-tag">当前</span>' : '') + '</div>' +
        '<div class="skin-item-actions">' +
          (active ? '' : '<button class="btn-mini" data-act="switch">使用</button>') +
          '<button class="btn-mini" data-act="rename">重命名</button>' +
          ((active || s.builtin) ? '' : '<button class="btn-mini" data-act="delete">删除</button>') +
          '<button class="btn-mini" data-act="export">导出</button>' +
        '</div>' +
      '</div>';
    });
    list.innerHTML = html || '<div class="empty-hint">暂无套系</div>';

    Array.prototype.forEach.call(list.querySelectorAll('.skin-item'), function (item) {
      item.addEventListener('click', function (e) {
        var btn = e.target.closest('[data-act]');
        if (!btn) return;
        var skinId = item.getAttribute('data-skin-id');
        var act = btn.getAttribute('data-act');
        skinAction(act, skinId);
      });
    });
  }

  function skinAction(act, skinId) {
    var skin = App.skins.get(skinId);
    if (!skin) return;
    if (act === 'switch') {
      App.skins.switchTo(skinId);
      App.render.refreshSkin();
      renderSkinList();
      renderGallery();
      refreshCurrentLabel();
    } else if (act === 'rename') {
      var name = prompt('请输入新名称：', skin.name);
      if (name && name.trim()) {
        App.skins.rename(skinId, name.trim());
        renderSkinList();
        refreshCurrentLabel();
      }
    } else if (act === 'delete') {
      if (!confirm('确定删除套系「' + skin.name + '」吗？其图片将一并删除。')) return;
      App.skins.remove(skinId);
      renderSkinList();
      refreshCurrentLabel();
      renderGallery();
    } else if (act === 'export') {
      App.skins.exportSkin(skinId).then(function (data) {
        downloadJSON(data, skin.name);
      });
    }
  }

  function refreshCurrentLabel() {
    var cur = App.skins.getCurrent();
    el('skinCurrentName').textContent = cur ? cur.name : '—';
  }

  function renderGallery() {
    var grid = el('skinGallery');
    grid.innerHTML = '';
    var skinId = App.skins.currentId;
    App.cards.forEach(function (card) {
      var tile = document.createElement('div');
      tile.className = 'gallery-tile';
      tile.setAttribute('data-card-id', card.id);
      tile.innerHTML =
        '<div class="gallery-ph">' + App.render.placeholderHTML(card) + '</div>' +
        '<div class="gallery-name">' + h(card.nameZh) + '</div>';
      tile.addEventListener('click', function () {
        openUpload(card);
      });
      grid.appendChild(tile);

      App.skins.getCardImage(skinId, card.id).then(function (img) {
        if (img) {
          var ph = tile.querySelector('.gallery-ph');
          ph.innerHTML = '<img src="' + img + '" alt="' + h(card.nameZh) + '">';
          tile.classList.add('has-img');
        }
      });
    });
  }

  function createSkin() {
    var name = prompt('请输入新套系名称：');
    if (!name || !name.trim()) return;
    var id = App.skins.create(name.trim());
    App.skins.switchTo(id);
    App.render.refreshSkin();
    renderSkinList();
    renderGallery();
    refreshCurrentLabel();
  }

  function importSkin(file) {
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var data = JSON.parse(reader.result);
        App.skins.importSkin(data).then(function (id) {
          App.skins.switchTo(id);
          App.render.refreshSkin();
          renderSkinList();
          renderGallery();
          refreshCurrentLabel();
          alert('套系导入成功！');
        }).catch(function (err) {
          alert('导入失败：' + (err && err.message ? err.message : err));
        });
      } catch (e) {
        alert('导入失败：JSON 解析错误');
      }
    };
    reader.readAsText(file);
  }

  function downloadJSON(data, name) {
    var blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'tarot-skin-' + (name || 'export') + '.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // ---------------- 设置弹窗 ----------------

  function openSettings() {
    el('setAllowReversed').checked = !!App.settings.allowReversed;
    el('setAnimations').checked = App.settings.animations !== false;
    show('settingsModal');
  }

  function applySettings() {
    App.settings.allowReversed = el('setAllowReversed').checked;
    App.settings.animations = el('setAnimations').checked;
    if (typeof App.saveSettings === 'function') App.saveSettings();
    if (typeof App.applyBodyAnimClass === 'function') App.applyBodyAnimClass();
    close('settingsModal');
  }

  // ---------------- 上传弹窗 ----------------

  var uploadCard = null;
  var uploadPreview = null;

  function openUpload(card) {
    uploadCard = card;
    uploadPreview = null;
    el('uploadTitle').textContent = '上传牌面 · ' + card.nameZh;
    el('uploadPreview').innerHTML =
      '<div class="upload-hint">拖拽图片到此处，或点击选择文件</div>';
    el('uploadDrop').classList.remove('has-file');
    show('uploadModal');
  }

  function setUploadFile(file) {
    if (!file) return;
    if (!/^image\//.test(file.type)) {
      alert('请选择图片文件');
      return;
    }
    processImage(file).then(function (dataURL) {
      uploadPreview = dataURL;
      el('uploadPreview').innerHTML = '<img src="' + dataURL + '" alt="预览">';
      el('uploadDrop').classList.add('has-file');
    }).catch(function () {
      alert('图片处理失败，请重试');
    });
  }

  function saveUpload() {
    if (!uploadCard || !uploadPreview) {
      alert('请先选择图片');
      return;
    }
    App.skins.saveCardImage(App.skins.currentId, uploadCard.id, uploadPreview).then(function () {
      App.render.refreshSkin();
      renderGallery();
      close('uploadModal');
    });
  }

  function clearUpload() {
    if (!uploadCard) return;
    App.skins.deleteCardImage(App.skins.currentId, uploadCard.id).then(function () {
      App.render.refreshSkin();
      renderGallery();
      close('uploadModal');
    });
  }

  // ---------------- 事件绑定 ----------------

  function bindEvents() {
    // 皮肤弹窗按钮
    el('skinNewBtn').addEventListener('click', createSkin);
    el('skinImportBtn').addEventListener('click', function () {
      el('skinImportFile').click();
    });
    el('skinImportFile').addEventListener('change', function (e) {
      if (e.target.files && e.target.files[0]) importSkin(e.target.files[0]);
      e.target.value = '';
    });

    // 设置
    el('setSaveBtn').addEventListener('click', applySettings);

    // 上传：拖拽 + 点击 + 按钮
    var drop = el('uploadDrop');
    drop.addEventListener('click', function () {
      el('uploadFile').click();
    });
    el('uploadFile').addEventListener('change', function (e) {
      if (e.target.files && e.target.files[0]) setUploadFile(e.target.files[0]);
      e.target.value = '';
    });
    ['dragover', 'dragenter'].forEach(function (ev) {
      drop.addEventListener(ev, function (e) {
        e.preventDefault();
        drop.classList.add('dragover');
      });
    });
    ['dragleave', 'drop'].forEach(function (ev) {
      drop.addEventListener(ev, function (e) {
        e.preventDefault();
        drop.classList.remove('dragover');
      });
    });
    drop.addEventListener('drop', function (e) {
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        setUploadFile(e.dataTransfer.files[0]);
      }
    });
    el('uploadSaveBtn').addEventListener('click', saveUpload);
    el('uploadClearBtn').addEventListener('click', clearUpload);

    // 关闭按钮（.modal-close 或 data-close）
    document.addEventListener('click', function (e) {
      var c = e.target.closest ? e.target.closest('.modal-close') : null;
      if (c) {
        var m = c.closest('.modal');
        if (m) m.classList.remove('show');
      }
    });

    bindOverlayClose();
  }

  var modal = {
    openCard: openCard,
    openSkin: openSkin,
    openSettings: openSettings,
    openUpload: openUpload,
    close: close,
    processImage: processImage
  };

  App.modal = modal;

  // 等待 DOM 就绪后绑定（main.js 在脚本末尾也会确保顺序）
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindEvents);
  } else {
    bindEvents();
  }
})();
