import React, { useContext, useState, useEffect, useRef } from 'react';
import { ShopContext } from '../../context/ShopContext';
import { ChatContext } from '../../context/ChatContext';
import { Send, MessageCircle, Tag, Loader2, User, ChevronRight, Inbox } from 'lucide-react';

export default function UserInbox() {
  const { currentUser, formatPrice } = useContext(ShopContext);
  const {
    conversations,
    activeConversationId,
    messages,
    chatLoading,
    chatError,
    selectConversation,
    sendMessage,
    fetchConversations
  } = useContext(ChatContext);

  const [inputVal, setInputVal] = useState('');
  const messagesEndRef = useRef(null);
  const sidebarEndRef = useRef(null);

  // Load conversations on mount
  useEffect(() => {
    fetchConversations();
  }, []);

  // Scroll to bottom of messages when room or message count changes
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeConversationId]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputVal.trim()) return;
    sendMessage(inputVal);
    setInputVal('');
  };

  // Find the currently selected conversation object
  const activeConversation = conversations.find(c => Number(c.id) === Number(activeConversationId));

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    
    // If today, show time
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    // If this year, show month & day
    if (date.getFullYear() === now.getFullYear()) {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
    return date.toLocaleDateString([], { year: 'numeric', month: 'numeric', day: 'numeric' });
  };

  if (!currentUser) {
    return (
      <div className="container" style={{ padding: '6rem 2rem', textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
        <Inbox size={48} style={{ color: 'var(--clr-text-muted)', marginBottom: '1rem' }} />
        <h2>Please sign in to view your inbox.</h2>
        <p style={{ color: 'var(--clr-text-secondary)', marginTop: '0.5rem' }}>You can only chat with buyers or sellers once you are authenticated.</p>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, display: 'flex', background: 'var(--clr-bg-app)', height: 'calc(100vh - 70px)', overflow: 'hidden' }}>
      
      {/* 1. LEFT SIDEBAR: LIST OF CONVERSATIONS */}
      <div 
        style={{ 
          width: '350px', 
          borderRight: '1px solid var(--clr-border)', 
          background: 'var(--clr-bg-card)', 
          display: 'flex', 
          flexDirection: 'column', 
          height: '100%',
          flexShrink: 0
        }}
      >
        <div style={{ padding: '1.5rem 1.25rem', borderBottom: '1px solid var(--clr-border)' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--clr-text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <MessageCircle size={22} style={{ color: 'var(--clr-primary)' }} />
            Inbox Messages
          </h2>
          <p style={{ fontSize: '0.75rem', color: 'var(--clr-text-muted)', margin: '0.25rem 0 0' }}>
            Manage active buyer/seller threads
          </p>
        </div>

        {/* Conversations List Container */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem 0' }}>
          {conversations.length === 0 ? (
            <div style={{ padding: '3rem 1.5rem', textAlign: 'center', color: 'var(--clr-text-muted)', fontSize: '0.85rem' }}>
              <Inbox size={32} style={{ opacity: 0.5, marginBottom: '0.5rem' }} />
              <div>No conversations found.</div>
              <p style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>Start chatting from product detail pages.</p>
            </div>
          ) : (
            conversations.map((conv) => {
              const isActive = Number(conv.id) === Number(activeConversationId);
              const partnerName = conv.partner?.name || `User #${conv.partner?.id}`;
              const lastMsgText = conv.lastMessage?.content || 'No messages yet';
              const lastMsgTime = conv.lastMessage ? formatTime(conv.lastMessage.createdAt) : '';
              
              // Unread indicator (if last message is unread and sender is the partner)
              const isUnread = conv.lastMessage && 
                               conv.lastMessage.isRead === false && 
                               Number(conv.lastMessage.senderId) !== Number(currentUser.id);

              return (
                <div
                  key={conv.id}
                  onClick={() => selectConversation(conv.id)}
                  style={{
                    padding: '1rem 1.25rem',
                    cursor: 'pointer',
                    background: isActive ? 'var(--clr-primary-light, rgba(0, 123, 255, 0.08))' : 'transparent',
                    borderLeft: `4px solid ${isActive ? 'var(--clr-primary)' : 'transparent'}`,
                    borderBottom: '1px solid var(--clr-border)',
                    transition: 'background var(--transition-fast)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.85rem'
                  }}
                  className="inbox-sidebar-item"
                >
                  {/* Avatar Bubble */}
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, var(--clr-primary), var(--clr-secondary))',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: '1rem',
                      flexShrink: 0
                    }}
                  >
                    {partnerName.charAt(0).toUpperCase()}
                  </div>

                  {/* Text details */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.15rem' }}>
                      <span style={{ fontWeight: isUnread ? 800 : 700, fontSize: '0.88rem', color: 'var(--clr-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {partnerName}
                      </span>
                      <span style={{ fontSize: '0.68rem', color: isUnread ? 'var(--clr-primary)' : 'var(--clr-text-muted)', fontWeight: isUnread ? 700 : 400, flexShrink: 0 }}>
                        {lastMsgTime}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.15rem' }}>
                      <Tag size={11} style={{ color: 'var(--clr-primary)', flexShrink: 0 }} />
                      <span style={{ fontSize: '0.72rem', color: 'var(--clr-text-secondary)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {conv.postTitle || `Listing #${conv.postId}`}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.8rem', color: isUnread ? 'var(--clr-text-primary)' : 'var(--clr-text-muted)', fontWeight: isUnread ? 600 : 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {lastMsgText}
                    </div>
                  </div>

                  {/* Unread indicator dot */}
                  {isUnread && (
                    <div
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: 'var(--clr-primary)',
                        flexShrink: 0
                      }}
                    />
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 2. RIGHT CHAT SCREEN */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--clr-bg-app)' }}>
        {activeConversationId === null ? (
          /* Placeholder when no chat is open */
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: 'var(--clr-text-muted)', padding: '2rem' }}>
            <div
              style={{
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                background: 'var(--clr-bg-card)',
                border: '1px solid var(--clr-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: 'var(--shadow-sm)',
                marginBottom: '1rem'
              }}
            >
              <MessageCircle size={32} style={{ color: 'var(--clr-text-muted)' }} />
            </div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--clr-text-primary)', margin: '0 0 0.5rem' }}>No Room Selected</h3>
            <p style={{ fontSize: '0.85rem', maxWidth: '320px', textAlign: 'center', margin: 0 }}>
              Select a conversation from the sidebar list to start chatting with buyers or sellers.
            </p>
          </div>
        ) : (
          /* Real-time active chat viewport */
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
            
            {/* Header info bar */}
            <div 
              style={{ 
                padding: '1rem 1.5rem', 
                background: 'var(--clr-bg-card)', 
                borderBottom: '1px solid var(--clr-border)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              <div>
                <div style={{ fontWeight: 800, fontSize: '0.98rem', color: 'var(--clr-text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <User size={16} style={{ color: 'var(--clr-text-secondary)' }} />
                  {activeConversation?.partner?.name || `User #${activeConversation?.partner?.id}`}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--clr-text-secondary)', display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.15rem' }}>
                  <Tag size={12} style={{ color: 'var(--clr-primary)' }} />
                  Item: <span style={{ fontWeight: 600 }}>{activeConversation?.postTitle || `Listing #${activeConversation?.postId}`}</span>
                </div>
              </div>
            </div>

            {/* Chat Messages viewport */}
            <div style={{ flex: 1, padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {chatLoading ? (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
                  <Loader2 size={28} className="anim-spin" style={{ color: 'var(--clr-primary)' }} />
                  <span style={{ fontSize: '0.85rem', color: 'var(--clr-text-secondary)' }}>Loading message history...</span>
                </div>
              ) : chatError ? (
                <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '1rem', color: 'var(--clr-danger)', fontSize: '0.85rem' }}>
                  {chatError}
                </div>
              ) : messages.length === 0 ? (
                <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'var(--clr-text-muted)', fontSize: '0.85rem', fontStyle: 'italic' }}>
                  No messages yet. Send a greeting to start the conversation!
                </div>
              ) : (
                messages.map((msg, index) => {
                  const isMine = Number(msg.senderId) === Number(currentUser.id);
                  const time = msg.createdAt 
                    ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
                    : 'Sending...';

                  return (
                    <div
                      key={msg.id || index}
                      style={{
                        alignSelf: isMine ? 'flex-end' : 'flex-start',
                        maxWidth: '65%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: isMine ? 'flex-end' : 'flex-start'
                      }}
                    >
                      <div
                        style={{
                          background: isMine ? 'var(--clr-primary)' : 'var(--clr-bg-card)',
                          color: isMine ? 'white' : 'var(--clr-text-primary)',
                          padding: '0.75rem 1rem',
                          borderRadius: isMine ? '18px 18px 0 18px' : '0 18px 18px 18px',
                          border: isMine ? 'none' : '1px solid var(--clr-border)',
                          fontSize: '0.88rem',
                          lineHeight: 1.4,
                          boxShadow: 'var(--shadow-sm)'
                        }}
                      >
                        {msg.content}
                      </div>
                      <span style={{ fontSize: '0.65rem', color: 'var(--clr-text-muted)', marginTop: '0.25rem', opacity: 0.8 }}>
                        {time}
                      </span>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input field row */}
            <form 
              onSubmit={handleSend} 
              style={{ 
                padding: '1rem 1.5rem', 
                background: 'var(--clr-bg-card)', 
                borderTop: '1px solid var(--clr-border)', 
                display: 'flex', 
                gap: '0.75rem',
                alignItems: 'center'
              }}
            >
              <input
                type="text"
                className="form-input"
                style={{
                  fontSize: '0.88rem',
                  borderRadius: 'var(--radius-full)',
                  height: '42px',
                  padding: '0 1.25rem',
                  flex: 1
                }}
                placeholder="Type your message here..."
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                disabled={chatLoading}
              />
              <button
                type="submit"
                className="btn btn-primary"
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '50%',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
                disabled={chatLoading || !inputVal.trim()}
              >
                <Send size={16} />
              </button>
            </form>
          </div>
        )}
      </div>

    </div>
  );
}
