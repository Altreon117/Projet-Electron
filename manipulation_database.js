const database = require("./database"); // Connexion à la base SQLite par import

//Fonction pour récupérer les utilisateurs
function getUtilisateurs(callback) {
    const sql = "SELECT * FROM utilisateurs";
    database.all(sql, [], (err, rows) => {
        if (err) {
            return callback(err, null);
        }
        callback(null, { utilisateurs: rows });
    });
}

//Fonction pour récupérer les admins
function getAdmins(callback) {
    const sql = "SELECT * FROM admins";
    database.all(sql, [], (err, rows) => {
        if (err) {
            return callback(err, null);
        }
        callback(null, { admins: rows });
    });
}

//Fonction pour récupérer les événements
function getEvenements(callback) {
    const sql = "SELECT * FROM evenements";
    database.all(sql, [], (err, rows) => {
        if (err) {
            return callback(err, null);
        }
        callback(null, { evenements: rows });
    });
}

function getInscriptions(callback) {
    const sql = `
        SELECT inscriptions.id, utilisateurs.nom AS utilisateur, evenements.titre AS evenement
        FROM inscriptions
        JOIN utilisateurs ON inscriptions.utilisateur_id = utilisateurs.id
        JOIN evenements ON inscriptions.evenement_id = evenements.id
    `;
    database.all(sql, [], (err, rows) => {
        if (err) {
            return callback(err, null);
        }
        callback(null, { inscriptions: rows });
    });
}

//Ajouter un utilisateur à la base de données (signin) (passe connecte à 1)
function addUtilisateur(nom, prenom, email, password, callback) {
    // Insérer l'utilisateur avec "connecte" à 1
    const sql = `INSERT INTO utilisateurs (nom, prenom, email, password, connecte) VALUES (?, ?, ?, ?, 1)`;
    database.run(sql, [nom, prenom, email, password], function (err) {
        if (err) return callback(err, null);
        
        // Retourner l'utilisateur créé avec "connecte = 1"
        callback(null, { id: this.lastID, nom, prenom, email, connecte: 1 });
        console.log("Utilisateur créé et connecté avec succès !");
    });
}

//Supprimr un utilisateur
function deleteUtilisateur(id, callback) {
    const sql = `DELETE FROM utilisateurs WHERE id = ?`;
    database.run(sql, [id], function (err) {
        if (err) return callback(err, null);
        callback(null, { id });
    });
}

//modifier un uitilisateur donc connecte
function updateUtilisateur(id, nom, prenom, email, password, callback) {
    const sql = `UPDATE utilisateurs SET nom = ?, prenom = ?, email = ?, password = ?, connecte = 0 WHERE id = ?`;
    database.run(sql, [nom, prenom, email, password, id], function (err) {
        if (err) return callback(err, null);
        callback(null, { id, nom, prenom, email });
    });
}

//Ajouter un administrateur
function addAdmin(nom, prenom, email, password, callback) {
    const sql = `INSERT INTO admins (nom, prenom, email, password) VALUES (?, ?, ?, ?)`;
    database.run(sql, [nom, prenom, email, password], function (err) {
        if (err) return callback(err, null);
        callback(null, { id: this.lastID, nom, prenom, email });
    });
}

//Supprimer un administrateur
function deleteAdmin(id, callback) {
    const sql = `DELETE FROM admins WHERE id = ?`;
    database.run(sql, [id], function (err) {
        if (err) return callback(err, null);
        callback(null, { id });
    });
}

//Modifier un administrateur
function updateAdmin(id, nom, prenom, email, password, callback) {
    const sql = `UPDATE admins SET nom = ?, prenom = ?, email = ?, password = ? WHERE id = ?`;
    database.run(sql, [nom, prenom, email, password, id], function (err) {
        if (err) return callback(err, null);
        callback(null, { id, nom, prenom, email });
    });
}


//Inscrire un utilisateur à un événement
function addInscription(utilisateur_id, evenement_id, callback) {
    const sql = `INSERT INTO inscriptions (utilisateur_id, evenement_id) VALUES (?, ?)`;
    database.run(sql, [utilisateur_id, evenement_id], function (err) {
        if (err) return callback(err, null);
        callback(null, { id: this.lastID, utilisateur_id, evenement_id });
    });
}

