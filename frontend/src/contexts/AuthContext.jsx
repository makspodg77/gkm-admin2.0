import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import PropTypes from "prop-types";
import { API_BASE_URL } from "../services/config";

const AuthContext = createContext(null);

const getTokenExpiration = (token) => {
  if (!token) return null;

  try {
    const payload = token.split(".")[1];
    const decodedPayload = JSON.parse(atob(payload));
    return decodedPayload.exp * 1000;
  } catch (error) {
    console.error("Error parsing token:", error);
    return null;
  }
};

const isTokenExpiring = (token) => {
  const expiration = getTokenExpiration(token);
  if (!expiration) return true;

  return Date.now() > expiration - 300000;
};

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [user, setUser] = useState(JSON.parse(localStorage.getItem("user")));
  const [isLoading, setIsLoading] = useState(true);

  const login = useCallback((newToken, userData) => {
    setToken(newToken);
    setUser(userData);
    localStorage.setItem("token", newToken);
    localStorage.setItem("user", JSON.stringify(userData));
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  }, []);

  const refreshToken = useCallback(async () => {
    try {
      setIsLoading(true);

      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          refreshToken: localStorage.getItem("refreshToken"),
        }),
      });

      if (!response.ok) {
        logout();
        return false;
      }

      const data = await response.json();

      login(data.token, data.user);
      localStorage.setItem("refreshToken", data.refreshToken);

      return true;
    } catch (error) {
      console.error("Error refreshing token:", error);
      logout();
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [login, logout]);

  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setIsLoading(false);
        return;
      }

      if (isTokenExpiring(token)) {
        const success = await refreshToken();
        if (!success) {
          setIsLoading(false);
          return;
        }
      }

      setIsLoading(false);
    };

    verifyToken();

    const tokenCheckInterval = setInterval(() => {
      if (token && isTokenExpiring(token)) {
        refreshToken();
      }
    }, 240000);

    return () => clearInterval(tokenCheckInterval);
  }, [token, refreshToken]);

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        login,
        logout,
        refreshToken,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
