import React, { useState } from 'react';
import { Download, CheckCircle2, Share, PlusSquare, Monitor, Smartphone, X, Sparkles } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  className?: string;
  variant?: 'sidebar' | 'compact' | 'full';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  className = '',
  variant = 'sidebar',
}) => {
  const { isInstallable, canPromptDirectly, isInstalled, isIOS, triggerInstall } = usePWAInstall();
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [activeGuideTab, setActiveGuideTab] = useState<'auto' | 'ios' | 'desktop' | 'android'>(
    isIOS ? 'ios' : 'auto'
  );

  const handleClick = async () => {
    if (isInstalled) {
      setShowGuideModal(true);
      return;
    }

    if (canPromptDirectly) {
      const result = await triggerInstall();
      if (result === 'manual_guide') {
        setShowGuideModal(true);
      }
    } else {
      setShowGuideModal(true);
    }
  };

  return (
    <>
      {isInstalled ? (
        <div
          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold bg-emerald-50/80 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/40 ${className}`}
          title="IponTa is installed and running in standalone PWA mode"
        >
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="truncate">IponTa App Installed</span>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-200/70 dark:bg-emerald-800/60 px-1.5 py-0.5 rounded text-emerald-900 dark:text-emerald-200">
            PWA
          </span>
        </div>
      ) : (
        <button
          type="button"
          onClick={handleClick}
          className={`w-full group relative flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 active:scale-[0.98] transition-all shadow-xs hover:shadow-md cursor-pointer ${className}`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-1 rounded-lg bg-white/20 text-white shrink-0 group-hover:scale-105 transition-transform">
              <Download className="w-3.5 h-3.5" />
            </div>
            <div className="text-left truncate">
              <p className="leading-tight font-bold">Install IponTa App</p>
              <p className="text-[10px] text-emerald-100 font-normal leading-tight opacity-90">
                {canPromptDirectly ? '1-Click Fast Install' : 'Fast, Offline & Mobile'}
              </p>
            </div>
          </div>
          <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-white/20 text-white tracking-wide shrink-0">
            PWA
          </span>
        </button>
      )}

      {/* Guide Modal for browsers where prompt cannot fire immediately or for iOS/Manual steps */}
      {showGuideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            {/* Header */}
            <div className="p-5 bg-gradient-to-br from-emerald-600 to-teal-700 text-white relative">
              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                className="absolute top-4 right-4 p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white text-emerald-700 flex items-center justify-center font-black text-xl shadow-md">
                  ₱
                </div>
                <div>
                  <h3 className="text-base font-extrabold tracking-tight">
                    {isInstalled ? 'IponTa PWA Ready' : 'Install IponTa on your Device'}
                  </h3>
                  <p className="text-xs text-emerald-100">
                    {isInstalled ? 'App is active in standalone mode' : 'Enjoy offline access, full-screen view & faster launches'}
                  </p>
                </div>
              </div>
            </div>

            {/* Content Body */}
            <div className="p-5 space-y-4">
              {isInstalled ? (
                <div className="text-center py-4 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                      Already Installed as Progressive Web App!
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">
                      IponTa is properly installed on this device. You can launch it directly from your Home Screen, Desktop shortcut, or Applications menu.
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Platform selector tabs */}
                  <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl text-xs font-semibold">
                    <button
                      type="button"
                      onClick={() => setActiveGuideTab('desktop')}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg transition-colors ${
                        activeGuideTab === 'desktop' || activeGuideTab === 'auto'
                          ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <Monitor className="w-3.5 h-3.5" />
                      <span>Desktop / Chrome</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveGuideTab('ios')}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg transition-colors ${
                        activeGuideTab === 'ios'
                          ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <Smartphone className="w-3.5 h-3.5" />
                      <span>iPhone / iPad</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveGuideTab('android')}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg transition-colors ${
                        activeGuideTab === 'android'
                          ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <Smartphone className="w-3.5 h-3.5" />
                      <span>Android</span>
                    </button>
                  </div>

                  {/* Desktop Chrome / Edge */}
                  {(activeGuideTab === 'desktop' || activeGuideTab === 'auto') && (
                    <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
                      {canPromptDirectly && (
                        <button
                          type="button"
                          onClick={async () => {
                            setShowGuideModal(false);
                            await triggerInstall();
                          }}
                          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-colors shadow-xs"
                        >
                          <Download className="w-4 h-4" />
                          <span>Trigger Browser Install Prompt</span>
                        </button>
                      )}
                      <div className="space-y-2 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                        <div className="flex items-start gap-2.5">
                          <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 font-bold flex items-center justify-center text-[11px] shrink-0">
                            1
                          </span>
                          <p>
                            Look at your browser’s address bar (top right). You will see an <strong>Install icon</strong> (a computer with a down arrow, or a circle with a &apos;+&apos;).
                          </p>
                        </div>
                        <div className="flex items-start gap-2.5">
                          <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 font-bold flex items-center justify-center text-[11px] shrink-0">
                            2
                          </span>
                          <p>
                            Alternatively, open the browser menu (<strong>⋮</strong> in Chrome/Brave or <strong>⋯</strong> in Edge), choose <strong>&quot;Install IponTa&quot;</strong> or <strong>&quot;Cast, save, and share&quot; → &quot;Install page as app&quot;</strong>.
                          </p>
                        </div>
                        <div className="flex items-start gap-2.5">
                          <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 font-bold flex items-center justify-center text-[11px] shrink-0">
                            3
                          </span>
                          <p>
                            Click <strong>Install</strong> to add IponTa directly to your desktop and applications launcher!
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* iOS Safari */}
                  {activeGuideTab === 'ios' && (
                    <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
                      <div className="space-y-2 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                        <div className="flex items-start gap-2.5">
                          <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 font-bold flex items-center justify-center text-[11px] shrink-0">
                            1
                          </span>
                          <p className="flex items-center gap-1.5">
                            Tap the <strong>Share</strong> button <Share className="w-3.5 h-3.5 text-blue-500 inline" /> in Safari&apos;s bottom toolbar.
                          </p>
                        </div>
                        <div className="flex items-start gap-2.5">
                          <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 font-bold flex items-center justify-center text-[11px] shrink-0">
                            2
                          </span>
                          <p className="flex items-center gap-1.5">
                            Scroll down and tap <strong>&quot;Add to Home Screen&quot;</strong> <PlusSquare className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300 inline" />.
                          </p>
                        </div>
                        <div className="flex items-start gap-2.5">
                          <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 font-bold flex items-center justify-center text-[11px] shrink-0">
                            3
                          </span>
                          <p>
                            Tap <strong>Add</strong> in the top right corner. The IponTa app icon will now appear on your iPhone/iPad Home Screen!
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Android Chrome */}
                  {activeGuideTab === 'android' && (
                    <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
                      {canPromptDirectly && (
                        <button
                          type="button"
                          onClick={async () => {
                            setShowGuideModal(false);
                            await triggerInstall();
                          }}
                          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-colors shadow-xs"
                        >
                          <Download className="w-4 h-4" />
                          <span>Install Now</span>
                        </button>
                      )}
                      <div className="space-y-2 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                        <div className="flex items-start gap-2.5">
                          <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 font-bold flex items-center justify-center text-[11px] shrink-0">
                            1
                          </span>
                          <p>
                            Tap the <strong>three dots menu (⋮)</strong> in Chrome at the top right.
                          </p>
                        </div>
                        <div className="flex items-start gap-2.5">
                          <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 font-bold flex items-center justify-center text-[11px] shrink-0">
                            2
                          </span>
                          <p>
                            Select <strong>&quot;Install app&quot;</strong> or <strong>&quot;Add to Home screen&quot;</strong>.
                          </p>
                        </div>
                        <div className="flex items-start gap-2.5">
                          <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 font-bold flex items-center justify-center text-[11px] shrink-0">
                            3
                          </span>
                          <p>
                            Confirm by tapping <strong>Install</strong>.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Benefits footer */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500">
                    <span className="flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      Zero app-store download needed
                    </span>
                    <span>Fast &bull; Encrypted &bull; Offline</span>
                  </div>
                </>
              )}

              {/* Close Button */}
              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                className="w-full py-2.5 rounded-xl font-bold text-xs bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
