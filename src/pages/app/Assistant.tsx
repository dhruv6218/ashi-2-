import React, { useState, useRef, useEffect } from 'react';
import { AppLayout } from '../../layouts/AppLayout';
import { Send, Sparkles, User, Loader2, ArrowRight, Bot } from 'lucide-react';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string | React.ReactNode;
}

export const Assistant = () => {
  const { activeWorkspace } = useWorkspace();
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: (
        <div className="space-y-2">
          <p>Hello! I'm your Astrix Assistant. I can help you query your workspace data.</p>
          <p className="text-sm text-gray-500">Try asking me about opportunities, affected accounts, or recent decisions.</p>
        </div>
      )
    }
  ]);

  const suggestions = [
    "Show top 3 opportunities",
    "Which accounts are affected by SAML SSO?",
    "What was the verdict on the last launch?",
    "Show decisions marked Build"
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = async (text: string) => {
    if (!text.trim()) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    let responseContent: React.ReactNode = "I couldn't find specific data for that query in your workspace.";

    // Mocked Grounded Responses based on PRD
    const lowerText = text.toLowerCase();
    if (lowerText.includes('top 3 opportunities') || lowerText.includes('opportunities')) {
      responseContent = (
        <div className="space-y-3">
          <p>Here are the top 3 opportunities based on your current workspace scoring:</p>
          <div className="space-y-2">
            <Link to="/app/opportunities/opp-1" className="block p-3 bg-white border border-gray-200 rounded-xl hover:border-astrix-teal transition-colors">
              <div className="flex justify-between items-center mb-1">
                <span className="font-bold text-gray-900">SAML SSO Integration Missing</span>
                <span className="text-astrix-teal font-black">92</span>
              </div>
              <div className="text-xs text-gray-500">Affects $2.04M ARR • 84 Signals</div>
            </Link>
            <Link to="/app/opportunities/opp-2" className="block p-3 bg-white border border-gray-200 rounded-xl hover:border-astrix-teal transition-colors">
              <div className="flex justify-between items-center mb-1">
                <span className="font-bold text-gray-900">API Rate Limits Too Strict</span>
                <span className="text-astrix-gold font-black">78</span>
              </div>
              <div className="text-xs text-gray-500">Affects $840k ARR • 42 Signals</div>
            </Link>
            <Link to="/app/opportunities/opp-3" className="block p-3 bg-white border border-gray-200 rounded-xl hover:border-astrix-teal transition-colors">
              <div className="flex justify-between items-center mb-1">
                <span className="font-bold text-gray-900">Dark Mode Support</span>
                <span className="text-gray-500 font-black">41</span>
              </div>
              <div className="text-xs text-gray-500">Affects $45k ARR • 312 Signals</div>
            </Link>
          </div>
        </div>
      );
    } else if (lowerText.includes('accounts') && lowerText.includes('saml')) {
      responseContent = (
        <div className="space-y-3">
          <p>The <strong>SAML SSO Integration Missing</strong> problem currently affects the following key accounts:</p>
          <ul className="list-disc pl-5 space-y-1 text-sm text-gray-700">
            <li><strong>CloudScale Inc</strong> ($1.2M ARR) - Enterprise Tier</li>
            <li><strong>TechFlow</strong> ($840k ARR) - Enterprise Tier</li>
          </ul>
          <p className="text-sm text-gray-500 mt-2">Total ARR at risk: $2.04M</p>
        </div>
      );
    } else if (lowerText.includes('verdict') || lowerText.includes('launch')) {
      responseContent = (
        <div className="space-y-3">
          <p>The last completed launch was <strong>Enterprise SAML SSO</strong>.</p>
          <div className="p-3 bg-green-50 border border-green-200 rounded-xl">
            <div className="text-green-800 font-bold mb-1">Verdict: Solved</div>
            <p className="text-sm text-green-700">Signal volume dropped from 84 to 12. Okta and Azure AD support successfully addressed the primary friction point.</p>
          </div>
        </div>
      );
    } else if (lowerText.includes('build') || lowerText.includes('decisions')) {
      responseContent = (
        <div className="space-y-3">
          <p>You have 1 recent decision marked as <strong>Build</strong>:</p>
          <div className="p-3 bg-white border border-gray-200 rounded-xl">
            <div className="font-bold text-gray-900 mb-1">SAML SSO Integration Missing</div>
            <p className="text-sm text-gray-600 line-clamp-2">"This is blocking $2M+ in Enterprise renewals. The engineering effort is estimated at 3 sprints..."</p>
            <Link to="/app/decisions/dec-1" className="text-xs text-brand-blue font-bold mt-2 inline-flex items-center gap-1 hover:underline">
              View Decision <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      );
    } else {
      responseContent = (
        <p>I can only answer questions grounded in your workspace data. Try asking about opportunities, accounts, decisions, or launches.</p>
      );
    }

    const assistantMsg: Message = { id: Date.now().toString(), role: 'assistant', content: responseContent };
    setMessages(prev => [...prev, assistantMsg]);
    setIsTyping(false);
  };

  return (
    <AppLayout 
      title="Ask Assistant" 
      subtitle="Query your workspace data using natural language."
    >
      <div className="flex flex-col h-[calc(100vh-12rem)] max-h-[800px] bg-white border border-gray-200 rounded-3xl shadow-sm overflow-hidden">
        
        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/30">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-4 max-w-3xl ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-gray-900 text-white' : 'bg-astrix-teal text-white shadow-sm'}`}>
                {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>
              <div className={`p-4 rounded-2xl text-sm ${msg.role === 'user' ? 'bg-gray-900 text-white rounded-tr-sm' : 'bg-white border border-gray-200 text-gray-800 shadow-sm rounded-tl-sm'}`}>
                {msg.content}
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="flex gap-4 max-w-3xl">
              <div className="w-8 h-8 rounded-full bg-astrix-teal text-white flex items-center justify-center shrink-0 shadow-sm">
                <Bot className="w-4 h-4" />
              </div>
              <div className="p-4 rounded-2xl bg-white border border-gray-200 shadow-sm rounded-tl-sm flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-astrix-teal" />
                <span className="text-sm text-gray-500 font-medium">Searching workspace...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white border-t border-gray-200">
          {/* Suggestions */}
          <div className="flex gap-2 overflow-x-auto hide-scrollbar mb-4 pb-1">
            {suggestions.map((suggestion, i) => (
              <button
                key={i}
                onClick={() => handleSend(suggestion)}
                className="whitespace-nowrap px-3 py-1.5 bg-gray-50 border border-gray-200 hover:border-astrix-teal hover:text-astrix-teal text-gray-600 text-xs font-bold rounded-lg transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>

          <form 
            onSubmit={(e) => { e.preventDefault(); handleSend(input); }}
            className="relative flex items-center"
          >
            <div className="absolute left-4 text-astrix-teal">
              <Sparkles className="w-5 h-5" />
            </div>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about opportunities, accounts, or decisions..."
              className="w-full bg-gray-50 border border-gray-200 rounded-xl py-4 pl-12 pr-14 text-sm outline-none focus:ring-2 focus:ring-astrix-teal focus:bg-white transition-all"
              disabled={isTyping}
            />
            <button
              type="submit"
              disabled={!input.trim() || isTyping}
              className="absolute right-2 p-2 bg-astrix-teal text-white rounded-lg hover:bg-astrix-darkTeal disabled:opacity-50 disabled:bg-gray-300 transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
          <div className="text-center mt-2">
            <span className="text-[10px] text-gray-400 font-mono uppercase tracking-widest">Assistant retrieves data strictly from your workspace</span>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};
