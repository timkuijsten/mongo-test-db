# mongo-test-db

mongo-test-db is a small utility to load database connections and fixtures
suitable for testing.

# Usage
    // simplest use case without fixtures
    var MongoTestDb = require('mongo-test-db');
    var db = new MongoTestDb();

    db.open(function (err) {
      if (err) { throw err; }
      // do some stuff with db.connection
    });

    // example with fixtures
    var fixtures = {
      myCollection: [
        { foo: 'bar' },
        { qux: 'raboof' }
      ]
    }

    db.open(fixtures, function (err) {
      if (err) { throw err; }
      // now a collection named "myCollection" is created that contains two
      // items
      // do some stuff with db.connection
    });

# Installation

    $ npm install mongo-test-db

## License

MIT, see LICENSE

## Bugs

See <https://github.com/timkuijsten/mongo-test-db/issues>.
