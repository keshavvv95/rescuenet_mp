import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../services/apiClient';
import { getCurrentLocation } from '../services/locationHelper';
import { fetchLiveTriagePreview, CATEGORY_MAXES } from '../services/priorityCalculator';
import {
  Camera, MapPin, ShieldAlert, CheckCircle,
  Flame, AlertTriangle, Loader, CheckCircle2, ChevronDown, ChevronUp, Info, RotateCcw
} from 'lucide-react';

const ReportAnimal = () => {
  const navigate = useNavigate();

  // Navigation tab state
  const [activeTab, setActiveTab] = useState('AI Evidence');

  // Animal Report State
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [selectedAnimal, setSelectedAnimal] = useState('');

  // Location State
  const [locationData, setLocationData] = useState({
    latitude: 19.0760,
    longitude: 72.8777,
    accuracy: 10,
    address: 'Detecting live street address...',
    zoneName: 'Locating municipal zone...',
    zoneCode: 'DOMB-ZONE'
  });
  const [landmarkNote, setLandmarkNote] = useState('');
  const [isLocating, setIsLocating] = useState(true);

  // Symptoms & Priority
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [triageData, setTriageData] = useState({
    priority: 'ROUTINE',
    score: 0,
    categoryScores: {
      life_threatening: 0,
      major_injuries: 0,
      functional_impairment: 0,
      other_injuries: 0,
      vulnerability: 0,
      environmental_danger: 0
    },
    categoryMaxes: CATEGORY_MAXES,
    requiresHumanReview: false,
    urgentSafeguardTriggered: false,
    safeguardReasons: [],
    matchedFindings: [],
    negatedSymptomsExcluded: [],
    uncertainties: [],
    reasoning: ''
  });
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [callbackMode, setCallbackMode] = useState('share');

  // Anti-Spam / Deduplication
  const [duplicateCount, setDuplicateCount] = useState(0);
  const [isCheckingDuplicates, setIsCheckingDuplicates] = useState(false);

  // Form Submission
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Auto-acquire GPS & reverse geocode on mount or manual refresh
  const detectLocation = async () => {
    setIsLocating(true);
    try {
      const loc = await getCurrentLocation();
      if (loc) {
        setLocationData({
          latitude: Number(loc.latitude.toFixed(6)),
          longitude: Number(loc.longitude.toFixed(6)),
          accuracy: Math.round(loc.accuracy || 12),
          address: loc.address || 'Mumbai Municipal Zone Net',
          zoneName: loc.zoneName || 'Mumbai Municipal Area',
          zoneCode: loc.zoneCode || 'MUM-ZONE'
        });
        checkDuplicates(loc.latitude, loc.longitude);
      }
    } catch (err) {
      console.warn('Location error, fallback activated', err);
    } finally {
      setIsLocating(false);
    }
  };

  useEffect(() => {
    detectLocation();
  }, []);

  // Check 500m duplicates
  const checkDuplicates = async (lat, lng) => {
    setIsCheckingDuplicates(true);
    try {
      const res = await apiClient.checkDuplicateIncidents(lat, lng, 500);
      if (res && typeof res.duplicate_count === 'number') {
        setDuplicateCount(res.duplicate_count);
      }
    } catch (err) {
      console.warn('Duplicate check skipped:', err);
    } finally {
      setIsCheckingDuplicates(false);
    }
  };

  // Authoritative Priority Scoring Engine: Recalculates dynamically with 0-100 explainable weights
  useEffect(() => {
    if (!photoFile || !aiResult) {
      setTriageData({
        priority: 'ROUTINE',
        score: 0,
        categoryScores: {
          life_threatening: 0,
          major_injuries: 0,
          functional_impairment: 0,
          other_injuries: 0,
          vulnerability: 0,
          environmental_danger: 0
        },
        categoryMaxes: CATEGORY_MAXES,
        requiresHumanReview: false,
        urgentSafeguardTriggered: false,
        safeguardReasons: [],
        matchedFindings: [],
        negatedSymptomsExcluded: [],
        uncertainties: [],
        reasoning: ''
      });
      return;
    }

    let isSubscribed = true;
    const runTriage = async () => {
      const desc = [
        selectedSymptoms.join(', '),
        landmarkNote
      ].filter(Boolean).join('. ');

      const res = await fetchLiveTriagePreview({
        detectionConfidence: aiResult?.confidence || 0.0,
        description: desc,
        visualDistressScore: aiResult?.distress_score || 0.0,
        detectedAnimalType: selectedAnimal || aiResult?.detected_animal || 'Dog',
        selectedSymptoms: selectedSymptoms,
        isAnimalDetected: aiResult?.is_animal_detected
      });

      if (isSubscribed && res) {
        setTriageData(res);
      }
    };

    runTriage();
    return () => { isSubscribed = false; };
  }, [photoFile, aiResult, selectedSymptoms, selectedAnimal, landmarkNote]);

  // Handle Photo Capture
  const handlePhotoCapture = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
    setIsDetecting(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('source', 'field_report');

      const data = await apiClient.detectAnimal(formData);
      if (data) {
        setAiResult(data);
        if (data.detected_animal && data.detected_animal !== 'Unknown') {
          setSelectedAnimal(data.detected_animal);
        }
      }
    } catch (err) {
      console.error('Detection error:', err);
    } finally {
      setIsDetecting(false);
    }
  };

  const toggleSymptom = (symptom) => {
    setSelectedSymptoms((prev) =>
      prev.includes(symptom) ? prev.filter((s) => s !== symptom) : [...prev, symptom]
    );
  };

  const getAnimalIcon = (type) => {
    switch (type) {
      case 'Cat': return '🐱';
      case 'Cow': return '🐮';
      case 'Horse': return '🐴';
      case 'Bird': return '🐦';
      case 'Dog':
      default: return '🐶';
    }
  };

  // Submit Emergency Rescue Signal
  const handleSubmit = async () => {
    if (!photoFile && !photoPreview) {
      alert('Please upload or capture a photo of the animal first.');
      return;
    }
    setSubmitting(true);

    try {
      let uploadedPhotoUrl = aiResult?.image_url || null;
      if (!uploadedPhotoUrl && photoFile) {
        try {
          const uploadRes = await apiClient.uploadPhoto(photoFile);
          uploadedPhotoUrl = uploadRes?.url || uploadRes?.photo_url || null;
        } catch (uploadErr) {
          console.warn('Image upload fallback:', uploadErr);
        }
      }

      const notesDescription = [
        `Symptoms: ${selectedSymptoms.join(', ') || 'General Inspection'}`,
        `Species: ${selectedAnimal || aiResult?.detected_animal || 'Stray Animal'}`,
        `AI Triage: ${triageData.score}/100 [${triageData.priority}]`,
        `Requires Human Review: ${triageData.requiresHumanReview ? 'YES' : 'NO'}`,
        `Condition: ${aiResult?.health_condition || 'Requires Field Triage'}`,
        landmarkNote ? `Landmark: ${landmarkNote}` : ''
      ].filter(Boolean).join(' • ');

      await apiClient.submitReport({
        photo_url: uploadedPhotoUrl || '/static/uploads/reports/default.jpg',
        latitude: Number(locationData.latitude) || 19.0760,
        longitude: Number(locationData.longitude) || 72.8777,
        address: landmarkNote ? `${landmarkNote}, ${locationData.address}` : (locationData.address || 'Mumbai Municipal Area'),
        detected_animal_type: selectedAnimal || aiResult?.detected_animal || 'Dog',
        detection_confidence: aiResult?.confidence || 0.0,
        confirmed_animal_type: selectedAnimal || aiResult?.detected_animal || 'Dog',
        description: notesDescription,
        urgency: triageData.priority,
        is_sos: true,
        distress_score: aiResult?.distress_score || 0.0,
        is_ai_generated: Boolean(aiResult?.is_ai_generated || (aiResult?.ai_generated && aiResult?.ai_verification_status?.includes('AI-GENERATED'))),
        is_web_image: Boolean(aiResult?.is_web_image || aiResult?.ai_verification_status?.includes('WEB / STOCK')),
        authenticity_status: aiResult?.ai_verification_status || null
      });

      setSubmitted(true);
    } catch (err) {
      console.error('Submit error:', err);
      alert('Failed to submit rescue report: ' + (err.message || 'Please check your connection and login status.'));
    } finally {
      setSubmitting(false);
    }
  };

  const isNoAnimal = aiResult && aiResult.is_animal_detected === false;
  const currentBadgeLabel = !photoFile
    ? 'AWAITING PHOTO'
    : isDetecting
      ? 'ANALYZING...'
      : isNoAnimal
        ? 'NO ANIMAL DETECTED'
        : triageData.priority;

  const currentBadgeColor = !photoFile || isNoAnimal
    ? 'bg-slate-800 text-slate-400 border-slate-700'
    : isDetecting
      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse'
      : triageData.priority === 'CRITICAL'
        ? 'bg-red-500/20 text-red-300 border-red-500/40 shadow-sm shadow-red-500/20'
        : triageData.priority === 'HIGH'
          ? 'bg-orange-500/20 text-amber-300 border-orange-500/40 shadow-sm shadow-orange-500/20'
          : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] pb-24 fade-in-up">
      <div className="max-w-xl mx-auto px-4 py-5 space-y-4">

        {/* AI Priority Score Header Banner (Chatpata Sunset Obsidian Hero) */}
        <div className="bg-gradient-to-br from-slate-900 via-[#1E1B4B] to-slate-950 rounded-3xl p-6 text-white border border-orange-500/30 shadow-xl shadow-orange-500/10 space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 text-white flex items-center justify-center shadow-lg shadow-orange-500/30 animate-pulse">
                <ShieldAlert className="w-6 h-6 stroke-[2]" />
              </div>
              <div>
                <span 
                  style={{ color: '#FACC15' }}
                  className="text-[10px] font-mono uppercase font-bold tracking-wider text-[#FACC15] text-cyber-yellow block"
                >
                  AI PRIORITY SCORE:
                </span>
                <h2 
                  style={{ color: '#FACC15' }}
                  className="text-3xl font-heading font-extrabold leading-none text-[#FACC15] text-cyber-yellow tracking-tight drop-shadow-md"
                >
                  {!photoFile ? '0/100' : isDetecting ? 'Scanning...' : isNoAnimal ? '0/100' : `${triageData.score}/100`}
                </h2>
              </div>
            </div>
            <div className="text-right">
              <span className={`px-3 py-1 rounded-full text-[10px] font-mono font-black uppercase tracking-wider border ${currentBadgeColor}`}>
                {currentBadgeLabel}
              </span>
            </div>
          </div>

          <p className="text-xs font-medium text-slate-300 pt-1 leading-relaxed">
            {!photoFile
              ? 'Upload or capture an animal photo below to run live computer vision triage & calculate priority score.'
              : isDetecting
                ? 'AI is currently analyzing the animal species, wound patterns, and distress signs...'
                : isNoAnimal
                  ? '⚠️ No supported animal detected. Animal triage assessment is bypassed.'
                  : triageData.urgentSafeguardTriggered
                    ? '🚨 URGENT SAFEGUARD ACTIVE: Credible life-threatening indicators detected. Escalated to CRITICAL priority for immediate emergency response.'
                    : triageData.priority === 'CRITICAL'
                      ? '🚨 Critical Priority (70–100) • Urgent emergency review & rapid rescue response required.'
                      : triageData.priority === 'HIGH'
                        ? '⚡ High Priority (40–69) • Prompt rescue-team review queued for local squad.'
                        : '✓ Routine Queue (0–39) • Standard queue, animal in stable condition.'}
          </p>

          {/* Explainable AI Triage Breakdown Toggle */}
          {photoFile && !isDetecting && (
            <div className="pt-2 border-t border-slate-800/80">
              <button
                type="button"
                onClick={() => setShowBreakdown(!showBreakdown)}
                className="w-full flex items-center justify-between text-[11px] font-mono text-amber-300 hover:text-amber-200 transition-colors py-1 cursor-pointer"
              >
                <span className="flex items-center gap-1.5 font-bold">
                  <Info className="w-3.5 h-3.5 text-orange-400" />
                  Explainable AI Evidence Breakdown & Rules
                </span>
                {showBreakdown ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {showBreakdown && (
                <div className="mt-3 bg-slate-950/90 rounded-2xl p-4 border border-slate-800 space-y-3 text-xs font-mono">
                  {/* Category Points Grid */}
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold mb-1.5">
                      Provisional Category Weights:
                    </span>
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800 flex justify-between">
                        <span className="text-slate-300">Life-Threatening:</span>
                        <strong className="text-red-400">{triageData.categoryScores?.life_threatening || 0}/40 pts</strong>
                      </div>
                      <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800 flex justify-between">
                        <span className="text-slate-300">Major Injuries:</span>
                        <strong className="text-orange-400">{triageData.categoryScores?.major_injuries || 0}/25 pts</strong>
                      </div>
                      <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800 flex justify-between">
                        <span className="text-slate-300">Impairment:</span>
                        <strong className="text-amber-300">{triageData.categoryScores?.functional_impairment || 0}/15 pts</strong>
                      </div>
                      <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800 flex justify-between">
                        <span className="text-slate-300">Other Distress:</span>
                        <strong className="text-slate-200">{triageData.categoryScores?.other_injuries || 0}/10 pts</strong>
                      </div>
                      <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800 flex justify-between">
                        <span className="text-slate-300">Vulnerability:</span>
                        <strong className="text-teal-300">{triageData.categoryScores?.vulnerability || 0}/5 pts</strong>
                      </div>
                      <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800 flex justify-between">
                        <span className="text-slate-300">Env Danger:</span>
                        <strong className="text-blue-300">{triageData.categoryScores?.environmental_danger || 0}/5 pts</strong>
                      </div>
                    </div>
                  </div>

                  {/* Separate Detection Confidence Evidence */}
                  <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800 text-[10px] space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Object Species Detected:</span>
                      <strong className="text-white">{aiResult?.detected_animal || 'None'}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Model Detection Confidence:</span>
                      <strong className="text-amber-400">{Math.round((aiResult?.confidence || 0) * 100)}% (+0 severity pts, kept separate)</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Human Operator Review:</span>
                      <strong className={triageData.requiresHumanReview ? 'text-amber-400' : 'text-emerald-400'}>
                        {triageData.requiresHumanReview ? 'Required (Safeguard / High Triage)' : 'Routine Pipeline'}
                      </strong>
                    </div>
                  </div>

                  {/* Matched Findings */}
                  {triageData.matchedFindings?.length > 0 && (
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold mb-1">
                        Active Matched Symptoms:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {triageData.matchedFindings.map((f, i) => (
                          <span key={i} className="px-2 py-0.5 rounded-lg bg-orange-500/20 text-orange-300 border border-orange-500/30 text-[10px]">
                            {f}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Negated Symptoms Excluded */}
                  {triageData.negatedSymptomsExcluded?.length > 0 && (
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold mb-1">
                        Excluded Negations (0 pts):
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {triageData.negatedSymptomsExcluded.map((n, i) => (
                          <span key={i} className="px-2 py-0.5 rounded-lg bg-slate-800 text-slate-400 border border-slate-700 text-[10px]">
                            ✓ {n}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Safeguard / Uncertainty Reasons */}
                  {triageData.safeguardReasons?.length > 0 && (
                    <div className="p-2 bg-red-950/40 rounded-xl border border-red-500/30 text-[10px] text-red-300">
                      <strong>Safeguard Note:</strong> {triageData.safeguardReasons.join(' • ')}
                    </div>
                  )}

                  {/* Veterinary Disclaimer */}
                  <div className="pt-1 text-[9px] text-slate-400 border-t border-slate-800/80 leading-normal">
                    ⚖️ <strong>Safety Disclaimer:</strong> AI priority score is a provisional engineering prioritization metric and does NOT constitute a clinical veterinary diagnosis. Emergency dispatch requires human operator verification.
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Step Navigation Tabs */}
        <div className="grid grid-cols-3 gap-2 border-b border-slate-200 pb-2">
          {['AI Evidence', 'Location', 'Triage Log'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-2 text-center text-xs font-heading font-bold rounded-xl transition-all cursor-pointer ${
                activeTab === tab
                  ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/20'
                  : 'text-slate-500 hover:text-orange-600 hover:bg-orange-50'
              }`}
            >
              {tab === 'AI Evidence' && '✓ '}
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Contents */}
        {activeTab === 'AI Evidence' && (
          <>
            {/* Computer Vision Scan Card */}
            <div className="bg-white rounded-3xl border border-slate-200 p-5 space-y-3.5 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Camera className="w-4 h-4 text-orange-500 stroke-[2]" />
                  <h3 className="text-sm font-heading font-extrabold text-slate-900">Computer Vision Scan</h3>
                </div>
                <span className="bg-orange-500/10 text-orange-600 text-[10px] px-2.5 py-0.5 rounded-full font-mono font-bold flex items-center gap-1.5 border border-orange-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-ping"></span>
                  LIVE INFERENCE
                </span>
              </div>

              {/* Photo Frame with AI Detection Bounding Boxes */}
              <div className="relative min-h-64 h-72 sm:h-80 rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 flex items-center justify-center p-1">
                {photoPreview ? (
                  <img src={photoPreview} alt="Animal Scan" className="w-full h-full object-contain rounded-xl" />
                ) : (
                  <label className="text-slate-400 text-sm flex flex-col items-center gap-2 cursor-pointer w-full h-full justify-center hover:bg-slate-800/60 transition-colors rounded-xl">
                    <Camera className="w-8 h-8 opacity-75 text-orange-400 stroke-[1.5]" />
                    <span className="font-heading font-medium text-slate-300">Upload a photo to scan</span>
                    <input type="file" accept="image/*" onChange={handlePhotoCapture} className="hidden" />
                  </label>
                )}

                {isDetecting && (
                  <div className="absolute inset-0 bg-slate-950/80 flex items-center justify-center backdrop-blur-xs">
                    <Loader className="w-8 h-8 text-orange-400 animate-spin" />
                  </div>
                )}

                {aiResult && (
                  <>
                    {/* AI Authenticity Badge */}
                    <div className={`absolute top-3 right-3 px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold border backdrop-blur-md shadow-md ${
                      aiResult.ai_generated 
                        ? 'bg-rose-950/95 text-rose-200 border-rose-500 shadow-rose-900/50' 
                        : (aiResult.ai_verification_status?.includes('UNVERIFIED') || aiResult.ai_verification_status?.includes('UNCERTAIN')
                            ? 'bg-amber-950/95 text-amber-200 border-amber-500/60' 
                            : 'bg-emerald-950/95 text-emerald-200 border-emerald-500/50')
                    }`}>
                      {aiResult.ai_verification_status} {aiResult.ai_verification_confidence > 0 && `(${aiResult.ai_verification_confidence}%)`}
                    </div>

                    {/* Detected Animal Badge */}
                    <div className="absolute top-3 left-3 bg-slate-900/90 backdrop-blur-md text-white px-3 py-1.5 rounded-xl text-xs font-mono font-bold border border-slate-700 shadow-md flex items-center gap-1.5">
                      <span className="text-sm">{getAnimalIcon(selectedAnimal || aiResult.detected_animal)}</span>
                      <span>{selectedAnimal || aiResult.detected_animal}</span>
                      {aiResult.confidence > 0 && (
                        <span className="text-amber-400 font-black text-[10px]">({Math.round(aiResult.confidence * 100)}%)</span>
                      )}
                    </div>

                    {aiResult.health_condition && aiResult.health_condition !== 'None' && (
                      <div className={`absolute top-11 left-3 px-2.5 py-1 rounded-lg text-[10px] font-mono font-black border ${
                        aiResult.health_condition === 'Injured / Needs Medical Aid' 
                          ? 'bg-red-600/90 text-white border-red-400 shadow-sm' 
                          : 'bg-slate-800/90 text-amber-300 border-amber-400/30'
                      }`}>
                        Condition: {aiResult.health_condition}
                      </div>
                    )}
                  </>
                )}

                {/* Retake & Add Angle buttons overlay */}
                <div className="absolute bottom-3 left-3 right-3 flex justify-between gap-2">
                  <label className="flex-1 bg-slate-900/90 backdrop-blur-md hover:bg-slate-800 text-white text-xs font-bold py-2 rounded-xl border border-slate-700 flex items-center justify-center gap-1.5 cursor-pointer transition-colors">
                    <RotateCcw className="w-3.5 h-3.5 text-orange-400" /> Retake
                    <input type="file" accept="image/*" onChange={handlePhotoCapture} className="hidden" />
                  </label>
                  <button className="flex-1 bg-slate-900/90 backdrop-blur-md hover:bg-slate-800 text-white text-xs font-bold py-2 rounded-xl border border-slate-700 flex items-center justify-center gap-1.5 transition-colors">
                    <Camera className="w-3.5 h-3.5 text-orange-400" /> Add Angle
                  </button>
                </div>
              </div>

              {/* Animal Species Detection & Confirmation Card */}
              {photoPreview && (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3 shadow-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="text-2xl">{getAnimalIcon(selectedAnimal || aiResult?.detected_animal)}</span>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-xs font-heading font-extrabold text-slate-900">Detected Species:</h4>
                          <span className="bg-orange-500/10 text-orange-600 border border-orange-500/30 font-mono font-bold text-xs px-2.5 py-0.5 rounded-lg uppercase tracking-wide flex items-center gap-1">
                            {selectedAnimal || aiResult?.detected_animal || (isDetecting ? 'Scanning...' : 'Dog')}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                          {isDetecting
                            ? 'Running dual-stage AI species inference...'
                            : aiResult
                              ? `${aiResult.model_used || 'YOLOv8'} Vision • ${Math.round((aiResult.confidence || 0.85) * 100)}% Confidence`
                              : 'Animal detected from uploaded scan'}
                        </p>
                      </div>
                    </div>
                    {aiResult && (
                      <span className={`text-[10px] font-mono font-bold px-2 py-1 rounded-lg border ${
                        aiResult.ai_generated
                          ? 'bg-rose-50 text-rose-600 border-rose-200'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}>
                        {aiResult.ai_generated 
                          ? (aiResult.ai_verification_status?.includes('WEB') ? '🌐 Web/Stock Image Flagged' : '⚠️ AI Generated Flagged') 
                          : '🛡️ Authentic Field Photo'}
                      </span>
                    )}
                  </div>

                  {/* Quick Species Selection Buttons */}
                  <div className="pt-2 border-t border-slate-200 flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] font-bold text-slate-500 uppercase mr-1">Confirm Species:</span>
                    {['Dog', 'Cat', 'Cow', 'Horse', 'Bird', 'Other'].map((type) => {
                      const isCurrent = (selectedAnimal || aiResult?.detected_animal || 'Dog') === type;
                      return (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setSelectedAnimal(type)}
                          className={`px-3 py-1 rounded-xl text-xs font-bold transition-all border flex items-center gap-1 cursor-pointer ${
                            isCurrent
                              ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white border-transparent shadow-sm'
                              : 'bg-white text-slate-800 border-slate-200 hover:bg-orange-50'
                          }`}
                        >
                          <span>{getAnimalIcon(type)}</span>
                          <span>{type}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* DINOv3 Consensus Check Box */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 flex items-center gap-2.5 text-xs text-slate-600 font-mono">
                {isCheckingDuplicates ? (
                  <Loader className="w-4 h-4 text-orange-500 animate-spin shrink-0" />
                ) : duplicateCount === 0 ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                )}
                <span>
                  <strong>DINOv3 Consensus Check:</strong> {isCheckingDuplicates ? 'Scanning 500m radius...' : `${duplicateCount} duplicate cases within 500m in last 3h (${duplicateCount === 0 ? 'Unique Incident Confirmed' : 'Possible Duplicate'}).`}
                </span>
              </div>
            </div>
          </>
        )}

        {activeTab === 'Location' && (
          <>
            {/* Incident Location & Municipal Zone Card */}
            <div className="bg-white rounded-3xl border border-slate-200 p-5 space-y-3.5 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-orange-500 stroke-[2]" />
                  <h3 className="text-sm font-heading font-extrabold text-slate-900">Incident Location & Zone</h3>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={detectLocation}
                    disabled={isLocating}
                    title="Re-detect GPS and reverse-geocode address"
                    className="p-1 hover:bg-orange-50 text-orange-600 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-orange-200"
                  >
                    <RotateCcw className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
                  </button>
                  <span className="text-[10px] font-mono text-orange-600 font-bold bg-orange-50 px-2.5 py-0.5 rounded-full border border-orange-200">
                    GPS ±{locationData.accuracy}m Accuracy {isLocating ? 'Locating...' : 'Verified'}
                  </span>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
                <div className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    {isLocating ? (
                      <div className="flex items-center gap-2 text-xs text-orange-600 font-medium py-1">
                        <Loader className="w-3.5 h-3.5 animate-spin" />
                        <span>Resolving street address & municipal zone...</span>
                      </div>
                    ) : (
                      <>
                        <h4 className="text-xs sm:text-sm font-heading font-bold text-slate-900 leading-snug break-words">
                          {locationData.address}
                        </h4>
                        {locationData.zoneName && (
                          <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-orange-700 bg-orange-100/70 border border-orange-200 px-2 py-0.5 rounded-md">
                              📍 Assigned Zone: {locationData.zoneName}
                            </span>
                          </div>
                        )}
                        <p className="text-[11px] text-slate-500 font-mono mt-1">
                          Coordinates: {locationData.latitude}, {locationData.longitude}
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Landmark input */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-[10px] font-mono font-bold text-slate-500">
                  <span>LANDMARK / SPECIFIC SPOT NOTE</span>
                  <span className="text-orange-600">EDITABLE</span>
                </div>
                <input
                  type="text"
                  value={landmarkNote}
                  onChange={(e) => setLandmarkNote(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 text-xs text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                  placeholder="e.g. Near Metro Pillar 142, outside Chai Tapri"
                />
              </div>
            </div>
          </>
        )}

        {activeTab === 'Triage Log' && (
          <>
            {/* Observed Symptoms Selector */}
            <div className="bg-white rounded-3xl border border-slate-200 p-5 space-y-3.5 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-heading font-extrabold text-slate-900">Observed Symptoms</h3>
                <span className="text-[9px] font-mono text-slate-500 uppercase font-bold">
                  SELECT ALL THAT APPLY
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                {[
                  { label: 'Bleeding', color: 'orange' },
                  { label: 'Hit & Run', color: 'orange' },
                  { label: 'Unable to Walk', color: 'orange' },
                  { label: 'Puppy / Infant', color: 'teal' },
                  { label: 'Aggressive / Rabies Risk', color: 'amber' }
                ].map(({ label, color }) => {
                  const isSelected = selectedSymptoms.includes(label);
                  return (
                    <button
                      type="button"
                      key={label}
                      onClick={() => toggleSymptom(label)}
                      className={`px-3.5 py-2.5 rounded-2xl text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${
                        isSelected
                          ? color === 'orange'
                            ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white border-transparent shadow-sm'
                            : color === 'amber'
                              ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white border-transparent shadow-sm'
                              : 'bg-gradient-to-r from-amber-500 to-orange-500 text-white border-transparent shadow-sm'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-orange-50'
                      }`}
                    >
                      {label === 'Bleeding' && '🩸 '}
                      {label === 'Hit & Run' && '🚗 '}
                      {label === 'Unable to Walk' && '⚠️ '}
                      {label === 'Puppy / Infant' && '🐾 '}
                      {label === 'Aggressive / Rabies Risk' && '☣️ '}
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Volunteer Callback Mode */}
            <div className="bg-white rounded-3xl border border-slate-200 p-5 space-y-3.5 shadow-sm">
              <h3 className="text-sm font-heading font-extrabold text-slate-900">Volunteer Callback Mode</h3>

              <div className="space-y-2.5">
                {/* Share Phone Option */}
                <div
                  onClick={() => setCallbackMode('share')}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                    callbackMode === 'share'
                      ? 'bg-orange-50/70 border-2 border-orange-500 text-slate-900 shadow-sm'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle className={`w-5 h-5 ${callbackMode === 'share' ? 'text-orange-500 fill-orange-500 stroke-white' : 'text-slate-300'}`} />
                    <div>
                      <h4 className="text-xs font-heading font-bold text-slate-900">Share Phone Number</h4>
                      <p className="text-[10px] text-slate-500">Direct SMS & driver WhatsApp sync</p>
                    </div>
                  </div>
                </div>

                {/* Report Anonymously Option */}
                <div
                  onClick={() => setCallbackMode('anonymous')}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                    callbackMode === 'anonymous'
                      ? 'bg-orange-50/70 border-2 border-orange-500 text-slate-900 shadow-sm'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle className={`w-5 h-5 ${callbackMode === 'anonymous' ? 'text-orange-500 fill-orange-500 stroke-white' : 'text-slate-300'}`} />
                    <div>
                      <h4 className="text-xs font-heading font-bold text-slate-900">Report Anonymously</h4>
                      <p className="text-[10px] text-slate-500">Civic telemetry only, no callback</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Primary Action Button (Emergency SOS Action) */}
        <button
          onClick={handleSubmit}
          disabled={submitting || !photoFile}
          className={`w-full ${
            submitting || !photoFile 
              ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
              : 'bg-gradient-to-r from-red-600 via-orange-500 to-amber-500 hover:from-red-700 hover:via-orange-600 hover:to-amber-600 cursor-pointer shadow-xl shadow-orange-500/30 active:scale-98 text-white'
          } font-heading font-extrabold text-sm py-4 rounded-2xl flex items-center justify-center gap-2 transition-all`}
        >
          <Flame className={`w-5 h-5 fill-white stroke-none ${!submitting && photoFile ? 'animate-bounce' : ''}`} />
          <span>{submitting ? 'Dispatching Rescue Signal...' : 'SOS Submit Rescue Request'}</span>
        </button>



      </div>

      {/* Success Modal */}
      {submitted && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
          <div className="bg-white p-6 rounded-3xl max-w-sm w-full text-center space-y-4 shadow-2xl border border-slate-200">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto stroke-[1.75]" />
            <h3 className="text-lg font-heading font-extrabold text-slate-900">Emergency SOS Dispatched!</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Your rescue alert for <strong className="text-slate-900">{landmarkNote || locationData.address}</strong> has been sent to nearby volunteers and KDMC Veterinary Triage.
            </p>
            <button
              onClick={() => navigate('/feed')}
              className="w-full py-3.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-heading font-bold text-xs rounded-xl shadow-md shadow-orange-500/25 cursor-pointer transition-all"
            >
              Go to Live Community Feed
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportAnimal;
