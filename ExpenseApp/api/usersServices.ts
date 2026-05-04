import api from "./index";

export const registerUser = async (
  username: string,
  email: string,
  password: string,
) => {
  try {
    const response = await api("/users/register", {
      method: "POST",
      body: JSON.stringify({ username, email, password }),
    });
    return response;
  } catch (error) {
    throw error;
  }
};

export const loginUser = async (email: string, password: string) => {
  try {
    const response = await api("/users/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    return response;
  } catch (error) {
    throw error;
  }
};
