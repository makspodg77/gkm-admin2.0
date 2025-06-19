import { ROUTES } from "./config";

// Create a wrapper function for fetch that handles auth
export const fetchWithAuth = async (url, options = {}) => {
  // Add auth header if token exists
  const token = localStorage.getItem("token");
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  // Make the initial request
  const response = await fetch(url, {
    ...options,
    headers,
  });

  // If successful, return the response
  if (response.ok) {
    return response;
  }

  // Handle 401 errors with token expiration
  if (response.status === 401) {
    const data = await response.json().catch(() => ({}));

    // Check if token expired and this isn't a retry
    if (data.tokenExpired && !options._retry) {
      try {
        // Call refresh token endpoint
        const refreshResponse = await fetch(ROUTES.AUTH.REFRESH, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            refreshToken: localStorage.getItem("refreshToken"),
          }),
        });

        if (!refreshResponse.ok) {
          // If refresh fails, logout
          logout();
          return Promise.reject(
            new Error("Session expired. Please log in again.")
          );
        }

        // Get the new tokens
        const refreshData = await refreshResponse.json();

        // Update tokens in storage
        localStorage.setItem("token", refreshData.token);
        localStorage.setItem("refreshToken", refreshData.refreshToken);

        // Retry the original request with new token
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

  // If we get here, the error wasn't a token expiration or refresh failed
  // Convert the response to an error to maintain consistency
  const error = new Error(response.statusText || "Request failed");
  error.response = response;
  return Promise.reject(error);
};

// Helper function for logout
export const logout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  localStorage.removeItem("refreshToken");
  window.location.href = "/login";
};

// Helper function for login
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

    // Save tokens and user data
    localStorage.setItem("token", data.token);
    localStorage.setItem("refreshToken", data.refreshToken);
    localStorage.setItem("user", JSON.stringify(data.user));

    return data;
  } catch (error) {
    console.error("Login error:", error);
    throw error;
  }
};

// Example of how to use fetchWithAuth in your services
export const fetchData = async (url, options = {}) => {
  try {
    const response = await fetchWithAuth(url, options);
    return await response.json();
  } catch (error) {
    console.error("API request failed:", error);
    throw error;
  }
};
