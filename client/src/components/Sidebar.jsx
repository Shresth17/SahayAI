import { Link, useNavigate } from "react-router-dom";
import { deleteCookie } from "../utilities/cookie";

export default function Sidebar() {
  const navigate = useNavigate();
  const backendUri = import.meta.env.VITE_BACKEND_URI;

  function logout(){
    console.log("Logging out");
    // Call backend logout endpoint first
    fetch(`${backendUri}/user/logout`, {
      method: "GET",
      credentials: "include",
    })
      .then(() => {
        // Clear the cookie on frontend
        deleteCookie('token');
        localStorage.setItem("showLoginToast", "true");
        // Navigate to landing page
        navigate('/');
      })
      .catch(err => {
        console.error("Logout error", err);
        // Even if backend fails, clear frontend cookie and redirect
        deleteCookie('token');
        navigate('/');
      });
  }

  return (
    <div className="w-64 p-5 rounded-2xl bg-gradient-to-b from-blue-900 to-blue-600 shadow-xl backdrop-blur-md text-white flex flex-col">
      {/* Sidebar Header (Optional) */}
      {/* 
        If you want a logo or heading at the top, place it here 
        and use `flex-none` or `mb-4`.
      */}

      {/* Menu Items */}
      <ul className="space-y-3 overflow-y-auto flex-grow">
        <SidebarItem
          icon="📺"
          text={<Link to="/" className="no-underline text-inherit">Appeal Dashboard</Link>}
          badge="NEW"
        />
        <SidebarItem
          icon="➕"
          text={<Link to="/newGrievanceOrganisation" className="no-underline text-inherit">Lodge Public Grievance</Link>}
        />
        <SidebarItem icon="➕" text="Lodge Pension Grievance" />
        <SidebarItem icon="➕" text="Check Status" />
        <SidebarItem icon="🔄" text="Account Activity" />
        <SidebarItem
          icon="✏️"
          text={<Link to="/profile" className="no-underline text-inherit">Edit Profile</Link>}
        />
        <SidebarItem
          icon="🔒"
          text={<Link to="/change-password" className="no-underline text-inherit">Change Password</Link>}
        />
        <SidebarItem
          icon="🔌"
          text="Sign out"
          special
          onClick={logout}
        />
      </ul>
    </div>
  );
}

function SidebarItem({ icon, text, badge, special, onClick }) {
  return (
    <li
      className={`flex justify-between items-center p-3 rounded-xl cursor-pointer transition-all duration-200 transform hover:scale-105 hover:shadow-md ${
        special ? "bg-red-600 hover:bg-red-700 text-white" : "bg-white/20 hover:bg-white/30 text-white"
      }`}
      onClick={onClick}
    >
      <div className="flex items-center space-x-3">
        <span className="text-md">{icon}</span>
        <span className="text-sm font-small">{text}</span>
      </div>
      {badge && (
        <span className="ml-2 px-2 py-1 text-xs font-bold bg-red-100 text-red-600 rounded-full">
          {badge}
        </span>
      )}
    </li>
  );
}
