import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

import Home from "./pages/Home";
import Shop from "./pages/Shop";
import Collections from "./pages/Collections";
import ProductDetails from "./pages/ProductDetails";
import Cart from "./pages/Cart";
import Wishlist from "./pages/Wishlist";
import Search from "./pages/Search";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Account from "./pages/Account";
import Orders from "./pages/Orders";
import OrderDetails from "./pages/OrderDetails";
import Checkout from "./pages/Checkout";
import Payment from "./pages/Payment";
import OrderSuccess from "./pages/OrderSuccess";
import About from "./pages/About";
import Lookbook from "./pages/Lookbook";
import Contact from "./pages/Contact";
import NotFound from "./pages/NotFound";
import ContactButton from "./components/ContactButton";
import ScrollToTop from "./components/ScrollToTop";

// ADMIN IMPORTS
import AdminLayout from "./admin/layouts/AdminLayout";
import AdminDashboard from "./admin/pages/AdminDashboard";
import AdminProducts from "./admin/pages/AdminProducts";
import AdminAddProduct from "./admin/pages/AdminAddProduct";
import AdminEditProduct from "./admin/pages/AdminEditProduct";
import AdminOrders from "./admin/pages/AdminOrders";
import AdminOrderDetails from "./admin/pages/AdminOrderDetails";
import AdminCustomers from "./admin/pages/AdminCustomers";
import AdminCustomerDetails from "./admin/pages/AdminCustomerDetails";
import AdminCollections from "./admin/pages/AdminCollections";
import AdminWishlist from "./admin/pages/AdminWishlist";
import AdminNewsletter from "./admin/pages/AdminNewsletter";
import AdminInquiries from "./admin/pages/AdminInquiries";
import AdminInquiryDetails from "./admin/pages/AdminInquiryDetails";
import AdminSettings from "./admin/pages/AdminSettings";
import AdminLogin from "./admin/pages/AdminLogin";
import ProtectedAdminRoute from "./admin/components/ProtectedAdminRoute";

function AppContent() {
  const location = useLocation();

  // Check whether the current page is inside admin
  const isAdminPage = location.pathname.startsWith("/admin");

  return (
    <>
      {/* Customer Navbar */}
      {!isAdminPage && <Navbar />}

      <main>
        <Routes>

          {/* =========================
              CUSTOMER ROUTES
          ========================= */}

          <Route
            path="/"
            element={<Home />}
          />

          <Route
            path="/shop"
            element={<Shop />}
          />

          <Route
            path="/collections"
            element={<Collections />}
          />

          <Route
            path="/product/:id"
            element={<ProductDetails />}
          />

          <Route
            path="/cart"
            element={<Cart />}
          />

          <Route
            path="/wishlist"
            element={<Wishlist />}
          />

          <Route
            path="/search"
            element={<Search />}
          />

          <Route
            path="/login"
            element={<Login />}
          />

          <Route
            path="/register"
            element={<Register />}
          />

          <Route
            path="/account"
            element={<Account />}
          />

          <Route
            path="/orders"
            element={<Orders />}
          />

          <Route
            path="/orders/:id"
            element={<OrderDetails />}
          />

          <Route
            path="/checkout"
            element={<Checkout />}
          />

          <Route
            path="/payment"
            element={<Payment />}
          />

          <Route
            path="/order-success"
            element={<OrderSuccess />}
          />

          <Route
            path="/about"
            element={<About />}
          />

          <Route
            path="/lookbook"
            element={<Lookbook />}
          />

          <Route
            path="/contact"
            element={<Contact />}
          />


          {/* =========================
              ADMIN ROUTES
          ========================= */}

   {/* ADMIN LOGIN */}

<Route
  path="/admin/login"
  element={<AdminLogin />}
/>

{/* PROTECTED ADMIN */}

<Route
  path="/admin"
  element={<ProtectedAdminRoute />}
>
  <Route element={<AdminLayout />}>
    <Route
      index
      element={<AdminDashboard />}
    />

    <Route
      path="products"
      element={<AdminProducts />}
    />

    <Route
      path="products/add"
      element={<AdminAddProduct />}
    />

    <Route
      path="products/edit/:id"
      element={<AdminEditProduct />}
    />

    <Route
      path="orders"
      element={<AdminOrders />}
    />

    <Route
      path="orders/:id"
      element={<AdminOrderDetails />}
    />

    <Route
      path="customers"
      element={<AdminCustomers />}
    />

    <Route
      path="customers/:id"
      element={<AdminCustomerDetails />}
    />

    <Route
      path="collections"
      element={<AdminCollections />}
    />

    <Route
      path="wishlist"
      element={<AdminWishlist />}
    />

    <Route
      path="newsletter"
      element={<AdminNewsletter />}
    />

    <Route
      path="inquiries"
      element={<AdminInquiries />}
    />

    <Route
      path="inquiries/:id"
      element={<AdminInquiryDetails />}
    />

    <Route
      path="settings"
      element={<AdminSettings />}
    />
  </Route>
</Route>
          {/* =========================
              404
          ========================= */}

          <Route
            path="*"
            element={<NotFound />}
          />

        </Routes>
      </main>

      {/* Customer Footer */}
      {!isAdminPage && <Footer />}
      
      <ContactButton />

      {/* Customer Scroll Button */}
      {!isAdminPage && <ScrollToTop />}
    </>
  );
}


function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;