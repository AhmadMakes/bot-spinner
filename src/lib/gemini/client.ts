import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  throw new Error('Missing GEMINI_API_KEY');
}

const genAI = new GoogleGenerativeAI(apiKey);

export const getFlashModel = () => genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
