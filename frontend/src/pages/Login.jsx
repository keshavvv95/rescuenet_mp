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
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center px-4 py-12 text-[#0F172A] fade-in-up">
      <div className="max-w-md w-full bg-white border border-slate-200 p-8 rounded-3xl shadow-xl shadow-orange-500/5 space-y-6">
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 text-white mx-auto flex items-center justify-center shadow-lg shadow-orange-500/25 border border-orange-400/30">
            <ShieldAlert className="h-7 w-7" strokeWidth={2} />
          </div>
          <div>
            <h2 className="text-2xl font-bold font-heading text-slate-900 tracking-tight">
              Welcome to <span className="text-orange-600">RescueNet</span>
            </h2>
            <p className="text-[11px] font-mono font-semibold text-slate-500 uppercase tracking-widest mt-1">
              Mumbai RescueNet Platform
            </p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-2.5 text-xs font-medium">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email-address" className="block text-xs font-bold text-slate-800 mb-1.5 font-heading">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Mail className="h-4 w-4" strokeWidth={1.75} />
              </div>
              <input
                id="email-address"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 pl-10 pr-4 py-3 text-xs text-slate-900 rounded-xl focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 font-medium placeholder-slate-400 transition-all"
                placeholder="name@rescuenet.org"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-xs font-bold text-slate-800 mb-1.5 font-heading">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Key className="h-4 w-4" strokeWidth={1.75} />
              </div>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 pl-10 pr-4 py-3 text-xs text-slate-900 rounded-xl focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 font-medium placeholder-slate-400 transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center items-center gap-2 py-3.5 px-4 text-xs font-bold rounded-xl text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 transition-all shadow-md shadow-orange-500/25 disabled:opacity-50 cursor-pointer active:scale-98 font-heading"
          >
            {loading ? <Loader className="h-4 w-4 animate-spin text-white" /> : (
              <>
                <span>Sign In</span>
                <ArrowRight className="w-4 h-4 text-white" strokeWidth={2} />
              </>
            )}
          </button>
        </form>

        <div className="text-center pt-3 border-t border-slate-100">
          <p className="text-xs text-slate-500">
            Don't have an account yet?{' '}
            <Link to="/register" className="font-bold text-orange-600 hover:text-orange-700 hover:underline underline-offset-4">
              Create an account here
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
};

export default Login;
