import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';

const router = express.Router();

// Initialize Gemini
const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

router.post('/chat', async (req, res) => {
  const { prompt } = req.body;
  
  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  try {
    const model = ai.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      systemInstruction: "You are an AI assistant for the MedBook clinic management system. You help the user manage patients and appointments. If the user asks to perform an action like marking an appointment as done, respond politely and include a line like 'ACTION: MARK_APPOINTMENT_DONE' so the system can handle it."
    });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    res.json({ response: text });
  } catch (error) {
    console.error('Gemini error:', error);
    res.status(500).json({ error: 'Failed to generate response from AI' });
  }
});

export default router;
