import { apiFetch } from './api';

export const fetchUserProfile = async (userId) => {
  const userRes = await apiFetch(`https://cho-tot-production.up.railway.app/user/get-user-by-id?id=${userId}`);
  if (!userRes.ok) throw new Error('Failed to fetch user profile');
  const userJSON = await userRes.json();
  if (userJSON.success && userJSON.data) {
    return userJSON.data;
  }
  return null;
};

export const fetchUserPosts = async (userId) => {
  const postsRes = await apiFetch(`https://cho-tot-production.up.railway.app/post/get-all-post-by-user-id?id=${userId}`);
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

    const detailedPosts = await Promise.all(
      postsJSON.data.map(async (post) => {
        let image = post.categoryId === 1
          ? 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&auto=format&fit=crop'
          : post.categoryId === 2
            ? 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=600&auto=format&fit=crop'
            : 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=600&auto=format&fit=crop';

        try {
          const detailRes = await apiFetch(`https://cho-tot-production.up.railway.app/post/id?id=${post.id}`);
          if (detailRes.ok) {
            const detailJSON = await detailRes.json();
            if (detailJSON.success && detailJSON.data && Array.isArray(detailJSON.data.images)) {
              const avatarImg = detailJSON.data.images.find(img => img.isAvatar) || detailJSON.data.images[0];
              if (avatarImg && avatarImg.url) {
                image = avatarImg.url;
              }
            }
          }
        } catch (err) {
          console.error(`Failed to fetch details for post ${post.id} in fetchUserPosts:`, err);
        }

        return {
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
          image: image,
          location: LOCATIONS[post.id % LOCATIONS.length]
        };
      })
    );

    return detailedPosts;
  }
  return [];
};

export const fetchAllUsers = async () => {
  const response = await apiFetch('https://cho-tot-production.up.railway.app/user/get-all-user');
  if (!response.ok) throw new Error('Failed to fetch user database');
  const resData = await response.json();
  if (resData.success && Array.isArray(resData.data)) {
    return resData.data;
  }
  return [];
};

export const saveUserAddress = async (addressData) => {
  const response = await apiFetch('https://cho-tot-production.up.railway.app/address/save-address', {
    method: 'POST',
    body: JSON.stringify(addressData)
  });
  if (!response.ok) {
    let errorMsg = 'Failed to save address';
    try {
      const errJSON = await response.json();
      if (errJSON && errJSON.message) errorMsg = errJSON.message;
    } catch (_) {}
    throw new Error(errorMsg);
  }
  return await response.json();
};

export const fetchUserAddress = async (userId) => {
  const response = await apiFetch(`https://cho-tot-production.up.railway.app/address/get-address-by-user-id?id=${userId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch user address details');
  }
  const resData = await response.json();
  if (resData.success && resData.data) {
    return resData.data;
  }
  return null;
};

export const fetchUserOrders = async () => {
  const response = await apiFetch('https://cho-tot-production.up.railway.app/order/get-all-order-by-user');
  if (!response.ok) {
    throw new Error('Failed to fetch user orders');
  }
  const resData = await response.json();
  if (resData.success && Array.isArray(resData.data)) {
    return resData.data;
  }
  return [];
};

export const updateUserOrder = async (orderId, orderStatus) => {
  const response = await apiFetch('https://cho-tot-production.up.railway.app/order/update-order', {
    method: 'PUT',
    body: JSON.stringify({ orderId: Number(orderId), orderStatus })
  });
  if (!response.ok) {
    let errorMsg = 'Failed to update order status';
    try {
      const errJSON = await response.json();
      if (errJSON && errJSON.message) errorMsg = errJSON.message;
    } catch (_) {}
    throw new Error(errorMsg);
  }
  return await response.json();
};

export const fetchOrderDetailsByPostId = async (postId) => {
  const response = await apiFetch(`https://cho-tot-production.up.railway.app/offer/get-offer-by-post-id?postId=${postId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch offer details by post ID');
  }
  const resData = await response.json();
  if (resData.success && Array.isArray(resData.data)) {
    return resData.data;
  }
  return [];
};

export const fetchAllOrders = async () => {
  const response = await apiFetch('https://cho-tot-production.up.railway.app/order');
  if (!response.ok) {
    throw new Error('Failed to fetch all orders');
  }
  const resData = await response.json();
  if (resData.success && Array.isArray(resData.data)) {
    return resData.data;
  }
  return [];
};

export const fetchOrderAndTracking = async (orderId) => {
  const response = await apiFetch(`https://cho-tot-production.up.railway.app/order/get-order-and-tracking?orderId=${orderId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch order and tracking details');
  }
  const resData = await response.json();
  if (resData.success && resData.data) {
    return resData.data;
  }
  return null;
};

export const updateUserPhone = async (phone) => {
  const response = await apiFetch(`https://cho-tot-production.up.railway.app/user/update-phone?phone=${encodeURIComponent(phone)}`, {
    method: 'PUT'
  });
  if (!response.ok) {
    let errorMsg = 'Failed to update phone number';
    try {
      const errJSON = await response.json();
      if (errJSON && errJSON.message) errorMsg = errJSON.message;
    } catch (_) {}
    throw new Error(errorMsg);
  }
  return await response.json();
};

