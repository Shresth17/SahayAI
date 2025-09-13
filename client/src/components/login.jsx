import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from 'react-toastify';
import { setCookie } from '../utilities/cookie';

export default function LoginForm() {
  const [securityCode, setSecurityCode] = useState("");
  const navigate = useNavigate();
  const [status, setStatus] = useState(null);
  const backendUri = import.meta.env.VITE_BACKEND_URI;
  async function handleLogin() {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    
    try {
      const response = await fetch(`${backendUri}/user/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
        credentials: "include",
      });
      
      if (response.status === 200) {
        const data = await response.json();
        
        // Primary: Backend sets the cookie automatically with credentials: "include"
        // Fallback: Set cookie on frontend as well to ensure it's available
        if (data.token) {
          setCookie('token', data.token, {
            path: '/',
            maxAge: 2 * 60 * 60, // 2 hours in seconds
            secure: window.location.protocol === 'https:', // Secure in production
            sameSite: 'None' // Required for cross-origin requests
          });
        }
        
        localStorage.setItem("showLoginToast", "true");
        navigate("/homepage");
      } else if (response.status === 404) {
        setStatus("User not found");
      } else {
        const errorData = await response.json().catch(() => ({}));
        setStatus(errorData.message || "Login failed. Please try again.");
      }
    } catch (error) {
      console.error("Login error:", error);
      setStatus("Network error. Please check your connection and try again.");
    }
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100   bg-fill bg-center relative"
    style={{ backgroundImage: "url('/images/login-bg.jpg')" }}
>
      <div className="bg-white p-8 rounded-2xl shadow-xl w-96">
        {/* Title */}
        <h2 className="text-2xl font-bold text-center text-gray-800">User Login</h2>
        <p className="text-gray-500 text-center mt-1">
          Welcome back! Please enter your credentials.
        </p>

        {/* Username/Email/Mobile Input */}
        <div className="mt-6">
          <label className="text-sm font-semibold text-gray-600">Email / Mobile No</label>
          <div className="flex items-center border rounded-lg p-2 mt-1 bg-gray-100 focus-within:ring-2 focus-within:ring-indigo-400">
            <input
              type="text"
              id="email"
              name="email"
              placeholder="Enter your details"
              className="w-full bg-transparent outline-none"
            />
          </div>
        </div>

        {/* Password Input */}
        <div className="mt-4">
          <label className="text-sm font-semibold text-gray-600">Password</label>
          <div className="flex items-center border rounded-lg p-2 mt-1 bg-gray-100 focus-within:ring-2 focus-within:ring-indigo-400">
            <input
              type="password"
              id="password"
              name="password"
              placeholder="Enter your password"
              className="w-full bg-transparent outline-none"
            />
          </div>
        </div>

        {/* Status Message */}
        {status && <p className="text-red-600 text-sm mt-2 text-center">{status}</p>}

        {/* Login Button */}
        <button
          className="w-full bg-gradient-to-r from-[#ffb703] to-[#fb8500] text-white py-3 rounded-full font-semibold shadow-md mt-6 hover:shadow-lg transition-all duration-300"
          onClick={handleLogin}
        >
          Login ➜
        </button>
        <ToastContainer />

        {/* Links */}
        <div className="text-center mt-4 text-sm text-gray-600">
          <a href="#" className="hover:text-indigo-700 transition">Forgot Password</a> | 
          <a href="#" className="hover:text-indigo-700 ml-2 transition">Forgot Username</a>
          <br />
          <a href="/signup" className="hover:text-indigo-700 font-medium transition">
            Click here to Sign Up
          </a>
        </div>
      </div>
    </div>
  );
}
