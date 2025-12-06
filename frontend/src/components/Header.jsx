import { useState, useEffect } from "react";
import { TextSearch } from 'lucide-react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import SearchSidebar from "./SearchSidebar";
import { supabase } from '../client';

export default function Header() {
  const { user, setUser } = useUser();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  /// Scroll effect for header
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 8);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  /// Logout handler
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      navigate("/auth");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  return (
    <>
      <header
        id="header"
        className={`fixed top-0 left-0 right-0 z-50 transition-[width,margin,padding,transform,background-color,border-radius] duration-700 ease-in-out ${isScrolled
          ? "w-[92%] bg-[#05000c] text-gray-100 mt-6 px-10 py-6 shadow-[0px_2px_18px_4px_rgba(255,255,255,0.48)] rounded-2xl border-3 border-white/30 mx-auto"
          : "w-full backdrop-blur-sm text-gray-900 py-8 px-20 bg-transparent"
        }`}
      >
        <div className="flex justify-between items-center">
          {/* Logo */}
          <NavLink to='/' className="text-4xl font-bold text-gray-700 dark:text-white cursor-pointer flex items-center gap-2">
            <img src="/sceneit.png" width={35} alt="SceneIt" />
            <span className='hidden lg:inline'>SceneIt</span>
          </NavLink>

          {/* Navigation */}
          <nav className={`${isScrolled ? "text-gray-200" : "text-gray-700"}`}>
            <ul className="flex space-x-8 items-center text-gray-700 dark:text-gray-300 transition-all duration-200">
              
              {/* Browse link */}
              <NavLink to='/search' className='font-semibold text-lg cursor-pointer hover:underline'>
                <li>Browse</li>
              </NavLink>

              {/* Conditional login/profile/logout */}
              {!user ? (
                <NavLink to='/auth' className='font-semibold text-lg cursor-pointer hover:underline'>
                  <li>Login</li>
                </NavLink>
              ) : (
                <>
                  {/* Profile link */}
                  <NavLink to='/profile' className='font-semibold text-lg cursor-pointer hover:underline'>
                    <li>Profile</li>
                  </NavLink>

                  {/* Username display */}
                  <NavLink to={`/profile`} className='font-semibold text-lg cursor-pointer hover:underline'>
                    <li>@{user.username}</li>
                  </NavLink>

                  {/* Logout button */}
                  <li>
                    <button
                      onClick={handleLogout}
                      className="bg-red-600 px-4 py-2 rounded text-white font-semibold hover:bg-red-700 transition-colors duration-300"
                    >
                      Logout
                    </button>
                  </li>
                </>
              )}

              {/* Search icon */}
              <li>
                <TextSearch
                  onClick={() => setIsSidebarOpen(true)}
                  size={24}
                  className='cursor-pointer hover:scale-[1.15] transition-all duration-300 hover:text-green-400'
                />
              </li>
            </ul>
          </nav>
        </div>
      </header>

      {/* Search sidebar */}
      <SearchSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
    </>
  );
}

