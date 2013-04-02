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
  it('should open the db without fixtures', function (done) {
    db.open(done);
  });

  it('should close the db', function(done) {
    db.close(done);
  });

  it('should open the db and load all fixtures', function (done) {
    db.open(fixtures, function(err) {
      if (err) { throw err; }

      db.connection.collection(testCollection).find().toArray(function(err, items) {
        assert.strictEqual(items.length, 2);
        done();
      });
    });
  });

  it('should close the db', function(done) {
    db.close(done);
  });
});
