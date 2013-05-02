var assert = require('assert');

var config = require('./../package.json').config;
var MongoTestDb = require('./../main');
var db = new MongoTestDb(config);

var testCollection = 'my_collection';
var fixture1 = { foo: 'bar1' };
var fixture2 = { foo: 'baz2' };
var fixture3 = { foo: 'bal3' };
var fixture4 = { foo: 'bak4' };
var fixture5 = { foo: 'bam5' };

var testCollection2 = 'my_collection2';
var fixture6 = { foo: 'bar' };
var fixture7 = { foo: 'baz' };

var fixtures = {};
fixtures[testCollection] = [ fixture1, fixture2, fixture3, fixture4, fixture5 ];
fixtures[testCollection2] = [fixture6, fixture7];

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
        assert.strictEqual(items.length, 5);
        done();
      });
    });
  });

  it('should return the fixtures in the same order', function (done) {
    db.connection.collection(testCollection).find().toArray(function(err, items) {
      assert.deepEqual(items,[fixture1, fixture2, fixture3, fixture4, fixture5]);
      db.connection.collection(testCollection2).find().toArray(function(err, items) {
        assert.deepEqual(items,[fixture6, fixture7]);
        db.close(done);
      });
    });
  });
});
