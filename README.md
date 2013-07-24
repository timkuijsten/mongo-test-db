# mongo-test-db

Small utility to load database connections and fixtures suitable for testing.

## Usage
### Simplest use case without fixtures
    var MongoTestDb = require('mongo-test-db');
    var db = new MongoTestDb();

    db.open(function (err) {
      // do some stuff with db.connection
    });

### Example with fixtures and options
    var MongoTestDb = require('mongo-test-db');
    var db = new MongoTestDb({
      dbHost: '10.0.0.123', // defaults to "127.0.0.1" if omitted
      dbPort: 27009,        // defaults to 27017 if omitted
      dbName: 'myDb',       // defaults to "test" if omitted
      dbUser: 'joe',        // optional
      dbPass: 'secret'      // optional
    });

    var fixtures = {
      myCollection: [
        { foo: 'bar' },
        { qux: 'raboof' }
      ]
    }

    db.open(fixtures, function (err) {
      // now a collection named "myCollection" is created that contains two
      // items
      // raw connection available at db.connection
    });

## Installation

    $ npm install mongo-test-db

## License

MIT, see LICENSE

## Bugs

See <https://github.com/timkuijsten/mongo-test-db/issues>.
