import { apiFetch } from './api';
import { setCookie } from '../utils/cookie';
import { decodeJwt } from '../utils/jwt';

export const signIn = async (email, password) => {
  try {
    const response = await apiFetch('https://cho-tot-production.up.railway.app/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: email.trim(),
        password: password
      })
    });

    if (!response.ok) {
      let errorMsg = 'Invalid email or password.';
      try {
        const errData = await response.json();
        if (errData && errData.message) errorMsg = errData.message;
        else if (errData && errData.error) errorMsg = errData.error;
      } catch (e) { }
      return { success: false, message: errorMsg };
    }

    const data = await response.json();
    const token = data.data?.accessToken || data.accessToken || data.token || data.data?.token;

    if (!token) {
      return { success: false, message: 'Access token not returned from server.' };
    }

    setCookie('accessToken', token);
    setCookie('currentUserEmail', email.trim());

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

    return { success: true, user: loggedUser };
  } catch (error) {
    console.error('Login error:', error);
    return { success: false, message: 'Server connection failed. Please try again.' };
  }
};

export const signUpService = async (name, email, password, phone) => {
  try {
    const response = await apiFetch('https://cho-tot-production.up.railway.app/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: email.trim(),
        name: name.trim(),
        password: password,
        phone: phone.trim()
      })
    });

    if (!response.ok) {
      let errorMsg = 'Registration failed.';
      try {
        const errData = await response.json();
        if (errData && errData.message) errorMsg = errData.message;
        else if (errData && errData.error) errorMsg = errData.error;
      } catch (e) {}
      return { success: false, message: errorMsg };
    }

    const resData = await response.json();
    return { success: true, data: resData.data };
  } catch (error) {
    console.error('Registration error:', error);
    return { success: false, message: 'Server connection failed. Please try again.' };
  }
};
