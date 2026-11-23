import React, { useEffect } from 'react';
import { X, Sparkles, ShieldCheck, Users, Layers, Heart, ExternalLink } from 'lucide-react';

export default function AuthorModal({ isOpen, onClose }) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-royal-900/50 p-4 backdrop-blur-sm"
    >
      <div className="w-full max-w-md rounded-3xl bg-white modal-3d border border-royal-200 overflow-hidden">
        {/* 3D Royal Cover Banner */}
        <div className="relative h-32 bg-gradient-to-br from-[#270E5C] via-[#491FA3] to-[#7C51DA] overflow-hidden">
          <div className="absolute -top-10 -left-10 h-32 w-32 rounded-full bg-amber-300/20 blur-2xl" />
          <div className="absolute -bottom-10 -right-10 h-36 w-36 rounded-full bg-fuchsia-400/25 blur-2xl" />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close author modal"
            className="absolute top-3.5 right-3.5 rounded-xl bg-white/15 p-1.5 text-white/90 hover:bg-white/25 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="absolute top-4 left-5 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold text-white border border-white/25 backdrop-blur-sm">
            <Sparkles className="h-3 w-3 text-amber-300" />
            <span>About the Author</span>
          </div>
        </div>

        {/* Floating 3D Portrait + Content */}
        <div className="px-6 pb-6 text-center">
          <div className="relative -mt-16 mb-3 inline-block">
            <div className="h-32 w-32 rounded-full p-1 bg-gradient-to-tr from-amber-400 via-royal-500 to-fuchsia-400 shadow-2xl">
              <img
                src="/author.jpg"
                alt="Sri Harsha — Creator of Wedding Budget Tracker"
                className="h-full w-full rounded-full object-cover object-top border-[3px] border-white"
              />
            </div>
          </div>

          <h3 className="font-serif text-2xl font-bold text-[#1A132B]">Sri Harsha</h3>
          <p className="inline-flex items-center gap-1.5 mt-1 rounded-full bg-royal-50 px-3 py-0.5 text-xs font-semibold text-royal-800 border border-royal-200">
            <Heart className="h-3 w-3 text-royal-600 fill-royal-600" />
            <span>Creator &amp; Developer</span>
          </p>

          <p className="mt-4 rounded-2xl bg-gradient-to-r from-royal-50/90 via-white to-[#FDF4FF]/90 p-4 font-serif italic text-sm text-ink leading-relaxed border border-royal-200/80 shadow-sm">
            &ldquo;Creator of Wedding Budget Tracker — built to help couples celebrate their big day
            with clarity, confidence, and zero budget stress.&rdquo;
          </p>

          {/* Feature Highlights */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-[11px] font-semibold">
            <span className="inline-flex items-center gap-1 rounded-full bg-[#EDE9FE] px-3 py-1 text-[#4C1D95] border border-[#C4B5FD]">
              <Layers className="h-3 w-3" />
              3D Modern UI
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-emerald-700 border border-emerald-200">
              <ShieldCheck className="h-3 w-3" />
              Encrypted Privacy
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-[#FDF4FF] px-3 py-1 text-[#86198F] border border-[#E879F9]/70">
              <Users className="h-3 w-3" />
              Smart Couple Splits
            </span>
          </div>

          {/* Actions */}
          <div className="mt-5 flex items-center justify-center gap-2.5">
            <a
              href="https://github.com/sri1642917/wedding-budget-tracker-website"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl btn-3d-white px-4 py-2 text-xs font-semibold text-royal-800 border border-royal-200"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              View on GitHub
            </a>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl btn-3d-primary px-5 py-2 text-xs font-semibold text-white"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
