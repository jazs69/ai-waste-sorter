import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { WasteCategory } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.warn("API_KEY environment variable not found. Gemini API calls will likely fail.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY! }); // Non-null assertion as availability is assumed

const WASTE_CLASSIFICATION_PROMPT = `You are an expert waste sorting AI. Analyze the image provided, identify the most prominent item of waste, and classify it into one of the following categories:
- Plastic
- Paper
- Cardboard
- Glass
- Metal
Respond with *only* the category name. If the image is unclear, does not show a clear item of waste, or the item cannot be reasonably classified into these categories, respond with 'Unknown'.`;

export const classifyWasteImage = async (
  imageBase64: string,
  mimeType: string
): Promise<{ category: WasteCategory; error?: string }> => {
  if (!API_KEY) {
    return { category: WasteCategory.UNKNOWN, error: "API Key not configured." };
  }
  try {
    const imagePart = {
      inlineData: {
        mimeType: mimeType,
        data: imageBase64,
      },
    };
    const textPart = {
      text: WASTE_CLASSIFICATION_PROMPT,
    };

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash-preview-04-17', 
      contents: [{ parts: [imagePart, textPart] }],
    });

    const classificationText = response.text.trim();

    if (Object.values(WasteCategory).includes(classificationText as WasteCategory)) {
      return { category: classificationText as WasteCategory };
    } else {
      console.warn(`Unexpected classification from API: ${classificationText}`);
      const lowerCaseText = classificationText.toLowerCase();
      if (lowerCaseText.includes('plastic')) return { category: WasteCategory.PLASTIC };
      if (lowerCaseText.includes('paper')) return { category: WasteCategory.PAPER };
      if (lowerCaseText.includes('cardboard')) return { category: WasteCategory.CARDBOARD };
      if (lowerCaseText.includes('glass')) return { category: WasteCategory.GLASS };
      if (lowerCaseText.includes('metal')) return { category: WasteCategory.METAL };
      
      return { category: WasteCategory.UNKNOWN, error: `Unexpected category: ${classificationText}` };
    }
  } catch (error) {
    console.error("Error classifying waste image:", error);
    let errorMessage = "Failed to classify image due to an API error.";
    if (error instanceof Error) {
        errorMessage = error.message;
    }
    if (typeof error === 'object' && error !== null && 'message' in error) {
        const err = error as { message: string };
        if (err.message.includes("API key not valid")) {
            errorMessage = "Invalid API Key. Please check your configuration.";
        }
    }
    return { category: WasteCategory.UNKNOWN, error: errorMessage };
  }
};