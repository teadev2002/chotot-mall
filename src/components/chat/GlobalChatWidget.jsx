import React, { useContext, useState, useEffect, useRef } from 'react';
import { ShopContext } from '../../context/ShopContext';
import { ChatContext } from '../../context/ChatContext';
import { Send, Loader2, X, MessageSquare, Tag } from 'lucide-react';

export default function GlobalChatWidget() {
  const { currentUser, formatPrice } = useContext(ShopContext);
  const {
    isChatOpen,
    closeChat,
    conversations,
    activeConversationId,
    messages,
    chatLoading,
    chatError,
    sendMessage
  } = useContext(ChatContext);

  const [chatInput, setChatInput] = useState('');
  const messagesEndRef = useRef(null);

  // Find the active conversation metadata
  const activeConversation = conversations.find(c => Number(c.id) === Number(activeConversationId));
  const partnerName = activeConversation?.partner?.name || `User #${activeConversation?.partner?.id || '...'}`;

  // Scroll to bottom when messages list updates or chat opens
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isChatOpen, activeConversationId]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    sendMessage(chatInput);
    setChatInput('');
  };

  if (!currentUser || !isChatOpen || !activeConversationId) return null;

  return (
    <div
      className="anim-scale-in"
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        width: '360px',
        height: '460px',
        background: 'var(--clr-bg-card)',
        border: '1px solid var(--clr-border)',
        borderRadius: 'var(--radius-md)',
        boxShadow: 'var(--shadow-2xl)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 9999,
        overflow: 'hidden'
      }}
    >
      {/* Chat Header */}
      <div
        style={{
          padding: '0.85rem 1rem',
          background: 'linear-gradient(135deg, var(--clr-primary), var(--clr-secondary))',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '0.9rem'
            }}
          >
            {partnerName.charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{ fontWeight: 'bold', fontSize: '0.9rem', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {partnerName}
            </div>
            <div style={{ fontSize: '0.68rem', opacity: 0.85 }}>Online via socket</div>
          </div>
        </div>
        <button
          onClick={closeChat}
          style={{
            background: 'none',
            border: 'none',
            color: 'white',
            cursor: 'pointer',
            padding: '0.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: 0.85,
            transition: 'opacity var(--transition-fast)'
          }}
          onMouseEnter={(e) => e.target.style.opacity = 1}
          onMouseLeave={(e) => e.target.style.opacity = 0.85}
        >
          <X size={18} />
        </button>
      </div>

      {/* Chat Messages Viewport */}
      <div
        style={{
          flex: 1,
          padding: '1rem',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
          background: 'var(--clr-bg-app)'
        }}
      >
        {chatLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100%', gap: '0.5rem', color: 'var(--clr-text-secondary)' }}>
            <Loader2 size={24} className="anim-spin" style={{ color: 'var(--clr-primary)' }} />
            <span style={{ fontSize: '0.8rem' }}>Loading messages...</span>
          </div>
        ) : chatError ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', padding: '1rem', color: 'var(--clr-danger)', fontSize: '0.85rem', textAlign: 'center' }}>
            {chatError}
          </div>
        ) : messages.length === 0 ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', padding: '1rem', color: 'var(--clr-text-muted)', fontSize: '0.8rem', textAlign: 'center', fontStyle: 'italic' }}>
            No messages yet. Send a message to start chatting!
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isMine = Number(msg.senderId) === Number(currentUser?.id);
            const timeStr = msg.createdAt
              ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : 'Just now';
            return (
              <div
                key={msg.id || idx}
                style={{
                  alignSelf: isMine ? 'flex-end' : 'flex-start',
                  maxWidth: '80%',
                  background: isMine ? 'var(--clr-primary)' : 'var(--clr-bg-card)',
                  color: isMine ? 'white' : 'var(--clr-text-primary)',
                  padding: '0.6rem 0.8rem',
                  borderRadius: isMine ? '12px 12px 0 12px' : '0 12px 12px 12px',
                  border: isMine ? 'none' : '1px solid var(--clr-border)',
                  fontSize: '0.85rem',
                  boxShadow: 'var(--shadow-sm)',
                  position: 'relative'
                }}
              >
                <div>{msg.content}</div>
                <div
                  style={{
                    fontSize: '0.62rem',
                    opacity: 0.6,
                    textAlign: 'right',
                    marginTop: '0.2rem'
                  }}
                >
                  {timeStr}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input Form */}
      <form
        onSubmit={handleSendMessage}
        style={{
          padding: '0.65rem 0.75rem',
          background: 'var(--clr-bg-card)',
          borderTop: '1px solid var(--clr-border)',
          display: 'flex',
          gap: '0.5rem',
          alignItems: 'center'
        }}
      >
        <input
          type="text"
          className="form-input"
          style={{
            fontSize: '0.85rem',
            borderRadius: 'var(--radius-full)',
            height: '34px',
            padding: '0 1rem',
            flex: 1,
            border: '1px solid var(--clr-border)',
            background: 'var(--clr-bg-app)',
            color: 'var(--clr-text-primary)'
          }}
          placeholder="Type a message..."
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          disabled={chatLoading}
        />
        <button
          type="submit"
          className="btn btn-primary"
          style={{
            width: '34px',
            height: '34px',
            padding: 0,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            background: 'var(--clr-primary)',
            border: 'none',
            color: 'white',
            cursor: 'pointer'
          }}
          disabled={chatLoading || !chatInput.trim()}
        >
          <Send size={14} />
        </button>
      </form>
    </div>
  );
}
