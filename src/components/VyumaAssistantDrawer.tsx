import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Sparkles, Bot, User, CornerDownRight, Loader2 } from 'lucide-react';
import { Product } from '../types';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface VyumaAssistantDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  contextProduct: Product | null;
  onSelectProduct: (product: Product) => void;
}

export const VyumaAssistantDrawer: React.FC<VyumaAssistantDrawerProps> = ({
  isOpen,
  onClose,
  contextProduct,
  onSelectProduct,
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: contextProduct
        ? `Hello! I'm **Vyuma AI**, your smart shopping advisor. I see you're looking at **${contextProduct.title}**. Would you like to know about its battery life, compare it with alternatives, or check today's bank offers?`
        : `Hi! I'm **Vyuma AI**, your intelligent shopping companion. Ask me for recommendations, feature comparisons, budget advice, or today's best deals!`,
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (contextProduct) {
      setMessages([
        {
          role: 'assistant',
          content: `Hello! I'm **Vyuma AI**, your smart shopping advisor. I see you're looking at **${contextProduct.title}**. Would you like to know about its camera capabilities, compare it with alternatives, or check available bank discounts?`,
        },
      ]);
    }
  }, [contextProduct]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  if (!isOpen) return null;

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || loading) return;

    const newMessages: Message[] = [...messages, { role: 'user', content: text }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages,
          contextProduct: contextProduct
            ? {
                title: contextProduct.title,
                brand: contextProduct.brand,
                price: contextProduct.price,
                originalPrice: contextProduct.originalPrice,
                category: contextProduct.category,
                specs: contextProduct.specs,
                rating: contextProduct.rating,
              }
            : null,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }

      const data = await response.json();
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data.reply || "I'm ready to help you with anything on Vyuma!",
        },
      ]);
    } catch (err) {
      console.error(err);
      let fallbackText = "I'm your Vyuma AI assistant. ";
      const lower = text.toLowerCase();
      if (contextProduct) {
        fallbackText += `For "${contextProduct.title}", this item is offered by ${contextProduct.seller || 'verified sellers'} at ₹${contextProduct.price.toLocaleString('en-IN')}. It includes 7-day replacement and safe delivery via Razorpay checkout.`;
      } else if (lower.includes('deal') || lower.includes('discount')) {
        fallbackText += "You can explore current verified deals on our catalog page. All discounts and promotions are live in real-time.";
      } else if (lower.includes('payment') || lower.includes('razorpay')) {
        fallbackText += "We support secure payments via Razorpay including UPI (Google Pay, PhonePe, Paytm), Credit/Debit cards, and NetBanking.";
      } else if (lower.includes('delivery') || lower.includes('shipping')) {
        fallbackText += "Delivery is handled with doorstep express shipping and live order tracking across India.";
      } else {
        fallbackText += "All items on Vyuma are 100% genuine and verified. How can I assist you with your shopping today?";
      }

      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: fallbackText },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const samplePrompts = contextProduct
    ? [
        `Tell me about ${contextProduct.title}`,
        'What are the key advantages of this product?',
        'What are the available payment methods?',
      ]
    : [
        'How does Razorpay payment work?',
        'What is the return and replacement policy?',
        'How do I track my orders?',
        'Tell me about Vyuma store guarantees',
      ];

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        
        {/* Drawer Header */}
        <div className="bg-gradient-to-r from-[#2874f0] to-[#1e5ecc] text-white p-4 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#ffe500] text-blue-900 flex items-center justify-center font-bold">
              <Sparkles className="w-4 h-4 fill-blue-900" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-bold text-sm tracking-wide">Vyuma AI Assistant</h3>
                <span className="text-[10px] bg-blue-700 font-semibold px-1.5 py-0.2 rounded text-blue-100">
                  Gemini
                </span>
              </div>
              <p className="text-[11px] text-blue-100">Live Shopping Advisor & Spec Comparer</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 hover:bg-blue-700/60 rounded-full transition cursor-pointer"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Context Product Card if active */}
        {contextProduct && (
          <div className="bg-blue-50/60 border-b border-blue-100 p-2.5 flex items-center gap-3">
            <img
              src={contextProduct.image}
              alt={contextProduct.title}
              className="w-9 h-9 object-contain bg-white rounded p-0.5 border border-blue-200"
            />
            <div className="flex-1 min-w-0 text-xs">
              <span className="text-[10px] text-gray-500 block uppercase font-bold">
                Inspecting Item:
              </span>
              <p className="font-semibold text-gray-900 truncate">
                {contextProduct.title}
              </p>
            </div>
            <span className="text-xs font-bold text-[#2874f0]">
              ₹{contextProduct.price.toLocaleString('en-IN')}
            </span>
          </div>
        )}

        {/* Message Thread */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-gray-50">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex gap-2.5 ${
                m.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {m.role === 'assistant' && (
                <div className="w-7 h-7 rounded-full bg-[#2874f0] text-white flex items-center justify-center shrink-0 text-xs">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed shadow-2xs ${
                  m.role === 'user'
                    ? 'bg-[#2874f0] text-white rounded-br-xs'
                    : 'bg-white text-gray-800 border border-gray-200 rounded-bl-xs'
                }`}
              >
                <div className="whitespace-pre-wrap font-sans">
                  {m.content}
                </div>
              </div>

              {m.role === 'user' && (
                <div className="w-7 h-7 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center shrink-0 text-xs">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 text-xs text-gray-500 py-1">
              <div className="w-7 h-7 rounded-full bg-[#2874f0] text-white flex items-center justify-center shrink-0">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              </div>
              <span className="bg-white px-3 py-2 rounded-2xl border border-gray-200 shadow-2xs">
                Vyuma AI is typing...
              </span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Queries */}
        <div className="px-4 py-2 border-t border-gray-200 bg-white">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
            Suggested Questions
          </p>
          <div className="flex flex-wrap gap-1.5">
            {samplePrompts.map((q, i) => (
              <button
                key={i}
                onClick={() => handleSend(q)}
                className="text-[11px] bg-gray-100 hover:bg-blue-50 hover:text-[#2874f0] hover:border-blue-300 text-gray-700 border border-gray-200 px-2.5 py-1 rounded-full transition cursor-pointer text-left"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Message Input Box */}
        <div className="p-3 border-t border-gray-200 bg-white">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Vyuma AI about products, deals, specs..."
              className="flex-1 text-xs border border-gray-300 rounded-full px-3.5 py-2.5 outline-none focus:border-[#2874f0] focus:ring-1 focus:ring-[#2874f0]"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="bg-[#2874f0] hover:bg-blue-600 text-white p-2.5 rounded-full transition disabled:opacity-40 cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
