import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

app.use(express.json());

// Initialize Gemini client if API key is present
const geminiApiKey = process.env.GEMINI_API_KEY;
let aiClient: GoogleGenAI | null = null;
if (geminiApiKey) {
  aiClient = new GoogleGenAI({ apiKey: geminiApiKey });
}

// AI Shopping Assistant Proxy Endpoint
app.post('/api/ai/chat', async (req, res) => {
  try {
    const { messages, contextProduct } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    if (!aiClient) {
      // Return smart fallback assistant response if key is not configured yet
      const lastMsg = messages[messages.length - 1]?.content?.toLowerCase() || '';
      let reply = "Welcome to Vyuma! I am your AI Shopping Assistant. How can I help you with your shopping, orders, or checkout today?";
      if (contextProduct) {
        reply = `You are viewing "${contextProduct.title}". It is listed at ₹${contextProduct.price.toLocaleString('en-IN')} with secure delivery and Razorpay checkout protection. Let me know if you would like more details.`;
      } else if (lastMsg.includes('payment') || lastMsg.includes('razorpay')) {
        reply = "We accept all major payment modes via Razorpay including UPI (Google Pay, PhonePe, Paytm), Credit & Debit cards, and NetBanking.";
      } else if (lastMsg.includes('order') || lastMsg.includes('delivery')) {
        reply = "All orders placed on Vyuma are synchronized with Firebase Firestore in real-time, with doorstep express delivery and live status tracking.";
      } else if (lastMsg.includes('return') || lastMsg.includes('refund')) {
        reply = "We offer a 7-day hassle-free replacement policy on verified purchases.";
      }
      return res.json({ reply });
    }

    const systemInstruction = `You are "Vyuma AI", the friendly, knowledgeable, and helpful e-commerce shopping assistant for VYUMA (an Indian e-commerce platform like Flipkart/Amazon).
Brand name: VYUMA. Never mention or refer to Flipkart.
Your role:
- Help shoppers discover products, compare features, choose between options, find the best deals, and answer questions about orders, delivery, and returns.
- Keep answers concise, polite, engaging, and formatted with bullet points where helpful.
- Mention prices in Indian Rupees (₹).
- Delivery is fast across India (typically 1-3 business days with Vyuma Assured).
- 7 days replacement and 100% genuine guarantee.
${contextProduct ? `The user is currently viewing: ${JSON.stringify(contextProduct)}` : ''}`;

    // Format chat history
    const contents = messages.map((m: { role: string; content: string }) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    // Use gemini-2.5-flash for fast and smart shopping responses
    const response = await aiClient.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: contents,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    const reply = response.text || "I'm here to assist with your shopping needs on Vyuma!";
    return res.json({ reply });
  } catch (error: any) {
    console.error('Gemini API Error:', error);
    return res.status(500).json({
      error: 'Failed to generate shopping assistance response',
      details: error.message,
    });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', store: 'VYUMA', timestamp: new Date().toISOString() });
});

async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Vyuma E-Commerce Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
