import { GoogleGenAI } from "@google/genai";
import { stripBase64Prefix } from "../utils/imageUtils";

// Initialize Gemini API
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Using 2.5 Flash Image as requested for "Nano Banana" capabilities.
const MODEL_NAME = 'gemini-2.5-flash-image'; 

/**
 * Generates a clothing image based on a text prompt.
 */
export const generateClothingImage = async (prompt: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: {
        parts: [{ text: `Design a standalone clothing item: ${prompt}. Professional fashion photography, flat lay on white background, high detailed texture, completely visible.` }]
      },
    });

    const candidates = response.candidates;
    if (candidates && candidates.length > 0) {
      const parts = candidates[0].content.parts;
      for (const part of parts) {
        if (part.inlineData) {
          return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
      }
    }
    throw new Error("No image generated.");
  } catch (error) {
    console.error("Generate Clothing Error:", error);
    throw error;
  }
};

/**
 * Generates a single view for the try-on process.
 */
const generateSingleView = async (personData: string, clothData: string, viewAngle: string): Promise<string> => {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: {
        parts: [
          { text: "This is the target person." },
          { inlineData: { mimeType: 'image/jpeg', data: personData } },
          { text: "This is the clothing garment." },
          { inlineData: { mimeType: 'image/jpeg', data: clothData } },
          {
            text: `Generate a photorealistic full-body fashion photo of the target person wearing the target clothing.
            
            **View Angle**: ${viewAngle}
            
            **Strict Requirements**:
            1. **Full Body**: The person must be completely visible from the top of the head to the bottom of the shoes. ADD PADDING at top and bottom. DO NOT CROP HEAD OR FEET.
            2. **Independent Image**: Generate a SINGLE, high-resolution standalone image of this angle.
            3. **Consistency**: Maintain the exact facial identity, body shape, and clothing details of the reference person.
            4. **Background**: Pure solid white background (#FFFFFF).
            5. **Pose**: Natural standing fashion pose suitable for a 360-degree view.`
          }
        ]
      },
      config: {
        imageConfig: {
            aspectRatio: '9:16' // Portrait mode for full body
        }
      }
    });

    const candidates = response.candidates;
    if (candidates && candidates.length > 0) {
      const parts = candidates[0].content.parts;
      for (const part of parts) {
        if (part.inlineData) {
          return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
      }
    }
    throw new Error(`Failed to generate ${viewAngle}`);
};

/**
 * Performs the "Try On" operation by generating 4 independent high-res images.
 * Returns an array of 4 base64 strings: [Front, Left, Back, Right].
 */
export const generateTryOn = async (personBase64: string, clothBase64: string): Promise<string[]> => {
  try {
    const personData = stripBase64Prefix(personBase64);
    const clothData = stripBase64Prefix(clothBase64);

    // Run 4 generations in parallel for speed
    const views = [
      'Front View (facing camera)', 
      'Left Side Profile View (person facing left)', 
      'Back View (facing away)', 
      'Right Side Profile View (person facing right)'
    ];

    const promises = views.map(view => generateSingleView(personData, clothData, view));
    
    // Wait for all 4 to complete
    const results = await Promise.all(promises);
    return results;

  } catch (error) {
    console.error("Try-On Generation Error:", error);
    throw error;
  }
};