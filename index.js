const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.json());

const PORT = process.env.PORT || 3000;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN || "token696";
const N8N_WEBHOOK = 'https://n8n-tc9w.onrender.com/webhook/whatsapp';
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN || '<YOUR_ACCESS_TOKEN>';
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID || '<YOUR_PHONE_NUMBER_ID>';

// Validation GET pour Meta
app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode && token && mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('Webhook validé avec succès.');
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

// Réception POST pour messages WhatsApp
app.post('/webhook', async (req, res) => {
  const body = req.body;

  if (body.object) {
    console.log('Message WhatsApp reçu:', JSON.stringify(body, null, 2));

    // Transmettre à n8n
    try {
      await axios.post(N8N_WEBHOOK, body);
      console.log('Message transmis à n8n ✅');
    } catch (err) {
      console.error('Erreur en envoyant à n8n:', err.message);
    }

    // Réponse automatique via WhatsApp Cloud API
    const message = body.entry?.[0].changes?.[0].value.messages?.[0];
    if (message) {
      const from = message.from;
      const text = message.text?.body || 'Bonjour !';

      try {
        await axios.post(
          `https://graph.facebook.com/v16.0/${PHONE_NUMBER_ID}/messages`,
          {
            messaging_product: 'whatsapp',
            to: from,
            text: { body: `Vous avez envoyé : ${text}` }
          },
          {
            headers: {
              Authorization: `Bearer ${WHATSAPP_TOKEN}`,
              'Content-Type': 'application/json'
            }
          }
        );
        console.log(`Réponse envoyée à ${from} ✅`);
      } catch (err) {
        console.error('Erreur en envoyant la réponse WhatsApp:', err.message);
      }
    }

    res.sendStatus(200);
  } else {
    res.sendStatus(404);
  }
});

// Démarrage du serveur
app.listen(PORT, () => {
  console.log(`Serveur WhatsApp actif sur le port ${PORT}`);
});
