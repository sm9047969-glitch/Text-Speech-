
import { GoogleGenAI, Modality } from "@google/genai";
import { Voice, SpeechStyle } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Performance Cache for Audio Buffers
const audioBufferCache = new Map<string, AudioBuffer>();

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Optimized decoding: reuse shared context for performance
 */
async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

export const mergeAudioBuffers = (buffers: AudioBuffer[], ctx: AudioContext): AudioBuffer => {
  if (buffers.length === 0) return ctx.createBuffer(1, 1, 24000);
  if (buffers.length === 1) return buffers[0];

  const totalLength = buffers.reduce((acc, buf) => acc + buf.length, 0);
  const mergedBuffer = ctx.createBuffer(
    buffers[0].numberOfChannels,
    totalLength,
    buffers[0].sampleRate
  );

  for (let channel = 0; channel < mergedBuffer.numberOfChannels; channel++) {
    const channelData = mergedBuffer.getChannelData(channel);
    let offset = 0;
    for (const buffer of buffers) {
      channelData.set(buffer.getChannelData(channel), offset);
      offset += buffer.length;
    }
  }
  return mergedBuffer;
};

export function bufferToWav(buffer: AudioBuffer): Blob {
  const numOfChan = buffer.numberOfChannels;
  const length = buffer.length * numOfChan * 2 + 44;
  const outBuffer = new ArrayBuffer(length);
  const view = new DataView(outBuffer);
  let pos = 0;

  const setUint16 = (data: number) => { view.setUint16(pos, data, true); pos += 2; };
  const setUint32 = (data: number) => { view.setUint32(pos, data, true); pos += 4; };

  setUint32(0x46464952); // "RIFF"
  setUint32(length - 8);
  setUint32(0x45564157); // "WAVE"
  setUint32(0x20746d66); // "fmt "
  setUint32(16);
  setUint16(1); // PCM
  setUint16(numOfChan);
  setUint32(buffer.sampleRate);
  setUint32(buffer.sampleRate * 2 * numOfChan);
  setUint16(numOfChan * 2);
  setUint16(16);
  setUint32(0x61746164); // "data"
  setUint32(length - pos - 4);

  const channels = [];
  for (let i = 0; i < buffer.numberOfChannels; i++) channels.push(buffer.getChannelData(i));

  let offset = 0;
  while (pos < length) {
    for (let i = 0; i < numOfChan; i++) {
      let sample = Math.max(-1, Math.min(1, channels[i][offset]));
      sample = (sample < 0 ? sample * 0x8000 : sample * 0x7fff) | 0;
      view.setInt16(pos, sample, true);
      pos += 2;
    }
    offset++;
  }
  return new Blob([outBuffer], { type: 'audio/wav' });
}

export const splitTextIntoChunks = (text: string, maxChars: number = 500): string[] => {
  const chunks: string[] = [];
  const segments = text.split(/([।?!.|\n])/);
  
  let currentChunk = "";
  for (const segment of segments) {
    if ((currentChunk.length + segment.length) > maxChars && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      currentChunk = "";
    }
    currentChunk += segment;
  }
  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk.trim());
  }
  return chunks;
};

/**
 * Core synthesis function optimized for parallel execution
 */
export const generateHindiSpeech = async (
  text: string,
  voice: Voice,
  style: SpeechStyle = 'Normal',
  sharedContext?: AudioContext
): Promise<{ buffer: AudioBuffer }> => {
  const cacheKey = `${voice.id}-${style}-${text.trim().toLowerCase()}`;
  if (audioBufferCache.has(cacheKey)) {
    return { buffer: audioBufferCache.get(cacheKey)! };
  }

  let styleDetail = "";
  switch (style) {
    case 'Emotional': styleDetail = "Perform with deep resonance."; break;
    case 'Storytelling': styleDetail = "Dramatic narrative pauses."; break;
    case 'News Style': styleDetail = "Fast authoritative news delivery."; break;
    default: styleDetail = "Clear conversational Hindi.";
  }

  const systemInstruction = `Role: Pro Hindi Voice Artist. Engine: ${voice.geminiVoice}. Persona: ${voice.persona}. Style: ${styleDetail}. Output: Natural, human cadence.`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: `${systemInstruction}\n\nScript:\n${text}` }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: voice.geminiVoice },
        },
      },
    },
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64Audio) throw new Error("Synthesis failed.");

  const ctx = sharedContext || new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});
  const audioBuffer = await decodeAudioData(decode(base64Audio), ctx, 24000, 1);
  
  audioBufferCache.set(cacheKey, audioBuffer);
  return { buffer: audioBuffer };
};
