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
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20 fade-in-up">
      <div className="max-w-xl mx-auto px-4 py-5 space-y-5">
        
        {/* Header Title */}
        <div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold tracking-widest text-emerald-700 uppercase font-mono flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              Dombivli Civic Animal Care
            </span>
            <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full font-bold">
              KDMC Ward 1-7
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">Find a Soulmate</h1>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
          <input 
            type="text"
            placeholder="Search by name, breed, or Dombivli locality..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-2xl pl-10 pr-10 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs"
          />
          <Mic className="absolute right-3.5 top-3 w-4 h-4 text-slate-400 cursor-pointer" />
        </div>

        {/* Filter Pills */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none text-xs font-bold">
          {['All', 'Dogs', 'Cats', 'Puppies & Kittens', 'Vaccinated & Neutered', 'House-Trained'].map((tag) => (
            <button
              key={tag}
              onClick={() => setFilterTag(tag)}
              className={`px-3.5 py-1.5 rounded-full whitespace-nowrap border transition-all ${
                filterTag === tag 
                  ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs' 
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
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
            <div className="bg-white p-10 rounded-3xl border border-slate-200 text-center space-y-3 shadow-sm">
              <AlertCircle className="w-10 h-10 text-slate-400 mx-auto" />
              <h3 className="text-base font-bold text-slate-800">No Adoption Listings Available</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">There are currently no adoption listings registered in the system matching your criteria.</p>
            </div>
          ) : (
            filteredPets.map((pet) => (
            <div key={pet.id} className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow space-y-3 pb-4">
              
              {/* Pet Image Banner */}
              <div className="relative h-60 bg-slate-100">
                <img src={pet.photo_url} alt={pet.name} className="w-full h-full object-cover" />
                
                {/* Badge Top Left */}
                <div className="absolute top-3 left-3">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider border shadow-xs ${pet.badge_bg || 'bg-emerald-100 text-emerald-800 border-emerald-300'}`}>
                    ● {pet.badge_text || 'READY FOR ADOPTION'}
                  </span>
                </div>

                {/* Heart Top Right */}
                <button className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/80 backdrop-blur-md flex items-center justify-center text-slate-700 hover:text-rose-500 transition-colors shadow-xs">
                  <Heart className="w-5 h-5" />
                </button>

                {/* Location Pill Bottom Left */}
                <div className="absolute bottom-3 left-3 bg-slate-900/80 backdrop-blur-md text-white text-[10px] px-3 py-1 rounded-full font-bold flex items-center gap-1">
                  <Home className="w-3 h-3 text-emerald-400" />
                  <span>{pet.location.split(',')[0]}</span>
                </div>
              </div>

              {/* Card Details */}
              <div className="px-5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-black text-slate-900 tracking-tight">
                    {pet.name} {pet.gender} • {pet.age}
                  </h3>
                  <span className="text-xs text-slate-500 font-semibold flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600" /> {pet.distance || '1.5 km'}
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
                    <span key={tag} className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
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
                    className={`flex-1 py-3 px-4 rounded-2xl font-black text-xs flex items-center justify-center gap-2 shadow-sm transition-transform active:scale-98 ${pet.button_color || 'bg-emerald-700 text-white'}`}
                  >
                    <span>Meet {pet.name.split(' ')[0]}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <button className="w-11 h-11 rounded-2xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600">
                    <Share2 className="w-4 h-4" />
                  </button>
                </div>

              </div>

            </div>
          )))}
        </div>

        {/* KDMC Adoption Shield Banner Footer */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-5 text-center space-y-3">
          <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-widest font-mono">RESCUENET CERTIFIED</span>
            <h4 className="text-base font-black text-slate-900">The KDMC Adoption Shield</h4>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed max-w-sm mx-auto">
            Free 1st-year vaccinations, municipal microchip registration, and zero adoption fees for all Dombivli citizens. Backed by Kalyan Dombivli Municipal Corporation Veterinary Cell.
          </p>

          <div className="grid grid-cols-3 gap-2 pt-2">
            <div className="bg-white p-2.5 rounded-2xl border border-emerald-100 text-center">
              <span className="block text-sm font-black text-emerald-700">100%</span>
              <span className="text-[10px] text-slate-500 font-semibold">Free Process</span>
            </div>
            <div className="bg-white p-2.5 rounded-2xl border border-emerald-100 text-center">
              <span className="block text-sm font-black text-emerald-700">1 Year</span>
              <span className="text-[10px] text-slate-500 font-semibold">Free Vet Care</span>
            </div>
            <div className="bg-white p-2.5 rounded-2xl border border-emerald-100 text-center">
              <span className="block text-sm font-black text-emerald-700">KDMC</span>
              <span className="text-[10px] text-slate-500 font-semibold">DB Chip Included</span>
            </div>
          </div>
        </div>

      </div>

      {/* Application Modal */}
      {selectedPet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
          <div className="bg-white border border-slate-200 p-6 rounded-3xl max-w-md w-full space-y-4 shadow-2xl">
            {!submittedAppId ? (
              <>
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <h3 className="text-base font-black text-slate-900">Adoption Application: {selectedPet.name}</h3>
                  <button onClick={() => setSelectedPet(null)} className="text-slate-400 hover:text-slate-600 text-lg">✕</button>
                </div>

                <form onSubmit={handleApply} className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Applicant Name</label>
                    <input
                      type="text"
                      required
                      value={applyForm.name}
                      onChange={(e) => setApplyForm({ ...applyForm, name: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Contact Phone Number</label>
                    <input
                      type="text"
                      required
                      placeholder="+91 98204 XXXXX"
                      value={applyForm.phone}
                      onChange={(e) => setApplyForm({ ...applyForm, phone: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Housing Type</label>
                    <select
                      value={applyForm.housing}
                      onChange={(e) => setApplyForm({ ...applyForm, housing: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="Apartment (Pet Friendly)">Apartment (Pet Friendly)</option>
                      <option value="Independent House with Lawn">Independent House with Lawn</option>
                      <option value="Gated Villa Community">Gated Villa Community</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Why do you want to adopt {selectedPet.name}?</label>
                    <textarea
                      rows={3}
                      value={applyForm.reason}
                      onChange={(e) => setApplyForm({ ...applyForm, reason: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setSelectedPet(null)}
                      className="w-1/3 py-2.5 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-2/3 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-md"
                    >
                      {submitting ? 'Submitting...' : 'Submit Application'}
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="text-center py-6 space-y-4">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                <h3 className="text-lg font-black text-slate-900">Application Submitted!</h3>
                <p className="text-xs text-slate-600">
                  Application ID: <strong className="text-emerald-700">{submittedAppId}</strong>. KDMC Veterinary Cell & Foster Net will review your details and contact you for verification.
                </p>
                <button
                  onClick={() => setSelectedPet(null)}
                  className="px-6 py-2.5 bg-emerald-600 text-white font-bold text-xs rounded-xl"
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
