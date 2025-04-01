import { ACCESS_TOKEN, REFRESH_TOKEN } from "../../constants";

const refreshToken = async () => {
  const refresh = localStorage.getItem(REFRESH_TOKEN || "refresh_token");
  if (!refresh) {
    throw new Error("No refresh token available");
  }

  const response = await fetch("http://localhost:8000/auth/token/refresh/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ refresh }),
  });

  if (!response.ok) {
    throw new Error("Failed to refresh token");
  }

  const data = await response.json();
  localStorage.setItem(ACCESS_TOKEN || "access_token", data.access);
  return data.access;
};

const fetchWithAuth = async (url, options = {}) => {
  let accessToken = localStorage.getItem(ACCESS_TOKEN || "access_token");

  const config = {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${accessToken}`,
    },
  };

  let response = await fetch(url, config);

  if (response.status === 401) {
    try {
      accessToken = await refreshToken();
      config.headers.Authorization = `Bearer ${accessToken}`;
      response = await fetch(url, config);
    } catch (err) {
      console.error("Token refresh failed:", err);
      localStorage.clear();
      window.location.href = "/login";
      return null;
    }
  }

  return response;
};

export default fetchWithAuth;