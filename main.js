var util = require('util');
var EventEmitter = require('events').EventEmitter;

var mongodb = require('mongodb');

var MongoTestDb = function MongoTestDb(spec) {
  EventEmitter.call(this);

  spec = spec || {};

  this.dbName = spec.dbName || 'test';
  this.dbHost = spec.dbHost || '127.0.0.1';
  this.dbPort = spec.dbPort || 27017;
  this.connection = false;

  this.state = 'closed';

  var Db = mongodb.Db;
  var DbServer = mongodb.Server;
  this.db = new Db(this.dbName, new DbServer(this.dbHost, this.dbPort), { w: 0 });
};
util.inherits(MongoTestDb, EventEmitter);

module.exports = MongoTestDb;

/**
 * Open database connection.
 *
 * @param {Function} [collections] optional object containing collection names and arrays of objects for the collection
 * @param {Function} [cb]          optional callback is passed (err, connection)
 *
 * @events   'open'    passed connection
 *           'error'   passed error
 */
MongoTestDb.prototype.open = function open(collections, cb) {
  if (collections && typeof collections === 'function') {
    cb = collections;
    collections = {};
  }

  collections = collections || {};
  cb = cb || function () {};

  if (this.state === 'opening') {
    cb(null, this.connection);
    return;
  }
  this.state = 'opening';

  var that = this;
  this.db.open(function (err, connection) {
    if (err) {
      that.state = 'error';
      cb(err);
      return that.emit('error', err);
    }

    that.connection = connection;

    that.state = 'open';

    if (Object.keys(collections).length > 0) {
      that.load(collections, function (err) {
        cb(err, connection);
        that.emit('open', connection);
      });
    } else {
      cb(err, connection);
      that.emit('open', connection);
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
    cb();
    return;
  }
  this.state = 'closing';

  var that = this;
  this.connection.dropDatabase(function (err) {
    if (err) {
      that.state = 'error';
      cb(err);
      return that.emit('error', err);
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
    return cb(new Error('not open while trying to load'));
  }

  var collectionKeys = Object.keys(collections);
  var loaded = 0;

  // in case of 0 collections
  if (loaded === collectionKeys.length) {
    return cb();
  }

  var that = this;
  collectionKeys.forEach(function (collection) {
    var collectionItemsLoaded = 0;
    var collectionItems = collections[collection].length;

    // save collection data
    that.db.collection(collection).remove({}, {w: 1}, function (err) {
      if (err) { return cb(err); }

      collections[collection].forEach(function (obj) {
        // date conversion: if a key has a sub object with a key '$date', transform it to a JS Date
        Object.keys(obj).forEach(function (key) {
          if (obj[key].$date) {
            obj[key] = new Date(obj[key].$date);
          }
        });

        that.db.collection(collection).insert(obj, {w: 1}, function (err) {
          if (err) { return cb(err); }

          collectionItemsLoaded++;
          if (collectionItemsLoaded === collectionItems) {
            loaded++;
            if (loaded === collectionKeys.length) {
              return cb();
            }
          }
        });
      });
    });
  });
};
