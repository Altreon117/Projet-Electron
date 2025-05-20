const sqlite3 = require("sqlite3").verbose();

//  Connexion à la base de données
let database = new sqlite3.Database("./database.sqlite", (err) => {
  if (err) {
    console.error(" Erreur de connexion SQLite", err.message);
  } else {
    console.log(" Base de données SQLite connectée !");
  }
});

//  Création des tables
database.serialize(() => {
  database.run(`
    CREATE TABLE IF NOT EXISTS utilisateurs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nom TEXT NOT NULL,
      prenom TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      admin BOOLEAN DEFAULT 0,
      labyrinths TEXT,
      connecte BOOLEAN DEFAULT 0
    )
  `);
  
});

module.exports = database;

