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
    citizen: { label: 'Citizen', color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
    officer: { label: 'Municipal Officer', color: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30' },
    ngo_admin: { label: 'NGO Admin', color: 'bg-purple-500/15 text-purple-400 border-purple-500/30' },
    volunteer: { label: 'Volunteer Rescuer', color: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
    super_admin: { label: 'Super Admin', color: 'bg-rose-500/15 text-rose-400 border-rose-500/30' }
  };

  const currentBadge = roleBadges[userRole] || roleBadges.citizen;

  return (
    <>
      {/* Top Header Bar */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-xl border-b border-slate-800/80 shadow-lg shadow-black/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Logo & Subtitle */}
            <div className="flex items-center gap-3">
              <Link to="/feed" className="flex items-center space-x-2.5 group">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-600 to-teal-700 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-600/30 border border-emerald-400/30 group-hover:scale-105 transition-transform">
                  <ShieldAlert className="h-5 w-5" />
                </div>
                <div>
                  <h1 className="text-white font-extrabold text-lg tracking-tight leading-tight flex items-center gap-2">
                    RescueNet
                  </h1>
                  <p className="text-[10px] text-emerald-400/80 font-medium tracking-wider uppercase font-mono">
                    Dombivli Civic Sanctuary
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
                        ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 shadow-md shadow-emerald-950' 
                        : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                    }`}
                  >
                    <Radio className="h-4 w-4 text-emerald-400" />
                    <span>Live Feed</span>
                  </Link>

                  <Link
                    to="/"
                    className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                      isActive('/') 
                        ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30 border border-rose-400/30' 
                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20'
                    }`}
                  >
                    <PlusCircle className="h-4 w-4 text-rose-400" />
                    <span>Report SOS</span>
                  </Link>

                  <Link
                    to="/verify-camera"
                    className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                      isActive('/verify-camera') 
                        ? 'bg-cyan-600/20 text-cyan-300 border border-cyan-500/30 shadow-md' 
                        : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                    }`}
                  >
                    <ScanLine className="h-4 w-4 text-cyan-400" />
                    <span>Field AI</span>
                  </Link>

                  <Link
                    to="/adoption"
                    className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                      isActive('/adoption') 
                        ? 'bg-pink-600/20 text-pink-300 border border-pink-500/30 shadow-md' 
                        : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                    }`}
                  >
                    <Heart className="h-4 w-4 text-pink-400" />
                    <span>Adopt</span>
                  </Link>

                  <Link
                    to="/donations"
                    className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                      isActive('/donations') 
                        ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 shadow-md' 
                        : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                    }`}
                  >
                    <HandHeart className="h-4 w-4 text-emerald-400" />
                    <span>Impact & Donate</span>
                  </Link>

                  {/* Officer / Volunteer Dashboards */}
                  {(userRole === 'officer' || userRole === 'ngo_admin' || userRole === 'super_admin') && (
                    <Link
                      to="/officer-dashboard"
                      className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                        isActive('/officer-dashboard') 
                          ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30' 
                          : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/20'
                      }`}
                    >
                      <ShieldAlert className="h-4 w-4" />
                      <span>KDMC Triage</span>
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
                      className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors"
                    >
                      <LogOut className="h-4 w-4" />
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    to="/login"
                    className="px-4 py-2 text-xs font-bold text-slate-300 hover:text-white transition-colors"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded-xl text-xs transition-all shadow-lg shadow-emerald-600/30 border border-emerald-400/20"
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
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-xl border-t border-slate-800 shadow-2xl px-4 py-2 flex items-center justify-around">
          
          {/* 1. Feed */}
          <Link 
            to="/feed" 
            className={`flex flex-col items-center justify-center py-1 px-3 transition-colors ${
              isActive('/feed') ? 'text-emerald-400 font-extrabold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Radio className={`w-5 h-5 ${isActive('/feed') ? 'text-emerald-400' : ''}`} />
            <span className="text-[10px] mt-0.5 font-bold tracking-tight">Feed</span>
          </Link>

          {/* 2. SOS (Elevated Center Button) */}
          <Link 
            to="/" 
            className="flex flex-col items-center justify-center -mt-5"
          >
            <div className={`w-13 h-13 rounded-full flex items-center justify-center shadow-xl transition-transform active:scale-95 border border-rose-400/30 ${
              isActive('/') 
                ? 'bg-rose-600 text-white ring-4 ring-rose-500/30 shadow-rose-600/50' 
                : 'bg-rose-500 text-white shadow-rose-500/40'
            }`}>
              <ShieldAlert className="w-6 h-6 animate-pulse" />
            </div>
            <span className={`text-[10px] mt-1 font-black tracking-tight ${isActive('/') ? 'text-rose-400' : 'text-slate-400'}`}>
              SOS
            </span>
          </Link>

          {/* 3. Field AI */}
          <Link 
            to="/verify-camera" 
            className={`flex flex-col items-center justify-center py-1 px-3 transition-colors ${
              isActive('/verify-camera') ? 'text-cyan-400 font-extrabold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ScanLine className={`w-5 h-5 ${isActive('/verify-camera') ? 'text-cyan-400' : ''}`} />
            <span className="text-[10px] mt-0.5 font-bold tracking-tight">Field AI</span>
          </Link>

          {/* 4. Adopt */}
          <Link 
            to="/adoption" 
            className={`flex flex-col items-center justify-center py-1 px-3 transition-colors ${
              isActive('/adoption') ? 'text-pink-400 font-extrabold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Heart className={`w-5 h-5 ${isActive('/adoption') ? 'text-pink-400' : ''}`} />
            <span className="text-[10px] mt-0.5 font-bold tracking-tight">Adopt</span>
          </Link>

          {/* 5. Impact */}
          <Link 
            to="/donations" 
            className={`flex flex-col items-center justify-center py-1 px-3 transition-colors ${
              isActive('/donations') ? 'text-emerald-400 font-extrabold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <HandHeart className={`w-5 h-5 ${isActive('/donations') ? 'text-emerald-400' : ''}`} />
            <span className="text-[10px] mt-0.5 font-bold tracking-tight">Impact</span>
          </Link>

        </nav>
      )}
    </>
  );
};

export default Navbar;
