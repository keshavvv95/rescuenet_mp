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
  const [selectedZone, setSelectedZone] = useState('Mumbai East - Station & Ramnagar');
  
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
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center px-4 py-12 text-[#0F172A] fade-in-up">
      <div className="max-w-md w-full bg-white border border-slate-200 p-8 rounded-3xl shadow-xl shadow-orange-500/5 space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-1.5">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 text-white mx-auto flex items-center justify-center shadow-lg shadow-orange-500/25 border border-orange-400/30">
            <ShieldAlert className="h-7 w-7" strokeWidth={2} />
          </div>
          <h2 className="text-2xl font-bold font-heading text-slate-900 tracking-tight">
            Join <span className="text-orange-600">RescueNet</span>
          </h2>
          <p className="text-[11px] font-mono font-semibold text-slate-500 uppercase tracking-widest">
            KDMC Mumbai Civic RescueNet Account
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-2 text-xs font-medium">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl flex items-center gap-2 text-xs font-semibold">
            <CheckCircle className="h-4 w-4 shrink-0 text-emerald-600" strokeWidth={2} />
            <span>Registration successful! Redirecting to feed...</span>
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5 font-heading">
              Select Account Role *
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 px-3.5 py-3 text-xs text-slate-900 rounded-xl focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 font-medium transition-all"
            >
              <option value="citizen">Citizen (Reporter / Animal Lover)</option>
              <option value="officer">Municipal Officer / Vet</option>
              <option value="ngo_admin">NGO Rescue Administrator</option>
              <option value="volunteer">Volunteer Rescuer</option>
              <option value="super_admin">Super Admin</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5 font-heading">
              Full Name *
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 px-3.5 py-3 text-xs text-slate-900 rounded-xl focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 font-medium placeholder-slate-400 transition-all"
              placeholder="Enter your full name"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5 font-heading">
              Email Address *
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 px-3.5 py-3 text-xs text-slate-900 rounded-xl focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 font-medium placeholder-slate-400 transition-all"
              placeholder="your.email@domain.com"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5 font-heading">
              Primary Mumbai Municipal Zone *
            </label>
            <select
              value={selectedZone}
              onChange={(e) => setSelectedZone(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 px-3.5 py-3 text-xs text-slate-900 rounded-xl focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 font-medium transition-all"
            >
              <option value="Mumbai East - Station & Ramnagar">ZONE 1: Mumbai East - Station & Ramnagar</option>
              <option value="Mumbai East - Phadke Road & Manpada">ZONE 2: Mumbai East - Phadke Road & Manpada</option>
              <option value="Mumbai East - MIDC & Residential">ZONE 3: Mumbai East - MIDC & Residential</option>
              <option value="Mumbai West - Station & Subhash Road">ZONE 4: Mumbai West - Station & Subhash Road</option>
              <option value="Mumbai West - Garibachawada & Kopar">ZONE 5: Mumbai West - Garibachawada & Kopar</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5 font-heading">
              Password *
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 px-3.5 py-3 text-xs text-slate-900 rounded-xl focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 font-medium placeholder-slate-400 transition-all"
              placeholder="••••••••"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5 font-heading">
              Confirm Password *
            </label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 px-3.5 py-3 text-xs text-slate-900 rounded-xl focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 font-medium placeholder-slate-400 transition-all"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading || success}
            className="w-full py-3.5 px-4 text-xs font-bold font-heading rounded-xl text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 transition-all shadow-md shadow-orange-500/25 disabled:opacity-50 cursor-pointer active:scale-98"
          >
            {loading ? <Loader className="h-4 w-4 animate-spin text-white mx-auto" /> : 'Create RescueNet Account'}
          </button>
        </form>

        <div className="text-center pt-3 border-t border-slate-100">
          <p className="text-xs text-slate-500">
            Already registered?{' '}
            <Link to="/login" className="font-bold text-orange-600 hover:text-orange-700 hover:underline underline-offset-4">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
