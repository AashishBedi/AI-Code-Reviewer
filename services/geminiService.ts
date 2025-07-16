import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import type { ReviewResult } from '../types.ts';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    review: {
      type: Type.STRING,
      description: "Detailed code review in Markdown format. Use headings for sections and bullet points for suggestions."
    },
    optimizedCode: {
      type: Type.STRING,
      description: "The complete optimized code as a string, without any surrounding markdown backticks."
    }
  },
  required: ["review", "optimizedCode"],
};

export const getCodeReview = async (code: string, language: string): Promise<ReviewResult> => {
  const prompt = `
    As an expert software engineer and senior code architect, please perform a comprehensive code review for the following ${language} code.

    In your review, please provide a detailed analysis covering potential bugs, adherence to best practices, performance optimizations, code readability, and any security vulnerabilities. Use Markdown for formatting. For titles, use markdown headings (e.g., '## Title' or '### Title') instead of bolded text (e.g., '**Title**'). Use bullet points for specific suggestions.

    After the review, provide an optimized and refactored version of the code that addresses the issues you found.

    Structure your response as a JSON object that adheres to the provided schema. The "review" should be a helpful Markdown string. The "optimizedCode" should be just the raw code.

    Here is the code to review:
    \`\`\`${language.toLowerCase()}
    ${code}
    \`\`\`
  `;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      },
    });

    const jsonText = response.text.trim();
    const parsedResult = JSON.parse(jsonText) as ReviewResult;

    if (!parsedResult.review || !parsedResult.optimizedCode) {
        throw new Error("AI response is missing required fields.");
    }
    
    return parsedResult;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    if (error instanceof Error && error.message.includes('SAFETY')) {
        throw new Error("The provided code could not be processed due to safety settings. Please modify the code and try again.");
    }
    throw new Error("Failed to get code review from AI. The model may have returned an invalid format.");
  }
};