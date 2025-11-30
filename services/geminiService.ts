import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Converts a File object to a Base64 string suitable for Gemini API.
 */
const fileToGenerativePart = async (file: File): Promise<{ inlineData: { data: string; mimeType: string } }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
      const base64Data = base64String.split(',')[1];
      resolve({
        inlineData: {
          data: base64Data,
          mimeType: file.type,
        },
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const analyzeImageEdits = async (file: File): Promise<AnalysisResult> => {
  try {
    const imagePart = await fileToGenerativePart(file);

    const prompt = `
      Analyze this image specifically for signs of digital editing, manipulation, or generation. 
      Act as a digital forensics expert. 
      
      I want you to estimate the likelihood (from 0 to 10) that specific tools were used to create or modify this image.
      
      You must specifically evaluate the image for the following tools:
      1. Adobe Lightroom (Color grading, exposure adjustments)
      2. Adobe Photoshop (Compositing, healing, liquify)
      3. ChatGPT / DALL-E (AI generation, specific smooth textures, text rendering artifacts)
      4. Nano Banana (Look for deep-fried artifacts, uncanny valley features, or specific "Nano Banana" style synthetic signatures)
      5. Mobile Filters (Instagram, VSCO, Snapchat)
      
      Also, estimate the "Edit Count" - roughly how many distinct editing operations or layers seem to have been applied (e.g., 0 for raw, 1-3 for light touch-ups, 10+ for heavy manipulation).

      Finally, analyze the visual characteristics (grain, noise pattern, depth of field, color science) to estimate the "Original Device" used to take the picture. Be as specific as possible (e.g., "High-end DSLR", "iPhone 14 Pro", "Mid-range Android", "Film Camera 35mm", or "AI Image Generator").

      Return a JSON response listing these details.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: {
        parts: [
          imagePart,
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            overallAssessment: {
              type: Type.STRING,
              description: "A summary paragraph describing the overall authenticity and style of the image."
            },
            estimatedEditLayerCount: {
              type: Type.INTEGER,
              description: "Estimated number of distinct editing operations or layers detected."
            },
            originalDevice: {
              type: Type.STRING,
              description: "The estimated device or camera type used to capture the image (e.g. iPhone, DSLR, AI Generator)."
            },
            detectedTools: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING, description: "Name of the tool (e.g., Lightroom, Photoshop, ChatGPT, Nano Banana)" },
                  likelihoodScore: { type: Type.NUMBER, description: "Score from 0 to 10 indicating likelihood of usage." },
                  reasoning: { type: Type.STRING, description: "Brief explanation of visual cues found." }
                },
                required: ["name", "likelihoodScore", "reasoning"]
              }
            }
          },
          required: ["overallAssessment", "estimatedEditLayerCount", "originalDevice", "detectedTools"]
        }
      }
    });

    if (!response.text) {
      throw new Error("No response received from Gemini.");
    }

    const result: AnalysisResult = JSON.parse(response.text);
    return result;

  } catch (error) {
    console.error("Error analyzing image:", error);
    throw error;
  }
};