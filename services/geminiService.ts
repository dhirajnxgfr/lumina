import { GoogleGenAI } from "@google/genai";

export const generateInvoiceTerms = async (businessName: string, itemsDescription: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const prompt = `
    Generate professional, concise invoice terms and conditions for a business named "${businessName}".
    The business generally provides: ${itemsDescription}.
    Limit to 3 short bullet points. plain text.
    Focus on payment deadlines and late fees.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "Payment due on receipt.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Payment due within 30 days. Please include invoice number on check.";
  }
};

export const generateThankYouNote = async (recipientName: string, businessName: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const prompt = `
    Write a short, warm, professional thank you note for an invoice.
    From: ${businessName}
    To: ${recipientName}
    Keep it under 30 words.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "Thank you for your business!";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Thank you for your valued business. We look forward to working with you again.";
  }
};

export const suggestItemDescription = async (roughInput: string): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
    const prompt = `
      Rewrite this rough invoice item description to sound more professional: "${roughInput}".
      Output only the description, nothing else.
    `;
  
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });
      return response.text.replace(/\n/g, '').trim() || roughInput;
    } catch (error) {
      return roughInput;
    }
  };