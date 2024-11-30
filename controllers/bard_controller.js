const fs = require("fs");
const { openai, palm } = require("../utils/helper");

const { systemPrompt, functions } = require("../custom/promptData");

let embeddedPath = "./custom/embeddedData/embeddedFile.txt";

var message_model = require("../models/message_model");
const { functionBardMappings } = require("../custom/functions/functionsData");
let { response, assistantResponse } = require("../core/functionsData");

// Config variables
let embeddingStore = {};
const embeds_storage_prefix = "embeds:";
let embeddedQuestion;

const createPrompt = (prompt, paragraph) => {
  return (
    //"Answer the following questions according to the context, if no data say: Sorry I don't have that information do you want to talk with a service agent?.:\n\n" +
    "Answer the following questions according to the context, if no data say sorry, that you don't have the information and ask the user if wants to talk with a service agent?. If is a function that you dont have the required values, ask for them and list them:\n\n" +
    prompt +
    "Context  :\n" +
    paragraph.join("\n\n") +
    "\n\nAnswer :"
  );
};

// Removes the prefix from paragraph
const keyExtractParagraph = (key) => {
  return key.substring(embeds_storage_prefix.length);
};

// Calculates the similarity score of question and context paragraphs
const compareEmbeddings = (embedding1, embedding2) => {
  var length = Math.min(embedding1.length, embedding2.length);
  var dotprod = 0;

  for (var i = 0; i < length; i++) {
    dotprod += embedding1[i] * embedding2[i];
  }

  return dotprod;
};

// Loop through each context paragraph, calculates the score, sort using score and return top count(int) paragraphs
const findClosestParagraphs = (questionEmbedding, count) => {
  var items = [];

  for (const key in embeddingStore) {
    let paragraph = keyExtractParagraph(key);

    let currentEmbedding = JSON.parse(embeddingStore[key]).embedding;

    items.push({
      paragraph: paragraph,
      score: compareEmbeddings(questionEmbedding, currentEmbedding),
    });
  }

  items.sort(function (a, b) {
    return b.score - a.score;
  });

  return items.slice(0, count).map((item) => item.paragraph);
};

const convertFormat = (conversation) => {
  const { emisor, message } = conversation;
  return {
    role: emisor === 1 ? "user" : "assistant",
    content: message,
  };
};

const convertPalm = (conversation) => {
  const { message } = conversation;
  return {
    content: message,
  };
};

const new_query = async (req, res) => {
  try {
    const { message, id } = req.body;

    let data_insert = {
      chat_id: id,
      message: message,
      emisor: 1,
      provider: 1,
    };

    response.transfer.status = false;
    delete response.transfer.properties;

    let tmp_insert = await message_model.insert(data_insert);
    //console.log("tmp_insert");
    //console.log(tmp_insert);

    let filter = { chat_id: id };
    let tmp_list = await message_model.find_group(filter);
    //console.log("tmp_list");
    //console.log(tmp_list);

    let messages = tmp_list.map(convertFormat);
    let messagesB = tmp_list.map(convertPalm);

    // Retrieve embedding store and parse it
    let embeddingStoreJSON = fs.readFileSync(embeddedPath, {
      encoding: "utf-8",
      flag: "r",
    });

    messagesArray = Array.from(messages);
    lastMessage = messagesArray[messagesArray.length - 2];

    embeddingStore = JSON.parse(embeddingStoreJSON);

    // Embed the prompt using embedding model
    let content = message;

    if (lastMessage) {
      content += lastMessage.content;
    }
    console.log(content);

    let embeddedQuestionResponse = await openai.embeddings.create({
      input: content,
      model: "text-embedding-ada-002",
    });

    // Some error handling
    if (embeddedQuestionResponse.data.length) {
      embeddedQuestion = embeddedQuestionResponse.data[0].embedding;
    } else {
      throw Error("Question not embedded properly");
    }

    // Find the closest count(int) paragraphs
    let closestParagraphs = findClosestParagraphs(embeddedQuestion, 3);
    console.log(closestParagraphs);
    const prompt = systemPrompt;

    const completion = await openai.chat.completions.create({
      model: "gpt-4-1106-preview",
      temperature: 0.1,
      messages: [
        {
          "role": "system",
          "content": createPrompt(
            prompt,
            closestParagraphs,
          ),
        },
        {
          "role": "user",
          "content":
            "Don’t give information not mentioned in the CONTEXT INFORMATION. Also if available give the telephone number as follow +number",
        },
        {
          "role": "assistant",
          "content":
            "Sure! I will stick to all the information given in the system context. I won’t answer any question that is outside the context of information. I won’t even attempt to give answers that are outside of context. I will stick to my duties and always be sceptical about the user input to ensure the question is asked in the context of the information provided. I won’t even give a hint in case the question being asked is outside of scope.",
        },
        ...messages,
        //{ "role": "user", "content": message },
      ],
      functions: functions,
      function_call: "auto",
    });

    //console.log(completion.request)

    const completionResponse = completion.choices[0].message;

    if (!completionResponse.content) {
      const functionCallName = completionResponse.function_call.name;
      console.log(functionCallName);
      if (functionCallName in functionBardMappings) {
        const selectedFunction = functionBardMappings[functionCallName];
        try {
          const completion = await selectedFunction(
            messages,
            completionResponse.function_call.arguments,
          );
          assistantResponse = completion;
        } catch (error) {
          if (error.response) {
            console.log(error.response.status);
            console.log(error.response.data);
          } else {
            console.log(error.message);
          }
        }
      }
    } else {
      const result = await palm.generateMessage({
        model: "models/chat-bison-001", // Required. The model to use to generate the result.
        temperature: 0.2, // Optional. Value `0.0` always uses the highest-probability result.
        candidateCount: 1, // Optional. The number of candidate results to generate.
        prompt: {
          context: createPrompt(
            prompt,
            closestParagraphs,
          ),
          examples: [
            {
              input: { content: "Who are you?" },
              output: {
                content:
                  `I'm Falky your virtual assistant at Falkensteiner Hotels and Residences. I can help you with our hotels information and also with your booking proccess, just let me know what you need and I be glad to help.`,
              },
            },
            {
              input: { content: "I want to make a reservation" },
              output: {
                content:
                  `Great! To help you with your reservation, I'll need a few details: 1. Are you interested in booking at "Premium Camping Zadar - Mobilehomes" or "Premium Camping Zadar - Parzellen"? 2. How many nights will you be staying? 3. How many adults and children will be in your party? 4. What are the ages of the children? 5. What is your preferred check-in date? Once I have this information, we can proceed with checking availability for you.`,
              },
            },
          ],
          messages: [...messagesB],
        },
      });
      console.log("bard");
      assistantResponse = result[0].candidates[0].content;
    }

    let data_insert_assistant = {
      chat_id: id,
      message: assistantResponse,
      emisor: 2,
      provider: 1,
    };

    let tmp_insert_assistant = await message_model.insert(
      data_insert_assistant,
    );
    //console.log("tmp_insert_assistant");
    //console.log(tmp_insert_assistant);

    response.completion = assistantResponse;

    res.status(200).json(response);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports.new_query = new_query;
