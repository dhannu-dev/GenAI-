import readlineSync from "readline-sync";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
dotenv.config();

function sum({ num1, num2 }) {
  return num1 + num2;
}

async function getCryptoPrice({ coin }) {
  const response = await fetch(
    `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${coin}`,
  );

  const data = await response.json();

  return {
    coin,
    price: data[0]?.current_price,
  };
}

const tools = {
  sum,
  getCryptoPrice,
};

const sumDeclaration = {
  name: "sum",
  description: "Get the sum of two numbers",
  parameters: {
    type: "OBJECT",
    properties: {
      num1: {
        type: "NUMBER",
        description: "First number",
      },
      num2: {
        type: "NUMBER",
        description: "Second number",
      },
    },
    required: ["num1", "num2"],
  },
};

const cryptoDeclaration = {
  name: "getCryptoPrice",
  description: "Get the current price of any crypto Currency like bitcoin",
  parameters: {
    type: "OBJECT",
    properties: {
      coin: {
        type: "STRING",
        description: "It will be the crypto currency name, like bitcoin",
      },
    },
    required: ["coin"],
  },
};

const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_API_KEY,
});

async function runAgent(userInput) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: userInput,
      config: {
        tools: [{ functionDeclarations: [sumDeclaration, cryptoDeclaration] }],
      },
    });

    if (response.functionCalls?.length > 0) {
      const toolCall = response.functionCalls[0];
      const { name, args } = toolCall;

      const result = await tools[name](args);
      const finalResponse = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          {
            role: "user",
            parts: [{ text: userInput }],
          },
          {
            role: "model",
            parts: [{ functionCall: toolCall }],
          },
          {
            role: "function",
            parts: [
              {
                functionResponse: {
                  name: name,
                  response: {
                    content: result,
                  },
                },
              },
            ],
          },
        ],
      });

      console.log(finalResponse.text);
      return;
    }

    console.log(response.text);
  } catch (error) {
    if (error.status === 429) {
      console.log("Rate limit exceeded. Please wait and try again.");
      return;
    }

    console.log("Something went wrong:", error.message);
  }
}

async function main() {
  while (true) {
    const input = readlineSync.question("Ask something --> ");
    await runAgent(input);
  }
}

main();
