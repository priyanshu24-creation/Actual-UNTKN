import React from "react";
import ReactDOM from "react-dom/client";

import App from "./App";

import "./index.css";
import "./admin/admin.css";

import { CartProvider } from "./context/CartContext";
import { WishlistProvider } from "./context/WishlistContext";
import AdminAuthProvider from "./admin/context/AdminAuthContext";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AdminAuthProvider>
      <CartProvider>
        <WishlistProvider>
          <App />
        </WishlistProvider>
      </CartProvider>
    </AdminAuthProvider>
  </React.StrictMode>
);