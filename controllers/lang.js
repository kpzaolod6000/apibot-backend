// 1. Import necessary modules and libraries
const { OpenAI } = require("langchain/llms/openai");
const { ConversationalRetrievalQAChain, RetrievalQAChain } = require("langchain/chains");
const { HNSWLib } = require("langchain/vectorstores/hnswlib");
const { OpenAIEmbeddings } = require("langchain/embeddings/openai");
const { RecursiveCharacterTextSplitter } = require("langchain/text_splitter");
const { ChatPromptTemplate, SystemMessagePromptTemplate } = require("langchain/prompts");
const { BufferMemory } = require("langchain/memory");
const fs = require("fs");
const dotenv = require("dotenv").config();

// 3. Set up input data and paths
const txtFilename = "sourceFile";
const question = "Cual es la hora de Check in?";
const txtPath = `./sourceData/${txtFilename}.txt`;
const VECTOR_STORE_PATH = `./embeddedData/${txtFilename}.index`;

// 4. Define the main function runWithEmbeddings
const runWithEmbeddings = async () => {
  // 5. Initialize the OpenAI model with an empty configuration object
  const model = new OpenAI({ modelName: "gpt-3.5-turbo" });

  // 6. Check if the vector store file exists
  let vectorStore;
  if (fs.existsSync(VECTOR_STORE_PATH)) {
    // 6.1. If the vector store file exists, load it into memory
    console.log("Vector Exists..");
    vectorStore = await HNSWLib.load(VECTOR_STORE_PATH, new OpenAIEmbeddings());
  } else {
    // 6.2. If the vector store file doesn't exist, create it
    // 6.2.1. Read the input text file
    const text = fs.readFileSync(txtPath, "utf8");
    // 6.2.2. Create a RecursiveCharacterTextSplitter with a specified chunk size
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
    });
    // 6.2.3. Split the input text into documents
    const docs = await textSplitter.createDocuments([text]);
    // 6.2.4. Create a new vector store from the documents using OpenAIEmbeddings
    vectorStore = await HNSWLib.fromDocuments(docs, new OpenAIEmbeddings());
    // 6.2.5. Save the vector store to a file
    await vectorStore.save(VECTOR_STORE_PATH);
  }

  const chatPrompt = `Answer the following question as a helpful assistent from Falkensteiner hotels and residences

  Follow Up Input: {question}
  If you don't know the answer please answer the question by using your own knowledge about the topic`;

  // 7. Create a RetrievalQAChain by passing the initialized OpenAI model and the vector store retriever
  //const chain = RetrievalQAChain.fromLLM(model, vectorStore.asRetriever());
  const chain = ConversationalRetrievalQAChain.fromLLM(
    model,
    vectorStore.asRetriever(),
    {
      questionGeneratorChainOptions: {
        llm: model,
        template: chatPrompt,
      },
      memory: new BufferMemory({
        memoryKey: "chat_history", // Must be set to "chat_history"
        returnMessages: true,
      }),
    }
  );
  // 8. Call the RetrievalQAChain with the input question, and store the result in the 'res' variable
  const res = await chain.call({
    question,
  });

  // 9. Log the result to the console
  console.log({ res });
};

// 10. Execute the main function runWithEmbeddings
runWithEmbeddings();
