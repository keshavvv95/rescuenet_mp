import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, Key, Mail, User, Phone, AlertCircle, CheckCircle, Loader, UserCheck } from 'lucide-react';

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('citizen');
  const [selectedZone, setSelectedZone] = useState('Dombivli East - Station & Ramnagar');
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!fullName || !email || !password || !confirmPassword) {
      setError('Please fill in all required fields');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    try {
      await register(email, password, fullName, phoneNumber || null, role, selectedZone);
      setSuccess(true);
      setTimeout(() => {
        if (role === 'officer' || role === 'ngo_admin') navigate('/officer-dashboard');
        else if (role === 'volunteer') navigate('/volunteer-dashboard');
        else if (role === 'super_admin') navigate('/analytics');
        else navigate('/feed');
      }, 1000);
    } catch (err) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4 py-12 text-slate-100 fade-in-up selection:bg-emerald-500 selection:text-emerald-950">
      <div className="max-w-md w-full glass-panel bg-slate-900/80 border border-slate-800/80 p-8 rounded-3xl shadow-2xl shadow-black/60 space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-1.5">
          <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white mx-auto flex items-center justify-center shadow-lg shadow-emerald-600/30 border border-emerald-400/30">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">
            Join <span className="text-emerald-400">RescueNet</span>
          </h2>
          <p className="text-[11px] font-mono text-cyan-400 uppercase tracking-widest">
            KDMC Dombivli Civic RescueNet Account
          </p>
        </div>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 px-4 py-3 rounded-2xl flex items-center gap-2 text-xs font-medium backdrop-blur-md">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 px-4 py-3 rounded-2xl flex items-center gap-2 text-xs font-medium backdrop-blur-md">
            <CheckCircle className="h-4 w-4 shrink-0 text-emerald-400" />
            <span>Registration successful! Redirecting to feed...</span>
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              Select Account Role *
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full bg-slate-950/70 border border-slate-800 px-3.5 py-3 text-xs text-white rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-medium transition-all"
            >
              <option value="citizen">Citizen (Reporter / Animal Lover)</option>
              <option value="officer">Municipal Officer / Vet</option>
              <option value="ngo_admin">NGO Rescue Administrator</option>
              <option value="volunteer">Volunteer Rescuer</option>
              <option value="super_admin">Super Admin</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              Full Name *
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full bg-slate-950/70 border border-slate-800 px-3.5 py-3 text-xs text-white rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-medium placeholder-slate-500 transition-all"
              placeholder="Enter your full name"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              Email Address *
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-950/70 border border-slate-800 px-3.5 py-3 text-xs text-white rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-medium placeholder-slate-500 transition-all"
              placeholder="your.email@domain.com"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              Primary Dombivli Municipal Zone *
            </label>
            <select
              value={selectedZone}
              onChange={(e) => setSelectedZone(e.target.value)}
              className="w-full bg-slate-950/70 border border-slate-800 px-3.5 py-3 text-xs text-white rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-medium transition-all"
            >
              <option value="Dombivli East - Station & Ramnagar">ZONE 1: Dombivli East - Station & Ramnagar</option>
              <option value="Dombivli East - Phadke Road & Manpada">ZONE 2: Dombivli East - Phadke Road & Manpada</option>
              <option value="Dombivli East - MIDC & Residential">ZONE 3: Dombivli East - MIDC & Residential</option>
              <option value="Dombivli West - Station & Subhash Road">ZONE 4: Dombivli West - Station & Subhash Road</option>
              <option value="Dombivli West - Garibachawada & Kopar">ZONE 5: Dombivli West - Garibachawada & Kopar</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              Password *
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-950/70 border border-slate-800 px-3.5 py-3 text-xs text-white rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-medium placeholder-slate-500 transition-all"
              placeholder="••••••••"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              Confirm Password *
            </label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-slate-950/70 border border-slate-800 px-3.5 py-3 text-xs text-white rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-medium placeholder-slate-500 transition-all"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading || success}
            className="w-full py-3.5 px-4 text-xs font-extrabold rounded-xl text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 transition-all shadow-lg shadow-emerald-950 border border-emerald-400/30 disabled:opacity-50 cursor-pointer active:scale-98"
          >
            {loading ? <Loader className="h-4 w-4 animate-spin text-white mx-auto" /> : 'Create RescueNet Account'}
          </button>
        </form>

        <div className="text-center pt-3 border-t border-slate-800/80">
          <p className="text-xs text-slate-400">
            Already registered?{' '}
            <Link to="/login" className="font-bold text-emerald-400 hover:text-emerald-300 underline underline-offset-4">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
