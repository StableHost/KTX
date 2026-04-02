import React, { useState } from 'react';
import './chatbot.css';
import { ChatBubbleLeftIcon, XMarkIcon } from '@heroicons/react/24/outline';

const ChatbotWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    // Thêm tin nhắn user vào lịch sử
    const newChatHistory = [...chatHistory, { role: 'user', text: message }];
    setChatHistory(newChatHistory);
    setMessage('');
    setIsLoading(true);

    try {
      // Gọi API đến Main Backend (Port 8800)
      const response = await fetch(`${process.env.REACT_APP_API_URL}/chatbot`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message })
      });

      if (!response.ok) throw new Error('Network response was not ok');
      
      const data = await response.json();
      setChatHistory([...newChatHistory, { role: 'ai', text: data.reply }]);
    } catch (error) {
      console.error('Lỗi khi chat:', error);
      setChatHistory([...newChatHistory, { 
        role: 'ai', 
        text: 'Xin lỗi, có lỗi xảy ra. Vui lòng kiểm tra kết nối.' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      {/* Nút Toggle Fixed */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="chatbot-toggle-btn"
        title={isOpen ? 'Đóng chatbot' : 'Mở chatbot'}
        aria-label="Toggle chatbot"
      >
        {isOpen ? (
          <XMarkIcon className="w-6 h-6" />
        ) : (
          <ChatBubbleLeftIcon className="w-6 h-6" />
        )}
      </button>

      {/* Chatbot Widget */}
      {isOpen && (
        <div className="chatbot-widget">
          {/* Header */}
          <div className="chatbot-header">
            <h3>Trợ lý AI</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="close-btn"
              aria-label="Close chatbot"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Chat Window */}
          <div className="chatbot-window">
            {chatHistory.length === 0 ? (
              <div className="chatbot-welcome">
                <p>👋 Xin chào! Tôi có thể giúp bạn gì?</p>
                <p className="text-sm">Hỏi tôi về ký túc xá, phòng, v.v...</p>
              </div>
            ) : (
              chatHistory.map((item, index) => (
                <div key={index} className={`chat-message ${item.role}`}>
                  <div className="chat-bubble">
                    <span>{item.text}</span>
                  </div>
                </div>
              ))
            )}
            {isLoading && (
              <div className="chat-message ai">
                <div className="chat-bubble loading">
                  <span className="typing-dot"></span>
                  <span className="typing-dot"></span>
                  <span className="typing-dot"></span>
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="chatbot-input-area">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Nhập câu hỏi..."
              className="chatbot-input"
              rows="2"
            />
            <button
              onClick={handleSendMessage}
              disabled={isLoading || !message.trim()}
              className="chatbot-send-btn"
            >
              {isLoading ? '...' : 'Gửi'}
            </button>
          </div>

          {/* Footer */}
          <div className="chatbot-footer">
            <p>Hỗ trợ bởi AI</p>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatbotWidget;
