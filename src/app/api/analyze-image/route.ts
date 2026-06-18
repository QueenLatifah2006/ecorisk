import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export async function POST(request: Request) {
  try {
    const { imageBase64 } = await request.json();
    if (!imageBase64) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    // Remove data:image/jpeg;base64, prefix if present
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");

    const prompt = `You are an expert environmental hazard assessor. Analyze the provided image and classify the urban or environmental problem it depicts.

Possible Categories:
- waste (Déchets / Dépotoirs)
- pollution (Odeurs / Pollution visible)
- blocked_drains (Caniveaux Bouchés)
- stagnant_water (Eau Stagnante)
- broken_pipes (Tuyaux Cassés)
- power_poles (Poteaux Dangereux)
- unsanitary_zones (Zones Insalubres)
- flood (Inondation)

Determine the most appropriate category and estimate the severity (low, medium, high).
Respond strictly in the following JSON format:
{
  "category": "waste",
  "severity": "medium",
  "reasoning": "A brief explanation of what you see and why you chose this category and severity."
}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt },
            { inlineData: { mimeType: "image/jpeg", data: base64Data } }
          ]
        }
      ],
      config: {
          responseMimeType: "application/json",
          temperature: 0.2
      }
    });

    const text = response.text || "";
    let result;
    try {
      result = JSON.parse(text);
    } catch (e) {
      // Fallback for markdown-wrapped json
      const match = text.match(/```json\n([\s\S]*)\n```/);
      if (match) {
         result = JSON.parse(match[1]);
      } else {
         throw e;
      }
    }
    
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error analyzing image:", error);
    return NextResponse.json({ error: "Failed to analyze image" }, { status: 500 });
  }
}
