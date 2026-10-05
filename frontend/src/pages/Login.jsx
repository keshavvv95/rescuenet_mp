import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, Key, Mail, AlertCircle, Loader, ArrowRight } from 'lucide-react';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password) {
      setError('Please enter both your email address and password.');
      return;
    }
    
    setLoading(true);
    try {
      const res = await login(email, password);
      const role = res.role || 'citizen';
      if (role === 'officer' || role === 'ngo_admin') navigate('/officer-dashboard');
      else if (role === 'volunteer') navigate('/volunteer-dashboard');
      else if (role === 'super_admin') navigate('/analytics');
      else navigate('/feed');
    } catch (err) {
      setError(err.message || 'Invalid credentials. Please check your email and password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4 py-12 text-slate-100 fade-in-up selection:bg-emerald-500 selection:text-emerald-950">
      <div className="max-w-md w-full glass-panel bg-slate-900/80 border border-slate-800/80 p-8 rounded-3xl shadow-2xl shadow-black/60 space-y-6">
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white mx-auto flex items-center justify-center shadow-lg shadow-emerald-600/30 border border-emerald-400/30">
            <ShieldAlert className="h-7 w-7" />
          </div>
          <div>
            <h2 className="text-2xl font-extrabold text-white tracking-tight">
              Welcome to <span className="text-emerald-400">RescueNet</span>
            </h2>
            <p className="text-[11px] font-mono font-semibold text-cyan-400 uppercase tracking-widest mt-1">
              KDMC Dombivli RescueNet Platform
            </p>
          </div>
        </div>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 px-4 py-3 rounded-2xl flex items-center gap-2.5 text-xs font-medium backdrop-blur-md">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email-address" className="block text-xs font-bold text-slate-300 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Mail className="h-4 w-4" />
              </div>
              <input
                id="email-address"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950/70 border border-slate-800 pl-10 pr-4 py-3 text-xs text-white rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-medium placeholder-slate-500 transition-all"
                placeholder="name@rescuenet.org"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-xs font-bold text-slate-300 mb-1.5">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Key className="h-4 w-4" />
              </div>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950/70 border border-slate-800 pl-10 pr-4 py-3 text-xs text-white rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-medium placeholder-slate-500 transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center items-center gap-2 py-3.5 px-4 text-xs font-extrabold rounded-xl text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 transition-all shadow-lg shadow-emerald-950 border border-emerald-400/30 disabled:opacity-50 cursor-pointer active:scale-98"
          >
            {loading ? <Loader className="h-4 w-4 animate-spin text-white" /> : (
              <>
                <span>Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="text-center pt-3 border-t border-slate-800/80">
          <p className="text-xs text-slate-400">
            Don't have an account yet?{' '}
            <Link to="/register" className="font-bold text-emerald-400 hover:text-emerald-300 underline underline-offset-4">
              Create an account here
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
};

export default Login;
