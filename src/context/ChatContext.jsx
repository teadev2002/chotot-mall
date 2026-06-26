import React, { createContext, useState, useEffect, useContext, useRef } from 'react';
import { io } from 'socket.io-client';
import { ShopContext } from './ShopContext';

export const ChatContext = createContext();

// Helper to sort conversations so the most recently chatted one stands at the top
const sortConversations = (list) => {
  return [...list].sort((a, b) => {
    const timeA = a.lastMessage ? new Date(a.lastMessage.createdAt).getTime() : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
    const timeB = b.lastMessage ? new Date(b.lastMessage.createdAt).getTime() : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
    return timeB - timeA;
  });
};

export const ChatProvider = ({ children }) => {
  const { currentUser } = useContext(ShopContext);
  const [socket, setSocket] = useState(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const activeConversationIdRef = useRef(activeConversationId);

  useEffect(() => {
    activeConversationIdRef.current = activeConversationId;
  }, [activeConversationId]);

  const [messages, setMessages] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState(null);

  // Fetch list of all active conversations for the current user
  const fetchConversations = async () => {
    if (!currentUser || !currentUser.token) return;
    try {
      const response = await fetch('https://cho-tot-production.up.railway.app/conversation', {
        headers: {
          'Authorization': `Bearer ${currentUser.token}`,
          'accept': '*/*'
        }
      });
      const json = await response.json();
      if (json.success && Array.isArray(json.data)) {
        setConversations(sortConversations(json.data));
      }
    } catch (err) {
      console.error('Failed to fetch conversations list:', err);
    }
  };

  const updateSidebarRef = useRef(null);

  const updateSidebarWithNewMessage = (message) => {
    if (!message || !message.conversationId) return;
    setConversations((prevList) => {
      const index = prevList.findIndex(c => Number(c.id) === Number(message.conversationId));
      if (index !== -1) {
        const updated = [...prevList];
        const isRead = Number(message.conversationId) === Number(activeConversationIdRef.current)
          ? true
          : (message.isRead !== undefined ? message.isRead : false);

        updated[index] = {
          ...updated[index],
          lastMessage: {
            ...message,
            isRead
          }
        };
        return sortConversations(updated);
      } else {
        // Fetch full metadata if it's a new conversation thread
        fetchConversations();
        return prevList;
      }
    });
  };

  useEffect(() => {
    updateSidebarRef.current = updateSidebarWithNewMessage;
  });

  // Establish / Clean up Socket.io connection based on user authentication
  useEffect(() => {
    if (!currentUser || !currentUser.token) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      setActiveConversationId(null);
      setConversations([]);
      setMessages([]);
      setIsChatOpen(false);
      return;
    }

    // Connect to /chat namespace with bearer token
    const socketInstance = io('https://cho-tot-production.up.railway.app/chat', {
      auth: { token: currentUser.token },
      transports: ['websocket']
    });

    socketInstance.on('connect', () => {
      console.log('🔌 Chat Socket.io connected:', socketInstance.id);
      // Re-fetch conversations list on connection
      fetchConversations();
      // If there is an active conversation, rejoin it
      if (activeConversationId) {
        socketInstance.emit('joinConversation', { conversationId: Number(activeConversationId) });
      }
    });

    socketInstance.on('disconnect', () => {
      console.log('❌ Chat Socket.io disconnected');
    });

    socketInstance.on('connect_error', (err) => {
      console.error('⚠️ Chat Socket.io connection error:', err.message);
    });

    // Listen for incoming messages from others
    socketInstance.on('newMessage', (message) => {
      console.log('📩 Received newMessage:', message);
      updateSidebarRef.current?.(message);
      if (Number(message.conversationId) === Number(activeConversationIdRef.current)) {
        setMessages((prev) => {
          if (prev.some(m => m.id === message.id)) {
            return prev;
          }
          return [...prev, message];
        });
      }
    });

    // Server confirmation of sent message
    socketInstance.on('messageSent', (message) => {
      console.log('✅ Server confirmed messageSent:', message);
      updateSidebarRef.current?.(message);
      if (Number(message.conversationId) === Number(activeConversationIdRef.current)) {
        setMessages((prev) => {
          const index = prev.findIndex(m => String(m.id).startsWith('temp-') && m.content === message.content);
          if (index !== -1) {
            const updated = [...prev];
            updated[index] = message;
            return updated;
          }
          if (prev.some(m => m.id === message.id)) {
            return prev;
          }
          return [...prev, message];
        });
      }
    });

    // Real-time conversation updates to sort/update the sidebar list
    socketInstance.on('conversationUpdated', (data) => {
      console.log('🔄 conversationUpdated received:', data);
      // Reload the conversations list via GET /conversation API to ensure partner details,
      // lastMessage details, and sorting are up to date in real-time.
      fetchConversations();
    });

    socketInstance.on('messageError', (err) => {
      console.error('⚠️ messageError event:', err.error);
    });

    socketInstance.on('joinConversation', (data) => {
      console.log(`✅ Socket joined conversation room: ${data.conversationId}`);
    });

    socketInstance.on('joinConversationError', (err) => {
      console.error('⚠️ joinConversationError:', err.error);
    });

    setSocket(socketInstance);

    // Initial load of conversations list
    fetchConversations();

    return () => {
      socketInstance.disconnect();
    };
  }, [currentUser]); // Note: only depend on currentUser to avoid connection churn.

  // Fetch chat message history for a conversation
  const loadChatHistory = async (conversationId) => {
    if (!currentUser || !currentUser.token) return;
    setChatLoading(true);
    setChatError(null);

    try {
      const response = await fetch(`https://cho-tot-production.up.railway.app/conversation/${conversationId}`, {
        headers: {
          'Authorization': `Bearer ${currentUser.token}`,
          'accept': '*/*'
        }
      });
      const json = await response.json();
      if (!response.ok) {
        throw new Error(json.message || 'Failed to load chat history');
      }

      // Backend returns messages array in json.data.messages
      const rawMessages = json.data?.messages || [];
      // Sort messages by creation date ascending (oldest to newest)
      const sortedMessages = [...rawMessages].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
      setMessages(sortedMessages);
    } catch (err) {
      console.error('Failed to load chat history:', err);
      setChatError(err.message || 'An error occurred while loading chat history.');
    } finally {
      setChatLoading(false);
    }
  };

  // Select/switch to a conversation (joining its socket room)
  const selectConversation = async (convId) => {
    setActiveConversationId(convId);
    if (socket && socket.connected) {
      socket.emit('joinConversation', { conversationId: Number(convId) });
    }

    // Mark as read locally in the sidebar immediately
    setConversations((prevList) => {
      const index = prevList.findIndex(c => Number(c.id) === Number(convId));
      if (index !== -1 && prevList[index].lastMessage) {
        const updated = [...prevList];
        updated[index] = {
          ...updated[index],
          lastMessage: {
            ...updated[index].lastMessage,
            isRead: true
          }
        };
        return updated;
      }
      return prevList;
    });

    await loadChatHistory(convId);
  };

  // Start chat conversation (create or get room)
  const startChat = async (postId, sellerId) => {
    if (!currentUser) {
      throw new Error('Please sign in to chat with the seller.');
    }

    setChatLoading(true);
    setChatError(null);

    try {
      const response = await fetch('https://cho-tot-production.up.railway.app/conversation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentUser.token}`,
          'accept': '*/*'
        },
        body: JSON.stringify({
          postId: Number(postId),
          sellerId: Number(sellerId)
        })
      });
      const json = await response.json();
      if (!response.ok) {
        throw new Error(json.message || 'Failed to initialize conversation');
      }

      const conversation = json.data || json;
      const convId = conversation.id;

      setActiveConversationId(convId);
      setIsChatOpen(true);

      // Join socket room
      if (socket && socket.connected) {
        socket.emit('joinConversation', { conversationId: Number(convId) });
      }

      // Load history
      await loadChatHistory(convId);

      // Refresh list
      await fetchConversations();
    } catch (err) {
      console.error('Failed to start chat:', err);
      setChatError(err.message || 'Could not connect to conversation.');
      throw err;
    } finally {
      setChatLoading(false);
    }
  };

  // Send a message via Socket.io
  const sendMessage = (content) => {
    if (!content.trim() || !socket || !activeConversationId) return;

    // Send via WebSocket emit
    socket.emit('sendMessage', {
      conversationId: Number(activeConversationId),
      content: content.trim()
    });

    // Optimistic UI render
    const tempMessage = {
      id: `temp-${Date.now()}`,
      senderId: Number(currentUser.id),
      conversationId: Number(activeConversationId),
      content: content.trim(),
      createdAt: new Date().toISOString()
    };
    setMessages((prev) => [...prev, tempMessage]);

    // Optimistic sidebar update
    updateSidebarWithNewMessage(tempMessage);
  };

  const closeChat = () => {
    setIsChatOpen(false);
  };

  return (
    <ChatContext.Provider
      value={{
        isChatOpen,
        setIsChatOpen,
        conversations,
        activeConversationId,
        messages,
        chatLoading,
        chatError,
        fetchConversations,
        selectConversation,
        startChat,
        closeChat,
        sendMessage
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};
