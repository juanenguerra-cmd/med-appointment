import Database from 'better-sqlite3';
const db = new Database(':memory:');
console.log('Successfully opened in-memory database');
db.exec('CREATE TABLE test (id INTEGER PRIMARY KEY)');
console.log('Successfully created table');
const result = db.prepare('SELECT 1 as result').get();
console.log('Query result:', result);
