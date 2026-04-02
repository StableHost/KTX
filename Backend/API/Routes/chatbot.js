import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

// Khởi tạo Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

// POST /api/chatbot - Chat với AI
router.post('/', async (req, res, next) => {
  try {
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ 
        error: 'Vui lòng nhập tin nhắn' 
      });
    }

    // Gửi tin nhắn tới Gemini
    const result = await model.generateContent(message);
    const response = await result.response;
    const text = response.text();

    res.json({ 
      reply: text,
      success: true 
    });
  } catch (error) {
    console.error('ChatBot Error:', error);
    next({
      statusCode: 500,
      message: 'Lỗi kết nối AI của Google. Vui lòng thử lại sau.'
    });
  }
});

export default router;
