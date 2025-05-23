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

//Fonction pour récupérer les admins parmi les utilisateurs (les user qui ont le champ admin à 1)
function getUtilisateursAdmins(callback) {
    const sql = `SELECT * FROM utilisateurs WHERE admin = 1`;
  
    database.all(sql, [], (err, rows) => {
      if (err) return callback(err, null);
      callback(null, { admins: rows });
    });
  }

//Fonction pour récupérer seulement les utilisateurs non admins
function getUtilisateursNonAdmins(callback) {
    const sql = `SELECT * FROM utilisateurs WHERE admin = 0`;
    database.all(sql, [], (err, rows) => {
        if (err) return callback(err, null);
        callback(null, { utilisateurs: rows });
    });
}
  

//Ajouter un utilisateur à la base de données (signin) (passe connecte à 1)
function addUtilisateur(nom, prenom, email, password, callback) {
    // Vérifier si l'utilisateur existe déjà
    const sqlCheck = `SELECT * FROM utilisateurs WHERE email = ?`;
    database.get(sqlCheck, [email], (err, rows) => {
        if (err) return callback(err, null);
        if (rows) {
            return callback(new Error("Cet utilisateur existe déjà"), null);
        }

        // Si l'utilisateur n'existe pas, on l'ajoute
        const sqlInsert = `INSERT INTO utilisateurs (nom, prenom, email, password, admin, connecte) VALUES (?, ?, ?, ?, 0, 1)`;
        database.run(sqlInsert, [nom, prenom, email, password], function (err) {
            if (err) return callback(err, null);
            console.log("Utilisateur créé et connecté avec succès !");
        });
    });
}


//Ajouter un admin à la base de données (signin) (passe connecte à 1)
function addAdmin(nom, prenom, email, password, callback) {
    // Vérifier si l'admin existe déjà
    const sqlCheck = `SELECT * FROM utilisateurs WHERE email = ?`;
    database.get(sqlCheck, [email], (err, rows) => {
        if (err) return callback(err, null);
        if (rows) {
            return callback(new Error("Cet admin existe déjà"), null);
        }
        // Si l'admin n'existe pas, on l'ajoute
        const sqlInsert = `INSERT INTO utilisateurs (nom, prenom, email, password, admin, connecte) VALUES (?, ?, ?, ?, 1, 1)`;
        database.run(sqlInsert, [nom, prenom, email, password], function (err) {
            if (err) return callback(err, null);
            console.log("Admin créé et connecté avec succès !");
        });
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


// Vider la table des utilisateurs
function videUtilisateurs(callback) {
    const sql = `DELETE FROM utilisateurs`;
    database.run(sql, [], function (err) {
        if (err) return callback(err);
        callback(null, "Table 'utilisateurs' vidée avec succès.");
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



//Déconnexion de l'utilisateur
function logout(Id, callback) {
    const sqlUser = `UPDATE utilisateurs SET connecte = 0 WHERE id = ?`;
    database.run(sqlUser, [Id], function (err) {
        if (err) {
            return callback(err, null)}
        const sqlAdmin = `UPDATE admins SET connecte = 0 WHERE id = ?`;
        database.run(sqlAdmin, [Id], function (err) {
            if (err) return callback(err, null);
            callback(null, "Déconnexion réussie");
        });
    });
    }


//Ajoute un labyrinthe à la liste de labyrinths d'un utilisateur
function addLabyrinthe(userId, schema, callback) {
    const sqlSelect = `SELECT labyrinths FROM utilisateurs WHERE id = ?`;

    database.get(sqlSelect, [userId], (err, row) => {
        if (err) return callback(err);

        let labyrinths = [];
        if (row && row.labyrinths) {
            try {
                labyrinths = JSON.parse(row.labyrinths);
            } catch (parseErr) {
                return callback(parseErr);
            }
        }

        // Supprimer le plus ancien si on atteint 50
        if (labyrinths.length >= 50) {
            labyrinths.shift(); // supprime le premier labyrinthe (le plus vieux)
        }

        // Ajouter le nouveau labyrinthe
        labyrinths.push({ id: 0, schema }); // ID temporaire, sera réindexé ensuite

        // Réindexer les ID (1 à N)
        labyrinths = labyrinths.map((laby, index) => ({
            id: index + 1,
            schema: laby.schema,
        }));

        const sqlUpdate = `UPDATE utilisateurs SET labyrinths = ? WHERE id = ?`;
        database.run(sqlUpdate, [JSON.stringify(labyrinths), userId], function (err) {
            if (err) return callback(err);
            callback(null, labyrinths);
        });
    });
}

    


//Supprimer un labyrinthe de la liste de labyrinths d'un utilisateur
function deleteLabyrinthe(id, posi_labyrinth, callback) {
    const sql = `UPDATE utilisateurs SET labyrinths = ? WHERE id = ?`;
    database.run(sql, [labyrinth, id], function (err) {
        if (err) return callback(err);
        callback(null, { id, labyrinth });
    });
}

//renvoie les labyrinthes d'un utilisateur ou d'un admin
function getLabyrinths(id, callback) {
    const sql = `SELECT labyrinths FROM utilisateurs WHERE id = ?`;
    database.get(sql, [id], (err, row) => {
        if (err) return callback(err);
        if (row) {
            return callback(null, { labyrinths: row.labyrinths });
        } else {
            const sqlAdmin = `SELECT labyrinths FROM admins WHERE id = ?`;
            database.get(sqlAdmin, [id], (err, row) => {
                if (err) return callback(err);
                if (row) {
                    return callback(null, { labyrinths: row.labyrinths });
                } else {
                    return callback(new Error("Aucun labyrinthe trouvé"), null);
                }
            });
        }
    });
}

//dit si c'est un dmin ou non
function checkRole(id, callback) {
    const sqlAdmin = "SELECT * FROM admins WHERE id = ?";
    database.get(sqlAdmin, [id], (err, adminRow) => {
        if (err) {
            return callback(err, null);
        }
        if (adminRow) {
            return "admin";
        } else {
            const sqlUser = "SELECT * FROM utilisateurs WHERE id = ?";
            database.get(sqlUser, [id], (err, userRow) => {
                if (err) {
                    return callback(err, null);
                }
                if (userRow) {
                    return "utilisateur";
                } else {
                    return null; // Aucun compte trouvé
                }
            });
        }
    });
}



//Exporter la fonction
module.exports = {
    getUtilisateurs,
    getUtilisateursAdmins,
    getUtilisateursNonAdmins,
    addUtilisateur,
    addAdmin,
    deleteUtilisateur,
    videUtilisateurs,
    updateUtilisateur,
    checkLogin,
    logout,
    addLabyrinthe,
    deleteLabyrinthe,
    getLabyrinths,
    checkRole
}

