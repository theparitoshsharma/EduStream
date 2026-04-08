/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from "react";
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import ReactMarkdown from "react-markdown";
import { 
  Send, 
  Bot, 
  User, 
  Loader2, 
  TrendingUp, 
  PieChart, 
  Globe, 
  Cpu, 
  ChevronRight,
  MessageSquare,
  Sparkles
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "./lib/utils";

// Types
interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const SYSTEM_INSTRUCTION = `You are FinAI Insights, an elite AI and Machine Learning consultant specializing in the intersection of technology, finance, and economics. 

Your expertise includes:
- Quantitative Finance & Algorithmic Trading
- Risk Management & Credit Scoring using ML
- Macroeconomic Forecasting with Deep Learning
- Natural Language Processing (NLP) for Sentiment Analysis in Markets
- Fraud Detection & Anti-Money Laundering (AML)
- Blockchain & Decentralized Finance (DeFi)
- ESG (Environmental, Social, and Governance) Analytics

Guidelines:
1. Provide detailed, technically accurate, and professional responses.
2. Use real-world examples and case studies where relevant.
3. If a question is outside the scope of finance, economics, or AI/ML, politely redirect the conversation back to your area of expertise.
4. Use Markdown for formatting (bolding, lists, tables, code blocks).
5. Be concise but thorough.
`;

const SUGGESTED_QUESTIONS = [
  {
    icon: <TrendingUp className="w-4 h-4" />,
    text: "How is Reinforcement Learning used in high-frequency trading?",
    label: "Trading"
  },
  {
    icon: <PieChart className="w-4 h-4" />,
    text: "Explain ML's role in credit risk assessment for SMEs.",
    label: "Risk"
  },
  {
    icon: <Globe className="w-4 h-4" />,
    text: "How can Deep Learning improve macroeconomic forecasting?",
    label: "Economics"
  },
  {
    icon: <Cpu className="w-4 h-4" />,
    text: "What are the ethical implications of AI in automated lending?",
    label: "Ethics"
  }
];

export default function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [ai, setAi] = useState<GoogleGenAI | null>(null);

  useEffect(() => {
    // Initialize AI
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      setAi(new GoogleGenAI({ apiKey }));
    }
  }, []);

  useEffect(() => {
    // Auto-scroll to bottom
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSend = async (text: string = input) => {
    if (!text.trim() || !ai || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const chat = ai.chats.create({
        model: "gemini-3-flash-preview",
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
        },
        // Pass history
        history: messages.map(m => ({
          role: m.role === "assistant" ? "model" : "user",
          parts: [{ text: m.content }]
        }))
      });

      const response = await chat.sendMessageStream({ message: text });
      
      let assistantContent = "";
      const assistantMessageId = (Date.now() + 1).toString();

      // Add a placeholder assistant message
      setMessages((prev) => [
        ...prev,
        {
          id: assistantMessageId,
          role: "assistant",
          content: "",
          timestamp: new Date(),
        },
      ]);

      for await (const chunk of response) {
        const c = chunk as GenerateContentResponse;
        const textChunk = c.text || "";
        assistantContent += textChunk;
        
        setMessages((prev) => 
          prev.map(m => m.id === assistantMessageId ? { ...m, content: assistantContent } : m)
        );
      }
    } catch (error) {
      console.error("Chat Error:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "assistant",
          content: "I apologize, but I encountered an error processing your request. Please try again.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-[var(--color-brand-bg)] overflow-hidden">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex flex-col w-80 bg-white border-r border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-10">
          <div className="bg-[var(--color-brand-accent)] p-2 rounded-xl">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold font-serif leading-tight">FinAI</h1>
            <p className="text-xs text-gray-500 font-medium tracking-wider uppercase">Insights Engine</p>
          </div>
        </div>

        <div className="space-y-8">
          <div>
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Sparkles className="w-3 h-3" />
              Suggested Topics
            </h2>
            <div className="space-y-3">
              {SUGGESTED_QUESTIONS.map((q, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(q.text)}
                  className="w-full text-left p-3 rounded-xl border border-gray-100 hover:border-[var(--color-brand-accent)] hover:bg-blue-50 transition-all group"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[var(--color-brand-accent)]">{q.icon}</span>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter group-hover:text-[var(--color-brand-accent)]">
                      {q.label}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed group-hover:text-gray-900">
                    {q.text}
                  </p>
                </button>
              ))}
            </div>
          </div>

          <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
            <h3 className="text-sm font-bold mb-2 flex items-center gap-2">
              <Globe className="w-4 h-4 text-blue-500" />
              Global Context
            </h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              Analyzing real-time market shifts and economic indicators using state-of-the-art LLMs.
            </p>
          </div>
        </div>

        <div className="mt-auto pt-6 border-t border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
              <User className="w-4 h-4 text-gray-500" />
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-xs font-bold truncate">theparitoshsharma@gmail.com</p>
              <p className="text-[10px] text-gray-400">Pro Researcher</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col relative">
        {/* Header - Mobile */}
        <header className="lg:hidden flex items-center justify-between p-4 bg-white border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Bot className="w-6 h-6 text-[var(--color-brand-accent)]" />
            <h1 className="font-serif font-bold">FinAI Insights</h1>
          </div>
          <button className="p-2 rounded-lg hover:bg-gray-100">
            <MessageSquare className="w-5 h-5 text-gray-500" />
          </button>
        </header>

        {/* Messages */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-4 lg:p-8 space-y-8 scroll-smooth"
        >
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center max-w-2xl mx-auto text-center space-y-6">
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-20 h-20 bg-blue-50 rounded-3xl flex items-center justify-center"
              >
                <Bot className="w-10 h-10 text-[var(--color-brand-accent)]" />
              </motion.div>
              <div className="space-y-2">
                <h2 className="text-3xl font-serif font-bold tracking-tight">How can I assist your research today?</h2>
                <p className="text-gray-500 max-w-md mx-auto">
                  Ask me about quantitative models, market sentiment analysis, or the impact of AI on global economics.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                {SUGGESTED_QUESTIONS.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(q.text)}
                    className="p-4 text-left rounded-2xl bg-white border border-gray-100 hover:border-[var(--color-brand-accent)] hover:shadow-sm transition-all flex items-start gap-3"
                  >
                    <div className="p-2 bg-gray-50 rounded-lg text-[var(--color-brand-accent)]">
                      {q.icon}
                    </div>
                    <span className="text-sm text-gray-600 font-medium">{q.text}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto space-y-8">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "flex gap-4 lg:gap-6",
                    message.role === "user" ? "flex-row-reverse" : "flex-row"
                  )}
                >
                  <div className={cn(
                    "w-8 h-8 lg:w-10 lg:h-10 rounded-xl flex items-center justify-center shrink-0",
                    message.role === "user" ? "bg-gray-900" : "bg-[var(--color-brand-accent)]"
                  )}>
                    {message.role === "user" ? (
                      <User className="w-5 h-5 text-white" />
                    ) : (
                      <Bot className="w-5 h-5 text-white" />
                    )}
                  </div>
                  <div className={cn(
                    "flex flex-col max-w-[85%] lg:max-w-[75%]",
                    message.role === "user" ? "items-end" : "items-start"
                  )}>
                    <div className={cn(
                      "p-4 lg:p-5 rounded-2xl",
                      message.role === "user" 
                        ? "bg-gray-900 text-white rounded-tr-none" 
                        : "bg-white border border-gray-100 shadow-sm rounded-tl-none"
                    )}>
                      <div className="markdown-body">
                        <ReactMarkdown>{message.content}</ReactMarkdown>
                      </div>
                    </div>
                    <span className="text-[10px] text-gray-400 mt-2 font-medium uppercase tracking-wider">
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </motion.div>
              ))}
              {isLoading && (
                <div className="flex gap-4 lg:gap-6">
                  <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-xl bg-[var(--color-brand-accent)] flex items-center justify-center shrink-0">
                    <Loader2 className="w-5 h-5 text-white animate-spin" />
                  </div>
                  <div className="p-4 bg-white border border-gray-100 shadow-sm rounded-2xl rounded-tl-none">
                    <div className="flex gap-1">
                      <motion.div 
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ repeat: Infinity, duration: 1.5, delay: 0 }}
                        className="w-1.5 h-1.5 bg-gray-300 rounded-full" 
                      />
                      <motion.div 
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ repeat: Infinity, duration: 1.5, delay: 0.2 }}
                        className="w-1.5 h-1.5 bg-gray-300 rounded-full" 
                      />
                      <motion.div 
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ repeat: Infinity, duration: 1.5, delay: 0.4 }}
                        className="w-1.5 h-1.5 bg-gray-300 rounded-full" 
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 lg:p-8 bg-gradient-to-t from-[var(--color-brand-bg)] via-[var(--color-brand-bg)] to-transparent">
          <div className="max-w-4xl mx-auto relative">
            <div className="relative flex items-center">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Ask about ML in finance..."
                className="w-full bg-white border border-gray-200 rounded-2xl px-5 py-4 pr-16 shadow-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-accent)]/20 focus:border-[var(--color-brand-accent)] transition-all resize-none min-h-[60px] max-h-[200px]"
                rows={1}
              />
              <button
                onClick={() => handleSend()}
                disabled={!input.trim() || isLoading}
                className={cn(
                  "absolute right-3 p-2.5 rounded-xl transition-all",
                  input.trim() && !isLoading
                    ? "bg-[var(--color-brand-accent)] text-white shadow-md hover:scale-105 active:scale-95"
                    : "bg-gray-100 text-gray-400 cursor-not-allowed"
                )}
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
            <p className="text-[10px] text-center text-gray-400 mt-3 font-medium uppercase tracking-widest">
              Powered by Gemini 3 Flash • Expert Financial AI
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
