
import React, { useState, useCallback, useRef, useEffect, useMemo, Suspense, lazy } from 'react';
import { VOICES, FEMALE_VOICE, APP_NAME, SAMPLE_SCRIPTS, PREVIEW_TEXT } from './constants';
import { Voice, TTSHistoryItem, SpeechStyle } from './types';
import { VoiceCard } from './components/VoiceCard';
import { generateHindiSpeech, mergeAudioBuffers, bufferToWav, splitTextIntoChunks } from './services/geminiService';

const HistorySection = lazy(() => import('./components/HistorySection'));

const EMOTIONS: { id: SpeechStyle; label: string; icon: string }[] = [
  { id: 'Normal', label: 'Normal', icon: '🎙️' },
  { id: 'Emotional', label: 'Emotional', icon: '❤️' },
  { id: 'Storytelling', label: 'Storytelling', icon: '📖' },
  { id: 'News Style', label: 'News Style', icon: '📺' }
];

const LAST_VOICE_KEY = 'mr_ajay_voice_last_selected';

const App: React.FC = () => {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [text, setText] = useState('नमस्ते! मिस्टर अजय वॉइस में आपका स्वागत है। अब हमारी आवाज़ें पहले से ज़्यादा तेज़ और साफ़ हैं।');
  
  const [selectedVoice, setSelectedVoice] = useState<Voice>(VOICES[0]);
  const [emotion, setEmotion] = useState<SpeechStyle>('Normal');
  const [speed, setSpeed] = useState(1.0);
  const [isFemaleEnabled, setIsFemaleEnabled] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [genProgress, setGenProgress] = useState(0);
  const [estRemaining, setEstRemaining] = useState(0);
  const [previewingVoiceId, setPreviewingVoiceId] = useState<string | null>(null);
  const [history, setHistory] = useState<TTSHistoryItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const charCount = text.length;
  const audioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const playingSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  useEffect(() => {
    const savedId = localStorage.getItem(LAST_VOICE_KEY);
    if (savedId) {
      const v = [...VOICES, FEMALE_VOICE].find(x => x.id === savedId);
      if (v) {
        if (v.gender === 'Female') setIsFemaleEnabled(true);
        setSelectedVoice(v);
      }
    }
  }, []);

  useEffect(() => {
    document.body.className = theme === 'dark' ? 'dark bg-slate-950 text-slate-100' : 'light bg-slate-50 text-slate-900';
  }, [theme]);

  useEffect(() => {
    localStorage.setItem(LAST_VOICE_KEY, selectedVoice.id);
  }, [selectedVoice]);

  const stopAllAudio = useCallback(() => {
    if (currentAudio) {
      currentAudio.pause();
      setCurrentAudio(null);
    }
    if (audioContextRef.current) {
      for (const s of playingSourcesRef.current) { try { s.stop(); } catch(e) {} }
      playingSourcesRef.current.clear();
      nextStartTimeRef.current = 0;
    }
    window.speechSynthesis.cancel();
    setIsPlaying(false);
  }, [currentAudio]);

  const playBuffer = async (audioBuffer: AudioBuffer) => {
    if (!audioContextRef.current) audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});
    const ctx = audioContextRef.current;
    if (ctx.state === 'suspended') await ctx.resume();

    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.playbackRate.value = speed;
    source.connect(ctx.destination);
    
    const startTime = Math.max(nextStartTimeRef.current, ctx.currentTime);
    source.start(startTime);
    nextStartTimeRef.current = startTime + (audioBuffer.duration / speed);
    
    playingSourcesRef.current.add(source);
    setIsPlaying(true);
    source.onended = () => {
      playingSourcesRef.current.delete(source);
      if (playingSourcesRef.current.size === 0) setIsPlaying(false);
    };
  };

  const handleGenerate = async (autoDownload: boolean = false) => {
    if (!text.trim() || isGenerating) return;
    setIsGenerating(true);
    setGenProgress(2);
    setError(null);
    stopAllAudio();
    
    if (!audioContextRef.current) audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});
    const ctx = audioContextRef.current;

    try {
      const chunks = splitTextIntoChunks(text);
      const total = chunks.length;
      
      // PARALLEL PIPELINE: Start all synthesis requests simultaneously for maximum speed
      const chunkPromises = chunks.map(chunk => 
        generateHindiSpeech(chunk, selectedVoice, emotion, ctx)
      );

      const finalBuffers: AudioBuffer[] = [];
      
      // SEQUENTIAL PLAYBACK: Start playing as soon as the "next" chunk is ready
      for (let i = 0; i < chunkPromises.length; i++) {
        const { buffer } = await chunkPromises[i];
        finalBuffers.push(buffer);
        
        const progress = Math.round(((i + 1) / total) * 100);
        setGenProgress(progress);
        setEstRemaining(Math.max(0, (total - (i + 1)) * 1));

        // Start playing the chunk immediately to minimize perceived latency
        await playBuffer(buffer);
      }

      const finalBuffer = mergeAudioBuffers(finalBuffers, ctx);
      const finalBlob = bufferToWav(finalBuffer);

      const newItem: TTSHistoryItem = {
        id: crypto.randomUUID(),
        text: text.slice(0, 80) + (text.length > 80 ? '...' : ''),
        voiceName: selectedVoice.name,
        timestamp: Date.now(),
        audioBlob: finalBlob,
        style: emotion,
        duration: finalBuffer.duration
      };
      
      setHistory(prev => [newItem, ...prev]);
      setGenProgress(100);
      if (autoDownload) handleDownload(newItem);

    } catch (err: any) {
      setError("High-speed synthesis failed. Please check connection.");
    } finally {
      setTimeout(() => { setIsGenerating(false); setGenProgress(0); }, 500);
    }
  };

  // Fixed: handlePreview function to synthesize a short preview for a voice
  const handlePreview = async (e: React.MouseEvent, voice: Voice) => {
    e.stopPropagation();
    if (previewingVoiceId || isGenerating) return;
    
    setPreviewingVoiceId(voice.id);
    stopAllAudio();
    
    try {
      if (!audioContextRef.current) audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});
      const { buffer } = await generateHindiSpeech(PREVIEW_TEXT, voice, 'Normal', audioContextRef.current);
      await playBuffer(buffer);
    } catch (err) {
      setError("Voice preview failed.");
    } finally {
      setPreviewingVoiceId(null);
    }
  };

  // Fixed: playFromHistory function to replay a previously synthesized audio record
  const playFromHistory = async (item: TTSHistoryItem) => {
    if (!item.audioBlob) return;
    stopAllAudio();
    
    try {
      const arrayBuffer = await item.audioBlob.arrayBuffer();
      if (!audioContextRef.current) audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});
      const ctx = audioContextRef.current;
      const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
      await playBuffer(audioBuffer);
    } catch (err) {
      setError("Failed to play history record.");
    }
  };

  const handleDownload = (item: TTSHistoryItem) => {
    if (!item.audioBlob) return;
    const url = URL.createObjectURL(item.audioBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mr-ajay-voice-${item.voiceName.toLowerCase().replace(/ /g, '-')}.wav`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen flex flex-col transition-colors duration-200 overflow-x-hidden">
      <header className="h-20 flex items-center justify-between px-6 lg:px-12 border-b border-indigo-500/10 glass-panel sticky top-0 z-50">
        <div className="flex items-center gap-4 group cursor-pointer" onClick={() => !isGenerating && window.location.reload()}>
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30 group-hover:scale-110 transition-transform">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight uppercase italic">{APP_NAME}</h1>
            <div className="flex items-center gap-2">
               <span className="text-[9px] text-emerald-500 font-bold tracking-[0.3em] uppercase">High Speed Mode Active</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
           <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="w-10 h-10 flex items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500 hover:text-white transition-all">
             {theme === 'dark' ? '☀️' : '🌙'}
           </button>
           <button className="hidden lg:block bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest px-6 py-3 rounded-2xl shadow-xl shadow-indigo-600/40">TURBO STUDIO</button>
        </div>
      </header>

      {isGenerating && (
        <div className="fixed top-20 left-0 w-full h-1.5 bg-indigo-900/20 z-[60]">
           <div className="h-full bg-indigo-500 shadow-[0_0_20px_rgba(99,102,241,1)] transition-all duration-300" style={{ width: `${genProgress}%` }}></div>
        </div>
      )}

      <main className="flex-1 max-w-[1600px] mx-auto w-full p-4 lg:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 flex flex-col gap-6">
          <div className="glass-panel rounded-[40px] p-6 lg:p-10 space-y-8 shadow-2xl flex-1 flex flex-col relative overflow-hidden">
            
            {isGenerating && (
              <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-[3px] rounded-[40px] z-40 flex flex-col items-center justify-center text-center p-12">
                <div className="w-40 h-40 relative mb-6">
                   <svg className="w-full h-full transform -rotate-90">
                      <circle cx="80" cy="80" r="74" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-indigo-900/30" />
                      <circle cx="80" cy="80" r="74" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray="465" strokeDashoffset={465 - (465 * genProgress) / 100} className="text-indigo-500 transition-all duration-500" strokeLinecap="round" />
                   </svg>
                   <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="font-black text-3xl text-white">{genProgress}%</span>
                      <span className="text-[10px] font-black uppercase text-indigo-400 opacity-60">Parallel</span>
                   </div>
                </div>
                <h2 className="text-xl font-black uppercase tracking-[0.2em] text-white">Turbo Synthesizing...</h2>
                <p className="text-[11px] text-indigo-400 font-bold uppercase mt-2 bg-indigo-500/10 px-4 py-1.5 rounded-full border border-indigo-500/20">
                   Remaining Chunks: {Math.ceil(estRemaining)}s
                </p>
              </div>
            )}

            <div className="flex-1 flex flex-col min-h-[350px]">
              <div className="flex justify-between items-center mb-6">
                <span className="text-[10px] font-black opacity-30 uppercase tracking-[0.3em]">Studio Script Input</span>
                <div className="flex items-center gap-4">
                  {SAMPLE_SCRIPTS.slice(0, 2).map((s, idx) => (
                    <button key={idx} onClick={() => setText(s.text)} disabled={isGenerating} className="text-[9px] font-black uppercase px-3 py-1 bg-indigo-500/5 text-indigo-500 hover:bg-indigo-500/20 rounded-lg transition-all">{s.title}</button>
                  ))}
                  <span className="text-[10px] font-bold text-indigo-500 bg-indigo-500/10 px-3 py-1 rounded-lg border border-indigo-500/20">{charCount.toLocaleString()} Chars</span>
                </div>
              </div>
              <textarea
                value={text}
                disabled={isGenerating}
                onChange={(e) => setText(e.target.value)}
                placeholder="यहाँ अपना कंटेंट टाइप करें..."
                className="w-full flex-1 bg-transparent devanagari resize-none focus:outline-none text-2xl lg:text-3xl font-light leading-relaxed custom-scrollbar disabled:opacity-30 placeholder-slate-700"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-8 border-t border-indigo-500/10">
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-[10px] font-black opacity-30 uppercase tracking-widest">Male Engines</h3>
                  <button onClick={() => setIsFemaleEnabled(!isFemaleEnabled)} className={`text-[9px] font-black uppercase px-2 py-0.5 rounded transition-all ${isFemaleEnabled ? 'bg-pink-500 text-white' : 'bg-slate-800 text-slate-500'}`}>Female Focus</button>
                </div>
                <div className="h-[400px] overflow-y-auto custom-scrollbar pr-2 space-y-2">
                  { (isFemaleEnabled ? [...VOICES, FEMALE_VOICE] : VOICES).map(v => (
                    <VoiceCard key={v.id} voice={v} isActive={selectedVoice.id === v.id} disabled={isGenerating} isPreviewing={previewingVoiceId === v.id} onClick={() => setSelectedVoice(v)} onPreview={(e) => handlePreview(e, v)} />
                  ))}
                </div>
              </div>

              <div className="lg:col-span-2 space-y-8">
                <div>
                  <h3 className="text-[10px] font-black opacity-30 uppercase tracking-widest mb-4">Neural Tuning</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {EMOTIONS.map(e => (
                      <button key={e.id} onClick={() => setEmotion(e.id)} disabled={isGenerating} className={`p-4 rounded-2xl text-[10px] font-black uppercase tracking-tight border transition-all ${emotion === e.id ? 'bg-indigo-600 border-indigo-500 text-white shadow-[0_10px_30px_rgba(79,70,229,0.3)]' : 'bg-indigo-500/5 border-transparent opacity-60 hover:opacity-100 hover:bg-indigo-500/10'}`}>
                        {e.icon} {e.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-8 bg-indigo-500/5 p-6 rounded-3xl border border-indigo-500/10">
                   <div className="space-y-4">
                      <div className="flex justify-between items-center text-[10px] font-black opacity-30"><span>Playback Speed</span><span>{speed}x</span></div>
                      <input type="range" min="0.5" max="2.0" step="0.1" value={speed} disabled={isGenerating} onChange={(e) => setSpeed(parseFloat(e.target.value))} className="w-full accent-indigo-500 cursor-pointer" />
                   </div>
                   <div className="space-y-4">
                      <div className="flex justify-between items-center text-[10px] font-black opacity-30 uppercase tracking-tighter"><span>Neural Pathing</span><span>Parallel-V2</span></div>
                      <div className="h-6 flex items-center gap-1.5 overflow-hidden">
                        {[1,2,3,4,5,6,7,8].map(i => <div key={i} className={`flex-1 h-1 rounded-full ${isGenerating ? 'bg-indigo-500 animate-pulse' : 'bg-indigo-500/20'}`} style={{ animationDelay: `${i * 0.1}s` }}></div>)}
                      </div>
                   </div>
                </div>

                <div className="flex gap-4 pt-4">
                   <button onClick={() => handleGenerate(false)} disabled={isGenerating || !text.trim()} className={`flex-1 h-20 rounded-[30px] font-black text-base uppercase tracking-[0.4em] transition-all shadow-2xl ${isGenerating ? 'bg-slate-800 text-slate-600 cursor-wait' : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/40 active:scale-95'}`}>Turbo Synthesize</button>
                   <button onClick={() => handleGenerate(true)} disabled={isGenerating || !text.trim()} className="px-8 h-20 rounded-[30px] bg-emerald-600 text-white flex flex-col items-center justify-center gap-1 hover:bg-emerald-500 transition-all disabled:opacity-30 shadow-lg shadow-emerald-900/20">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                      <span className="text-[9px] font-black uppercase">Direct Export</span>
                   </button>
                </div>
              </div>
            </div>

            {error && (
              <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-3xl text-red-500 text-[11px] font-black uppercase flex items-center justify-between gap-4 animate-in slide-in-from-top-4">
                <span className="flex items-center gap-3">⚠️ {error}</span>
                <button onClick={() => handleGenerate()} className="px-5 py-2 bg-red-500 text-white rounded-xl font-bold tracking-widest hover:bg-red-600 transition-colors">Emergency Retry</button>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-4 h-full overflow-hidden">
          <div className="glass-panel rounded-[40px] p-8 h-full flex flex-col shadow-xl border-indigo-500/10">
            <h2 className="text-[12px] font-black uppercase tracking-[0.2em] border-b border-indigo-500/10 pb-6 mb-6 flex justify-between items-center">
               Studio Archive 
               <span className="bg-indigo-600 text-[10px] px-2 py-0.5 rounded-lg text-white">{history.length}</span>
            </h2>
            <Suspense fallback={<div className="flex-1 flex items-center justify-center"><div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div></div>}>
              <HistorySection history={history} onPlay={playFromHistory} onDownload={handleDownload} onDelete={(id) => setHistory(prev => prev.filter(x => x.id !== id))} />
            </Suspense>
          </div>
        </div>
      </main>

      {isPlaying && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 w-full max-w-xl px-4 z-[100] animate-in slide-in-from-bottom-20 duration-500">
          <div className="glass-panel p-6 rounded-[30px] bg-indigo-600 text-white flex items-center gap-8 shadow-[0_30px_80px_rgba(0,0,0,0.6)] border-indigo-400">
             <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-tr from-black/20 to-transparent"></div>
                <div className="flex gap-1.5 items-end h-6 z-10">
                   {[1,2,3,4,5].map(i => <div key={i} className="w-1 bg-white rounded-full animate-bounce" style={{ height: `${20+Math.random()*80}%`, animationDuration: `${0.5+i*0.1}s` }}></div>)}
                </div>
             </div>
             <div className="flex-1 truncate">
                <p className="text-[10px] font-black opacity-60 uppercase tracking-[0.3em] mb-1">Monitoring Neural Output</p>
                <p className="text-lg font-bold truncate italic">Mr. Ajay Voice • {selectedVoice.name}</p>
             </div>
             <button onClick={stopAllAudio} className="w-14 h-14 rounded-2xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all border border-white/20">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
             </button>
          </div>
        </div>
      )}

      <footer className="h-16 border-t border-indigo-500/5 flex items-center justify-center bg-black/40 text-slate-500 text-[9px] font-black tracking-[0.5em] uppercase">
        Turbo Neural Engine v2.5 • Professional Synthesis Environment • Unlimited Chars
      </footer>
    </div>
  );
};

export default App;
