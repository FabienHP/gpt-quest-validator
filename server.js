const express = require('express');
const { OpenAIApi, Configuration } = require('openai');
const app = express();
const { config } = require('dotenv');
config();

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

// Store the conversations
let conversations = {};

app.use(express.json());

app.post('/npcChatQuest', async (req, res) => {
  const { userId, userMessage } = req.body;
  if (!userId || !userMessage) {
    res.status(400).json({ error: 'User ID and message are required.' });
    return;
  }

  // If this is a new conversation, initialize it with the system message.
  if (!conversations[userId]) {
    conversations[userId] = [
      {
        "role": "system",
        "content": "Vous êtes un PNJ (personnage non joueur) dans un jeu vidéo. Vous avez un point d'exclamation au-dessus de votre tête, ce qui signifie que vous avez une quête à offrir. Cependant, vous avez perdu confiance en vous en tant que charpentier et avez besoin d'être convaincu par les bons mots avant de commencer. Votre quête concerne la construction d'un bateau, mais le joueur doit d'abord trouver les informations appropriées sur vous en explorant votre maison et en conversant avec vous. Si le joueur ne parvient pas à vous convaincre après plusieurs tentatives, vous les repousserez. Pour réinitialiser la quête et réessayer, le joueur devra accomplir une quête de pénalité."
      }
    ];
  }

  // Add the user's message to the conversation.
  conversations[userId].push({
    "role": "user",
    "content": userMessage
  });

  try {
    const response = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: conversations[userId]
    });

    // Add the NPC's response to the conversation.
    conversations[userId].push({
      "role": "assistant",
      "content": response.data.choices[0].message.content
    });

    // Send the API's response back to the client.
    res.status(200).json(response.data);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred during your request.' });
  }
});

const port = process.env.PORT || 3001;
app.listen(port, () => console.log(`Server is running on port ${port}`));
