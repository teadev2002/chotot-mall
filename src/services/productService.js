import { apiFetch } from './api';

export const fetchAllPosts = async () => {
  const response = await apiFetch('https://cho-tot-production.up.railway.app/post/all');
  if (!response.ok) throw new Error('API failed to fetch posts');
  
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

    return resData.data.map((post) => ({
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
  }
  return [];
};

export const fetchCategories = async () => {
  const response = await apiFetch('https://cho-tot-production.up.railway.app/category');
  if (!response.ok) throw new Error('Failed to fetch categories');
  const resData = await response.json();
  if (resData.success && Array.isArray(resData.data)) {
    return resData.data.filter(cat => cat.isActive !== false); // optional: filter active categories
  }
  return [];
};

export const fetchPostById = async (postId) => {
  const response = await apiFetch(`https://cho-tot-production.up.railway.app/post/id?id=${postId}`);
  if (!response.ok) throw new Error('Failed to fetch post details');
  const resData = await response.json();
  if (resData.success && resData.data) {
    const post = resData.data;

    // Resolve image
    let image = 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=600&auto=format&fit=crop';
    if (Array.isArray(post.images) && post.images.length > 0) {
      const avatarImg = post.images.find(img => img.isAvatar) || post.images[0];
      if (avatarImg && avatarImg.url) {
        image = avatarImg.url;
      }
    }

    // Map category
    const category = post.categoryId === 1 ? 'Electronics' : post.categoryId === 2 ? 'Fashion' : 'Accessories';

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
    const location = LOCATIONS[post.id % LOCATIONS.length];

    return {
      ...post,
      image,
      category,
      location,
      description: post.content || 'No description provided.'
    };
  }
  return null;
};

export const fetchOffersByPostId = async (postId) => {
  const response = await apiFetch(`https://cho-tot-production.up.railway.app/offer/get-offer-by-post-id?postId=${postId}`);
  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Unauthorized');
    }
    throw new Error('Failed to fetch offers list');
  }
  const resData = await response.json();
  if (resData.success && Array.isArray(resData.data)) {
    return resData.data;
  }
  return [];
};

export const createOffer = async (postId, price) => {
  const response = await apiFetch('https://cho-tot-production.up.railway.app/offer/create-offer', {
    method: 'POST',
    body: JSON.stringify({
      postId: Number(postId),
      price: Number(price)
    })
  });
  if (!response.ok) {
    let errorMsg = 'Failed to create offer';
    try {
      const errJSON = await response.json();
      if (errJSON && errJSON.message) errorMsg = errJSON.message;
    } catch (_) {}
    throw new Error(errorMsg);
  }
  return await response.json();
};

export const acceptOffer = async (offerId) => {
  const response = await apiFetch(`https://cho-tot-production.up.railway.app/offer/accept-offer?offerId=${offerId}`, {
    method: 'PUT'
  });
  if (!response.ok) {
    let errorMsg = 'Failed to accept offer';
    try {
      const errJSON = await response.json();
      if (errJSON && errJSON.message) errorMsg = errJSON.message;
    } catch (_) {}
    throw new Error(errorMsg);
  }
  return await response.json();
};


