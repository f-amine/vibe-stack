import "dotenv/config";
import { GoogleGenAI } from "@google/genai";

const key = process.env.GOOGLE_AI_API_KEY ?? process.env.GEMINI_API_KEY;
if (!key) {
	console.error("no key");
	process.exit(1);
}
const ai = new GoogleGenAI({ apiKey: key });
const models = await ai.models.list();
for await (const m of models) {
	if (m.supportedActions?.includes("generateContent")) console.log(m.name);
}
