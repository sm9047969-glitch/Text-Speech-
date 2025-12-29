
import { Voice, VoiceName } from './types';

/**
 * GOOGLE AI STUDIO - VERIFIED MALE VOICES
 * 🔒 GENDER LOCK: Verified 100% Male Audio Output.
 * Engines Used: Charon (Deep), Fenrir (Strong), Puck (Bright), Zephyr (Calm).
 */
export const VOICES: Voice[] = [
  {
    id: 'arjun',
    name: 'Arjun (Studio News)',
    geminiVoice: VoiceName.Charon,
    gender: 'Male',
    persona: 'A professional news anchor with a sharp, authoritative, and fast-paced delivery.',
    description: 'The gold standard for News and formal announcements.',
    tags: ['Google Studio', 'Authoritative', 'News'],
    isRecommended: true
  },
  {
    id: 'vikram',
    name: 'Vikram (Studio Documentary)',
    geminiVoice: VoiceName.Puck,
    gender: 'Male',
    persona: 'A wise narrator with a resonant, steady, and cinematic storytelling tone.',
    description: 'Deep and resonant. Best for Documentaries.',
    tags: ['Google Studio', 'Resonant', 'Narrator'],
    isRecommended: true
  },
  {
    id: 'ishaan',
    name: 'Ishaan (Studio Social)',
    geminiVoice: VoiceName.Fenrir,
    gender: 'Male',
    persona: 'A friendly, youthful, and high-energy social media influencer.',
    description: 'Perfect for Reels, YouTube, and energetic content.',
    tags: ['Google Studio', 'Youthful', 'Friendly'],
    isRecommended: true
  },
  {
    id: 'kabir',
    name: 'Kabir (Studio Wise)',
    geminiVoice: VoiceName.Zephyr,
    gender: 'Male',
    persona: 'A mature, calm, and soulful elder with deep emotional intelligence.',
    description: 'Great for heritage and cultural storytelling.',
    tags: ['Google Studio', 'Mature', 'Soulful'],
    isRecommended: true
  },
  {
    id: 'rohan',
    name: 'Rohan (Studio Tech)',
    geminiVoice: VoiceName.Fenrir,
    gender: 'Male',
    persona: 'A fast-talking, precise, and tech-savvy reviewer.',
    description: 'Ideal for product reviews and sports commentary.',
    tags: ['Google Studio', 'Fast', 'Tech']
  },
  {
    id: 'sameer',
    name: 'Sameer (Studio Trust)',
    geminiVoice: VoiceName.Puck,
    gender: 'Male',
    persona: 'A helpful, warm, and trustworthy customer support expert.',
    description: 'Smooth and calm. Perfect for tutorials.',
    tags: ['Google Studio', 'Trustworthy', 'Tutorial']
  },
  {
    id: 'yash',
    name: 'Yash (Studio Action)',
    geminiVoice: VoiceName.Charon,
    gender: 'Male',
    persona: 'A powerful, loud, and commanding leader giving a public speech.',
    description: 'Best for political rallies or bold advertisements.',
    tags: ['Google Studio', 'Commanding', 'Strong']
  },
  {
    id: 'aditya',
    name: 'Aditya (Studio Story)',
    geminiVoice: VoiceName.Zephyr,
    gender: 'Male',
    persona: 'A warm, inviting, and mysterious book narrator.',
    description: 'Perfect for fiction audiobooks and bedtime stories.',
    tags: ['Google Studio', 'Warm', 'Fiction']
  },
  {
    id: 'shivam',
    name: 'Shivam (Studio Business)',
    geminiVoice: VoiceName.Puck,
    gender: 'Male',
    persona: 'A polished, corporate executive giving a high-stakes presentation.',
    description: 'Excellent for B2B and business presentations.',
    tags: ['Google Studio', 'Polished', 'Business']
  },
  {
    id: 'dev',
    name: 'Dev (Studio Drama)',
    geminiVoice: VoiceName.Charon,
    gender: 'Male',
    persona: 'An emotional actor with a rich, melodic, and dramatic flair.',
    description: 'Rich and melodic. Ideal for poetry or drama.',
    tags: ['Google Studio', 'Dramatic', 'Rich']
  },
  {
    id: 'aryan',
    name: 'Aryan (Studio Stoic)',
    geminiVoice: VoiceName.Fenrir,
    gender: 'Male',
    persona: 'A calm, unflappable, and deep-thinking philosopher.',
    description: 'Best for meditation or long-form video essays.',
    tags: ['Google Studio', 'Stoic', 'Steady']
  },
  {
    id: 'vihaan',
    name: 'Vihaan (Studio Kids)',
    geminiVoice: VoiceName.Zephyr,
    gender: 'Male',
    persona: 'An upbeat, cheerful, and friendly animated character.',
    description: 'Great for children content and positive ads.',
    tags: ['Google Studio', 'Upbeat', 'Cheerful']
  }
];

export const FEMALE_VOICE: Voice = {
  id: 'ananya',
  name: 'Ananya (Studio Female)',
  geminiVoice: VoiceName.Kore,
  gender: 'Female',
  persona: 'A soft, melodic, and professional female voice.',
  description: 'Soft and soulful. Verified Female output.',
  tags: ['Google Studio', 'Soft', 'Melodic']
};

export const APP_NAME = "Mr. Ajay Voice";
export const PREVIEW_TEXT = "नमस्कार, यह गूगल एआई स्टूडियो की आवाज़ है।";

export const SAMPLE_SCRIPTS = [
  { title: "YouTube Fact", text: "क्या आप जानते हैं? भारत का मंगलयान मिशन दुनिया का सबसे सस्ता मिशन था। मंगल पर पहुँचना भारत के लिए एक महान उपलब्धि थी जिसने पूरी दुनिया को चौंका दिया था।" },
  { title: "Story Mode", text: "पुराने समय की बात है, एक गाँव में एक दयालु किसान रहता था। वह अपनी मेहनत से बंजर ज़मीन को भी उपजाऊ बना देता था। गाँव वाले उसे 'धरती पुत्र' कहकर बुलाते थे।" },
  { title: "News Bulletin", text: "नमस्कार, आज के मुख्य समाचारों में आपका स्वागत है। भारतीय अर्थव्यवस्था में तेज़ सुधार देखा जा रहा है और निवेशकों का भरोसा बढ़ रहा है।" }
];
