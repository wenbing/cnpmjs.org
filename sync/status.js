/*!
 * cnpmjs.org - sync/status.js
 *
 * Copyright(c) cnpmjs.org and other contributors.
 * MIT Licensed
 *
 * Authors:
 *  dead_horse <dead_horse@qq.com> (http://deadhorse.me)
 */

'use strict';

/**
 * Module dependencies.
 */

var debug = require('debug')('cnpmjs.org:sync:status');
var utility = require('utility');
var Total = require('../proxy/total');

function Status(options) {
  this.need = options.need;
  this.lastSyncModule = '';
  this.successes = 0;
  this.fails = 0;
  this.left = options.need;
}

Status.prototype.log = function (syncDone) {
  var params = {
    syncStatus: syncDone ? 0 : 1,
    need: this.need,
    success: this.successes,
    fail: this.fails,
    left: this.left,
    lastSyncModule: this.lastSyncModule,
  };
  Total.updateSyncNum(params, utility.noop);
};

Status.prototype.start = function () {
  if (this.started) {
    return;
  }
  this.started = true;
  //every 30s log it into mysql
  this.timer = setInterval(this.log.bind(this), 30000);
};

Status.init = function (options, worker) {
  var status = new Status(options);
  status.start();
  worker.on('success', function (moduleName) {
    debug('sync [%s] success', moduleName);
    status.lastSyncModule = moduleName;
    status.successes++;
    status.left--;
  });
  worker.on('fail', function () {
    status.fails++;
    status.left--;
  });
  worker.on('add', function () {
    status.left++;
  });

  worker.on('end', function () {
    status.started = false;
    status.log(true);
    clearInterval(status.timer);
  });
};

module.exports = Status;
