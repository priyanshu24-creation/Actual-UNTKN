import { Menu, Bell, User } from "lucide-react";

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

        <div className="admin-user">

          <div className="admin-user-icon">
            <User
              size={17}
              strokeWidth={1.5}
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