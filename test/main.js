var assert = require('assert');

var config = require('./../package.json').config;
var MongoTestDb = require('./../main');
var db = new MongoTestDb(config);

var testCollection = 'my_collection';
var fixture1 = { foo: 'bar' };
var fixture2 = { foo: 'baz' };

var fixtures = {};
fixtures[testCollection] = [ fixture1, fixture2 ];

describe('main', function () {
  it('should open the db', function (done) {
    db.open(done);
  });

  it('should close the db', function(done) {
    db.close(done);
  });

  it('should emit open event after opening', function (done) {
    db.open();
    db.once('open', function() {
      db.close(done);
    });
  });

  it('should callback with opening error when already opening', function (done) {
    var myErr;
    db.open(function() {
      assert.equal(myErr.message, 'already opening');
      db.close(done);
    });
    db.open(function(err) {
      myErr = err;
    });
  });

  it('should open the db and load all fixtures', function (done) {
    db.open(fixtures, function(err) {
      if (err) { return done(err); }

      db.connection.collection(testCollection).find().toArray(function(err, items) {
        assert.strictEqual(items.length, 2);
        db.close(done);
      });
    });
  });
});
