import {
  deleteRefreshToken,
  deleteToken,
  getRefreshToken,
  getToken,
  saveToken,
} from "@/hooks/auth";

const apiClient = async (endpoint: string, options: RequestInit = {}) => {
  const baseUrl = process.env.EXPO_PUBLIC_API_URL; // Cambia esto a tu URL base
  const url = `${baseUrl}${endpoint}`;
  try {
    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
      },
      ...options,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "API request failed");
    }
    return await response.json();
  } catch (error) {
    throw error;
  }
};

export const authFetch = async (
  endpoint: string,
  options: RequestInit = {},
) => {
  let token = await getToken();
  const refreshToken = await getRefreshToken();
  const isExpired = token
    ? JSON.parse(atob(token.split(".")[1])).exp * 1000 < Date.now()
    : true;
  const isRefreshExpired = refreshToken
    ? JSON.parse(atob(refreshToken.split(".")[1])).exp * 1000 < Date.now()
    : true;

  if (isRefreshExpired) {
    await deleteToken();
    await deleteRefreshToken(); // limpiar storage
    throw new Error("SESSION_EXPIRED"); // código que puedas identificar
  }

  if (!token || isExpired) {
    try {
      const newToken = await apiClient(`/auth/refresh`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refreshToken }),
      });
      token = newToken.token;
      if (token) {
        saveToken(token);
      }
    } catch (error) {
      throw new Error("Failed to refresh token: " + error.message);
    }
  }
  return apiClient(endpoint, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
    },
  });
};

export default apiClient;
