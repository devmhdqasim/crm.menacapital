export const getAccessToken = () => localStorage.getItem('authToken');
export const getRefreshToken = () => localStorage.getItem('refreshToken');

export const setTokens = (access, refresh) => {
  localStorage.setItem('authToken', access);
  localStorage.setItem('refreshToken', refresh);
};

export const clearTokens = () => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('refreshToken');
};
