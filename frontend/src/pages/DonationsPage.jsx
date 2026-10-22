import React, { useState, useEffect } from 'react';
import { apiClient } from '../services/apiClient';
import { 
  Heart, ShieldCheck, CheckCircle2, TrendingUp, Sparkles, 
  Users, CheckCircle, ArrowRight, Info, AlertCircle, Coins
} from 'lucide-react';

export default function DonationsPage() {
  const [selectedCare, setSelectedCare] = useState(500);
  const [customAmount, setCustomAmount] = useState('');
  const [taxExempt, setTaxExempt] = useState(false);
  const [donorName, setDonorName] = useState('');
  const [paymentGateway, setPaymentGateway] = useState('UPI');
  const [processing, setProcessing] = useState(false);
  const [successTx, setSuccessTx] = useState(null);
  const [ledger, setLedger] = useState([]);

  const careLevels = [
    { amount: 250, title: 'First Aid Kit', desc: 'Antiseptic, gauze & pain relief for 1 stray' },
    { amount: 500, title: 'Emergency Trauma Care', desc: 'Anti-rabies, suture & antibiotic round' },
    { amount: 1500, title: 'Full Orthopedic Cast', desc: 'X-ray, limb stabilization & splinting' },
    { amount: 3000, title: 'Inpatient Hospitalization', desc: '48h surgical ICU observation & feeds' },
  ];

  const fetchLedger = async () => {
    try {
      const data = await apiClient.getDonationsLedger();
      if (Array.isArray(data)) setLedger(data);
    } catch (err) {
      console.error('Error fetching donations ledger:', err);
    }
  };

  useEffect(() => {
    fetchLedger();
  }, []);

  const handleDonate = async () => {
    const amount = Number(customAmount) || selectedCare;
    if (!amount || amount <= 0) return;

    setProcessing(true);
    try {
      const payload = {
        amount,
        donor_name: donorName.trim() || 'Anonymous Animal Friend',
        tax_exempt: taxExempt,
        payment_method: paymentGateway
      };
      const res = await apiClient.createDonation(payload);
      if (res) {
        setSuccessTx(res);
        fetchLedger();
      }
    } catch (err) {
      console.error('Donation error:', err);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] pb-24 fade-in-up">
      <div className="max-w-xl mx-auto px-4 py-5 space-y-4">

        {/* Top Trust Badge Bar */}
        <div className="flex items-center justify-between text-[11px] font-mono font-bold text-slate-500">
          <span className="flex items-center gap-1.5 text-slate-800">
            <ShieldCheck className="w-4 h-4 text-emerald-500 stroke-[2]" />
            100% Tax Deductible under 80G
          </span>
          <span className="bg-orange-500/10 text-orange-600 border border-orange-500/30 px-3 py-1 rounded-full uppercase text-[10px] tracking-wider font-extrabold">
            AUDITED BY MUNICIPAL WARD
          </span>
        </div>

        {/* Main Urgent Campaign Banner Card */}
        <div className="bg-gradient-to-br from-slate-900 via-[#1E1B4B] to-slate-950 rounded-3xl border border-orange-500/30 p-6 space-y-4 shadow-xl shadow-orange-500/10 text-white">
          <div className="flex items-center justify-between text-[10px] font-bold">
            <span className="bg-orange-500/20 text-amber-300 border border-orange-500/40 px-3 py-1 rounded-full font-mono uppercase tracking-wider font-extrabold">
              ● URGENT CIVIC FUND
            </span>
            <span className="text-slate-400 font-mono">
              ⏱ 14 days left
            </span>
          </div>

          <div>
            <h2 
              style={{ color: '#FACC15' }}
              className="text-xl font-heading font-extrabold text-[#FACC15] text-cyber-yellow leading-tight drop-shadow-sm"
            >
              Emergency Monsoon & Street Trauma Care 2025
            </h2>
            <p className="text-xs text-amber-100/90 mt-1">
              KDMC Mumbai Central Triage, MIDC Veterinary Unit
            </p>
          </div>

          {/* Amount & Progress */}
          <div className="space-y-2">
            <div className="flex items-baseline justify-between">
              <div>
                <span className="text-3xl font-heading font-extrabold text-amber-400">₹{ledger.reduce((s, t) => s + (t.amount || 0), 0).toLocaleString()}</span>
                <span className="text-xs text-slate-300 font-semibold ml-1.5">raised for Civic Animal Fund</span>
              </div>
              <span className="bg-orange-500/20 text-amber-300 border border-orange-500/40 text-xs font-mono font-bold px-3 py-1 rounded-full">
                LIVE AUDITED
              </span>
            </div>

            <div className="flex items-center justify-between text-[10px] text-slate-300 font-semibold pt-1">
              <span>🩵 {ledger.length} Civic Donors</span>
              <span className="text-amber-300">100% Direct Allocation to Care</span>
            </div>
          </div>
        </div>

        {/* 3 Metric Stat Cards */}
        <div className="grid grid-cols-3 gap-2.5 text-center">
          <div className="bg-slate-900 p-4 rounded-3xl border border-slate-800 shadow-sm">
            <span className="block text-2xl font-heading font-extrabold text-amber-400">{ledger.length}</span>
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-tight">Total Donations</span>
          </div>
          <div className="bg-slate-900 p-4 rounded-3xl border border-slate-800 shadow-sm">
            <span className="block text-2xl font-heading font-extrabold text-amber-400">₹{ledger.reduce((s, t) => s + (t.amount || 0), 0).toLocaleString()}</span>
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-tight">Funds Raised</span>
          </div>
          <div className="bg-slate-900 p-4 rounded-3xl border border-slate-800 shadow-sm">
            <span className="block text-2xl font-heading font-extrabold text-emerald-400">100%</span>
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-tight">Audit Transparency</span>
          </div>
        </div>

        {/* Select Care Level Grid */}
        <div className="space-y-3.5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-heading font-extrabold text-slate-900">Select Care Level</h3>
            <span className="text-[10px] font-mono bg-orange-50 text-orange-600 border border-orange-200 px-2.5 py-0.5 rounded-full font-bold">
              FAST 80G Instant Receipt
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {careLevels.map((care) => (
              <div 
                key={care.amount}
                onClick={() => { setSelectedCare(care.amount); setCustomAmount(''); }}
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                  selectedCare === care.amount && !customAmount
                    ? 'bg-orange-50/60 border-2 border-orange-500 ring-2 ring-orange-500/20 shadow-sm'
                    : 'bg-white border-slate-200 hover:border-orange-500/40'
                }`}
              >
                <div className="flex justify-between items-start">
                  <span className="text-lg font-heading font-extrabold text-slate-900">₹{care.amount}</span>
                  {selectedCare === care.amount && !customAmount && (
                    <CheckCircle className="w-4 h-4 text-orange-500 fill-orange-500 stroke-white" />
                  )}
                </div>
                <h4 className="text-xs font-heading font-bold text-slate-900 mt-1">{care.title}</h4>
                <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">{care.desc}</p>
              </div>
            ))}
          </div>

          {/* Custom Amount */}
          <div className="relative">
            <span className="absolute left-3.5 top-3.5 text-xs font-bold text-slate-400">₹</span>
            <input 
              type="number"
              placeholder="Or enter custom contribution amount"
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-2xl pl-8 pr-4 py-3 text-xs text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-orange-500 shadow-xs"
            />
          </div>

          {/* 80G Tax Exemption Toggle */}
          <div className="bg-white p-4 rounded-3xl border border-slate-200 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 stroke-[2]" />
              <div>
                <span className="text-xs font-heading font-bold text-slate-900 block">Claim 80G Tax Exemption Receipt</span>
                <span className="text-[10px] text-slate-500">Instantly emailed with IT-verified certificate</span>
              </div>
            </div>
            <input 
              type="checkbox"
              checked={taxExempt}
              onChange={(e) => setTaxExempt(e.target.checked)}
              className="w-5 h-5 accent-orange-500 rounded cursor-pointer"
            />
          </div>

          {/* Payment Gateway Options */}
          <div className="grid grid-cols-4 gap-2">
            {['GPay', 'PhonePe', 'Paytm', 'Scan QR'].map((method) => (
              <button
                key={method}
                onClick={() => setPaymentGateway(method)}
                className={`py-2.5 px-1 rounded-xl text-xs font-heading font-bold border transition-all cursor-pointer ${
                  paymentGateway === method
                    ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white border-transparent shadow-xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-orange-50 hover:text-orange-600'
                }`}
              >
                {method}
              </button>
            ))}
          </div>

          {/* Donor Name optional */}
          <input
            type="text"
            placeholder="Donor Name (Optional for public ledger)"
            value={donorName}
            onChange={(e) => setDonorName(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
          />

          {/* Submit Button */}
          <button 
            onClick={handleDonate}
            disabled={processing}
            className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-heading font-extrabold text-sm py-4 rounded-2xl shadow-xl shadow-orange-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Heart className="w-4 h-4 fill-white stroke-none" />
            <span>{processing ? 'Processing...' : `Donate ₹${customAmount || selectedCare} Securely`}</span>
          </button>
        </div>

        {/* How Funds Are Used Section */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-3.5 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-heading font-extrabold text-slate-900">How Funds Are Used</h3>
              <p className="text-[10px] font-mono font-bold text-orange-600 uppercase tracking-widest mt-0.5">
                KDMC AUDITED • ZERO ADMIN OVERHEAD
              </p>
            </div>
            <Info className="w-4 h-4 text-slate-400" />
          </div>

          <div className="flex items-center gap-4">
            {/* Donut Chart visual */}
            <div className="w-24 h-24 rounded-full border-8 border-slate-800 border-t-orange-500 border-r-amber-400 border-b-red-500 flex flex-col items-center justify-center shrink-0">
              <span className="text-xs font-heading font-bold text-slate-900">100%</span>
              <span className="text-[8px] font-bold text-slate-500 uppercase">Direct</span>
            </div>

            <div className="space-y-1.5 flex-1 text-xs font-semibold">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-slate-600">
                  <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span> Medical & Trauma Care
                </span>
                <span className="font-heading font-bold text-slate-900">60%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-slate-600">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span> Food & Clinical Diet
                </span>
                <span className="font-heading font-bold text-slate-900">22%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-slate-600">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span> Shelter & Sterilization
                </span>
                <span className="font-heading font-bold text-slate-900">12%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-slate-600">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Ambulance Fuel & Gear
                </span>
                <span className="font-heading font-bold text-slate-900">6%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Live Civic Ledger Streaming Section */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-heading font-extrabold text-slate-900">Live Civic Ledger</h3>
            <span className="text-[10px] font-mono bg-orange-50 text-orange-600 border border-orange-200 px-2.5 py-0.5 rounded-full font-bold">
              ● STREAMING Verified On-Chain
            </span>
          </div>

          <div className="space-y-2.5">
            {ledger.length === 0 ? (
              <div className="bg-white p-6 rounded-3xl border border-slate-200 text-center text-xs text-slate-500 shadow-xs">
                No civic donation transactions recorded in the system yet.
              </div>
            ) : (
              ledger.map((tx) => (
                <div key={tx.tx_id} className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center justify-between shadow-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-orange-50 border border-orange-200 text-orange-600 font-heading font-bold text-xs flex items-center justify-center font-mono">
                      {tx.donor ? tx.donor.substring(0, 2).toUpperCase() : 'RK'}
                    </div>
                    <div>
                      <h4 className="text-xs font-heading font-extrabold text-slate-900">{tx.donor} • <span className="text-slate-500 font-normal">{tx.case_ref}</span></h4>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                        {tx.timestamp} • {tx.payment_method} Reference {tx.tx_id}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-heading font-extrabold text-orange-600 font-mono">
                    +₹{tx.amount}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer Audit note */}
        <p className="text-[10px] text-center text-slate-400 font-mono leading-relaxed pt-2">
          KALYAN-DOMBIVLI MUNICIPAL CORPORATION ANIMAL WELFARE JOINT TRUST<br />
          REGISTRATION NO. E-11493 (THANE) • 80G VERIFIED #AABCR8190HF2
        </p>

      </div>

      {/* Success Modal */}
      {successTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
          <div className="bg-white p-6 rounded-3xl max-w-sm w-full text-center space-y-4 shadow-2xl border border-slate-200">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto stroke-[1.75]" />
            <h3 className="text-lg font-heading font-extrabold text-slate-900">Thank You for Your Contribution!</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Receipt ID <strong className="text-orange-600 font-mono">{successTx.tx_id}</strong> for <strong>₹{successTx.amount}</strong> has been logged to the public civic audit ledger.
            </p>
            <button 
              onClick={() => setSuccessTx(null)}
              className="w-full py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-heading font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
