
import React from 'react';
import { TTSHistoryItem } from '../types';

interface HistoryItemProps {
  item: TTSHistoryItem;
  onPlay: (item: TTSHistoryItem) => void;
  onDownload: (item: TTSHistoryItem) => void;
  onDelete: (id: string) => void;
}

export const HistoryItem: React.FC<HistoryItemProps> = ({ item, onPlay, onDownload, onDelete }) => {
  const formatDuration = (seconds?: number) => {
    if (!seconds) return '--';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="group p-5 rounded-[24px] bg-indigo-500/[0.03] border border-indigo-500/[0.05] hover:border-indigo-500/20 hover:bg-indigo-500/[0.06] transition-all duration-300">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600/10 text-indigo-500 flex items-center justify-center font-black text-sm border border-indigo-500/10">
            {item.voiceName[0]}
          </div>
          <div className="min-w-0">
            <h4 className="text-[11px] font-black uppercase tracking-[0.1em] truncate text-slate-300 group-hover:text-white transition-colors">{item.voiceName}</h4>
            <div className="flex items-center gap-2">
               <p className="text-[9px] opacity-30 font-bold tracking-tighter uppercase">{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
               <span className="text-[9px] bg-indigo-500/10 text-indigo-400 px-1.5 py-0.5 rounded font-black">{formatDuration(item.duration)}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
            onClick={() => onDownload(item)} 
            className="w-8 h-8 rounded-lg bg-indigo-500/10 hover:bg-indigo-600 hover:text-white text-indigo-500 flex items-center justify-center transition-all"
            title="Export Studio HQ WAV"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
          </button>
          <button 
            onClick={() => onDelete(item.id)} 
            className="w-8 h-8 rounded-lg bg-red-500/10 hover:bg-red-600 hover:text-white text-red-500 flex items-center justify-center transition-all"
            title="Purge Script"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      </div>
      
      <p className="text-[11px] opacity-60 devanagari line-clamp-2 mb-5 leading-relaxed font-light italic">
        "{item.text}"
      </p>

      <button
        onClick={() => onPlay(item)}
        className="w-full py-3 rounded-2xl bg-indigo-600/5 hover:bg-indigo-600 text-indigo-500 hover:text-white text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 border border-indigo-500/10 hover:border-transparent group/btn"
      >
        <svg className="w-3.5 h-3.5 group-hover/btn:scale-125 transition-transform" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
        Play Audio Record
      </button>
    </div>
  );
};
