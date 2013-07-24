var util = require('util');
var EventEmitter = require('events').EventEmitter;

var async = require('async');

var mongodb = require('mongodb');

var MongoTestDb = function MongoTestDb(spec) {
  EventEmitter.call(this);

  spec = spec || {};

  this.dbName = spec.dbName || 'test';
  this.dbHost = spec.dbHost || '127.0.0.1';
  this.dbPort = spec.dbPort || 27017;
  this.dbUser = spec.dbUser || null;
  this.dbPass = spec.dbPass || null;
  this.connection = false;

  this.state = 'closed';

  var Db = mongodb.Db;
  var DbServer = mongodb.Server;
  this.db = new Db(this.dbName, new DbServer(this.dbHost, this.dbPort), {w: 1});
};
util.inherits(MongoTestDb, EventEmitter);

module.exports = MongoTestDb;

/**
 * Open database connection.
 *
 * Make the raw connection available at this.connection.
 *
 * @param {Function} [collections]  optional object containing collection names and
 *                                  arrays of objects for the collection
 * @param {Function} [cb]  optional callback. Get's error if error occurred as
 *                         first parameter and the connection as a second parameter
 *
 * @events   'open'
 *           'error'   passed error
 */
MongoTestDb.prototype.open = function open(collections, cb) {
  if (typeof collections === 'function') {
    cb = collections;
    collections = {};
  }

  collections = collections || {};
  cb = cb || function () {};

  var that = this;
  if (this.state === 'opening') {
    process.nextTick(function() {
      cb(new Error('already opening'));
    });
    return;
  }
  this.state = 'opening';

  this.db.open(function (err, connection) {
    if (err) {
      that.state = 'error';
      cb(err);
      that.emit('error', err);
      return;
    }

    function proceed() {
      that.connection = connection;

      that.state = 'open';

      if (Object.keys(collections).length > 0) {
        that.load(collections, function (loadErr) {
          cb(loadErr, connection);
          that.emit('open');
        });
      } else {
        cb(null, connection);
        that.emit('open');
      }
    }

    if (that.dbUser || that.dbPass) {
      that.db.authenticate(that.dbUser, that.dbPass, function(err) {
        if (err) {
          that.state = 'error';
          cb(err);
          that.emit('error', err);
          return;
        }
        proceed();
      });
    } else {
      proceed();
    }
  });
};

/**
 * Close database connection.
 *
 * $params {Function} cb      optional callback is passed (err)
 *
 * @events   'close'
 *           'error'   passed error
 */
MongoTestDb.prototype.close = function close(cb) {
  if (!cb) { cb = function () {}; }

  if (this.state === 'closing') {
    process.nextTick(cb);
    return;
  }
  this.state = 'closing';

  var that = this;
  this.connection.dropDatabase(function (err) {
    if (err) {
      that.state = 'error';
      cb(err);
      that.emit('error', err);
      return;
    }

    that.connection.close();
    that.state = 'close';
    cb();
    that.emit('close');
  });
};

MongoTestDb.prototype.ready = function ready() {
  return this.state === 'open';
};

// load given collections
MongoTestDb.prototype.load = function load(collections, cb) {
  collections = collections || {};
  cb = cb || function () {};

  if (this.state !== 'open') {
    process.nextTick(function() {
      cb(new Error('not open while trying to load'));
    });
    return;
  }

  var collectionKeys = Object.keys(collections);
  var loaded = 0;

  // in case of 0 collections
  if (loaded === collectionKeys.length) {
    process.nextTick(cb);
    return;
  }

  var that = this;
  async.each(collectionKeys, function (collection, cb) {
    // save collection data
    that.db.collection(collection).remove({}, {w: 1}, function (removeErr) {
      if (removeErr) { return cb(removeErr); }

      var inserts = [];
      collections[collection].forEach(function (obj) {
        // date conversion: if a key has a sub object with a key '$date', transform it to a JS Date
        Object.keys(obj).forEach(function (key) {
          if (obj[key].$date) {
            obj[key] = new Date(obj[key].$date);
          }
        });

        inserts.push(function(cb) {
          that.db.collection(collection).insert(obj, {w: 1}, function (insertErr) {
            if (insertErr) { return cb(insertErr); }
            return cb(null);
          });
        });

      });
      async.series(inserts, cb);
    });
  }, cb);
};
