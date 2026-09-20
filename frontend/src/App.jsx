import {
  BrowserRouter,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";

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
import IntroAnimation from "./components/IntroAnimation";

// =========================================================
// ADMIN IMPORTS
// =========================================================

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

// DELIVERY SETTINGS
import AdminDeliverySettings from "./admin/pages/AdminDeliverySettings";

import AdminLogin from "./admin/pages/AdminLogin";
import ProtectedAdminRoute from "./admin/components/ProtectedAdminRoute";

import AdminLookbook from "./admin/pages/AdminLookbook";
import AdminAbout from "./admin/pages/AdminAbout";

// =========================================================
// APP CONTENT
// =========================================================

function AppContent() {
  const location = useLocation();

  // Check whether the current page is an admin page
  const isAdminPage =
    location.pathname.startsWith("/admin");

  return (
    <>
      {/* =====================================================
          INTRO ANIMATION
      ===================================================== */}

      <IntroAnimation />

      {/* =====================================================
          CUSTOMER NAVBAR
          Hidden inside Admin Panel
      ===================================================== */}

      {!isAdminPage && <Navbar />}

      {/* =====================================================
          MAIN
      ===================================================== */}

      <main>
        <Routes>

          {/* ===================================================
              CUSTOMER ROUTES
          =================================================== */}

          {/* HOME */}
          <Route
            path="/"
            element={<Home />}
          />

          {/* SHOP */}
          <Route
            path="/shop"
            element={<Shop />}
          />

          {/* COLLECTIONS */}
          <Route
            path="/collections"
            element={<Collections />}
          />

          {/* PRODUCT DETAILS */}
          <Route
            path="/product/:id"
            element={<ProductDetails />}
          />

          {/* CART */}
          <Route
            path="/cart"
            element={<Cart />}
          />

          {/* WISHLIST */}
          <Route
            path="/wishlist"
            element={<Wishlist />}
          />

          {/* SEARCH */}
          <Route
            path="/search"
            element={<Search />}
          />

          {/* LOGIN */}
          <Route
            path="/login"
            element={<Login />}
          />

          {/* REGISTER */}
          <Route
            path="/register"
            element={<Register />}
          />

          {/* ACCOUNT */}
          <Route
            path="/account"
            element={<Account />}
          />

          {/* ORDERS */}
          <Route
            path="/orders"
            element={<Orders />}
          />

          {/* ORDER DETAILS */}
          <Route
            path="/orders/:id"
            element={<OrderDetails />}
          />

          {/* ACCOUNT ORDER DETAILS
              Required for URLs like:
              /account/orders/10
          */}
          <Route
            path="/account/orders/:id"
            element={<OrderDetails />}
          />

          {/* CHECKOUT */}
          <Route
            path="/checkout"
            element={<Checkout />}
          />

          {/* PAYMENT */}
          <Route
            path="/payment"
            element={<Payment />}
          />

          {/* ORDER SUCCESS */}
          <Route
            path="/order-success"
            element={<OrderSuccess />}
          />

          {/* ABOUT */}
          <Route
            path="/about"
            element={<About />}
          />

          {/* LOOKBOOK */}
          <Route
            path="/lookbook"
            element={<Lookbook />}
          />

          {/* CONTACT */}
          <Route
            path="/contact"
            element={<Contact />}
          />

          {/* ===================================================
              ADMIN LOGIN
          =================================================== */}

          <Route
            path="/admin/login"
            element={<AdminLogin />}
          />

          {/* ===================================================
              PROTECTED ADMIN ROUTES
          =================================================== */}

          <Route
            path="/admin"
            element={<ProtectedAdminRoute />}
          >
            {/* ADMIN LAYOUT */}
            <Route element={<AdminLayout />}>

              {/* =============================================
                  ADMIN DASHBOARD
              ============================================= */}

              <Route
                index
                element={<AdminDashboard />}
              />

              {/* =============================================
                  PRODUCTS
              ============================================= */}

              <Route
                path="products"
                element={<AdminProducts />}
              />

              {/* ADD PRODUCT */}
              <Route
                path="products/add"
                element={<AdminAddProduct />}
              />

              {/* EDIT PRODUCT */}
              <Route
                path="products/edit/:id"
                element={<AdminEditProduct />}
              />

              {/* =============================================
                  ORDERS
              ============================================= */}

              <Route
                path="orders"
                element={<AdminOrders />}
              />

              {/* ORDER DETAILS */}
              <Route
                path="orders/:id"
                element={<AdminOrderDetails />}
              />

              {/* =============================================
                  LOOKBOOK
              ============================================= */}

              <Route
                path="lookbook"
                element={<AdminLookbook />}
              />

              {/* =============================================
                  DELIVERY SETTINGS
              ============================================= */}

              <Route
                path="delivery-settings"
                element={<AdminDeliverySettings />}
              />

              {/* =============================================
                  CUSTOMERS
              ============================================= */}

              <Route
                path="customers"
                element={<AdminCustomers />}
              />

              {/* CUSTOMER DETAILS */}
              <Route
                path="customers/:id"
                element={<AdminCustomerDetails />}
              />

              {/* =============================================
                  COLLECTIONS
              ============================================= */}

              <Route
                path="collections"
                element={<AdminCollections />}
              />

              {/* =============================================
                  WISHLIST
              ============================================= */}

              <Route
                path="wishlist"
                element={<AdminWishlist />}
              />

              {/* =============================================
                  NEWSLETTER
              ============================================= */}

              <Route
                path="newsletter"
                element={<AdminNewsletter />}
              />

              {/* =============================================
                  INQUIRIES
              ============================================= */}

              <Route
                path="inquiries"
                element={<AdminInquiries />}
              />

              {/* ABOUT */}
              <Route
                path="about"
                element={<AdminAbout />}
              />

              {/* INQUIRY DETAILS */}
              <Route
                path="inquiries/:id"
                element={<AdminInquiryDetails />}
              />

              {/* =============================================
                  ADMIN SETTINGS
              ============================================= */}

              <Route
                path="settings"
                element={<AdminSettings />}
              />

            </Route>
          </Route>

          {/* ===================================================
              404
          =================================================== */}

          <Route
            path="*"
            element={<NotFound />}
          />

        </Routes>
      </main>

      {/* =====================================================
          CUSTOMER FOOTER
          Hidden inside Admin Panel
      ===================================================== */}

      {!isAdminPage && <Footer />}

      {/* =====================================================
          CONTACT BUTTON
      ===================================================== */}

      <ContactButton />

      {/* =====================================================
          SCROLL TO TOP
          Hidden inside Admin Panel
      ===================================================== */}

      {!isAdminPage && <ScrollToTop />}
    </>
  );
}

// =========================================================
// APP
// =========================================================

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;