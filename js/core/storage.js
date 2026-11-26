/**
 * 图片持久化封装
 * 优先级：IndexedDB（主，容量大）→ localStorage（兜底，~5MB）→ 内存（临时，仅本次会话）
 * localStorage 仅用于元数据（套系列表、当前套系、设置）。
 * 所有图片以 dataURL 字符串存储，键为 `skinId:cardId`。
 */
(function () {
  'use strict';
  var App = window.TarotApp = window.TarotApp || {};

  var DB_NAME = 'tarot-card-images';
  var STORE = 'images';
  var LS_PREFIX = 'tarot_img_';

  var db = null;
  var idbOk = false;      // IndexedDB 是否可用
  var lsOk = true;        // localStorage 是否可用
  var memStore = {};      // 内存兜底

  function openDB() {
    return new Promise(function (resolve, reject) {
      if (!window.indexedDB) { reject(new Error('IndexedDB 不可用')); return; }
      var req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = function (e) {
        var d = e.target.result;
        if (!d.objectStoreNames.contains(STORE)) d.createObjectStore(STORE);
      };
      req.onsuccess = function (e) { resolve(e.target.result); };
      req.onerror = function (e) { reject(e.target.error); };
      req.onblocked = function () { reject(new Error('IndexedDB 被阻塞')); };
    });
  }

  function idbPut(key, value) {
    return new Promise(function (resolve, reject) {
      if (!db) { reject(new Error('无 db')); return; }
      var tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).put(value, key);
      tx.oncomplete = function () { resolve(); };
      tx.onerror = function (e) { reject(e.target.error); };
      tx.onabort = function (e) { reject(e.target.error); };
    });
  }

  function idbGet(key) {
    return new Promise(function (resolve, reject) {
      if (!db) { reject(new Error('无 db')); return; }
      var tx = db.transaction(STORE, 'readonly');
      var req = tx.objectStore(STORE).get(key);
      req.onsuccess = function () { resolve(req.result || null); };
      req.onerror = function (e) { reject(e.target.error); };
    });
  }

  function idbDelete(key) {
    return new Promise(function (resolve, reject) {
      if (!db) { reject(new Error('无 db')); return; }
      var tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).delete(key);
      tx.oncomplete = function () { resolve(); };
      tx.onerror = function (e) { reject(e.target.error); };
    });
  }

  function lsGet(key) {
    try { return localStorage.getItem(key); } catch (e) { return null; }
  }
  function lsSet(key, value) {
    try { localStorage.setItem(key, value); return true; } catch (e) { return false; }
  }
  function lsRemove(key) {
    try { localStorage.removeItem(key); return true; } catch (e) { return false; }
  }

  var storage = {
    /** 初始化存储层，检测 IndexedDB 可用性 */
    init: function () {
      // 探测 localStorage
      try {
        var k = '__tarot_ls_test__';
        localStorage.setItem(k, '1');
        localStorage.removeItem(k);
        lsOk = true;
      } catch (e) {
        lsOk = false;
      }
      return openDB().then(function (d) {
        db = d;
        idbOk = true;
      }).catch(function () {
        db = null;
        idbOk = false;
      });
    },

    /** 保存图片 dataURL */
    saveImage: function (key, dataURL) {
      if (idbOk) {
        return idbPut(key, dataURL).catch(function () {
          // IndexedDB 写入失败 → 降级
          if (!lsSet(LS_PREFIX + key, dataURL)) memStore[key] = dataURL;
        });
      }
      if (!lsSet(LS_PREFIX + key, dataURL)) memStore[key] = dataURL;
      return Promise.resolve();
    },

    /** 读取图片 dataURL，无则返回 null */
    getImage: function (key) {
      if (idbOk) {
        return idbGet(key).catch(function () {
          var v = lsGet(LS_PREFIX + key);
          return v || memStore[key] || null;
        });
      }
      var v = lsGet(LS_PREFIX + key);
      if (v) return Promise.resolve(v);
      return Promise.resolve(memStore[key] || null);
    },

    /** 删除单张图片 */
    deleteImage: function (key) {
      if (idbOk) {
        return idbDelete(key).catch(function () { lsRemove(LS_PREFIX + key); });
      }
      lsRemove(LS_PREFIX + key);
      delete memStore[key];
      return Promise.resolve();
    },

    /** 删除某个套系的全部图片（按皮肤 ID 前缀） */
    deleteSkinImages: function (skinId) {
      var prefix = skinId + ':';
      // 内存
      Object.keys(memStore).forEach(function (k) {
        if (k.indexOf(prefix) === 0) delete memStore[k];
      });
      // localStorage
      try {
        var toDel = [];
        for (var i = 0; i < localStorage.length; i++) {
          var k = localStorage.key(i);
          if (k && k.indexOf(LS_PREFIX + prefix) === 0) toDel.push(k);
        }
        toDel.forEach(function (k) { localStorage.removeItem(k); });
      } catch (e) { /* 忽略 */ }
      // IndexedDB：逐个删除该套系所有卡牌（78 张）
      if (idbOk && App.cards) {
        var jobs = App.cards.map(function (c) {
          return idbDelete(prefix + c.id).catch(function () {});
        });
        return Promise.all(jobs);
      }
      return Promise.resolve();
    },

    /** 读取 JSON 元数据 */
    getJSON: function (key, fallback) {
      var v = lsGet(key);
      if (!v) return fallback;
      try { return JSON.parse(v); } catch (e) { return fallback; }
    },

    /** 写入 JSON 元数据 */
    setJSON: function (key, value) {
      try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
      } catch (e) {
        return false;
      }
    },

    removeJSON: function (key) { return lsRemove(key); }
  };

  App.storage = storage;
})();
