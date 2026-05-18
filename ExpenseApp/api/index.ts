import {
  deleteRefreshToken,
  deleteToken,
  getRefreshToken,
  getToken,
  saveToken,
} from "@/hooks/auth";

const apiClient = async (endpoint: string, options: RequestInit = {}) => {
  const baseUrl = process.env.EXPO_PUBLIC_API_URL;
  if (!baseUrl) throw new Error("EXPO_PUBLIC_API_URL no está definida");
  const url = `${baseUrl}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      const err = new Error(
        errorData.error || "API request failed",
      ) as Error & { status: number };
      err.status = response.status;
      throw err;
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
        await saveToken(token);
      }
    } catch (error) {
      throw new Error(
        "Failed to refresh token: " +
          (error instanceof Error ? error.message : String(error)),
      );
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
