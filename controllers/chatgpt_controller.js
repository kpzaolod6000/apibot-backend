const fs = require("fs");
const { openai, ollama } = require("../utils/helper");

const { systemPrompt, functions } = require("../custom/promptData");

/*let embeddedPath = process.env.NODE_ENV
  ? `./embeddings/embeddedFile-${process.env.NODE_ENV}.txt`
  : "./custom/embeddedData/embeddedFile.txt";*/

let embeddedPath = "./custom/embeddedData/embeddedFile.txt";

var message_model = require("../models/message_model");
const { functionMappings } = require("../custom/functions/functionsData");
let { response, assistantResponse } = require("../core/functionsData");
const { profile } = require("console");

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
    if(response.data){
      delete response.data
    }

    let tmp_insert = await message_model.insert(data_insert);
    //console.log("tmp_insert");
    //console.log(tmp_insert);

    let filter = { chat_id: id };
    let tmp_list = await message_model.find_group(filter);
    //console.log("tmp_list");
    //console.log(tmp_list);

    let messages = tmp_list.map(convertFormat);
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
      // console.log("before llama3");
      console.time("Tiempo de petición LLm 3 control");
      const control = await openai.chat.completions.create({
        model: "llama3",
        temperature: 0.1,
        messages: [
          {
            "role": "system",
            "content": "Is there a relation between the last message: " +
              lastMessage.content + "and the new question?" + content +
              "If yes just say the name of the product. If not say 0.",
          },
        ],
      });
      console.timeEnd("Tiempo de petición LLm 3 control");
      console.log(control.choices[0].message);
      // console.log("after llama3");
      if (control.choices[0].message.content !== "0") {
        content += control.choices[0].message.content;
      }

      //content += lastMessage.content;
    }
    console.log(content);

  
    // let embeddedQuestionResponse = await openai.embeddings.create({
    //   input: content,
    //   // model: "text-embedding-ada-002",
    //   model: "all-minilm",
    // });

    console.time("Tiempo de petición LLm 3 embedding");
    let { embedding: embeddedQuestion} = await ollama.embeddings({
      model: "all-minilm",
      prompt: content
    });
    console.timeEnd("Tiempo de petición LLm 3 embedding");
    
    // console.log(embeddedQuestion  );
  

    // Some error handling
    // if (embeddedQuestionResponse.data.length) {
    //   embeddedQuestion = embeddedQuestionResponse.data[0].embedding;
    // } else {
    //   throw Error("Question not embedded properly");
    // }

    // Find the closest count(int) paragraphs
    let closestParagraphs = findClosestParagraphs(embeddedQuestion, 3);
    console.log(closestParagraphs);
    const prompt = createPrompt(
      systemPrompt,
      closestParagraphs,
    );

    console.time("Tiempo de petición LLm 3 completion");
    const completion = await openai.chat.completions.create({
      model: "llama3",
      temperature: 0.1,
      messages: [
        {
          "role": "system",
          "content": prompt,
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
    console.timeEnd("Tiempo de petición LLm 3 completion");

    //console.log(completion.request)

    const completionResponse = completion.choices[0].message;
    const stream = false;

    if (!completionResponse.content) {
      const functionCallName = completionResponse.function_call.name;
      console.log(functionCallName);
      if (functionCallName in functionMappings) {
        const selectedFunction = functionMappings[functionCallName];
        try {
          const completion = await selectedFunction(
            messages,
            stream,
            completionResponse.function_call.arguments,
            prompt,
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
      assistantResponse = completion.choices[0].message.content;
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
    console.log(assistantResponse);

    response.completion = assistantResponse;

    res.status(200).json(response);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal Server Error" + error });
  }
};

const new_stream = async (req, res) => {
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
      const control = await openai.chat.completions.create({
        model: "gpt-4-turbo-preview",
        temperature: 0.1,
        messages: [
          {
            "role": "system",
            "content": "Is there a relation between the last message: " +
              lastMessage.content + "and the new question?" + content +
              "If yes just say the name of the product. If not say 0.",
          },
        ],
      });
      console.log(control.choices[0].message);

      if (control.choices[0].message.content !== 0) {
        content += control.choices[0].message.content;
      }

      //content += lastMessage.content;
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
    const prompt = createPrompt(
      systemPrompt,
      closestParagraphs,
    );

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      temperature: 0.1,
      stream: true,
      messages: [
        {
          "role": "system",
          "content": prompt,
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

    const stream = true;
    const parts = [];

    //console.log(completion.request)
    for await (const part of completion) {
      const completionResponse = part.choices[0].delta;
      //console.log(completionResponse);
      if (completionResponse.function_call) {
        const functionCallName = completionResponse.function_call.name ?? "";
        console.log(functionCallName);
        if (functionCallName in functionMappings) {
          const selectedFunction = functionMappings[functionCallName];
          const onStream = (content) => {
            //process.stdout.write(content);
            parts.push(content || "");
            assistantResponse = parts.join("");
            response.completion = content || "";
            process.stdout.write(content ?? "");
            res.write(JSON.stringify(response) + "\n");
          };
          try {
            await selectedFunction(
              messages,
              stream,
              completionResponse.function_call.arguments,
              prompt,
              onStream,
            );
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
        //console.log(part)
        parts.push(completionResponse.content || "");
        assistantResponse = parts.join("");
        response.completion = completionResponse.content || "";
        process.stdout.write(completionResponse.content ?? "");
        res.write(JSON.stringify(response) + "\n");
      }
    }
    res.end();

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
    //console.log(assistantResponse);

    //response.completion = assistantResponse;

    //res.status(200).json(response);
  } catch (error) {
    console.error("Error:", error);
    //res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = { new_query, new_stream };
