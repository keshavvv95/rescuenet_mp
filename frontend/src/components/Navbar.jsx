import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationCenter from './NotificationCenter';
import { 
  ShieldAlert, LogOut, Menu, X, PlusCircle, List, Radio, Heart, 
  BookOpen, BarChart3, Camera, CheckSquare, Coins, UserCheck, Bell,
  Flame, HandHeart, ScanLine, AlertCircle
} from 'lucide-react';

const Navbar = () => {
  const { token, userRole, userName, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setMobileMenuOpen(false);
  };

  const isActive = (path) => location.pathname === path;

  const roleBadges = {
    citizen: { label: 'Citizen', color: 'bg-orange-500/15 text-orange-300 border-orange-500/30' },
    officer: { label: 'Municipal Officer', color: 'bg-amber-500/20 text-amber-300 border-amber-500/40' },
    ngo_admin: { label: 'NGO Admin', color: 'bg-rose-500/20 text-rose-300 border-rose-500/40' },
    volunteer: { label: 'Volunteer Rescuer', color: 'bg-orange-500/20 text-orange-300 border-orange-500/40' },
    super_admin: { label: 'Super Admin', color: 'bg-purple-500/20 text-purple-300 border-purple-500/40' }
  };

  const currentBadge = roleBadges[userRole] || roleBadges.citizen;

  return (
    <>
      {/* Top Header Bar */}
      <header className="sticky top-0 z-40 bg-[#0F172A] text-white border-b border-slate-800 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Logo & Subtitle */}
            <div className="flex items-center gap-3">
              <Link to="/feed" className="flex items-center space-x-2.5 group">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-500 text-white rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/25 border border-orange-400/30 group-hover:scale-105 transition-transform">
                  <ShieldAlert className="h-5 w-5 stroke-[2]" />
                </div>
                <div>
                  <h1 className="text-white font-heading font-extrabold text-lg tracking-tight leading-tight flex items-center gap-2">
                    RescueNet
                  </h1>
                  <p className="text-[10px] text-[#FFB703] font-bold tracking-wider uppercase font-mono">
                    Mumbai Civic Sanctuary
                  </p>
                </div>
              </Link>
            </div>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center space-x-1 lg:space-x-2">
              {token ? (
                <>
                  <Link
                    to="/feed"
                    className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                      isActive('/feed') 
                        ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/20' 
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <Radio className={`h-4 w-4 stroke-[1.75] ${isActive('/feed') ? 'text-white' : 'text-orange-400'}`} />
                    <span>Live Feed</span>
                  </Link>

                  <Link
                    to="/"
                    className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all bg-gradient-to-r from-red-500 via-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/30 hover:brightness-110 active:scale-95"
                  >
                    <PlusCircle className="h-4 w-4 text-white stroke-[2.5]" />
                    <span>Report SOS</span>
                  </Link>

                  <Link
                    to="/verify-camera"
                    className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                      isActive('/verify-camera') 
                        ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/20' 
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <ScanLine className={`h-4 w-4 stroke-[1.75] ${isActive('/verify-camera') ? 'text-white' : 'text-orange-400'}`} />
                    <span>Field AI</span>
                  </Link>

                  <Link
                    to="/adoption"
                    className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                      isActive('/adoption') 
                        ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/20' 
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <Heart className={`h-4 w-4 stroke-[1.75] ${isActive('/adoption') ? 'text-white' : 'text-rose-400'}`} />
                    <span>Adopt</span>
                  </Link>

                  <Link
                    to="/donations"
                    className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                      isActive('/donations') 
                        ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/20' 
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <HandHeart className={`h-4 w-4 stroke-[1.75] ${isActive('/donations') ? 'text-white' : 'text-amber-400'}`} />
                    <span>Impact & Donate</span>
                  </Link>

                  {/* Officer / Volunteer Dashboards */}
                  {(userRole === 'officer' || userRole === 'ngo_admin' || userRole === 'super_admin') && (
                    <Link
                      to="/officer-dashboard"
                      className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                        isActive('/officer-dashboard') 
                          ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/20' 
                          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <ShieldAlert className={`h-4 w-4 stroke-[1.75] ${isActive('/officer-dashboard') ? 'text-white' : 'text-orange-400'}`} />
                      <span>{userRole === 'super_admin' ? 'Priority Dashboard' : 'KDMC Triage'}</span>
                    </Link>
                  )}

                  {(userRole === 'super_admin' || userRole === 'ngo_admin' || userRole === 'officer') && (
                    <Link
                      to="/analytics"
                      className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                        isActive('/analytics') 
                          ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/20' 
                          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <BarChart3 className={`h-4 w-4 stroke-[1.75] ${isActive('/analytics') ? 'text-white' : 'text-amber-400'}`} />
                      <span>Analytics</span>
                    </Link>
                  )}


                  <NotificationCenter />

                  {/* User Avatar & Logout */}
                  <div className="flex items-center gap-3 pl-3 border-l border-slate-800">
                    <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${currentBadge.color}`}>
                      {currentBadge.label}
                    </span>
                    <button
                      onClick={handleLogout}
                      title="Logout"
                      className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                    >
                      <LogOut className="h-4 w-4 stroke-[1.75]" />
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    to="/login"
                    className="px-4 py-2 text-xs font-bold text-slate-300 hover:text-orange-400 transition-colors"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold px-4 py-2 rounded-xl text-xs transition-all shadow-md shadow-orange-500/25"
                  >
                    Register
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile Header Action Icons */}
            <div className="md:hidden flex items-center gap-2">
              {token && <NotificationCenter />}
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${currentBadge.color}`}>
                {currentBadge.label}
              </span>
            </div>

          </div>
        </div>
      </header>

      {/* Bottom Sticky Mobile Navigation Bar */}
      {token && (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0F172A] text-white border-t border-slate-800 shadow-xl px-4 py-2 flex items-center justify-around">
          
          {/* 1. Feed */}
          <Link 
            to="/feed" 
            className={`flex flex-col items-center justify-center py-1 px-3 transition-colors ${
              isActive('/feed') ? 'text-[#FFB703] font-extrabold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Radio className={`w-5 h-5 stroke-[1.75] ${isActive('/feed') ? 'text-[#FFB703]' : ''}`} />
            <span className="text-[10px] mt-0.5 font-bold tracking-tight">Feed</span>
          </Link>

          {/* 2. SOS (Elevated Center Button) */}
          <Link 
            to="/" 
            className="flex flex-col items-center justify-center -mt-5"
          >
            <div className={`w-13 h-13 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-95 border-2 border-orange-400 ${
              isActive('/') 
                ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white ring-4 ring-orange-500/30 shadow-orange-500/50' 
                : 'bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-orange-500/40'
            }`}>
              <ShieldAlert className="w-6 h-6 text-white animate-pulse stroke-[2.5]" />
            </div>
            <span className={`text-[10px] mt-1 font-black tracking-tight ${isActive('/') ? 'text-[#FFB703]' : 'text-white'}`}>
              SOS
            </span>
          </Link>

          {/* 3. Field AI */}
          <Link 
            to="/verify-camera" 
            className={`flex flex-col items-center justify-center py-1 px-3 transition-colors ${
              isActive('/verify-camera') ? 'text-[#FFB703] font-extrabold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <ScanLine className={`w-5 h-5 stroke-[1.75] ${isActive('/verify-camera') ? 'text-[#FFB703]' : ''}`} />
            <span className="text-[10px] mt-0.5 font-bold tracking-tight">Field AI</span>
          </Link>

          {/* 4. Adopt */}
          <Link 
            to="/adoption" 
            className={`flex flex-col items-center justify-center py-1 px-3 transition-colors ${
              isActive('/adoption') ? 'text-[#FFB703] font-extrabold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Heart className={`w-5 h-5 stroke-[1.75] ${isActive('/adoption') ? 'text-[#FFB703]' : ''}`} />
            <span className="text-[10px] mt-0.5 font-bold tracking-tight">Adopt</span>
          </Link>

          {/* 5. Impact */}
          <Link 
            to="/donations" 
            className={`flex flex-col items-center justify-center py-1 px-3 transition-colors ${
              isActive('/donations') ? 'text-[#FFB703] font-extrabold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <HandHeart className={`w-5 h-5 stroke-[1.75] ${isActive('/donations') ? 'text-[#FFB703]' : ''}`} />
            <span className="text-[10px] mt-0.5 font-bold tracking-tight">Impact</span>
          </Link>

        </nav>
      )}
    </>
  );
};

export default Navbar;
