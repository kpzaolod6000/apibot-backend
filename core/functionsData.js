const { openai } = require("../utils/helper");
const agenteTransition = require("./functions");

let assistantResponse;

let response = {
  completion: assistantResponse,
  transfer: {
    status: false,
  },
};

const createCompletions = async ({ model, messages, stream, onData }) => {
  if (stream) {
    const completion = await openai.chat.completions.create({
      model,
      messages,
      stream,
    });
    const parts = [];
    for await (const part of completion) {
      const content = part.choices[0].delta.content || "";
      parts.push(content);
      //process.stdout.write(content)
      if (typeof onData === "function") {
        onData(content); // Llama al callback con el contenido recibido
      }
    }
    return parts;
  } else {
    const completion = await openai.chat.completions.create({
      model,
      messages,
    });

    return completion;
  }
}

const coreFunctionMappings = {
  connectAgente: async (messages, stream, onStream) => {
    agenteTransition(response);
    try {
      const completions = await createCompletions({
        model: "gpt-4-turbo-preview",
        messages: [
          {
            role: "system",
            content:
              "Say to the user to wait a moment that you are going to connect with a service agent. Be polite and thankful to the user",
          },
          ...messages,
        ],
        stream: stream,
        onData: (content) => {
          //process.stdout.write(content);
          if (typeof onStream === "function") {
            onStream(content); // Llama al callback con el contenido recibido
          }
          //console.log("Data received:", content);
        },
      });
      if (stream) {
        for (const completion of completions) {
          return completion;
        }
      } else {
        return completions.choices[0].message.content;
      }
    } catch (error) {
      if (error.response) {
        console.log(error.response.status);
        console.log(error.response.data);
      } else {
        console.log(error.message);
      }
    }
  },
  // Add more functions
};

module.exports = { coreFunctionMappings, response, assistantResponse, createCompletions };
