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

// Seed Products Dataset
const SEED_PRODUCTS = [
  {
    id: 1,
    title: 'AeroSound Pro Wireless Headphones',
    description: 'Experience immersive, high-fidelity sound with adaptive active noise cancellation. Features up to 40 hours of battery life, fast charging, premium memory foam earcups, and crystal-clear voice calls.',
    price: 299.99,
    category: 'Electronics',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop',
    rating: 4.8,
    reviewsCount: 128,
    stock: 25,
    colors: ['#0f172a', '#64748b', '#e2e8f0'],
    sizes: ['Standard'],
    reviews: [
      { id: 1, author: 'Jane Doe', rating: 5, date: '2026-05-12', comment: 'Absolutely incredible sound quality. Noise cancellation is top tier.' },
      { id: 2, author: 'Mark S.', rating: 4, date: '2026-05-28', comment: 'Very comfortable for long sessions, though a bit heavy.' }
    ]
  },
  {
    id: 2,
    title: 'Chronos Smartwatch Series 5',
    description: 'Stay connected and monitor your health in style. Advanced heart-rate tracker, sleep analyzer, blood oxygen monitor, and custom workout modes. Always-on AMOLED display and 7-day battery life.',
    price: 199.99,
    category: 'Electronics',
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop',
    rating: 4.5,
    reviewsCount: 94,
    stock: 15,
    colors: ['#0f172a', '#b91c1c', '#f59e0b'],
    sizes: ['38mm', '42mm'],
    reviews: [
      { id: 1, author: 'Alice W.', rating: 5, date: '2026-06-01', comment: 'Beautiful screen and trackers are highly accurate.' }
    ]
  },
  {
    id: 3,
    title: 'Nomad Leather Backpack',
    description: 'Handcrafted from full-grain vegetable-tanned leather, this backpack is built to last. Dedicated 16-inch laptop compartment, multiple organizer pockets, and breathable mesh back padding.',
    price: 149.99,
    category: 'Fashion',
    image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&auto=format&fit=crop',
    rating: 4.7,
    reviewsCount: 56,
    stock: 8,
    colors: ['#7c2d12', '#451a03'],
    sizes: ['Standard'],
    reviews: [
      { id: 1, author: 'John B.', rating: 5, date: '2026-04-18', comment: 'Leather smells amazing and looks better as it ages. Super durable.' }
    ]
  },
  {
    id: 4,
    title: 'Matrix Mechanical Keyboard',
    description: 'Designed for enthusiasts and professionals alike. Custom hot-swappable tactile switches, double-shot PBT keycaps, programmable RGB backlighting, and solid aluminum frame.',
    price: 129.99,
    category: 'Electronics',
    image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&auto=format&fit=crop',
    rating: 4.9,
    reviewsCount: 72,
    stock: 4,
    colors: ['#0f172a', '#e2e8f0'],
    sizes: ['TKL', 'Full Size'],
    reviews: [
      { id: 1, author: 'David L.', rating: 5, date: '2026-06-05', comment: 'The key feel is phenomenal. Best stock keyboard I have owned.' }
    ]
  },
  {
    id: 5,
    title: 'Urban Retro Sneakers',
    description: 'Blend retro styling with modern cushion technology. Microfiber leather upper, shock-absorbing EVA midsole, and high-traction rubber outsole. Perfect for daily urban exploration.',
    price: 89.99,
    category: 'Fashion',
    image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=600&auto=format&fit=crop',
    rating: 4.3,
    reviewsCount: 110,
    stock: 19,
    colors: ['#ffffff', '#0f172a', '#f59e0b'],
    sizes: ['8', '9', '10', '11'],
    reviews: [
      { id: 1, author: 'Kevin H.', rating: 4, date: '2026-05-15', comment: 'Looks great and fits true to size. Soft interior cushioning.' }
    ]
  },
  {
    id: 6,
    title: 'Solstice Polarized Sunglasses',
    description: 'Protect your eyes with lightweight, durable aviator shades. Scratch-resistant polarized lenses providing 100% UV protection. Sleek surgical-grade titanium frames.',
    price: 79.99,
    category: 'Accessories',
    image: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=600&auto=format&fit=crop',
    rating: 4.6,
    reviewsCount: 42,
    stock: 30,
    colors: ['#0f172a', '#64748b'],
    sizes: ['Medium', 'Large'],
    reviews: [
      { id: 1, author: 'Emma R.', rating: 5, date: '2026-05-20', comment: 'Extremely lightweight, forget I have them on. Lenses are very clear.' }
    ]
  },
  {
    id: 7,
    title: 'Latitude Ultrabook 14"',
    description: 'Empower your productivity anywhere. Powered by the latest octa-core processor, 16GB RAM, and 512GB ultra-fast PCIe SSD. 14-inch IPS borderless screen, back-lit keyboard, and sleek unibody alloy chassis.',
    price: 899.99,
    category: 'Electronics',
    image: 'https://images.unsplash.com/photo-1496181130204-755241544e35?w=600&auto=format&fit=crop',
    rating: 4.7,
    reviewsCount: 38,
    stock: 6,
    colors: ['#64748b', '#e2e8f0'],
    sizes: ['16GB RAM / 512GB SSD', '32GB RAM / 1TB SSD'],
    reviews: [
      { id: 1, author: 'Toby M.', rating: 5, date: '2026-06-10', comment: 'Insanely fast and battery easily lasts all day. Highly recommended.' }
    ]
  }
];

