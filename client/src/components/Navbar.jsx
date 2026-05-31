import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

const Navbar = () => {
  const [active, setActive] = useState("Home");
  const navigate = useNavigate();
  const adminUrl = import.meta.env.VITE_ADMIN_URL || "http://localhost:5174";

  const navItems = [
    { name: "Home", path: "/" },
    { name: "How It Works", path: "/how-it-works" },
    { name: "FAQs", path: "/faqs" },
    { name: "Submit Complaints", path: "/complaints" },
    { name: "Contact", path: "/contact" },
  ];

  return (
    <header className="bg-blue-900 text-white px-8 py-4 flex justify-between items-center shadow-md">
      <Link to={"/"} className="text-2xl font-bold">SahayAI</Link>

      <nav className="relative">
        <ul className="flex space-x-6 relative">
          {navItems.map((item, index) => (
            <li
              key={index}
              className="relative cursor-pointer px-4 py-2 transition group"
              onClick={() => setActive(item.name)}
            >
              {/* Capsule Effect (Stays when active) */}
              <span
                className={`absolute inset-0 bg-white rounded-full transition-all duration-300 ease-in-out 
                  ${
                    active === item.name
                      ? "opacity-100 scale-x-100"
                      : "opacity-0 scale-x-0 group-hover:opacity-100 group-hover:scale-x-100"
                  }`}
              ></span>
              {/* Menu Item Text */}
              <Link to={item.path}>
                <span
                  className={`relative z-10 transition-colors duration-300 ${
                    active === item.name ? "text-blue-900" : "group-hover:text-blue-900"
                  }`}
                >
                  {item.name}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="flex gap-3">
        <button
          className="bg-yellow-400 text-gray-900 font-bold px-5 py-2 rounded-full hover:bg-yellow-300 transition-all duration-200 shadow-md border-2 border-yellow-500 hover:scale-105"
          onClick={() => window.open(`${adminUrl}/login`, "_blank")}
        >
          Admin Login
        </button>
        <button
          className="bg-yellow-400 text-gray-900 font-bold px-5 py-2 rounded-full hover:bg-yellow-300 transition-all duration-200 shadow-md border-2 border-yellow-500 hover:scale-105"
          onClick={() => navigate("/login")}
        >
          User Login
        </button>
      </div>
    </header>
  );
};

export default Navbar;
