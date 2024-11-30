require("dotenv").config();
const { OpenAI } = require("openai");

const { DiscussServiceClient } = require("@google-ai/generativelanguage");
const { GoogleAuth } = require("google-auth-library");

const { Ollama } =require('ollama');
const ollama = new Ollama({ host: 'http://localhost:11434' })

// const openai = new OpenAI({
//   apiKey: process.env.OPENAI_API_KEY,
// });

const openai = new OpenAI({
  baseURL: 'http://localhost:11434/v1/',
  apiKey: 'ollama'
});

const palm = new DiscussServiceClient({
  authClient: new GoogleAuth().fromAPIKey(process.env.PALM_API_KEY),
});

module.exports = { openai, palm, ollama };