// Seed Orders
const SEED_ORDERS = [
  {
    id: 'ORD-8491',
    date: '2026-06-12T14:32:00.000Z',
    customer: { name: 'Sarah Parker', email: 'sarah.p@example.com' },
    items: [
      { id: 1, title: 'AeroSound Pro Wireless Headphones', price: 299.99, qty: 1, color: '#0f172a', size: 'Standard', image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop' }
    ],
    subtotal: 299.99,
    tax: 24.00,
    shipping: 10.00,
    total: 333.99,
    status: 'delivered',
    paymentMethod: 'Credit Card'
  },
  {
    id: 'ORD-2952',
    date: '2026-06-14T09:15:00.000Z',
    customer: { name: 'David Smith', email: 'dsmith@example.com' },
    items: [
      { id: 3, title: 'Nomad Leather Backpack', price: 149.99, qty: 1, color: '#7c2d12', size: 'Standard', image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&auto=format&fit=crop' },
      { id: 6, title: 'Solstice Polarized Sunglasses', price: 79.99, qty: 1, color: '#0f172a', size: 'Medium', image: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=600&auto=format&fit=crop' }
    ],
    subtotal: 229.98,
    tax: 18.40,
    shipping: 0.00, // free shipping for orders > $150
    total: 248.38,
    status: 'processing',
    paymentMethod: 'PayPal'
  }
];

// Seed Customers
const SEED_CUSTOMERS = [
  { id: 1, name: 'Sarah Parker', email: 'sarah.p@example.com', ordersCount: 1, totalSpent: 333.99, joinedDate: '2026-01-15' },
  { id: 2, name: 'David Smith', email: 'dsmith@example.com', ordersCount: 1, totalSpent: 248.38, joinedDate: '2026-03-22' },
  { id: 3, name: 'Emily Davis', email: 'emily.d@example.com', ordersCount: 0, totalSpent: 0.00, joinedDate: '2026-05-11' }
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
  const [adminTab, setAdminTab] = useState('dashboard'); // 'dashboard', 'products', 'orders', 'customers'

  // Data States
  const [products, setProducts] = useState(() => {
    const local = localStorage.getItem('products');
    return local ? JSON.parse(local) : SEED_PRODUCTS;
  });
  const [cart, setCart] = useState(() => {
    const local = localStorage.getItem('cart');
    return local ? JSON.parse(local) : [];
  });
  const [orders, setOrders] = useState(() => {
    const local = localStorage.getItem('orders');
    return local ? JSON.parse(local) : SEED_ORDERS;
  });
  const [customers, setCustomers] = useState(() => {
    const local = localStorage.getItem('customers');
    return local ? JSON.parse(local) : SEED_CUSTOMERS;
  });

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
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [priceRange, setPriceRange] = useState(1000);
  const [sortBy, setSortBy] = useState('featured');

  // Sync state to local storage
  useEffect(() => {
    localStorage.setItem('products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem('orders', JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem('customers', JSON.stringify(customers));
  }, [customers]);

  useEffect(() => {
    localStorage.setItem('users', JSON.stringify(users));
  }, [users]);

  // accessToken & currentUserEmail are synchronized inside signIn and logout triggers.

  // Handle Theme Toggle
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  // Cart Handlers
  const addToCart = (product, color, size, qty = 1) => {
    const cartItemId = `${product.id}-${color}-${size}`;
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.cartItemId === cartItemId);
      if (existingItem) {
        return prevCart.map((item) =>
          item.cartItemId === cartItemId
            ? { ...item, qty: Math.min(item.qty + qty, product.stock) }
            : item
        );
      } else {
        return [
          ...prevCart,
          {
            cartItemId,
            id: product.id,
            title: product.title,
            price: product.price,
            image: product.image,
            color,
            size,
            qty,
            maxStock: product.stock
          }
        ];
      }
    });
    setIsCartOpen(true);
  };

  const updateCartQty = (cartItemId, qty) => {
    if (qty <= 0) {
      removeFromCart(cartItemId);
      return;
    }
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.cartItemId === cartItemId
          ? { ...item, qty: Math.min(qty, item.maxStock) }
          : item
      )
    );
  };

  const removeFromCart = (cartItemId) => {
    setCart((prevCart) => prevCart.filter((item) => item.cartItemId !== cartItemId));
  };

  const clearCart = () => {
    setCart([]);
  };

  // Place Order Handler
  const placeOrder = (customerDetails, paymentDetails) => {
    const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
    const tax = Number((subtotal * 0.08).toFixed(2));
    const shipping = subtotal > 150 ? 0 : 10.00;
    const total = Number((subtotal + tax + shipping).toFixed(2));

    const newOrder = {
      id: `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
      date: new Date().toISOString(),
      customer: {
        name: customerDetails.name,
        email: customerDetails.email
      },
      items: [...cart],
      subtotal,
      tax,
      shipping,
      total,
      status: 'pending',
      paymentMethod: paymentDetails.method || 'Credit Card'
    };

    // Deduct inventory stock
    setProducts((prevProducts) =>
      prevProducts.map((prod) => {
        const cartItemsForProd = cart.filter((c) => c.id === prod.id);
        if (cartItemsForProd.length > 0) {
          const totalBought = cartItemsForProd.reduce((sum, c) => sum + c.qty, 0);
          return { ...prod, stock: Math.max(0, prod.stock - totalBought) };
        }
        return prod;
      })
    );

    // Add order to database
    setOrders((prevOrders) => [newOrder, ...prevOrders]);

    // Update customer list
    setCustomers((prevCusts) => {
      const exists = prevCusts.find((c) => c.email.toLowerCase() === customerDetails.email.toLowerCase());
      if (exists) {
        return prevCusts.map((c) =>
          c.email.toLowerCase() === customerDetails.email.toLowerCase()
            ? { ...c, ordersCount: c.ordersCount + 1, totalSpent: Number((c.totalSpent + total).toFixed(2)) }
            : c
        );
      } else {
        return [
          ...prevCusts,
          {
            id: prevCusts.length + 1,
            name: customerDetails.name,
            email: customerDetails.email,
            ordersCount: 1,
            totalSpent: total,
            joinedDate: new Date().toISOString().split('T')[0]
          }
        ];
      }
    });

    // Reset shopping cart
    clearCart();
    return newOrder.id;
  };

  // Admin Product CRUD handlers
  const addProduct = (productData) => {
    const newProduct = {
      ...productData,
      id: products.length > 0 ? Math.max(...products.map((p) => p.id)) + 1 : 1,
      rating: 5.0,
      reviewsCount: 0,
      reviews: []
    };
    setProducts((prev) => [newProduct, ...prev]);
  };

  const editProduct = (productId, updatedData) => {
    setProducts((prev) =>
      prev.map((prod) => (prod.id === productId ? { ...prod, ...updatedData } : prod))
    );
  };

  const deleteProduct = (productId) => {
    setProducts((prev) => prev.filter((prod) => prod.id !== productId));
    // Clear detail selection if deleted
    if (selectedProductId === productId) {
      setSelectedProductId(null);
    }
  };

  // Admin Order Pipeline state change
  const updateOrderStatus = (orderId, newStatus) => {
    setOrders((prev) =>
      prev.map((ord) => (ord.id === orderId ? { ...ord, status: newStatus } : ord))
    );
  };

  // Add Product Review
  const addProductReview = (productId, reviewData) => {
    const newReview = {
      id: Math.floor(Math.random() * 10000),
      author: reviewData.author,
      rating: Number(reviewData.rating),
      date: new Date().toISOString().split('T')[0],
      comment: reviewData.comment
    };

    setProducts((prevProducts) =>
      prevProducts.map((prod) => {
        if (prod.id === productId) {
          const updatedReviews = [newReview, ...prod.reviews];
          const newAvgRating = Number(
            (updatedReviews.reduce((sum, r) => sum + r.rating, 0) / updatedReviews.length).toFixed(1)
          );
          return {
            ...prod,
            reviews: updatedReviews,
            reviewsCount: updatedReviews.length,
            rating: newAvgRating
          };
        }
        return prod;
      })
    );
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
          // ignore json parse error, use fallback message
        }
        return { success: false, message: errorMsg };
      }

      const data = await response.json();
      const token = data.data?.accessToken || data.accessToken || data.token || data.data?.token;
      
      if (!token) {
        return { success: false, message: 'Access token not returned from server.' };
      }

      // Save accessToken and email in localStorage
      localStorage.setItem('accessToken', token);
      localStorage.setItem('currentUserEmail', email.trim());

      // Decode JWT
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

      // Register account inside Customer list if not exists
      setCustomers((prevCusts) => {
        const exists = prevCusts.find((c) => c.email.toLowerCase() === email.trim().toLowerCase());
        if (exists) return prevCusts;
        return [
          ...prevCusts,
          {
            id: prevCusts.length + 1,
            name: userName,
            email: email.trim(),
            ordersCount: 0,
            totalSpent: 0.00,
            joinedDate: new Date().toISOString().split('T')[0]
          }
        ];
      });

      // Role-based redirects: ADMIN to 'admin' page, CUSTOMER to storefront ('/')
      if (role === 'ADMIN') {
        setView('admin');
      } else {
        setView('storefront');
      }

      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: 'Server connection failed or CORS blocked. Please check your credentials or try again later.' };
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

    // Also register them in the customers list
    setCustomers((prevCusts) => {
      const custExists = prevCusts.find((c) => c.email.toLowerCase() === email.toLowerCase());
      if (custExists) return prevCusts;
      return [
        ...prevCusts,
        {
          id: prevCusts.length + 1,
          name,
          email,
          ordersCount: 0,
          totalSpent: 0.00,
          joinedDate: new Date().toISOString().split('T')[0]
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
        cart,
        orders,
        customers,
        selectedProductId,
        setSelectedProductId,
        isCartOpen,
        setIsCartOpen,
        searchQuery,
        setSearchQuery,
        selectedCategory,
        setSelectedCategory,
        priceRange,
        setPriceRange,
        sortBy,
        setSortBy,
        addToCart,
        updateCartQty,
        removeFromCart,
        clearCart,
        placeOrder,
        addProduct,
        editProduct,
        deleteProduct,
        updateOrderStatus,
        addProductReview,
        users,
        currentUser,
        isAuthModalOpen,
        setIsAuthModalOpen,
        signIn,
        signUp,
        logout
      }}
    >
      {children}
    </ShopContext.Provider>
  );
};
