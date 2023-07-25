const express = require('express');
const { OpenAIApi, Configuration } = require('openai');
const app = express();
const { config } = require('dotenv');
config();

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

// Store the conversations.
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
        "content": "Vous êtes un PNJ, un charpentier qui a perdu confiance en lui. Vous voulez oublier votre passé. Vous avez une quête à offrir, mais le joueur doit trouver les bons mots pour vous convaincre de leur confier cette quête. Si vous n'êtes pas convaincu, vous pouvez repousser les joueurs. Si vous êtes convaincu, vous pouvez accepter d'aider le joueur dans sa quête."
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
      model: "gpt-3.5-turbo-0613",
      messages: conversations[userId],
      functions: [
        {
          name: "accept_quest",
          description: "Accept the quest and log the acceptance",
          parameters: {
            type: "object",
            properties: {}
          }
        }
      ],
      function_call: "auto"
    });

    // Add the NPC's response to the conversation.
    conversations[userId].push({
      "role": "assistant",
      "content": response.data.choices[0].message.content
    });

    // Check if a function was called.
    if (response.data.choices[0].message.function_call) {
      if (response.data.choices[0].message.function_call.name === "accept_quest") {
        accept_quest();
        conversations[userId].push({
          "role": "function",
          "name": "accept_quest",
          "content": "The quest has been accepted!"
        });
      }
    }

    console.log(conversations[userId]);
    // Send the API's response back to the client.
    res.status(200).json(response.data);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred during your request.' });
  }
});

function accept_quest() {
  console.log("The quest has been accepted!");
}

const port = process.env.PORT || 3001;
app.listen(port, () => console.log(`Server is running on port ${port}`));
