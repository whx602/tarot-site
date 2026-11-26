/**
 * 套系（皮肤）管理
 * 每个套系 = 一整套牌面图片的集合。元数据存 localStorage，图片存 IndexedDB/localStorage。
 * 内置一个不可删除的「经典占位」默认套系（初始无任何自定义图片，全部显示占位图）。
 */
(function () {
  'use strict';
  var App = window.TarotApp = window.TarotApp || {};

  var LS_SKINS = 'tarot_skins';
  var LS_CURRENT = 'tarot_current_skin';
  var DEFAULT_ID = 'default';

  function genId() {
    return 'skin_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7);
  }

  var skins = {
    list: [],
    currentId: DEFAULT_ID,

    /** 初始化：加载套系列表，确保默认套系存在 */
    init: function () {
      var saved = App.storage.getJSON(LS_SKINS, null);
      if (Array.isArray(saved) && saved.length) {
        this.list = saved;
      } else {
        this.list = [{ id: DEFAULT_ID, name: '经典占位', builtin: true, createdAt: Date.now() }];
      }
      this.currentId = App.storage.getJSON(LS_CURRENT, DEFAULT_ID);
      if (!this.get(this.currentId)) this.currentId = DEFAULT_ID;
      this.persist();
    },

    persist: function () {
      App.storage.setJSON(LS_SKINS, this.list);
      App.storage.setJSON(LS_CURRENT, this.currentId);
    },

    get: function (id) {
      return this.list.find(function (s) { return s.id === id; }) || null;
    },

    /** 返回全部套系（数组副本） */
    all: function () {
      return this.list.slice();
    },

    getCurrent: function () {
      return this.get(this.currentId) || this.get(DEFAULT_ID);
    },

    /** 新建套系，返回新 ID */
    create: function (name) {
      var id = genId();
      this.list.push({
        id: id,
        name: name || ('套系 ' + this.list.length),
        createdAt: Date.now()
      });
      this.persist();
      return id;
    },

    rename: function (id, name) {
      var s = this.get(id);
      if (s) {
        s.name = name;
        this.persist();
      }
    },

    /** 删除套系（默认套系受保护，且至少保留一个） */
    remove: function (id) {
      if (id === DEFAULT_ID) return false;
      if (this.list.length <= 1) return false;
      this.list = this.list.filter(function (s) { return s.id !== id; });
      if (this.currentId === id) this.currentId = DEFAULT_ID;
      this.persist();
      App.storage.deleteSkinImages(id); // 异步清理图片
      return true;
    },

    switchTo: function (id) {
      if (this.get(id)) {
        this.currentId = id;
        this.persist();
      }
    },

    /** 读取某套系某张牌的图片（dataURL 或 null） */
    getCardImage: function (skinId, cardId) {
      return App.storage.getImage(skinId + ':' + cardId);
    },

    /** 保存某套系某张牌的图片 */
    saveCardImage: function (skinId, cardId, dataURL) {
      return App.storage.saveImage(skinId + ':' + cardId, dataURL);
    },

    /** 删除某套系某张牌的自定义图片（恢复占位） */
    deleteCardImage: function (skinId, cardId) {
      return App.storage.deleteImage(skinId + ':' + cardId);
    },

    /** 导出套系为可 JSON 序列化的数据（含内嵌 base64 图片） */
    exportSkin: function (id) {
      var s = this.get(id);
      if (!s) return Promise.reject(new Error('套系不存在'));
      var images = {};
      var jobs = App.cards.map(function (c) {
        return this.getCardImage(id, c.id).then(function (img) {
          if (img) images[c.id] = img;
        });
      }, this);
      return Promise.all(jobs).then(function () {
        return {
          type: 'tarot-skin',
          version: 1,
          skin: { id: s.id, name: s.name, createdAt: s.createdAt },
          images: images
        };
      });
    },

    /** 导入套系数据（JSON），返回新套系 ID */
    importSkin: function (data) {
      if (!data || data.type !== 'tarot-skin' || !data.skin || !data.skin.name) {
        return Promise.reject(new Error('无效的套系文件'));
      }
      var id = genId();
      this.list.push({
        id: id,
        name: data.skin.name + '（导入）',
        createdAt: Date.now()
      });
      this.persist();

      var imgs = data.images || {};
      var jobs = [];
      Object.keys(imgs).forEach(function (cardId) {
        if (App.getCard(cardId) && typeof imgs[cardId] === 'string') {
          jobs.push(this.saveCardImage(id, cardId, imgs[cardId]));
        }
      }, this);
      return Promise.all(jobs).then(function () { return id; });
    }
  };

  App.skins = skins;
  App.SKINS_DEFAULT_ID = DEFAULT_ID;
})();
