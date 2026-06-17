// Cookie helper functions

export const setCookie = (name, value, days = 7) => {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax; Secure`;
};

export const getRawCookie = (name) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    let val = parts.pop().split(';').shift();
    try {
      return decodeURIComponent(val);
    } catch {
      return val;
    }
  }
  return null;
};

export const getCookie = (name) => {
  // Ưu tiên cookie không HttpOnly
  let val = getRawCookie('accessToken_frontend');
  if (val) return val;

  val = getRawCookie('accessToken');
  if (val) return val;

  return null;
};

export const deleteCookie = (name) => {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax`;
};
