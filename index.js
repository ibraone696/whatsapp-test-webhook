const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.json());

const PORT = process.env.PORT || 3000;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN || "token696";

// Vérification du webhook par WhatsApp
app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode && token) {
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('Webhook vérifié avec succès.');
      res.status(200).send(challenge);
    } else {
      res.sendStatus(403);
    }
  } else {
    res.sendStatus(400);
  }
});

// Réception des messages WhatsApp
app.post('/webhook', async (req, res) => {
  const body = req.body;

  if (body.object) {
    console.log('Reçu un événement WhatsApp:', JSON.stringify(body, null, 2));

    // Exemple : afficher le message dans la console
    if (body.entry && body.entry[0].changes) {
      const message = body.entry[0].changes[0].value.messages?.[0];
      if (message) {
        console.log(`Message reçu de ${message.from}: ${message.text?.body}`);
      }
    }

    // Transmettre le message à n8n
    try {
      await axios.post(
        'https://n8n-tc9w.onrender.com/webhook/whatsapp',
        body
      );
      console.log('Message transmis à n8n ✅');
    } catch (err) {
      console.error('Erreur en envoyant à n8n:', err.message);
    }

    res.sendStatus(200);
  } else {
    res.sendStatus(404);
  }
});

// Démarrer le serveur
app.listen(PORT, () => {
  console.log(`Serveur WhatsApp actif sur le port ${PORT}`);
});
