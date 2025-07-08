import { GoogleGenAI } from "@google/genai";
import { PartialReviewResult, SupportedLanguage, FlowchartData, FlowchartNode } from '../types';

interface ImportMetaEnv {
  readonly VITE_GEMINI_API_KEY: string;
}

// Extend ImportMeta to include 'env' for Vite
declare global {
  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

if (!API_KEY) {
  throw new Error("Gemini API key not found in environment variables.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const getShapeBrackets = (shape: FlowchartNode['shape']): [string, string] => {
  switch (shape) {
    case 'diamond':
      return ['{', '}'];
    case 'round-rect':
      return ['(', ')'];
    case 'stadium':
      return ['([', '])'];
    case 'rect':
    default:
      return ['[', ']'];
  }
};

export function convertFlowchartDataToMermaid(data: FlowchartData): string {
  let mermaidString = 'graph TD;\n';

  const sanitizeId = (id: string) => {
    return `node_${id.replace(/\s+/g, '_')}`;
  };

  data.nodes.forEach(node => {
    const [start, end] = getShapeBrackets(node.shape);
    const sanitizedLabel = node.label.replace(/"/g, '&quot;').replace(/\n/g, '<br/>');
    mermaidString += `    ${sanitizeId(node.id)}${start}"${sanitizedLabel}"${end};\n`;
  });

  data.edges.forEach(edge => {
    if (edge.label) {
      const sanitizedLabel = edge.label.replace(/"/g, '&quot;').replace(/\n/g, '<br/>');
      mermaidString += `    ${sanitizeId(edge.from)} -->|"${sanitizedLabel}"| ${sanitizeId(edge.to)};\n`;
    } else {
      mermaidString += `    ${sanitizeId(edge.from)} --> ${sanitizeId(edge.to)};\n`;
    }
  });

  return mermaidString;
}

export async function generateVisualization(
  code: string,
  language: SupportedLanguage
): Promise<FlowchartData> {
  if (!code.trim()) {
    throw new Error("Cannot visualize empty code.");
  }

  const prompt = `
    You are an expert code analysis expert specializing in creating structured data for visualizations.
    Your task is to analyze the following ${language} code and generate a JSON object representing a flowchart of its execution logic.

    **CRITICAL INSTRUCTIONS:**
    1.  **JSON ONLY:** Respond with ONLY a raw JSON object. Do not include any explanations, comments, or markdown fences (like \`\`\`json or \`\`\`).
    2.  **JSON STRUCTURE:** The JSON object must conform to this structure:
        {
          "nodes": [
            { "id": "A", "label": "Start", "shape": "stadium" },
            { "id": "B", "label": "Initialize variable i = 0", "shape": "rect" },
            { "id": "C", "label": "Is i < 10?", "shape": "diamond" }
          ],
          "edges": [
            { "from": "A", "to": "B" },
            { "from": "B", "to": "C" },
            { "from": "C", "to": "D", "label": "Yes" }
          ]
        }
    3.  **NODE REQUIREMENTS:** ... [instructions truncated for brevity]
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-preview-04-17',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    if (!response.text) {
      throw new Error("Gemini API did not return any text for visualization.");
    }

    let jsonStr = response.text.trim();
    const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
    const match = jsonStr.match(fenceRegex);
    if (match && match[2]) {
      jsonStr = match[2].trim();
    }

    const parsedData = JSON.parse(jsonStr) as FlowchartData;
    if (!parsedData.nodes || !parsedData.edges) {
      throw new Error("AI returned invalid JSON structure.");
    }
    return parsedData;

  } catch (error) {
    console.error("Error calling Gemini API for visualization or parsing JSON:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred during visualization.";
    throw new Error(`Failed to generate visualization: ${errorMessage}`);
  }
}

export async function translateCode(
  code: string,
  fromLanguage: SupportedLanguage,
  toLanguage: SupportedLanguage
): Promise<string> {
  if (!code.trim()) {
    return '';
  }

  const prompt = `
    You are an expert code translator.
    Your task is to translate the following ${fromLanguage} code snippet to ${toLanguage}.
    IMPORTANT INSTRUCTIONS:
    - Provide only the raw source code for the ${toLanguage} version.
    - Do NOT include any explanations, comments about the translation, or markdown fences (like \`\`\`${toLanguage} or \`\`\`).
    - Ensure the translated code is functionally equivalent to the original.
    Original ${fromLanguage} code:
    ---
    ${code}
    ---
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-preview-04-17',
      contents: prompt,
    });

    if (!response.text) {
      throw new Error("Gemini API did not return any text for translation.");
    }

    return response.text.trim();
  } catch (error) {
    console.error("Error calling Gemini API for translation:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred during translation.";
    throw new Error(`Failed to translate code: ${errorMessage}`);
  }
}

export async function* getOptimizedCodeStream(
  userCode: string,
  language: SupportedLanguage
): AsyncGenerator<PartialReviewResult, void, undefined> {
  if (!userCode.trim()) {
    yield {
      reviewChunk: "There's nothing to review.",
      optimizedCodeChunk: "Please provide some code in the left panel and click 'Get Review'."
    };
    return;
  }

  const prompt = `
    You are an expert AI programmer acting as a senior code reviewer.
    Your task is to analyze the following ${language} code and provide a detailed review and an optimized version.

    Please provide your response using the following template. Do not add any other text, explanations, or markdown fences around the final output.

    [AI_REVIEW_START]
    ... [review instructions truncated for brevity]
  `;

  try {
    const stream = await ai.models.generateContentStream({
      model: 'gemini-2.5-flash-preview-04-17',
      contents: prompt,
    });

    let fullResponseText = '';
    let lastYieldedReview = '';
    let lastYieldedCode = '';

    for await (const chunk of stream) {
      if (chunk.text) {
        fullResponseText += chunk.text;

        const reviewStartTag = '[AI_REVIEW_START]';
        const reviewEndTag = '[AI_REVIEW_END]';
        let reviewContent = '';

        const reviewStartIndex = fullResponseText.indexOf(reviewStartTag);
        if (reviewStartIndex !== -1) {
          const reviewEndIndex = fullResponseText.indexOf(reviewEndTag, reviewStartIndex);
          reviewContent = reviewEndIndex !== -1
            ? fullResponseText.substring(reviewStartIndex + reviewStartTag.length, reviewEndIndex)
            : fullResponseText.substring(reviewStartIndex + reviewStartTag.length);
        }

        if (reviewContent.length > lastYieldedReview.length) {
          const reviewChunk = reviewContent.substring(lastYieldedReview.length);
          yield { reviewChunk };
          lastYieldedReview = reviewContent;
        }

        const codeStartTag = '[AI_CODE_START]';
        const codeEndTag = '[AI_CODE_END]';
        let codeContent = '';

        const codeStartIndex = fullResponseText.indexOf(codeStartTag);
        if (codeStartIndex !== -1) {
          const codeEndIndex = fullResponseText.indexOf(codeEndTag, codeStartIndex);
          codeContent = codeEndIndex !== -1
            ? fullResponseText.substring(codeStartIndex + codeStartTag.length, codeEndIndex)
            : fullResponseText.substring(codeStartIndex + codeStartTag.length);
        }

        if (codeContent.length > lastYieldedCode.length) {
          const optimizedCodeChunk = codeContent.substring(lastYieldedCode.length);
          yield { optimizedCodeChunk };
          lastYieldedCode = codeContent;
        }
      }
    }

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    throw new Error(`An error occurred while communicating with the AI: ${errorMessage}`);
  }
}
