// app.js - Express pour servir des fichiers statiques
const express = require('express');
const app = express();

// Servir les fichiers statiques depuis le dossier 'public'
app.use(express.static('public'));

// Démarrer le serveur
app.listen(3000, () => {
    console.log('Serveur Express sur http://localhost:3000');
    console.log('Votre générateur de prompts est prêt!');
});