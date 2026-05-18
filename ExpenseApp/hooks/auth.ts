import { authFetch } from "@/api";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React from "react";

export const saveToken = async (token: string) => {
  try {
    await SecureStore.setItemAsync("authToken", token);
  } catch (error) {
    console.error("Error saving token:", error);
  }
};

export const saveUserData = async (userData: any) => {
  try {
    await SecureStore.setItemAsync("userData", JSON.stringify(userData));
  } catch (error) {
    console.error("Error saving user data:", error);
  }
};

export const deleteUserData = async () => {
  try {
    await SecureStore.deleteItemAsync("userData");
  } catch (error) {
    console.error("Error deleting user data:", error);
  }
};

export const saveRefreshToken = async (token: string) => {
  try {
    await SecureStore.setItemAsync("refreshToken", token);
  } catch (error) {
    console.error("Error saving refresh token:", error);
  }
};

export const getRefreshToken = async (): Promise<string | null> => {
  try {
    const token = await SecureStore.getItemAsync("refreshToken");
    return token;
  } catch (error) {
    console.error("Error retrieving refresh token:", error);
    return null;
  }
};

export const getToken = async (): Promise<string | null> => {
  try {
    const token = await SecureStore.getItemAsync("authToken");
    return token;
  } catch (error) {
    console.error("Error retrieving token:", error);
    return null;
  }
};

export const deleteToken = async () => {
  try {
    await SecureStore.deleteItemAsync("authToken");
  } catch (error) {
    console.error("Error deleting token:", error);
  }
};

export const deleteRefreshToken = async () => {
  try {
    await SecureStore.deleteItemAsync("refreshToken");
  } catch (error) {
    console.error("Error deleting refresh token:", error);
  }
};

export const useToken = () => {
  const [token, setToken] = React.useState<string | null>(null);

  React.useEffect(() => {
    getToken().then(setToken);
  }, []);

  return token;
};

export const isTokenExpired = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
};

export const useAuthFetch = () => {
  const router = useRouter();

  return async (endpoint: string, options: RequestInit = {}) => {
    try {
      return await authFetch(endpoint, options);
    } catch (error: any) {
      if (error.message === "SESSION_EXPIRED") {
        router.replace("/landing");
        return;
      }
      throw error;
    }
  };
};