//Vérifier les identifiants de connexion et met l'utilisateur ou l'admin en ligne (attribut connecte = 1)
const bcrypt = require("bcrypt");       // import bcrypt pour hacher les mots de passe

function checkLogin(email, password, callback) {
    // Vérifier d'abord dans la table des administrateurs
    const sqlAdmin = "SELECT * FROM admins WHERE email = ?";
    database.get(sqlAdmin, [email], (err, adminRow) => {
        if (err) {
            return callback(err, null);
        }
        if (adminRow) {
            // Vérifier le mot de passe
            if (adminRow.password === password) { // Remplace ça par bcrypt.compare(password, adminRow.password) si les mots de passe sont hachés
                database.run(`UPDATE admins SET connecte = 1 WHERE id = ?`, [adminRow.id], function (err) {
                    if (err) return callback(err, null);
                    return callback(null, { ...adminRow, role: "admin" });
                });
            } else {
                return callback(null, null); // Mauvais mot de passe
            }
        } else {
            // Vérifier dans la table des utilisateurs si ce n'est pas un admin
            const sqlUser = "SELECT * FROM utilisateurs WHERE email = ?";
            database.get(sqlUser, [email], (err, userRow) => {
                if (err) {
                    return callback(err, null);
                }
                if (userRow) {
                    if (userRow.password === password) { // Remplace ça aussi par bcrypt.compare si besoin
                        database.run(`UPDATE utilisateurs SET connecte = 1 WHERE id = ?`, [userRow.id], function (err) {
                            if (err) return callback(err, null);
                            return callback(null, { ...userRow, role: "utilisateur" });
                        });
                    } else {
                        return callback(null, null); // Mauvais mot de passe
                    }
                } else {
                    return callback(null, null); // Aucun compte trouvé
                }
            });
        }
    });
}



//Déconnexion de l'utilisateur ou de l'admin
function logout(userId, role, callback) {
    const table = role === "admin" ? "admins" : "utilisateurs";
    database.run(`UPDATE ${table} SET connecte = 0 WHERE id = ?`, [userId], function (err) {
        if (err) return callback(err);
        callback(null, "Déconnexion réussie !");
    });
}

// Vider la table des utilisateurs
function videUtilisateurs(callback) {
    const sql = `DELETE FROM utilisateurs`;
    database.run(sql, [], function (err) {
        if (err) return callback(err);
        callback(null, "Table 'utilisateurs' vidée avec succès.");
    });
}

// Vider la table des admins
function videAdmins(callback) {
    const sql = `DELETE FROM admins`;
    database.run(sql, [], function (err) {
        if (err) return callback(err);
        callback(null, "Table 'admins' vidée avec succès.");
    });
}

//Ajoute un labyrinthe à la liste de labyrinths d'un utilisateur ou un admin
function addLabyrinthe(id, labyrinth, callback) {
    const sql = `UPDATE ${table} SET labyrinths = ? WHERE id = ?`;
    database.run(sql, [labyrinth, id], function (err) {
        if (err) return callback(err);
        callback(null, { id, labyrinth });
    });
}


//Supprimer un labyrinthe de la liste de labyrinths d'un utilisateur ou un admin
function deleteLabyrinthe(id, labyrinth, callback) {
    const sql = `UPDATE ${table} SET labyrinths = ? WHERE id = ?`;
    database.run(sql, [labyrinth, id], function (err) {
        if (err) return callback(err);
        callback(null, { id, labyrinth });
    });
}

//renvoie les labyrinthes d'un utilisateur ou d'un admin
function getLabyrinths(id, role, callback) {
    const table = role === "admin" ? "admins" : "utilisateurs";
    const sql = `SELECT labyrinths FROM ${table} WHERE id = ?`;
    database.get(sql, [id], function (err, row) {
        if (err) return callback(err);
        callback(null, { labyrinths: row.labyrinths });
    });
}


//Exporter la fonction
module.exports = {
    logout ,checkLogin,
    getUtilisateurs, getAdmins, getEvenements, getInscriptions,
    addUtilisateur, addAdmin, addInscription, deleteUtilisateur, deleteAdmin, updateUtilisateur, updateAdmin, videUtilisateurs, videAdmins, addLabyrinthe, deleteLabyrinthe, getLabyrinths
};

