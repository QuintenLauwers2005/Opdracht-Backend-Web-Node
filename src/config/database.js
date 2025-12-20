const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Database bestand pad
const dbPath = path.join(__dirname, '../../juwelier.db');

// Maak database connectie
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Database verbinding mislukt:', err.message);
    } else {
        console.log('Database verbinding succesvol (SQLite)');
    }
});

// Promise wrapper voor queries
const query = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve([rows]); // MySQL format ([rows]) voor compatibiliteit
            }
        });
    });
};

// Run wrapper voor INSERT/UPDATE/DELETE
const run = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function(err) {
            if (err) {
                reject(err);
            } else {
                resolve([{ insertId: this.lastID, affectedRows: this.changes }]);
            }
        });
    });
};

module.exports = { query, run };