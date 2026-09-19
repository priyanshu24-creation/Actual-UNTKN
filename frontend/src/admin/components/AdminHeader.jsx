import { Menu, Bell } from "lucide-react";
import logo from "../../assets/images/logo.png";

function AdminHeader({ openSidebar }) {
  return (
    <header className="admin-header">

      {/* Mobile Menu */}
      <button
        type="button"
        className="admin-menu-button"
        onClick={openSidebar}
        aria-label="Open admin menu"
      >
        <Menu
          size={22}
          strokeWidth={1.5}
        />
      </button>

      {/* Header Title */}
      <div className="admin-header-title">
        <span>UNTKN</span>
        <span>/ ADMIN</span>
      </div>

      {/* Right Side */}
      <div className="admin-header-actions">

        {/* Notification */}
        <button
          type="button"
          className="admin-header-button"
          aria-label="Notifications"
        >
          <Bell
            size={18}
            strokeWidth={1.5}
          />
        </button>

        {/* UNTKN Logo instead of User Circle */}
        <div className="admin-user">

          <div className="admin-user-logo">
            <img
              src={logo}
              alt="UNTKN"
            />
          </div>

          <div className="admin-user-info">
            <span className="admin-user-name">
              Admin
            </span>

            <span className="admin-user-role">
              Administrator
            </span>
          </div>

        </div>

      </div>
    </header>
  );
}

export default AdminHeader;