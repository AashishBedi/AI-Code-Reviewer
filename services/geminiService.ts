

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
;

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
  
  // Sanitize function for IDs to prevent clashes with Mermaid keywords like 'end'.
  const sanitizeId = (id: string) => {
    // A simple prefix is enough to prevent most keyword collisions.
    return `node_${id.replace(/\s+/g, '_')}`;
  };

  // Add nodes
  data.nodes.forEach(node => {
    const [start, end] = getShapeBrackets(node.shape);
    // Sanitize label for mermaid: escape quotes and convert newlines to <br> for HTML labels
    const sanitizedLabel = node.label.replace(/"/g, '&quot;').replace(/\n/g, '<br/>');
    mermaidString += `    ${sanitizeId(node.id)}${start}"${sanitizedLabel}"${end};\n`;
  });

  // Add edges
  data.edges.forEach(edge => {
    if (edge.label) {
      // Sanitize label for mermaid: escape quotes and convert newlines to <br>
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
        \`\`\`json
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
        \`\`\`
    3.  **NODE REQUIREMENTS:**
        -   'id': A unique string identifier (e.g., "A", "B", "node1"). Do not use MermaidJS reserved keywords like 'graph', 'subgraph', 'end', etc.
        -   'label': A concise, descriptive text explaining the code's action at that step. This is mandatory for all nodes.
        -   'shape': Must be one of 'rect' (for processes), 'diamond' (for conditionals), 'round-rect' (for I/O), or 'stadium' (for start/end).
    4.  **EDGE REQUIREMENTS:**
        -   'from': The 'id' of the starting node.
        -   'to': The 'id' of the ending node.
        -   'label': (Optional) A label for the edge, typically "Yes" or "No" for conditional branches.
    5.  **LOGIC:** Represent loops with cycles. Represent if/else with diamond-shaped nodes and labeled edges.
    6.  **VALID JSON SYNTAX:** The output MUST be a perfectly valid JSON object. Pay special attention to string values within the 'label' fields:
        -   **Double Quotes:** Any double quotes (") inside a label's text MUST be escaped with a backslash (e.g., "He said \\"Hi\\"").
        -   **Backslashes:** Any backslashes (\\) must be escaped with another backslash (e.g., "Path: C:\\\\Users\\\\...").
        -   **Newlines:** Any newlines must be represented as a \\n character, NOT as literal newlines in the string.

    Analyze this ${language} code:
    ---
    ${code}
    ---
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
    // Basic validation
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
    return ''; // Return empty string if there's no code to translate
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
    A detailed review in Markdown format. The review must include these sections in order:
    - A high-level summary of the changes.
    - A section titled "### Correctness" pointing out any logical errors and how you fixed them.
    - A section titled "### Performance" explaining the optimizations applied (e.g., algorithmic improvements, better data structures).
    - A section titled "### Readability" suggesting improvements for style and maintainability.
    - A section titled "### Dry Run" with a step-by-step execution trace of your optimized code with a simple example input.
    - Use bullet points starting with '* ' for lists.
    [AI_REVIEW_END]
    [AI_CODE_START]
    The complete, corrected, and optimized ${language} code. Do not add any extra text or markdown code block fences.
    [AI_CODE_END]

    Original Code to review:
    ---
    ${userCode}
    ---
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

        // --- Stream Review ---
        const reviewStartTag = '[AI_REVIEW_START]';
        const reviewEndTag = '[AI_REVIEW_END]';
        let reviewContent = '';

        const reviewStartIndex = fullResponseText.indexOf(reviewStartTag);
        if (reviewStartIndex !== -1) {
          const reviewEndIndex = fullResponseText.indexOf(reviewEndTag, reviewStartIndex);
          if (reviewEndIndex !== -1) {
            reviewContent = fullResponseText.substring(reviewStartIndex + reviewStartTag.length, reviewEndIndex);
          } else {
            reviewContent = fullResponseText.substring(reviewStartIndex + reviewStartTag.length);
          }
        }
        
        if (reviewContent.length > lastYieldedReview.length) {
          const reviewChunk = reviewContent.substring(lastYieldedReview.length);
          yield { reviewChunk };
          lastYieldedReview = reviewContent;
        }

        // --- Stream Code ---
        const codeStartTag = '[AI_CODE_START]';
        const codeEndTag = '[AI_CODE_END]';
        let codeContent = '';
        
        const codeStartIndex = fullResponseText.indexOf(codeStartTag);
        if (codeStartIndex !== -1) {
           const codeEndIndex = fullResponseText.indexOf(codeEndTag, codeStartIndex);
           if(codeEndIndex !== -1) {
             codeContent = fullResponseText.substring(codeStartIndex + codeStartTag.length, codeEndIndex);
           } else {
             codeContent = fullResponseText.substring(codeStartIndex + codeStartTag.length);
           }
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
