import { GoogleGenAI } from "@google/genai";

const originalFetch = globalThis.fetch;
globalThis.fetch = function(url, options) {
    if (!options) options = {};
    if (!options.headers) options.headers = new Headers();
    if (options.headers instanceof Headers) {
        options.headers.set('Referer', 'https://npsc-evn.web.app');
    } else {
        options.headers['Referer'] = 'https://npsc-evn.web.app';
    }
    return originalFetch(url, options);
};

const ai = new GoogleGenAI({ apiKey: "" });

async function test() {
  const modelsToTest = ['text-embedding-004', 'gemini-embedding-001', 'models/text-embedding-004', 'embedding-001'];
  
  for (const model of modelsToTest) {
    console.log(`Testing model: ${model}`);
    try {
      const response = await ai.models.embedContent({
        model: model,
        contents: "The quick brown fox jumps over the lazy dog."
      });
      console.log(`Success with ${model}: ${response.embeddings[0].values.length} dimensions`);
    } catch (e) {
      console.error(`Error with ${model}:`, e.message);
    }
    console.log("-------------------");
  }
}

test();
