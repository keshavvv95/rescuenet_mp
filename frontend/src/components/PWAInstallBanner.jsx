import React, { useState, useEffect } from 'react';
import { Download, Share2, PlusSquare, X, Smartphone, Check } from 'lucide-react';

export default function PWAInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showAndroidBanner, setShowAndroidBanner] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if app is already running in standalone mode (installed PWA)
    const inStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    if (inStandalone) {
      setIsStandalone(true);
      return;
    }

    // Android & Chrome install prompt event listener
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowAndroidBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Detect iOS browser
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    if (isIOSDevice && !inStandalone) {
      // Check if user dismissed iOS hint previously
      const iosHintDismissed = localStorage.getItem('rescuenet_ios_hint_dismissed');
      if (!iosHintDismissed) {
        setShowIOSModal(true);
      }
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowAndroidBanner(false);
    }
    setDeferredPrompt(null);
  };

  const dismissIOSHint = () => {
    setShowIOSModal(false);
    localStorage.setItem('rescuenet_ios_hint_dismissed', 'true');
  };

  if (isStandalone) return null;

  return (
    <>
      {/* Android/Chrome Install Banner */}
      {showAndroidBanner && (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-emerald-950/90 backdrop-blur-md border border-emerald-500/40 p-4 rounded-2xl shadow-2xl z-50 flex items-center justify-between gap-4 fade-in-up">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-100">Install RescueNet App</h4>
              <p className="text-xs text-slate-300">Fast offline access & emergency alerts</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleInstallClick}
              className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1 shadow-lg transition-colors"
            >
              <Download className="w-3.5 h-3.5" /> Install
            </button>
            <button
              onClick={() => setShowAndroidBanner(false)}
              className="p-1 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* iOS Install Instructions Modal */}
      {showIOSModal && (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-slate-900/95 backdrop-blur-xl border border-slate-700 p-4 rounded-2xl shadow-2xl z-50 fade-in-up">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg">
                <Smartphone className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-semibold text-slate-100">Install RescueNet on iOS</h4>
            </div>
            <button onClick={dismissIOSHint} className="text-slate-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="mt-3 space-y-2 text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <Share2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>1. Tap the <strong>Share</strong> button in Safari toolbar.</span>
            </div>
            <div className="flex items-center gap-2">
              <PlusSquare className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>2. Scroll down and select <strong>'Add to Home Screen'</strong>.</span>
            </div>
          </div>
          <button
            onClick={dismissIOSHint}
            className="mt-3 w-full py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl transition-colors"
          >
            Got it
          </button>
        </div>
      )}
    </>
  );
}
