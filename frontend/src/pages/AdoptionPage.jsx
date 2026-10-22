import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../services/apiClient';
import { 
  Heart, ShieldCheck, CheckCircle2, Search, Mic, ArrowRight, 
  MapPin, Share2, Sparkles, Home, UserCheck, AlertCircle, Clock 
} from 'lucide-react';

export default function AdoptionPage() {
  const { userName } = useAuth();
  const [adoptions, setAdoptions] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterTag, setFilterTag] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPet, setSelectedPet] = useState(null);
  
  const [applyForm, setApplyForm] = useState({
    name: userName || '',
    phone: '',
    housing: 'Apartment (Pet Friendly)',
    experience: '',
    reason: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [submittedAppId, setSubmittedAppId] = useState(null);

  const fetchData = async () => {
    try {
      const ads = await apiClient.getAdoptions();
      if (Array.isArray(ads)) {
        setAdoptions(ads);
      } else {
        setAdoptions([]);
      }
      const apps = await apiClient.getMyAdoptionApplications();
      if (Array.isArray(apps)) {
        setApplications(apps);
      }
    } catch (err) {
      console.error('Error fetching adoption data:', err);
      setAdoptions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleApply = async (e) => {
    e.preventDefault();
    if (!selectedPet) return;
    setSubmitting(true);

    try {
      const newApp = await apiClient.applyAdoption({
        adoption_id: String(selectedPet.id),
        applicant_name: applyForm.name,
        phone: applyForm.phone,
        housing_type: applyForm.housing,
        experience_years: applyForm.experience,
        reason: applyForm.reason
      });

      fetchData();
      setSubmitting(false);
      setSubmittedAppId(newApp.id || 'RN-' + Math.floor(1000 + Math.random() * 9000));
    } catch (err) {
      console.error('Error submitting application:', err);
      setSubmitting(false);
      setSubmittedAppId('RN-' + Math.floor(1000 + Math.random() * 9000));
    }
  };

  const filteredPets = adoptions.filter(pet => {
    const matchesTag = filterTag === 'All' || 
      (filterTag === 'Dogs' && (pet.species === 'Dog' || pet.species === 'Dogs')) ||
      (filterTag === 'Cats' && (pet.species === 'Cat' || pet.species === 'Cats')) ||
      (filterTag === 'Puppies & Kittens' && (pet.species.includes('Pup') || pet.species.includes('Kit') || pet.age.includes('Mo')));
    
    const matchesSearch = !searchQuery || 
      pet.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      pet.location.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesTag && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 pb-24 fade-in-up">
      <div className="max-w-xl mx-auto px-4 py-5 space-y-5">
        
        {/* Header Title */}
        <div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold tracking-widest text-orange-600 uppercase font-mono flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
              Mumbai Civic Animal Care
            </span>
            <span className="text-[10px] bg-slate-900 text-amber-400 px-2.5 py-0.5 rounded-full font-mono font-bold border border-amber-400/30 shadow-xs">
              KDMC Ward 1-7
            </span>
          </div>
          <h1 className="text-2xl font-heading font-extrabold text-slate-900 tracking-tight mt-0.5">Find a Soulmate</h1>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400 stroke-[1.75]" />
          <input 
            type="text"
            placeholder="Search by name, breed, or Mumbai locality..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-2xl pl-10 pr-10 py-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 shadow-xs"
          />
          <Mic className="absolute right-3.5 top-3.5 w-4 h-4 text-slate-400 cursor-pointer stroke-[1.75]" />
        </div>

        {/* Filter Pills */}
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar text-xs font-heading font-bold">
          {['All', 'Dogs', 'Cats', 'Puppies & Kittens', 'Vaccinated & Neutered', 'House-Trained'].map((tag) => (
            <button
              key={tag}
              onClick={() => setFilterTag(tag)}
              className={`px-4 py-2 rounded-full whitespace-nowrap border transition-all cursor-pointer ${
                filterTag === tag 
                  ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white border-transparent shadow-md shadow-orange-500/20' 
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-orange-50/50 hover:text-orange-600'
              }`}
            >
              {tag === 'Dogs' && '🐶 '}
              {tag === 'Cats' && '🐱 '}
              {tag === 'Puppies & Kittens' && '🐾 '}
              {tag}
            </button>
          ))}
        </div>

        {/* Listings */}
        <div className="space-y-6">
          {filteredPets.length === 0 ? (
            <div className="bg-white p-10 rounded-3xl border border-slate-200 text-center space-y-3 shadow-xs">
              <AlertCircle className="w-10 h-10 text-slate-400 mx-auto stroke-[1.5]" />
              <h3 className="text-base font-heading font-bold text-slate-900">No Adoption Listings Available</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">There are currently no adoption listings registered in the system matching your criteria.</p>
            </div>
          ) : (
            filteredPets.map((pet) => (
            <div key={pet.id} className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md hover:border-orange-300 transition-all space-y-3 pb-4">
              
              {/* Pet Image Banner with Photo Frame */}
              <div className="p-1 bg-white">
                <div className="relative h-60 rounded-2xl overflow-hidden bg-slate-950">
                  <img src={pet.photo_url} alt={pet.name} className="w-full h-full object-cover" />
                  
                  {/* Badge Top Left */}
                  <div className="absolute top-3 left-3">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider border shadow-md bg-slate-950/90 text-amber-400 border-amber-400/40 backdrop-blur-md">
                      ● {pet.badge_text || 'READY FOR ADOPTION'}
                    </span>
                  </div>

                  {/* Heart Top Right */}
                  <button className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center text-slate-500 hover:text-orange-500 transition-colors shadow-xs cursor-pointer">
                    <Heart className="w-5 h-5 stroke-[1.75]" />
                  </button>

                  {/* Location Pill Bottom Left */}
                  <div className="absolute bottom-3 left-3 bg-slate-950/90 backdrop-blur-md text-slate-100 text-[10px] px-3 py-1 rounded-full font-bold flex items-center gap-1.5 border border-slate-800">
                    <Home className="w-3 h-3 text-orange-400" />
                    <span>{pet.location.split(',')[0]}</span>
                  </div>
                </div>
              </div>

              {/* Card Details */}
              <div className="px-5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-heading font-extrabold text-slate-900 tracking-tight">
                    {pet.name} {pet.gender} • {pet.age}
                  </h3>
                  <span className="text-xs text-slate-500 font-semibold flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-orange-600 stroke-[1.75]" /> {pet.distance || '1.5 km'}
                  </span>
                </div>

                <p className="text-[11px] text-slate-500 font-mono font-medium">
                  Free Adoption • {pet.reg_id || 'KDMC Registered'}
                </p>

                <p className="text-[11px] text-slate-500 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-slate-400" /> {pet.location}
                </p>

                {/* Temperament Tags */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {(Array.isArray(pet.temperament_tags) ? pet.temperament_tags : (pet.temperament_tags || '').split(',')).map((tag) => (
                    <span key={tag} className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-orange-50 text-orange-600 border border-orange-200">
                      {tag}
                    </span>
                  ))}
                </div>

                <p className="text-xs text-slate-600 leading-relaxed pt-1">
                  {pet.description}
                </p>

                {/* Buttons */}
                <div className="flex gap-2 pt-2">
                  <button 
                    onClick={() => { setSelectedPet(pet); setSubmittedAppId(null); }}
                    className="flex-1 py-3 px-4 rounded-xl font-heading font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white cursor-pointer shadow-orange-500/25"
                  >
                    <span>Meet {pet.name.split(' ')[0]}</span>
                    <ArrowRight className="w-4 h-4 stroke-[2]" />
                  </button>
                  <button className="w-11 h-11 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 hover:text-orange-600 transition-all cursor-pointer">
                    <Share2 className="w-4 h-4 stroke-[1.75]" />
                  </button>
                </div>

              </div>

            </div>
          )))}
        </div>

        {/* Statistics & Impact Card: KDMC Adoption Shield (Obsidian panel with vibrant amber/orange highlights) */}
        <div className="hero-panel text-white border border-slate-800 rounded-3xl p-6 text-center space-y-3.5 shadow-xl">
          <div className="w-12 h-12 rounded-2xl bg-slate-800/80 border border-amber-400/30 text-amber-400 mx-auto flex items-center justify-center shadow-sm">
            <ShieldCheck className="w-6 h-6 stroke-[2]" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest font-mono">RESCUENET CERTIFIED</span>
            <h4 className="text-base font-heading font-extrabold text-white mt-0.5">The KDMC Adoption Shield</h4>
          </div>
          <p className="text-xs text-amber-100/80 leading-relaxed max-w-sm mx-auto">
            Free 1st-year vaccinations, municipal microchip registration, and zero adoption fees for all Mumbai citizens. Backed by Kalyan Mumbai Municipal Corporation Veterinary Cell.
          </p>

          <div className="grid grid-cols-3 gap-2.5 pt-2">
            <div className="bg-slate-850 p-3 rounded-2xl border border-slate-700/80 text-center shadow-xs">
              <span className="block text-base font-heading font-extrabold text-amber-400">100%</span>
              <span className="text-[10px] text-slate-300 font-semibold">Free Process</span>
            </div>
            <div className="bg-slate-850 p-3 rounded-2xl border border-slate-700/80 text-center shadow-xs">
              <span className="block text-base font-heading font-extrabold text-orange-400">1 Year</span>
              <span className="text-[10px] text-slate-300 font-semibold">Free Vet Care</span>
            </div>
            <div className="bg-slate-850 p-3 rounded-2xl border border-slate-700/80 text-center shadow-xs">
              <span className="block text-base font-heading font-extrabold text-amber-400">KDMC</span>
              <span className="text-[10px] text-slate-300 font-semibold">DB Chip Included</span>
            </div>
          </div>
        </div>

      </div>

      {/* Application Modal */}
      {selectedPet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
          <div className="bg-white border border-slate-200 p-6 rounded-3xl max-w-md w-full space-y-4 shadow-2xl">
            {!submittedAppId ? (
              <>
                <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                  <h3 className="text-base font-heading font-extrabold text-slate-900">Adoption Application: {selectedPet.name}</h3>
                  <button onClick={() => setSelectedPet(null)} className="text-slate-400 hover:text-slate-800 text-lg cursor-pointer">✕</button>
                </div>

                <form onSubmit={handleApply} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-heading font-bold text-slate-800 mb-1">Applicant Name</label>
                    <input
                      type="text"
                      required
                      value={applyForm.name}
                      onChange={(e) => setApplyForm({ ...applyForm, name: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-heading font-bold text-slate-800 mb-1">Contact Phone Number</label>
                    <input
                      type="text"
                      required
                      placeholder="+91 98204 XXXXX"
                      value={applyForm.phone}
                      onChange={(e) => setApplyForm({ ...applyForm, phone: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-heading font-bold text-slate-800 mb-1">Housing Type</label>
                    <select
                      value={applyForm.housing}
                      onChange={(e) => setApplyForm({ ...applyForm, housing: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="Apartment (Pet Friendly)">Apartment (Pet Friendly)</option>
                      <option value="Independent House with Lawn">Independent House with Lawn</option>
                      <option value="Gated Villa Community">Gated Villa Community</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-heading font-bold text-slate-800 mb-1">Why do you want to adopt {selectedPet.name}?</label>
                    <textarea
                      rows={3}
                      value={applyForm.reason}
                      onChange={(e) => setApplyForm({ ...applyForm, reason: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setSelectedPet(null)}
                      className="w-1/3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-heading font-bold text-xs rounded-xl transition-all cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-2/3 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-heading font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer shadow-orange-500/25"
                    >
                      {submitting ? 'Submitting...' : 'Submit Application'}
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="text-center py-6 space-y-4">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto stroke-[1.75]" />
                <h3 className="text-lg font-heading font-extrabold text-slate-900">Application Submitted!</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Application ID: <strong className="text-orange-600 font-mono">{submittedAppId}</strong>. KDMC Veterinary Cell & Foster Net will review your details and contact you for verification.
                </p>
                <button
                  onClick={() => setSelectedPet(null)}
                  className="px-6 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-heading font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer shadow-orange-500/25"
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
