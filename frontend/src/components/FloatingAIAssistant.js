import React, { useState, useContext } from 'react';
import AuthContext from '../context/AuthContext';
import API from '../api';

const FloatingAIAssistant = () => {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const { user } = useContext(AuthContext);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    const userMsg = { sender: 'user', text: input };
    setMessages((msgs) => [...msgs, userMsg]);
    setLoading(true);
    try {
      const res = await API.post('/ai/analyze', {
        query: input,
        symbols: [],
      });
      // Make sure we're handling the response properly
      const analysisText = typeof res.data.analysis === 'object' 
        ? JSON.stringify(res.data.analysis) 
        : res.data.analysis;
      
      setMessages((msgs) => [
        ...msgs,
        { sender: 'ai', text: analysisText }
      ]);
    } catch (err) {
      console.error('AI Assistant error:', err);
      // Log the full error for debugging
      console.error('Error details:', err.response ? err.response.data : err.message);
      setMessages((msgs) => [
        ...msgs,
        { sender: 'ai', text: 'Sorry, something went wrong.' }
      ]);
    }
    setInput('');
    setLoading(false);
  };

  if (!user) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {open ? (
        <div className="w-80 bg-white rounded-lg shadow-lg flex flex-col">
          <div className="flex items-center justify-between bg-blue-600 text-white px-4 py-2 rounded-t-lg">
            <span className="font-bold">AI Financial Assistant</span>
            <button onClick={() => setOpen(false)} className="text-white">✕</button>
          </div>
          <div className="flex-1 p-4 overflow-y-auto max-h-80">
            {messages.length === 0 && (
              <div className="text-gray-400 text-sm">Ask about markets, stocks, or portfolio advice...</div>
            )}
            {messages.map((msg, idx) => (
              <div key={idx} className={`mb-2 flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`px-3 py-2 rounded-lg text-sm ${msg.sender === 'user' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                  {typeof msg.text === 'object' ? JSON.stringify(msg.text) : msg.text}
                </div>
              </div>
            ))}
            {loading && <div className="text-xs text-gray-400">AI is typing...</div>}
          </div>
          <form onSubmit={handleSend} className="flex border-t">
            <input
              type="text"
              className="flex-1 px-3 py-2 focus:outline-none"
              placeholder="Type your question..."
              value={input}
              onChange={e => setInput(e.target.value)}
              disabled={loading}
            />
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded-r-lg disabled:opacity-50"
              disabled={loading || !input.trim()}
            >
              Send
            </button>
          </form>
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="bg-blue-600 text-white rounded-full shadow-lg w-16 h-16 flex items-center justify-center text-2xl hover:bg-blue-700 focus:outline-none"
          title="Open AI Assistant"
        >
          🤖
        </button>
      )}
    </div>
  );
};

export default FloatingAIAssistant;