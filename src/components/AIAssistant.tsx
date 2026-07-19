'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Bot, X, Loader2, Sparkles, ImageIcon } from 'lucide-react';
import { API_URL, getSessionId, Product } from '@/lib/api';
import { fallbackProducts as clientFallbackProducts } from '@/data/products';
import Image from 'next/image';
import { useAuth } from '@/lib/auth';
import { generateProductImage, isImageRequest, extractImageSubject } from '@/lib/imageGenerator';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  imageUrl?: string;
}

const GREETING: Message = {
  role: 'assistant',
  content: "Hi! I'm ShopNova AI. I can help you find products, compare options, answer questions, and even generate product images! What are you looking for today?",
};

const DEFAULT_FOLLOW_UPS = [
  'Show me wireless headphones',
  'Generate an image of headphones',
  'What categories do you have?',
];

function getStorageKey() {
  return `shopnova_chat_${getSessionId()}`;
}

function loadMessages(): Message[] {
  if (typeof window === 'undefined') return [GREETING];
  try {
    const raw = localStorage.getItem(getStorageKey());
    if (raw) {
      const parsed = JSON.parse(raw) as Message[];
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch { /* ignore */ }
  return [GREETING];
}

function saveMessages(msgs: Message[]) {
  if (typeof window === 'undefined') return;
  try {
    // Keep last 60 messages, strip large dataUrls to avoid localStorage bloat
    const trimmed = msgs.slice(-60).map(m => ({
      ...m,
      imageUrl: m.imageUrl ? '(image)' : undefined,
    }));
    localStorage.setItem(getStorageKey(), JSON.stringify(trimmed));
  } catch { /* ignore */ }
}

export default function AIAssistant() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>(loadMessages);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [followUps, setFollowUps] = useState<string[]>(DEFAULT_FOLLOW_UPS);
  const [suggestedProducts, setSuggestedProducts] = useState<Product[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Persist messages to localStorage whenever they change
  useEffect(() => {
    saveMessages(messages);
  }, [messages]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load message history from DB when user logs in/out
  useEffect(() => {
    const fetchSession = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers: Record<string, string> = {};
        if (token) headers.Authorization = `Bearer ${token}`;

        const res = await fetch(`${API_URL}/chat/session?sessionId=${getSessionId()}`, { headers });
        if (res.ok) {
          const data = await res.json();
          if (data.messages && data.messages.length > 0) {
            setMessages(data.messages);
            return;
          }
        }
      } catch (err) {
        // Quietly catch connection errors
      }
      
      // Fallback: load messages from localStorage if offline or no DB history
      const localMsgs = loadMessages();
      setMessages(localMsgs);
    };
    fetchSession();
  }, [user]);

  // Load personalized follow-up suggestions based on browsing behavior
  const loadPersonalizedSuggestions = useCallback(async () => {
    try {
      const res = await fetch(
        `${API_URL}/ai/recommendations?sessionId=${getSessionId()}&limit=3`,
        { headers: { Authorization: localStorage.getItem('token') ? `Bearer ${localStorage.getItem('token')}` : '' } }
      );
      if (!res.ok) return;
      const data = await res.json();
      const topCategories: string[] = data?.insights?.topCategories || [];
      if (topCategories.length >= 2) {
        setFollowUps([
          `Show me more ${topCategories[0]} products`,
          `Best ${topCategories[1]} under $200`,
          'Compare top rated options',
        ]);
      } else if (topCategories.length === 1) {
        setFollowUps([
          `Show me more ${topCategories[0]} products`,
          'Best laptops under $1500',
          'What categories do you have?',
        ]);
      }
    } catch {
      // Keep defaults if API is offline
    }
  }, []);

  // When chat opens, load personalized suggestions
  useEffect(() => {
    if (open) {
      loadPersonalizedSuggestions();
    }
  }, [open, loadPersonalizedSuggestions]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;

    const userMsg = text.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    // Quick responses for greetings
    const lower = userMsg.toLowerCase().replace(/[!?.,]/g, '').trim();
    const greetings: Record<string, string> = {
      'hi': "Hey there! 👋 How can I help you today?",
      'hello': "Hello! 😊 Welcome to ShopNova! What are you looking for?",
      'hey': "Hey! 👋 Nice to see you! Need help finding something?",
      'how are you': "I'm doing great, thanks for asking! 😊 How can I help you shop today?",
      'good morning': "Good morning! ☀️ Ready to find something awesome?",
      'good night': "Good night! 🌙 Come back anytime you need help!",
      'thanks': "You're welcome! 😊 Happy to help!",
      'thank you': "You're welcome! 🙌 Let me know if you need anything else!",
      'bye': "Goodbye! 👋 See you soon!",
    };

    if (greetings[lower]) {
      setMessages((prev) => [...prev, { role: 'assistant', content: greetings[lower] }]);
      setLoading(false);
      return;
    }

    // Check if this is an image generation request
    if (isImageRequest(userMsg)) {
      try {
        const subject = extractImageSubject(userMsg);
        setMessages((prev) => [...prev, { role: 'assistant', content: `Generating your image...` }]);

        const generated = await generateProductImage(subject);
        const reply = `Here you go! 🎨`;
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: 'assistant', content: reply, imageUrl: generated.url };
          return updated;
        });
      } catch (err) {
        setMessages((prev) => [...prev, { role: 'assistant', content: 'Sorry, I had trouble generating that image. Could you try a different description?' }]);
      }
      setLoading(false);
      return;
    }

    // Add an empty assistant message that we'll stream into
    setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

    try {
      const res = await fetch(`${API_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: localStorage.getItem('token') ? `Bearer ${localStorage.getItem('token')}` : '',
        },
        body: JSON.stringify({ message: userMsg, sessionId: getSessionId() }),
      });

      if (!res.ok || !res.body) throw new Error('Stream unavailable');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let streamedReply = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const event = JSON.parse(line.slice(6));

            if (event.type === 'chunk') {
              streamedReply += event.content;
              setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = { role: 'assistant', content: streamedReply };
                return updated;
              });
            } else if (event.type === 'done') {
              setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = { role: 'assistant', content: event.reply };
                return updated;
              });
              if (event.followUps) setFollowUps(event.followUps);
              if (event.products) setSuggestedProducts(event.products);
            } else if (event.type === 'error') {
              throw new Error(event.message);
            }
          } catch (e: any) {
            // Rethrow explicitly thrown errors (like 'AI service not configured')
            if (e.message && e.message !== 'Unexpected end of JSON input') {
              throw e;
            }
          }
        }
      }
    } catch (err: any) {
      console.warn('AI streaming failed:', err);

      setMessages((prev) => prev.filter((_, i) => i < prev.length - 1));

      const errMsg = err?.message || '';
      
      if (errMsg.includes('AI service not configured') || errMsg.includes('rate limit') || errMsg.includes('credit')) {
        setMessages((prev) => [...prev, { role: 'assistant', content: `Sorry, I couldn't process your request: ${errMsg}. Please ensure the API is properly configured.` }]);
        setLoading(false);
        return;
      }

      // Smart scoring offline search fallback
      const stopwords = new Set([
        'what', 'do', 'you', 'have', 'the', 'is', 'a', 'under', 'me', 'show', 'best',
        'for', 'to', 'any', 'of', 'in', 'on', 'at', 'with', 'an', 'please', 'find', 'i',
        'want', 'can', 'help', 'search', 'some', 'more', 'about', 'recommend', 'options',
        'need', 'buy', 'looking', 'get', 'good', 'items', 'shop', 'store', 'there', 'are',
      ]);

      const rawTerms = userMsg.toLowerCase()
        .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, '')
        .split(/\s+/);

      const searchTerms: string[] = [];
      for (const term of rawTerms) {
        if (term.length <= 1 || stopwords.has(term)) continue;
        searchTerms.push(term);
        if (term.endsWith('s') && term.length > 2) searchTerms.push(term.slice(0, -1));
      }

      const finalTerms = searchTerms.length > 0 ? searchTerms : rawTerms.filter(t => t.length > 1);

      const scored = clientFallbackProducts.map(p => {
        let score = 0;
        const nameLower = p.name.toLowerCase();
        const categoryLower = p.category.toLowerCase();
        const brandLower = p.brand.toLowerCase();
        const descLower = (p.description || '').toLowerCase() + ' ' + (p.shortDescription || '').toLowerCase();
        const tags = (p.tags || []).map(t => t.toLowerCase());

        for (const term of finalTerms) {
          if (nameLower.includes(term)) score += (new RegExp(`\\b${term}\\b`, 'i').test(p.name) ? 15 : 10);
          if (categoryLower.includes(term)) score += 8;
          if (brandLower.includes(term)) score += 8;
          if (tags.some(t => t.includes(term))) score += 8;
          if (descLower.includes(term)) score += 3;
        }
        return { product: p, score };
      });

      const matched = scored.filter(item => item.score > 0).sort((a, b) => b.score - a.score).map(item => item.product);
      const productsList = matched.length > 0 ? matched.slice(0, 4) : clientFallbackProducts.filter(p => p.featured).slice(0, 4);

      const reply = `I'm currently in offline mode. Here are some products matching "${userMsg}": ${
        productsList.map((p) => `${p.name} ($${p.price})`).join(', ') || 'no direct matches found'
      }. How else can I help?`;

      setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
      setFollowUps(['Show me wireless headphones', 'Best laptops under $1500', 'What categories do you have?']);
      setSuggestedProducts(productsList as any);
    } finally {
      setLoading(false);
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 bg-primary text-white px-5 py-3 rounded-2xl shadow-lg shadow-primary/30 hover:bg-primary-dark transition-all hover:scale-105 cursor-pointer"
      >
        <Bot className="w-5 h-5" />
        <span className="font-medium">AI Assistant</span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-40 w-[calc(100vw-2rem)] sm:w-[380px] h-[550px] card flex flex-col shadow-2xl shadow-primary/20">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-neutral/10 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-primary" />
          <div>
            <span className="font-semibold text-sm text-[var(--foreground)]">ShopNova AI</span>
            <div className="flex items-center gap-1 mt-0.5">
              <Sparkles className="w-3 h-3 text-secondary" />
              <span className="text-[10px] text-secondary font-medium">
                Memory On · {messages.length - 1} message{messages.length !== 2 ? 's' : ''} remembered
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Clear history */}
          <button
            onClick={() => {
              const fresh = [GREETING];
              setMessages(fresh);
              setSuggestedProducts([]);
              setFollowUps(DEFAULT_FOLLOW_UPS);
              saveMessages(fresh);
            }}
            title="Clear conversation history"
            className="text-neutral/50 hover:text-red-400 transition-colors p-1 rounded-lg hover:bg-red-400/10 cursor-pointer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
            </svg>
          </button>
          <button onClick={() => setOpen(false)} className="text-neutral hover:text-neutral-dark p-1 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                msg.role === 'user'
                      ? 'bg-primary text-white rounded-br-md'
                      : 'bg-[var(--surface)] text-[var(--foreground)] rounded-bl-md'
              }`}
            >
              {msg.imageUrl && (
                <div className="mb-2 rounded-lg overflow-hidden">
                  <img
                    src={msg.imageUrl}
                    alt="Generated image"
                    className="w-full h-auto rounded-lg"
                  />
                </div>
              )}
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-neutral text-sm">
            <Loader2 className="w-4 h-4 animate-spin" />
            Thinking...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {suggestedProducts.length > 0 && (
        <div className="px-4 py-2 pb-4 overflow-x-auto flex-shrink-0 select-none scrollbar-thin scrollbar-thumb-neutral/15">
          <div className="flex gap-2 pb-1">
            {suggestedProducts.slice(0, 4).map((p) => (
              <a
                key={p._id}
                href={`/products/${p.slug}`}
                className="flex-shrink-0 w-32 card p-2.5 hover:shadow-md transition-all duration-200 border border-neutral/5 mb-1 hover:-translate-y-0.5 cursor-pointer"
              >
                <div className="relative w-full h-20 rounded-lg overflow-hidden mb-2 shadow-inner bg-neutral-100">
                  <Image src={p.images[0]} alt={p.name} fill className="object-contain p-1 bg-white" sizes="128px" />
                </div>
                <p className="text-xs font-medium line-clamp-1 mb-1 text-[var(--foreground)]">{p.name}</p>
                <p className="text-xs text-primary font-bold">${p.price.toFixed(2)}</p>
              </a>
            ))}
          </div>
        </div>
      )}

      {followUps.length > 0 && (
        <div className="px-4 pb-2 flex flex-wrap gap-1.5">
          {followUps.slice(0, 3).map((f) => (
            <button
              key={f}
              onClick={() => sendMessage(f)}
              className="text-xs px-3 py-1.5 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors cursor-pointer"
            >
              {f}
            </button>
          ))}
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          sendMessage(input);
        }}
        className="p-3 border-t border-neutral/10 flex gap-2 flex-shrink-0"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about products or generate images..."
          className="input-field text-sm flex-1"
          disabled={loading}
        />
        <button type="submit" disabled={loading || !input.trim()} className="btn-primary p-2.5 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed">
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
