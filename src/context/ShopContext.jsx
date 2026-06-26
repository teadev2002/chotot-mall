import React, { createContext, useState, useEffect } from 'react';
import { decodeJwt } from '../utils/jwt';
import { setCookie, getCookie, deleteCookie } from '../utils/cookie';
import { formatPrice } from '../utils/price';
import { signIn as authSignIn, signUpService } from '../services/authService';
import { fetchAllPosts, fetchPostById } from '../services/productService';
import { fetchUserProfile, fetchUserPosts } from '../services/userService';
import { generateSlug } from '../utils/slug';

// Create Shop Context
export const ShopContext = createContext();

// Seed Customers/Users database fallback metadata
const SEED_CUSTOMERS = [
  { id: 1, name: 'Sarah Parker', email: 'sarah.p@example.com', joinedDate: '2026-01-15', location: 'District 1, HCMC' },
  { id: 2, name: 'David Smith', email: 'dsmith@example.com', joinedDate: '2026-03-22', location: 'Cau Giay, Hanoi' },
  { id: 3, name: 'Emily Davis', email: 'emily.d@example.com', joinedDate: '2026-05-11', location: 'Hai Chau, Da Nang' }
];

export const ShopProvider = ({ children }) => {

  // Theme & View States
  const [theme, setTheme] = useState(() => getCookie('theme') || 'light');
  const [view, setView] = useState(() => {
    const token = localStorage.getItem('accessToken') || getCookie('accessToken');
    if (token) {
      let cleanToken = decodeURIComponent(token).trim();
      cleanToken = cleanToken.replace(/^["']|["']$/g, '').trim();
      const decoded = decodeJwt(cleanToken);
      if (decoded && decoded.role === 'ADMIN' && decoded.exp * 1000 > Date.now()) {
        return 'admin';
      }
    }
    const path = window.location.pathname;
    if (path === '/my-offers' || path.startsWith('/order/')) {
      return 'my-offers';
    }
    if (path === '/inbox') {
      return 'inbox';
    }
    if (path.startsWith('/user/')) {
      return 'user-listings';
    }
    return 'storefront';
  });
  const [adminTab, setAdminTab] = useState('dashboard'); // 'dashboard', 'products', 'customers'
  const [isRestoringPost, setIsRestoringPost] = useState(() => {
    return window.location.pathname.startsWith('/post/');
  });

  // Data States
  const [products, setProducts] = useState([]); // Will store API posts
  const [customers, setCustomers] = useState(() => {
    try {
      const local = getCookie('customers');
      return local ? JSON.parse(local) : SEED_CUSTOMERS;
    } catch (e) {
      console.error('Failed to parse customers cookie:', e);
      return SEED_CUSTOMERS;
    }
  });
  const [userListings, setUserListings] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [userListingsLoading, setUserListingsLoading] = useState(false);

  // Users Auth States
  const [users, setUsers] = useState(() => {
    try {
      const local = getCookie('users');
      if (local) return JSON.parse(local);
    } catch (e) {
      console.error('Failed to parse users cookie:', e);
    }
    return [
      { id: 1, name: 'Sarah Parker', email: 'sarah.p@example.com', password: 'password123' },
      { id: 2, name: 'David Smith', email: 'dsmith@example.com', password: 'password123' },
      { id: 3, name: 'Emily Davis', email: 'emily.d@example.com', password: 'password123' }
    ];
  });

  const [currentUser, setCurrentUser] = useState(() => {
    const token = localStorage.getItem('accessToken') || getCookie('accessToken');
    if (!token) return null;

    let cleanToken = decodeURIComponent(token).trim();
    cleanToken = cleanToken.replace(/^["']|["']$/g, '').trim();

    const decoded = decodeJwt(cleanToken);
    if (decoded && decoded.exp * 1000 > Date.now()) {
      const email = localStorage.getItem('currentUserEmail') || getCookie('currentUserEmail') || decoded.email || 'user@example.com';
      const name = localStorage.getItem('currentUserName') || getCookie('currentUserName') || decoded.name || email.split('@')[0];
      return {
        id: decoded.sub,
        name,
        email,
        role: decoded.role || 'CUSTOMER',
        token: cleanToken
      };
    }
    deleteCookie('accessToken');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('currentUserEmail');
    localStorage.removeItem('currentUserName');
    return null;
  });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Navigation / Detail Selection states
  const [selectedProductId, setSelectedProductId] = useState(null);

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [priceRange, setPriceRange] = useState(50000000); // 50M VND limit for classifieds
  const [sortBy, setSortBy] = useState('featured');

  // Sync state to cookies
  useEffect(() => {
    setCookie('products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    setCookie('customers', JSON.stringify(customers));
  }, [customers]);

  useEffect(() => {
    setCookie('users', JSON.stringify(users));
  }, [users]);

  // Handle Theme Toggle
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    setCookie('theme', theme);
  }, [theme]);

  // On startup, check for accessToken in URL parameters, hash fragments, or document.cookie (from Google OAuth redirection)
  useEffect(() => {
    const handleAuthCallback = async () => {
      let rawToken = null;

      // 1. URL query
      const urlParams = new URLSearchParams(window.location.search);
      rawToken = urlParams.get('accessToken') || urlParams.get('token') || urlParams.get('access_token');

      // 2. Hash fragment (Implicit flow)
      if (!rawToken && window.location.hash) {
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        rawToken = hashParams.get('accessToken') || hashParams.get('token') || hashParams.get('access_token');
      }

      // 3. Cookie/LocalStorage (ưu tiên cao nhất hiện tại)
      if (!rawToken) {
        rawToken = localStorage.getItem('accessToken') || getCookie('accessToken');
      }

      // 4. Backend code exchange nếu có code
      const oauthCode = urlParams.get('code');
      if (!rawToken && oauthCode && window.location.pathname.includes('callback')) {
        try {
          // Note: call local endpoint here if direct exchange is needed, but we keep it modular or direct fetch
          const response = await fetch(`https://cho-tot-production.up.railway.app/auth/google/callback${window.location.search}`, {
            headers: { 'accept': '*/*' }
          });

          if (response.ok) {
            const data = await response.json();
            rawToken = data?.data?.accessToken || data?.accessToken || data?.token;
          }
        } catch (err) {
          console.error('Code exchange failed:', err);
        }
      }

      // Clean URL: only if we processed auth info from the URL, hash, or callback path
      const cleanParams = new URLSearchParams(window.location.search);
      const hasAuthParams = cleanParams.has('accessToken') || cleanParams.has('token') || cleanParams.has('access_token') || cleanParams.has('code');
      const isCallbackPath = window.location.pathname.includes('callback');
      const hasAuthHash = window.location.hash && (window.location.hash.includes('accessToken') || window.location.hash.includes('token') || window.location.hash.includes('access_token'));

      if (hasAuthParams || isCallbackPath || hasAuthHash) {
        // Remove auth-related query parameters
        cleanParams.delete('accessToken');
        cleanParams.delete('token');
        cleanParams.delete('access_token');
        cleanParams.delete('code');

        const newSearch = cleanParams.toString();
        const cleanPath = (isCallbackPath ? '/' : window.location.pathname) + (newSearch ? `?${newSearch}` : '');
        const cleanHash = hasAuthHash ? '' : window.location.hash;

        window.history.replaceState({}, document.title, cleanPath + cleanHash);
      }

      if (rawToken) {
        try {
          let cleanToken = decodeURIComponent(rawToken).trim();
          cleanToken = cleanToken.replace(/^["']|["']$/g, '').trim();

          const decoded = decodeJwt(cleanToken);
          if (!decoded) {
            console.error('Failed to decode token');
            return;
          }

          const role = decoded.role || 'CUSTOMER';
          const email = localStorage.getItem('currentUserEmail') || getCookie('currentUserEmail') || decoded.email || `user-${decoded.sub}@gmail.com`;
          const name = localStorage.getItem('currentUserName') || getCookie('currentUserName') || decoded.name || email.split('@')[0];

          setCookie('accessToken', cleanToken);
          setCookie('currentUserEmail', email);
          localStorage.setItem('accessToken', cleanToken);
          localStorage.setItem('currentUserEmail', email);
          localStorage.setItem('currentUserName', name);

          const loggedUser = {
            id: decoded.sub,
            name,
            email,
            role,
            token: cleanToken
          };

          setCurrentUser(loggedUser);
          setView(role === 'ADMIN' ? 'admin' : 'storefront');

          console.log('✅ Google login success:', loggedUser);
        } catch (err) {
          console.error('Error processing token:', err);
        }
      }
    };

    handleAuthCallback();
  }, []);

  // Restore user-listings view on refresh if pathname matches currentUser.name
  useEffect(() => {
    if (currentUser) {
      const path = window.location.pathname;
      if (path.startsWith('/user/')) {
        const urlSlug = decodeURIComponent(path.substring(6));
        if (currentUser.name === urlSlug) {
          loadUserListings(currentUser.id);
        }
      }
    }
  }, [currentUser]);

  // Sync selectedProductId with URL path (specifically, handle back to storefront reset to /)
  useEffect(() => {
    if (selectedProductId === null && products.length > 0) {
      const path = window.location.pathname;
      if (path.startsWith('/post/')) {
        window.history.pushState(null, '', '/');
      }
    }
  }, [selectedProductId, products]);

  // Fetch all posts from the API and map them to products
  useEffect(() => {
    const fetchStorefrontPosts = async () => {
      try {
        const mapped = await fetchAllPosts();
        
        // Fetch detailed post info in parallel to get actual image URLs
        const detailedMapped = await Promise.all(
          mapped.map(async (post) => {
            try {
              const detailed = await fetchPostById(post.id);
              if (detailed && detailed.image) {
                return { ...post, image: detailed.image };
              }
              return post;
            } catch (err) {
              console.error(`Failed to fetch detailed post for ${post.id}:`, err);
              return post;
            }
          })
        );
        
        setProducts(detailedMapped);

        // Restore post detailed view on refresh if pathname matches /post/:slug
        const path = window.location.pathname;
        if (path.startsWith('/post/')) {
          const urlSlug = decodeURIComponent(path.substring(6)).trim();
          const match = detailedMapped.find((p) => generateSlug(p.title) === urlSlug);
          if (match) {
            setSelectedProductId(match.id);
          }
        }
      } catch (err) {
        console.error('Failed to load posts for storefront:', err);
      } finally {
        setIsRestoringPost(false);
      }
    };

    fetchStorefrontPosts();
  }, []);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  // Load user profile & posts for classifieds
  const loadUserListings = async (userId) => {
    setUserListingsLoading(true);
    try {
      const profile = await fetchUserProfile(userId);
      let userName = `User ${userId}`;
      if (profile) {
        setUserProfile(profile);
        userName = profile.name || userName;
      }

      // Push browser history state (change URL to /user/userName)
      const urlPath = `/user/${encodeURIComponent(userName)}`;
      window.history.pushState({ userId, view: 'user-listings' }, '', urlPath);

      // Get user posts
      const posts = await fetchUserPosts(userId);
      setUserListings(posts);
      setView('user-listings');
    } catch (err) {
      console.error('Failed to load user listings:', err);
    } finally {
      setUserListingsLoading(false);
    }
  };

  // Admin Product CRUD handlers (modifying local state for preview)
  const addProduct = (productData) => {
    const newProduct = {
      ...productData,
      id: products.length > 0 ? Math.max(...products.map((p) => p.id)) + 1 : 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      authorId: currentUser ? currentUser.id : 1,
      location: 'District 1, HCMC'
    };
    setProducts((prev) => [newProduct, ...prev]);
  };

  const editProduct = (productId, updatedData) => {
    setProducts((prev) =>
      prev.map((prod) => (prod.id === productId ? { ...prod, ...updatedData, updatedAt: new Date().toISOString() } : prod))
    );
  };

  const deleteProduct = (productId) => {
    setProducts((prev) => prev.filter((prod) => prod.id !== productId));
    if (selectedProductId === productId) {
      setSelectedProductId(null);
    }
  };

  // Sign In / Sign Up Handlers
  const signIn = async (email, password) => {
    const result = await authSignIn(email, password);
    if (result.success) {
      setCurrentUser(result.user);
      
      const userName = email.trim().split('@')[0];
      setCustomers((prevCusts) => {
        const exists = prevCusts.find((c) => c.email.toLowerCase() === email.trim().toLowerCase());
        if (exists) return prevCusts;
        return [
          ...prevCusts,
          {
            id: prevCusts.length + 1,
            name: userName,
            email: email.trim(),
            joinedDate: new Date().toISOString().split('T')[0],
            location: 'District 1, HCMC'
          }
        ];
      });

      if (result.user.role === 'ADMIN') {
        setView('admin');
      } else {
        setView('storefront');
      }
      return { success: true };
    }
    return result;
  };

  const signUp = async (name, email, password, phone) => {
    const result = await signUpService(name, email, password, phone);
    if (result.success) {
      // Automatically log in after registration
      const loginRes = await signIn(email, password);
      if (loginRes.success) {
        return { success: true };
      }
      return { success: true, message: 'Account created, please sign in.' };
    }
    return result;
  };

  const logout = () => {
    setCurrentUser(null);
    deleteCookie('accessToken');
    deleteCookie('currentUserEmail');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('currentUserEmail');
    localStorage.removeItem('currentUserName');
    setView('storefront');
  };

  return (
    <ShopContext.Provider
      value={{
        theme,
        toggleTheme,
        view,
        setView,
        adminTab,
        setAdminTab,
        products,
        customers,
        selectedProductId,
        setSelectedProductId,
        isRestoringPost,
        searchQuery,
        setSearchQuery,
        selectedCategory,
        setSelectedCategory,
        priceRange,
        setPriceRange,
        sortBy,
        setSortBy,
        addProduct,
        editProduct,
        deleteProduct,
        users,
        currentUser,
        isAuthModalOpen,
        setIsAuthModalOpen,
        signIn,
        signUp,
        logout,
        formatPrice,
        userListings,
        userProfile,
        userListingsLoading,
        loadUserListings
      }}
    >
      {children}
    </ShopContext.Provider>
  );
};
