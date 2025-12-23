const sqlite3 = require('sqlite3').verbose();
const path = require('path');

//DATABASE SETUP
// Dit bestand zorgt voor de verbinding met de SQLite database
// SQLite is een lichtgewicht database die als bestand wordt opgeslagen
// Ideaal voor kleinere applicaties en ontwikkeling

// Het pad naar het database bestand wordt hier bepaald
// __dirname = de huidige map waarin dit bestand staat
// We gaan 2 mappen omhoog (../../) om bij het hoofd projectbestand te komen
const dbPath = path.join(__dirname, '../../juwelier.db');

// DATABASE CONNECTIE
// Hier maken we de daadwerkelijke verbinding met de SQLite database
// Als het bestand niet bestaat, wordt het automatisch aangemaakt
// De callback functie controleert of de verbinding succesvol is
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Database verbinding mislukt:', err.message);
    } else {
        console.log('Database verbinding succesvol (SQLite)');
    }
});

// QUERY WRAPPER FUNCTIE
// Deze functie is een "wrapper" die SQLite queries omzet naar Promises
// Omdat moderne JavaScript met async/await werkt
// SQLite gebruikt standaard callbacks, maar Promises zijn moderner en leesbaarder

// De functie doet SELECT queries en geeft rijen terug
// We wrappen het resultaat in een array [rows] voor compatibiliteit met MySQL syntax
// later naar MySQL overstappen, werkt de code nog steeds
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

// RUN WRAPPER FUNCTIE
// Deze functie is specifiek voor INSERT, UPDATE en DELETE operaties
// Deze queries geven geen rijen terug, maar wel informatie over wat er is gebeurd
//
// "this" context in de callback bevat belangrijke informatie:
// - this.lastID = het ID van de laatst toegevoegde rij (bij INSERT)
// - this.changes = hoeveel rijen zijn aangepast (bij UPDATE/DELETE)
const run = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        // we gebruiken een gewone function() hier, GEEN arrow function
        // Omdat we toegang nodig hebben tot "this" context
        // Arrow functions hebben geen eigen "this"
        db.run(sql, params, function(err) {
            if (err) {
                reject(err);
            } else {
                resolve([{ insertId: this.lastID, affectedRows: this.changes }]);
            }
        });
    });
};

// EXPORTS
// We exporteren de query en run functies zodat andere bestanden ze kunnen gebruiken
// Dit zorgt voor een centrale plek waar alle database operaties doorheen gaan
module.exports = { query, run };