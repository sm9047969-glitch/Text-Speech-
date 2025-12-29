
import React from 'react';
import { Voice } from '../types';

interface VoiceCardProps {
  voice: Voice;
  isActive: boolean;
  isPreviewing?: boolean;
  disabled?: boolean;
  onClick: () => void;
  onPreview: (e: React.MouseEvent) => void;
}

export const VoiceCard: React.FC<VoiceCardProps> = ({ voice, isActive, isPreviewing, disabled, onClick, onPreview }) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-4 p-4 rounded-2xl border transition-all duration-300 text-left w-full group overflow-hidden relative ${
        isActive 
          ? 'bg-indigo-600/20 border-indigo-500 shadow-[0_0_25px_rgba(99,102,241,0.25)] ring-1 ring-indigo-500/50' 
          : 'bg-indigo-500/[0.03] border-indigo-500/5 hover:border-indigo-500/40 hover:bg-indigo-500/[0.08] hover:shadow-[0_0_20px_rgba(99,102,241,0.15)]'
      } ${disabled ? 'opacity-50 cursor-not-allowed filter grayscale-[0.5]' : ''}`}
    >
      <div className={`relative w-14 h-14 rounded-2xl flex items-center justify-center font-bold transition-all duration-500 flex-shrink-0 z-10 ${
        isActive ? 'bg-indigo-600 text-white shadow-lg rotate-2' : 'bg-indigo-500/10 text-indigo-500'
      }`}>
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={voice.gender === 'Male' ? "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" : "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197"} />
        </svg>
      </div>

      <div className="flex-1 min-w-0 z-10">
        <div className="flex items-center justify-between gap-2 mb-1">
          <span className={`text-[13px] font-bold truncate ${isActive ? 'text-white' : 'text-slate-200'}`}>
            {voice.name}
          </span>
          <span className="text-[7px] font-black bg-indigo-500 text-white px-1.5 py-0.5 rounded-sm uppercase tracking-tighter shadow-sm flex-shrink-0">
            STUDIO
          </span>
        </div>
        <p className={`text-[10px] leading-tight truncate italic transition-opacity ${isActive ? 'opacity-100 text-indigo-100' : 'opacity-40'}`}>
          Engine: {voice.geminiVoice} • {voice.gender}
        </p>
      </div>

      <button
        onClick={onPreview}
        disabled={isPreviewing || disabled}
        className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
          isPreviewing ? 'bg-indigo-500/20' : 'bg-indigo-500/10 hover:bg-indigo-500 text-indigo-500 hover:text-white'
        } ${disabled ? 'cursor-not-allowed opacity-30' : ''}`}
      >
        {isPreviewing ? <div className="w-3 h-3 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin"></div> : <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/></svg>}
      </button>
    </button>
  );
};
