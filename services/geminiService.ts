import { GoogleGenAI, Type } from "@google/genai";
import { BaAggregatedData, AnalysisResult } from "../types";

const apiKey = process.env.API_KEY;
// Fallback for development if needed, but prefer env var
if (!apiKey) {
  console.warn("API_KEY is missing in environment variables.");
}

const ai = new GoogleGenAI({ apiKey: apiKey || '' });

export const analyzeClusters = async (data: BaAggregatedData[]): Promise<AnalysisResult> => {
  // To avoid token limits, we might need to sample or send simplified data
  // For this demo, we'll send the top 200 BAs by transaction count or simple first 200
  // In production, you might want to send only statistics or a random sample.
  const sampleSize = 150;
  const dataToSend = data.slice(0, sampleSize).map(d => ({
    id: d.baId,
    total: d.totalAmount.toFixed(2),
    avg: d.averageAmount.toFixed(2),
    count: d.transactionCount,
    stdDev: d.stdDevAmount.toFixed(2)
  }));

  const prompt = `
    I have transaction data for Business Associates (BAs). 
    Please analyze the following list of BA statistics (Total Amount, Average Amount, Transaction Count, StdDev).
    
    Task:
    1. Identify 3 distinct clusters/segments based on their spending behavior (e.g., High Value, Frequent Small Spenders, Churn Risk, etc.).
    2. Assign each BA provided in the list to one of these clusters.
    
    Data:
    ${JSON.stringify(dataToSend)}
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          clusters: {
            type: Type.ARRAY,
            description: "The 3 defined clusters",
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                description: { type: Type.STRING },
                color: { type: Type.STRING, description: "A hex color code suitable for charts (e.g., #FF5733)" }
              },
              required: ["name", "description", "color"]
            }
          },
          assignments: {
            type: Type.ARRAY,
            description: "Assignment of each BA ID to a cluster name",
            items: {
              type: Type.OBJECT,
              properties: {
                baId: { type: Type.STRING },
                clusterName: { type: Type.STRING }
              },
              required: ["baId", "clusterName"]
            }
          }
        },
        required: ["clusters", "assignments"]
      }
    }
  });

  if (!response.text) {
    throw new Error("No response from Gemini");
  }

  return JSON.parse(response.text) as AnalysisResult;
};