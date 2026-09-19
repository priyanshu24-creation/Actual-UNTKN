import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import api from "../../services/api";

const AdminAuthContext = createContext(null);

function AdminAuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // =========================================
  // CHECK BACKEND SESSION
  // =========================================

  const checkAuth = async () => {
    try {
      const response = await api.get("/auth/me");

      const user = response.data?.user;

      if (user?.role === "admin") {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
    } catch (error) {
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  // =========================================
  // ADMIN LOGIN
  // =========================================

  const login = async (email, password) => {
    try {
      const response = await api.post("/auth/login", {
        email: email.trim().toLowerCase(),
        password,
      });

      const user = response.data?.user;

      if (!user) {
        return {
          success: false,
          message: "Invalid login response.",
        };
      }

      if (user.role !== "admin") {
        return {
          success: false,
          message: "Admin access required.",
        };
      }

      setIsAuthenticated(true);

      return {
        success: true,
        user,
      };
    } catch (error) {
      console.error("ADMIN LOGIN ERROR:", error);

      return {
        success: false,
        message:
          error.response?.data?.message ||
          "Invalid email or password.",
      };
    }
  };

  // =========================================
  // ADMIN LOGOUT
  // =========================================

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (error) {
      console.error("ADMIN LOGOUT ERROR:", error);
    } finally {
      setIsAuthenticated(false);
    }
  };

  return (
    <AdminAuthContext.Provider
      value={{
        isAuthenticated,
        loading,
        login,
        logout,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);

  if (!context) {
    throw new Error(
      "useAdminAuth must be used inside AdminAuthProvider"
    );
  }

  return context;
}

export default AdminAuthProvider;