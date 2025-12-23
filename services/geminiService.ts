
import { GoogleGenAI } from "@google/genai";

// Strictly using process.env.API_KEY directly as per developer guidelines
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getHRAssistantResponse = async (prompt: string) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: "أنت مساعد ذكي متخصص في الموارد البشرية لنظام المدار في العراق. أجب باللغة العربية بأسلوب احترافي."
      }
    });
    // Accessing .text property directly as it is not a method
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "عذراً، حدث خطأ أثناء معالجة طلبك الذكي.";
  }
};

export const analyzePayrollTrend = async (data: any) => {
  const prompt = `حلل بيانات الرواتب التالية وقدم توصيات مختصرة للإدارة: ${JSON.stringify(data)}`;
  return await getHRAssistantResponse(prompt);
};
