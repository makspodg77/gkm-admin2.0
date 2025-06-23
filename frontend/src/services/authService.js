import { ROUTES } from "./config";

export const fetchWithAuth = async (url, options = {}) => {
  const token = localStorage.getItem("token");
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.ok) {
    return response;
  }

  if (response.status === 401) {
    const data = await response.json().catch(() => ({}));

    if (data.tokenExpired && !options._retry) {
      try {
        const refreshResponse = await fetch(ROUTES.AUTH.REFRESH, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            refreshToken: localStorage.getItem("refreshToken"),
          }),
        });

        if (!refreshResponse.ok) {
          logout();
          return Promise.reject(
            new Error("Session expired. Please log in again.")
          );
        }

        const refreshData = await refreshResponse.json();

        localStorage.setItem("token", refreshData.token);
        localStorage.setItem("refreshToken", refreshData.refreshToken);

        return fetchWithAuth(url, {
          ...options,
          _retry: true,
        });
      } catch (error) {
        logout();
        return Promise.reject(error);
      }
    }
  }

  const error = new Error(response.statusText || "Request failed");
  error.response = response;
  return Promise.reject(error);
};

export const logout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  localStorage.removeItem("refreshToken");
  window.location.href = "/login";
};

export const login = async (username, password) => {
  try {
    const response = await fetch(ROUTES.AUTH.LOGIN, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Login failed");
    }

    const data = await response.json();

    localStorage.setItem("token", data.token);
    localStorage.setItem("refreshToken", data.refreshToken);
    localStorage.setItem("user", JSON.stringify(data.user));

    return data;
  } catch (error) {
    console.error("Login error:", error);
    throw error;
  }
};

export const fetchData = async (url, options = {}) => {
  try {
    const response = await fetchWithAuth(url, options);
    return await response.json();
  } catch (error) {
    console.error("API request failed:", error);
    throw error;
  }
};
