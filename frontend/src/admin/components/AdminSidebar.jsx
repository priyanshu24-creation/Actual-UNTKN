import { NavLink, useNavigate } from "react-router-dom";

import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Users,
  Layers,
  Heart,
  Mail,
  Info,
  BookOpen,
  MessageSquare,
  Settings,
  LogOut,
  X,
} from "lucide-react";

import { useAdminAuth } from "../context/AdminAuthContext";

function AdminSidebar({ sidebarOpen, closeSidebar }) {
  const navigate = useNavigate();

  const { logout } = useAdminAuth();

  const navigation = [
    {
      label: "Dashboard",
      path: "/admin",
      icon: LayoutDashboard,
    },
    {
      label: "Products",
      path: "/admin/products",
      icon: Package,
    },
    {
      label: "Orders",
      path: "/admin/orders",
      icon: ShoppingBag,
    },
    {
      label: "Customers",
      path: "/admin/customers",
      icon: Users,
    },
    {
      label: "Collections",
      path: "/admin/collections",
      icon: Layers,
    },
    {
  label: "Lookbook",
  path: "/admin/lookbook",
  icon: BookOpen,
},
    {
      label: "Wishlist",
      path: "/admin/wishlist",
      icon: Heart,
    },
    {
      label: "Newsletter",
      path: "/admin/newsletter",
      icon: Mail,
    },
    {
      label: "Inquiries",
      path: "/admin/inquiries",
      icon: MessageSquare,
    },

    {
  label: "About",
  path: "/admin/about",
  icon: Info,
},

    {
      label: "Settings",
      path: "/admin/settings",
      icon: Settings,
    },
  ];

  const handleLogout = () => {
    logout();

    closeSidebar();

    navigate("/admin/login", {
      replace: true,
    });
  };

  return (
    <>
      {/* =====================================================
          MOBILE OVERLAY
      ===================================================== */}

      {sidebarOpen && (
        <div
          className="admin-sidebar-overlay"
          onClick={closeSidebar}
        />
      )}

      <aside
        className={
          sidebarOpen
            ? "admin-sidebar open"
            : "admin-sidebar"
        }
      >

        {/* ===================================================
            LOGO
        =================================================== */}

        <div className="admin-sidebar-top">

          <div className="admin-brand">

            <span className="admin-brand-name">
              UNTKN
            </span>

            <span className="admin-brand-label">
              ADMIN
            </span>

          </div>

          <button
            type="button"
            className="admin-sidebar-close"
            onClick={closeSidebar}
            aria-label="Close admin menu"
          >
            <X
              size={20}
              strokeWidth={1.5}
            />
          </button>

        </div>


        {/* ===================================================
            NAVIGATION
        =================================================== */}

        <nav className="admin-navigation">

          <p className="admin-navigation-label">
            MANAGEMENT
          </p>

          {navigation.map((item) => {

            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === "/admin"}
                onClick={closeSidebar}
                className={({ isActive }) =>
                  isActive
                    ? "admin-nav-item active"
                    : "admin-nav-item"
                }
              >

                <Icon
                  size={17}
                  strokeWidth={1.5}
                />

                <span>
                  {item.label}
                </span>

              </NavLink>
            );

          })}

        </nav>


        {/* ===================================================
            BOTTOM
        =================================================== */}

        <div className="admin-sidebar-bottom">

          <button
            type="button"
            className="admin-signout"
            onClick={handleLogout}
          >

            <LogOut
              size={17}
              strokeWidth={1.5}
            />

            <span>
              SIGN OUT
            </span>

          </button>

          <p className="admin-version">
            UNTKN ADMIN · v1.0
          </p>

        </div>

      </aside>
    </>
  );
}

export default AdminSidebar;