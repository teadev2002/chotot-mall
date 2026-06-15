import React, { createContext, useState, useEffect } from 'react';

// Create Shop Context
export const ShopContext = createContext();

// Helper to decode JWT token in browser
const decodeJwt = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      window.atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error('Failed to decode JWT:', e);
    return null;
  }
};

// Seed Customers/Users database fallback metadata
const SEED_CUSTOMERS = [
  { id: 1, name: 'Sarah Parker', email: 'sarah.p@example.com', joinedDate: '2026-01-15', location: 'District 1, HCMC' },
  { id: 2, name: 'David Smith', email: 'dsmith@example.com', joinedDate: '2026-03-22', location: 'Cau Giay, Hanoi' },
  { id: 3, name: 'Emily Davis', email: 'emily.d@example.com', joinedDate: '2026-05-11', location: 'Hai Chau, Da Nang' }
];

export const ShopProvider = ({ children }) => {
  // Theme & View States
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
  const [view, setView] = useState(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      const decoded = decodeJwt(token);
      if (decoded && decoded.role === 'ADMIN' && decoded.exp * 1000 > Date.now()) {
        return 'admin';
      }
    }
    return 'storefront';
  });
  const [adminTab, setAdminTab] = useState('dashboard'); // 'dashboard', 'products', 'customers'

  // Data States
  const [products, setProducts] = useState([]); // Will store API posts
  const [customers, setCustomers] = useState(() => {
    const local = localStorage.getItem('customers');
    return local ? JSON.parse(local) : SEED_CUSTOMERS;
  });
  const [userListings, setUserListings] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [userListingsLoading, setUserListingsLoading] = useState(false);

  // Users Auth States
  const [users, setUsers] = useState(() => {
    const local = localStorage.getItem('users');
    if (local) return JSON.parse(local);
    return [
      { id: 1, name: 'Sarah Parker', email: 'sarah.p@example.com', password: 'password123' },
      { id: 2, name: 'David Smith', email: 'dsmith@example.com', password: 'password123' },
      { id: 3, name: 'Emily Davis', email: 'emily.d@example.com', password: 'password123' }
    ];
  });

  const [currentUser, setCurrentUser] = useState(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      const decoded = decodeJwt(token);
      if (decoded && decoded.exp * 1000 > Date.now()) {
        const email = decoded.email || localStorage.getItem('currentUserEmail') || 'user@example.com';
        return {
          id: decoded.sub,
          name: email.split('@')[0],
          email: email,
          role: decoded.role,
          token: token
        };
      } else {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('currentUserEmail');
      }
    }
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

  // Sync state to local storage
  useEffect(() => {
    localStorage.setItem('products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('customers', JSON.stringify(customers));
  }, [customers]);

  useEffect(() => {
    localStorage.setItem('users', JSON.stringify(users));
  }, [users]);

  // Handle Theme Toggle
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  // On startup, check for accessToken in document.cookie (from Google OAuth redirection)
  useEffect(() => {
    const getCookie = (name) => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop().split(';').shift();
      return null;
    };

    const cookieToken = getCookie('accessToken');
    if (cookieToken) {
      const decoded = decodeJwt(cookieToken);
      if (decoded && decoded.exp * 1000 > Date.now()) {
        const role = decoded.role || 'CUSTOMER';
        const email = decoded.email || `google-user-${decoded.sub}@gmail.com`;

        localStorage.setItem('accessToken', cookieToken);
        localStorage.setItem('currentUserEmail', email);

        const loggedUser = {
          id: decoded.sub,
          name: email.split('@')[0],
          email: email,
          role: role,
          token: cookieToken
        };

        setCurrentUser(loggedUser);

        // Redirect based on role
        if (role === 'ADMIN') {
          setView('admin');
        } else {
          setView('storefront');
        }

        // Register in customers list if not exists
        setCustomers((prevCusts) => {
          const exists = prevCusts.find((c) => c.email.toLowerCase() === email.toLowerCase());
          if (exists) return prevCusts;
          return [
            ...prevCusts,
            {
              id: prevCusts.length + 1,
              name: email.split('@')[0],
              email: email,
              joinedDate: new Date().toISOString().split('T')[0],
              location: 'Hanoi, Vietnam'
            }
          ];
        });
      }
    }
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

  // Fetch all posts from the API and map them to products
  useEffect(() => {
    const fetchStorefrontPosts = async () => {
      try {
        const response = await fetch('https://cho-tot-production.up.railway.app/post/all');
        if (!response.ok) throw new Error('API failed');
        const resData = await response.json();
        if (resData.success && Array.isArray(resData.data)) {
          // List of locations to make classifieds look authentic
          const LOCATIONS = [
            'District 1, HCMC',
            'Cau Giay, Hanoi',
            'Hai Chau, Da Nang',
            'Binh Thanh, HCMC',
            'Hoan Kiem, Hanoi',
            'Ngu Hanh Son, Da Nang',
            'Thu Duc, HCMC',
            'Dong Da, Hanoi'
          ];

          const mapped = resData.data.map((post) => ({
            id: post.id,
            title: post.title,
            description: post.content || 'No description provided.',
            price: post.price !== null && post.price !== undefined ? Number(post.price) : null,
            width: post.width,
            length: post.length,
            height: post.height,
            weight: post.weight,
            published: post.published,
            createdAt: post.createdAt,
            updatedAt: post.updatedAt,
            authorId: post.authorId,
            categoryId: post.categoryId,
            category: post.categoryId === 1 ? 'Electronics' : post.categoryId === 2 ? 'Fashion' : 'Accessories',
            image: post.categoryId === 1 
              ? 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&auto=format&fit=crop'
              : post.categoryId === 2
              ? 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=600&auto=format&fit=crop'
              : 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=600&auto=format&fit=crop',
            location: LOCATIONS[post.id % LOCATIONS.length]
          }));
          setProducts(mapped);
        }
      } catch (err) {
        console.error('Failed to load posts for storefront:', err);
      }
    };

    fetchStorefrontPosts();
  }, []);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  // Dynamic price formatter helper
  const formatPrice = (price) => {
    if (price === null || price === undefined) return 'Contact for Price';
    const numPrice = Number(price);
    if (isNaN(numPrice)) return 'Contact for Price';
    
    // Large prices (>= 1000) display as Vietnamese Dong (VND), others as USD
    if (numPrice >= 1000) {
      return `${numPrice.toLocaleString('vi-VN')} ₫`;
    }
    return `$${numPrice.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
  };

  // Load user profile & posts for classifieds
  const loadUserListings = async (userId) => {
    setUserListingsLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const headers = {
        'accept': '*/*'
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // 1. Get user profile
      const userRes = await fetch(`https://cho-tot-production.up.railway.app/user/get-user-by-id?id=${userId}`, {
        headers
      });
      if (!userRes.ok) throw new Error('Failed to fetch user profile');
      const userJSON = await userRes.json();
      
      let userName = `User ${userId}`;
      if (userJSON.success && userJSON.data) {
        setUserProfile(userJSON.data);
        userName = userJSON.data.name || userName;
      }

      // Push browser history state (change URL to /user/userName)
      const urlPath = `/user/${encodeURIComponent(userName)}`;
      window.history.pushState({ userId, view: 'user-listings' }, '', urlPath);

      // 2. Get user posts
      const postsRes = await fetch(`https://cho-tot-production.up.railway.app/post/get-all-post-by-user-id?id=${userId}`, {
        headers
      });
      if (!postsRes.ok) throw new Error('Failed to fetch user posts');
      const postsJSON = await postsRes.json();

      if (postsJSON.success && Array.isArray(postsJSON.data)) {
        const LOCATIONS = [
          'District 1, HCMC',
          'Cau Giay, Hanoi',
          'Hai Chau, Da Nang',
          'Binh Thanh, HCMC',
          'Hoan Kiem, Hanoi',
          'Ngu Hanh Son, Da Nang',
          'Thu Duc, HCMC',
          'Dong Da, Hanoi'
        ];

        const mapped = postsJSON.data.map((post) => ({
          id: post.id,
          title: post.title,
          description: post.content || 'No description provided.',
          price: post.price !== null && post.price !== undefined ? Number(post.price) : null,
          width: post.width,
          length: post.length,
          height: post.height,
          weight: post.weight,
          published: post.published,
          createdAt: post.createdAt,
          updatedAt: post.updatedAt,
          authorId: post.authorId,
          categoryId: post.categoryId,
          category: post.categoryId === 1 ? 'Electronics' : post.categoryId === 2 ? 'Fashion' : 'Accessories',
          image: post.categoryId === 1 
            ? 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&auto=format&fit=crop'
            : post.categoryId === 2
            ? 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=600&auto=format&fit=crop'
            : 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=600&auto=format&fit=crop',
          location: LOCATIONS[post.id % LOCATIONS.length]
        }));
        setUserListings(mapped);
      }
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
    try {
      const response = await fetch('https://cho-tot-production.up.railway.app/auth/login', {
        method: 'POST',
        headers: {
          'accept': '*/*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: email.trim(),
          password: password
        })
      });

      if (!response.ok) {
        let errorMsg = 'Invalid email or password.';
        try {
          const errData = await response.json();
          if (errData && errData.message) {
            errorMsg = errData.message;
          } else if (errData && errData.error) {
            errorMsg = errData.error;
          }
        } catch (e) {
          // ignore
        }
        return { success: false, message: errorMsg };
      }

      const data = await response.json();
      const token = data.data?.accessToken || data.accessToken || data.token || data.data?.token;
      
      if (!token) {
        return { success: false, message: 'Access token not returned from server.' };
      }

      localStorage.setItem('accessToken', token);
      localStorage.setItem('currentUserEmail', email.trim());

      const decoded = decodeJwt(token);
      if (!decoded) {
        return { success: false, message: 'Failed to decode authorization token.' };
      }

      const userName = email.trim().split('@')[0];
      const role = decoded.role || 'CUSTOMER';

      const loggedUser = {
        id: decoded.sub,
        name: userName,
        email: email.trim(),
        role: role,
        token: token
      };

      setCurrentUser(loggedUser);

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

      if (role === 'ADMIN') {
        setView('admin');
      } else {
        setView('storefront');
      }

      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: 'Server connection failed. Please try again.' };
    }
  };

  const signUp = (name, email, password) => {
    const exists = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (exists) {
      return { success: false, message: 'This email is already registered.' };
    }

    const newUser = {
      id: Date.now(),
      name,
      email,
      password
    };

    setUsers((prev) => [...prev, newUser]);
    setCurrentUser(newUser);

    setCustomers((prevCusts) => {
      const custExists = prevCusts.find((c) => c.email.toLowerCase() === email.toLowerCase());
      if (custExists) return prevCusts;
      return [
        ...prevCusts,
        {
          id: prevCusts.length + 1,
          name,
          email,
          joinedDate: new Date().toISOString().split('T')[0],
          location: 'Ho Chi Minh City'
        }
      ];
    });

    return { success: true };
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('accessToken');
    localStorage.removeItem('currentUserEmail');
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

