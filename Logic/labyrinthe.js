function genererLabyrinthe(largeur, hauteur) {
    const grilleLargeur = largeur * 2 + 1;
    const grilleHauteur = hauteur * 2 + 1;
  
    const labyrinthe = Array.from({ length: grilleHauteur }, () =>
      Array(grilleLargeur).fill(1)
    );
  
    const dejaVisite = Array.from({ length: hauteur }, () =>
      Array(largeur).fill(false)
    );
  
    const directions = [
      [0, -1],  // haut
      [1, 0],   // droite
      [0, 1],   // bas
      [-1, 0]   // gauche
    ];
  
    function melanger(tableau) {
      for (let i = tableau.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [tableau[i], tableau[j]] = [tableau[j], tableau[i]];
      }
      return tableau;
    }
  
    function explorer(x, y) {
      dejaVisite[y][x] = true;
      const grilleX = x * 2 + 1;
      const grilleY = y * 2 + 1;
      labyrinthe[grilleY][grilleX] = 0;
      for (const [dx, dy] of melanger([...directions])) {
        const nx = x + dx;
        const ny = y + dy;
        if (
          nx >= 0 && nx < largeur &&
          ny >= 0 && ny < hauteur &&
          !dejaVisite[ny][nx]
        ) {
          labyrinthe[grilleY + dy][grilleX + dx] = 0;
          explorer(nx, ny);
        }
      }
    }
    // random start position
    const departX = Math.floor(Math.random() * largeur);
    const departY = Math.floor(Math.random() * hauteur);
    explorer(departX, departY);
  
    return labyrinthe;
  }
  
  function labyrintheEnASCII(labyrinthe) {
    return labyrinthe.map(ligne =>
      ligne.map(cellule => (cellule === 1 ? "█" : " ")).join("")
    ).join("\n");
  }
  
  const labyrinthe = genererLabyrinthe(40, 20);
  console.log(labyrintheEnASCII(labyrinthe));
  