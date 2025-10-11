import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, X, Minimize2, Maximize2 } from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'bot' | 'user';
  message: string;
  timestamp: Date;
}

interface ChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onNodeExecuting?: (nodeId: string) => void;
  onNodeCompleted?: (nodeId: string) => void;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({ isOpen, onClose, onNodeExecuting, onNodeCompleted }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  const [isWaitingForInput, setIsWaitingForInput] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Focus input when waiting
  useEffect(() => {
    if (isWaitingForInput && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isWaitingForInput]);

  // WebSocket connection for chat
  useEffect(() => {
    if (!isOpen) return;

    const ws = new WebSocket('ws://localhost:8765/ws/chat');
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('Chat WebSocket connected');
      addBotMessage('Ciao! Sono pronto. Esegui un workflow chatbot per iniziare! 🤖');
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'bot_message') {
        if (data.typing) {
          // Typing effect
          typeMessage(data.message);
        } else {
          addBotMessage(data.message);
        }
      } else if (data.type === 'ask_user') {
        setCurrentQuestion(data.question);
        setIsWaitingForInput(true);
        addBotMessage(data.question);
      } else if (data.type === 'chat_end') {
        addBotMessage(data.message || 'Conversazione terminata. Grazie! 👋');
        setIsWaitingForInput(false);
      } else if (data.type === 'node_executing') {
        // Notify parent to highlight node
        if (onNodeExecuting) {
          onNodeExecuting(data.node_id);
        }
      } else if (data.type === 'node_completed') {
        // Notify parent to unhighlight node
        if (onNodeCompleted) {
          onNodeCompleted(data.node_id);
        }
      }
    };

    ws.onerror = (error) => {
      console.error('Chat WebSocket error:', error);
      addBotMessage('⚠️ Errore di connessione. Ricarica la pagina.');
    };

    ws.onclose = () => {
      console.log('Chat WebSocket disconnected');
    };

    return () => {
      ws.close();
    };
  }, [isOpen]);

  const addBotMessage = (message: string) => {
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      role: 'bot',
      message,
      timestamp: new Date()
    }]);
  };

  const addUserMessage = (message: string) => {
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      role: 'user',
      message,
      timestamp: new Date()
    }]);
  };

  const typeMessage = async (fullMessage: string) => {
    const messageId = Date.now().toString();
    const words = fullMessage.split(' ');
    
    // Add empty message
    setMessages(prev => [...prev, {
      id: messageId,
      role: 'bot',
      message: '',
      timestamp: new Date()
    }]);
    
    // Type word by word
    for (let i = 0; i < words.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 100)); // 100ms per word (più lento)
      setMessages(prev => prev.map(msg => 
        msg.id === messageId 
          ? { ...msg, message: words.slice(0, i + 1).join(' ') }
          : msg
      ));
    }
  };

  const handleSend = () => {
    if (!inputValue.trim() || !isWaitingForInput) return;

    // Add user message to chat
    addUserMessage(inputValue);

    // Send to backend
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'user_response',
        message: inputValue
      }));
    }

    setInputValue('');
    setIsWaitingForInput(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClear = () => {
    setMessages([]);
    addBotMessage('Chat pulita! Esegui un workflow per iniziare.');
  };

  if (!isOpen) return null;

  return (
    <div 
      className={`fixed right-4 bg-white rounded-lg shadow-2xl border border-gray-200 flex flex-col transition-all duration-300 z-50 ${
        isMinimized ? 'bottom-4 w-80 h-16' : 'bottom-4 w-96 h-[600px]'
      }`}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-3 rounded-t-lg flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          <span className="font-semibold">Chat Bot</span>
          {isWaitingForInput && (
            <span className="text-xs bg-white/20 px-2 py-1 rounded-full animate-pulse">
              In attesa...
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="hover:bg-white/20 p-1 rounded transition-colors"
            title={isMinimized ? 'Espandi' : 'Riduci'}
          >
            {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
          </button>
          <button
            onClick={onClose}
            className="hover:bg-white/20 p-1 rounded transition-colors"
            title="Chiudi"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
            {messages.length === 0 && (
              <div className="text-center text-gray-400 mt-8">
                <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Nessun messaggio ancora</p>
                <p className="text-xs mt-1">Esegui un workflow chatbot per iniziare</p>
              </div>
            )}
            
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-2 ${
                    msg.role === 'user'
                      ? 'bg-blue-500 text-white rounded-br-none'
                      : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none shadow-sm'
                  }`}
                >
                  <div className="text-sm whitespace-pre-wrap break-words">{msg.message}</div>
                  <div
                    className={`text-xs mt-1 ${
                      msg.role === 'user' ? 'text-blue-100' : 'text-gray-400'
                    }`}
                  >
                    {msg.timestamp.toLocaleTimeString('it-IT', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-gray-200 p-3 bg-white rounded-b-lg">
            {isWaitingForInput && currentQuestion && (
              <div className="text-xs text-gray-500 mb-2 px-2">
                💬 {currentQuestion}
              </div>
            )}
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={isWaitingForInput ? "Scrivi la tua risposta..." : "In attesa del bot..."}
                disabled={!isWaitingForInput}
                className={`flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${
                  !isWaitingForInput ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'
                }`}
              />
              <button
                onClick={handleSend}
                disabled={!inputValue.trim() || !isWaitingForInput}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  inputValue.trim() && isWaitingForInput
                    ? 'bg-blue-500 hover:bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
                title="Invia"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <div className="flex justify-between items-center mt-2 px-1">
              <button
                onClick={handleClear}
                className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
              >
                Pulisci chat
              </button>
              <div className="text-xs text-gray-400">
                {messages.length} messaggi
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
