
import React from 'react';
import { TTSHistoryItem } from '../types';
import { HistoryItem } from './HistoryItem';

interface HistorySectionProps {
  history: TTSHistoryItem[];
  onPlay: (item: TTSHistoryItem) => void;
  onDownload: (item: TTSHistoryItem) => void;
  onDelete: (id: string) => void;
}

const HistorySection: React.FC<HistorySectionProps> = ({ history, onPlay, onDownload, onDelete }) => {
  return (
    <div className="flex-1 space-y-5 overflow-y-auto custom-scrollbar pr-2">
      {history.map(item => (
        <HistoryItem 
          key={item.id} 
          item={item} 
          onPlay={onPlay} 
          onDownload={onDownload} 
          onDelete={onDelete} 
        />
      ))}
      {history.length === 0 && (
        <div className="flex flex-col items-center justify-center py-40 text-center opacity-10">
          <div className="w-20 h-20 rounded-full border-2 border-dashed border-indigo-500 flex items-center justify-center mb-6">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          </div>
          <p className="text-[11px] font-black uppercase tracking-widest">Empty Studio</p>
        </div>
      )}
    </div>
  );
};

export default HistorySection;
