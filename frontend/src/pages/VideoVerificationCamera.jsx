import React, { useState, useEffect, useRef } from 'react';
import { apiClient } from '../services/apiClient';
import { 
  Camera, CheckCircle2, RefreshCw, Eye, ShieldCheck, AlertCircle, Loader, 
  UploadCloud, Lock, Compass, Navigation, Flashlight, Phone, HeartPulse, Truck
} from 'lucide-react';

export default function VideoVerificationCamera() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [streamActive, setStreamActive] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setStreamActive(true);
      }
    } catch (err) {
      console.warn('Camera stream permission denied or device camera missing:', err);
      setStreamActive(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20 fade-in-up">
      <div className="max-w-xl mx-auto px-4 py-4 space-y-4">

        {/* Top Field Radar Bar */}
        <div className="flex items-center justify-between text-xs font-bold">
          <div className="flex items-center gap-1.5 text-emerald-700">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            <span className="font-mono uppercase tracking-widest text-[10px]">LIVE FIELD RADAR</span>
            <span className="text-slate-400">•</span>
            <span className="text-slate-700">KDMC Ward 4B Dombivli (W)</span>
          </div>
          <div className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-[10px] font-mono font-bold flex items-center gap-1">
            <Navigation className="w-3 h-3" /> GPS LOCK: ±1.2m
          </div>
        </div>

        {/* Camera Viewfinder Box */}
        <div className="bg-white rounded-3xl border border-slate-200 p-3 space-y-2 shadow-sm">
          <div className="relative rounded-2xl overflow-hidden bg-slate-900 aspect-3/4 border border-slate-800 flex items-center justify-center">
            
            {/* Camera feed or fallback UI */}
            {streamActive ? (
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-slate-950 flex flex-col items-center justify-center p-6 text-center space-y-3">
                <Camera className="w-12 h-12 text-slate-600 animate-pulse" />
                <p className="text-xs text-slate-400 font-mono">Camera feed inactive or device camera unattached</p>
              </div>
            )}

            {/* AI Overlay Badges */}
            <div className="absolute top-3 left-3 right-3 flex items-center justify-between font-mono text-[10px] font-bold">
              <span className="bg-emerald-950/80 text-emerald-400 border border-emerald-500/40 px-2.5 py-1 rounded-lg backdrop-blur-md">
                BIOMETRIC AI ACTIVE
              </span>
              <span className="bg-slate-900/80 text-slate-200 border border-slate-700 px-2.5 py-1 rounded-lg backdrop-blur-md">
                Live Verification
              </span>
              <span className="bg-emerald-600 text-white px-2.5 py-1 rounded-lg font-black flex items-center gap-1">
                <Lock className="w-3 h-3" /> AUDIT ACTIVE
              </span>
            </div>

            {/* AR Bounding Box Frame */}
            <div className="absolute inset-14 border-2 border-emerald-400 rounded-3xl pointer-events-none flex flex-col justify-between p-3">
              <div className="flex justify-between">
                <div className="w-4 h-4 border-t-2 border-l-2 border-emerald-400"></div>
                <div className="w-4 h-4 border-t-2 border-r-2 border-emerald-400"></div>
              </div>

              {/* Center Match Tag */}
              <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700 text-white p-2 rounded-xl text-center text-[10px] font-mono shadow-lg">
                <span className="text-emerald-400 font-bold block">LIVE FEATURE ALIGNMENT</span>
                <span className="text-slate-300">Biometric Pattern Scan</span>
              </div>

              <div className="flex justify-between">
                <div className="w-4 h-4 border-b-2 border-l-2 border-emerald-400"></div>
                <div className="w-4 h-4 border-b-2 border-r-2 border-emerald-400"></div>
              </div>
            </div>

            {/* Subhash Rd Landmark Pill */}
            <div className="absolute bottom-16 left-3 right-3 bg-slate-900/85 backdrop-blur-md text-slate-200 px-3 py-1.5 rounded-xl text-[10px] font-mono flex items-center gap-2 border border-slate-700">
              <Navigation className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
              <span>15m from beacon • Subhash Rd, Dombivli (W)</span>
            </div>

            {/* Triage Diagnosis Pill */}
            <div className="absolute bottom-3 left-3 right-3 bg-white text-slate-900 px-3 py-2 rounded-xl text-xs flex items-center justify-between shadow-md">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center">
                  <AlertCircle className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono block">TRIAGE DIAGNOSIS</span>
                  <span className="font-black text-slate-900 text-xs">Minor limp, right hind paw</span>
                </div>
              </div>
              <span className="bg-emerald-500 text-slate-950 font-black text-[10px] px-2.5 py-1 rounded-full font-mono">
                HIGH MATCH
              </span>
            </div>

          </div>

          <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 px-2 pt-1">
            <span>⚙ Neural Frame Buffer: 60 FPS</span>
            <span className="flex items-center gap-1 cursor-pointer hover:text-slate-800">
              <Flashlight className="w-3.5 h-3.5 text-slate-600" /> LED Torch
            </span>
          </div>
        </div>

        {/* Evidence Comparator Card */}
        <div className="bg-white rounded-3xl border border-slate-200 p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[9px] font-bold text-indigo-700 uppercase tracking-widest font-mono">EVIDENCE COMPARATOR</span>
              <h3 className="text-base font-black text-slate-900">Biometric Visual Audit</h3>
            </div>
            <span className="bg-indigo-100 text-indigo-800 text-[10px] px-2.5 py-1 rounded-full font-bold font-mono">
              KDMC Ward 4B
            </span>
          </div>

          {/* Side by side visual thumbnails */}
          <div className="grid grid-cols-2 gap-3">
            
            {/* Citizen Telemetry */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-2.5 text-center space-y-2">
              <div className="relative h-32 rounded-xl overflow-hidden bg-slate-200">
                <img 
                  src="https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=400&auto=format&fit=crop&q=80" 
                  alt="Citizen Telemetry" 
                  className="w-full h-full object-cover" 
                />
                <span className="absolute top-2 left-2 bg-slate-900/80 text-white px-2 py-0.5 rounded text-[9px] font-mono">
                  SOS 12:40 PM
                </span>
              </div>
              <div className="text-left">
                <h4 className="text-xs font-black text-slate-900">Citizen Telemetry</h4>
                <p className="text-[10px] text-slate-500 font-mono">Reported: Limping..</p>
              </div>
            </div>

            {/* Ear Notch Vector */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-2.5 text-center space-y-2">
              <div className="relative h-32 rounded-xl overflow-hidden bg-slate-200">
                <img 
                  src="https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=400&auto=format&fit=crop&q=80" 
                  alt="Ear Notch Vector" 
                  className="w-full h-full object-cover" 
                />
                <span className="absolute top-2 left-2 bg-emerald-600 text-white px-2 py-0.5 rounded text-[9px] font-mono">
                  LIVE 1:02 PM
                </span>
                <span className="absolute bottom-2 right-2 w-5 h-5 rounded-full bg-white text-emerald-600 flex items-center justify-center text-xs">
                  ✓
                </span>
              </div>
              <div className="text-left">
                <h4 className="text-xs font-black text-slate-900">Ear Notch Vector</h4>
                <p className="text-[10px] text-emerald-700 font-mono font-bold">Vector match: 0.94</p>
              </div>
            </div>

          </div>

          {/* DINOv3 Match Progress Bar */}
          <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-3 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-indigo-900 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                DINOv3 Multi-Angle Biometric Match
              </span>
              <span className="text-indigo-700 font-mono">92.8%</span>
            </div>
            <div className="w-full bg-indigo-200/60 rounded-full h-2 overflow-hidden">
              <div className="bg-indigo-600 h-full rounded-full w-[92.8%]"></div>
            </div>
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-600 pt-1">
              <span>Confidence: High</span>
              <span>KDMC Registry ID: IND-8831</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-1">
            <button 
              onClick={() => setConfirmed(true)}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs py-3.5 rounded-2xl shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-transform active:scale-98 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4 text-slate-950" />
              <span>Confirm Match & Secure Animal</span>
            </button>

            <div className="grid grid-cols-2 gap-2">
              <button className="py-2.5 bg-white border border-slate-200 text-slate-700 font-extrabold text-xs rounded-xl hover:bg-slate-50 flex items-center justify-center gap-1.5">
                <RefreshCw className="w-3.5 h-3.5" /> Retake Scan
              </button>
              <button className="py-2.5 bg-rose-50 border border-rose-200 text-rose-700 font-extrabold text-xs rounded-xl hover:bg-rose-100 flex items-center justify-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" /> Flag Mismatch
              </button>
            </div>
          </div>

        </div>

        {/* Rapid Dispatch Triage Cards */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">
              KDMC RAPID DISPATCH TRIAGE
            </span>
            <span className="text-[10px] font-mono text-slate-600 font-bold">3 Protocols Ready</span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            
            <div className="bg-white p-3 rounded-2xl border border-slate-200 text-center space-y-1.5 shadow-2xs cursor-pointer hover:border-emerald-400">
              <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center">
                <HeartPulse className="w-5 h-5" />
              </div>
              <h4 className="text-xs font-black text-slate-900 leading-tight">Apply First Aid</h4>
              <p className="text-[10px] text-slate-500 font-mono">Paw Bandage</p>
            </div>

            <div className="bg-white p-3 rounded-2xl border border-slate-200 text-center space-y-1.5 shadow-2xs cursor-pointer hover:border-rose-400">
              <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 mx-auto flex items-center justify-center">
                <Phone className="w-5 h-5" />
              </div>
              <h4 className="text-xs font-black text-slate-900 leading-tight">Call KDMC Vet</h4>
              <p className="text-[10px] text-slate-500 font-mono">Dr. Kadam (On-call)</p>
            </div>

            <div className="bg-white p-3 rounded-2xl border border-slate-200 text-center space-y-1.5 shadow-2xs cursor-pointer hover:border-indigo-400">
              <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 mx-auto flex items-center justify-center">
                <Truck className="w-5 h-5" />
              </div>
              <h4 className="text-xs font-black text-slate-900 leading-tight">Shelter Van</h4>
              <p className="text-[10px] text-slate-500 font-mono">ETA 8 mins</p>
            </div>

          </div>
        </div>

      </div>

      {/* Confirmation Modal */}
      {confirmed && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
          <div className="bg-white p-6 rounded-3xl max-w-sm w-full text-center space-y-4 shadow-2xl">
            <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
            <h3 className="text-lg font-black text-slate-900">Biometric Match Verified!</h3>
            <p className="text-xs text-slate-600">
              Case #RN-8A2F status updated to <strong>"Secured & Dispatched"</strong> on KDMC Triage Network.
            </p>
            <button 
              onClick={() => setConfirmed(false)}
              className="w-full py-2.5 bg-emerald-600 text-white font-bold text-xs rounded-xl"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
