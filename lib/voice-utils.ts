export function extractAvatarSeed(avatarUrl: string): string {
  // Extract seed from URL like "https://api.dicebear.com/7.x/avataaars/svg?seed=sarah"
  try {
    const url = new URL(avatarUrl);
    const seedParam = url.searchParams.get('seed');
    return seedParam || 'default';
  } catch {
    // Fallback parsing for malformed URLs
    const match = avatarUrl.match(/seed=([^&]+)/);
    return match ? match[1] : 'default';
  }
}

// Avatar characteristics detection
export function getAvatarCharacteristics(avatarUrl: string): {
  gender: 'female' | 'male' | 'neutral';
  age: 'young' | 'adult' | 'mature';
  personality: 'professional' | 'friendly' | 'casual';
  name: string;
} {
  const seed = extractAvatarSeed(avatarUrl).toLowerCase();
  
  // Character profiles based on avatar seeds
  const profiles: { [key: string]: {
    gender: 'female' | 'male' | 'neutral';
    age: 'young' | 'adult' | 'mature';
    personality: 'professional' | 'friendly' | 'casual';
  }} = {
    'sarah': { gender: 'female', age: 'young', personality: 'professional' },
    'michael': { gender: 'male', age: 'adult', personality: 'professional' },
    'emily': { gender: 'female', age: 'adult', personality: 'friendly' },
    'john': { gender: 'male', age: 'adult', personality: 'casual' },
    'jane': { gender: 'female', age: 'adult', personality: 'professional' },
    'alex': { gender: 'neutral', age: 'young', personality: 'casual' },
  };
  
  const profile = profiles[seed] || { gender: 'neutral', age: 'adult', personality: 'professional' };
  
  return {
    ...profile,
    name: seed.charAt(0).toUpperCase() + seed.slice(1),
  };
}

// Smallest.ai Lightning TTS voices (best quality, ultra-low latency)
export function getSmallestVoice(avatarUrl: string): string {
  const { gender, age } = getAvatarCharacteristics(avatarUrl);
  
  // Smallest.ai voice IDs
  const voices = {
    female: {
      young: 'emily',    // Young professional female
      adult: 'sarah',    // Mature professional female  
      mature: 'linda',   // Older professional female
    },
    male: {
      young: 'adam',     // Young professional male
      adult: 'michael',  // Mature professional male
      mature: 'james',   // Older professional male
    },
    neutral: {
      young: 'alex',     // Gender neutral young
      adult: 'jordan',  // Gender neutral adult
      mature: 'jordan', // Default to adult
    },
  };
  
  return voices[gender][age] || 'emily';
}

// CAMB.ai MARS TTS voices (high quality neural)
export function getCambVoice(avatarUrl: string): number {
  const { gender, age } = getAvatarCharacteristics(avatarUrl);
  
  // CAMB.ai voice IDs (example IDs - actual IDs from their API)
  const voices = {
    female: {
      young: 7299,   // Young female professional
      adult: 7300,   // Adult female professional
      mature: 7301,  // Mature female professional
    },
    male: {
      young: 7302,   // Young male professional
      adult: 7303,   // Adult male professional
      mature: 7304,  // Mature male professional
    },
    neutral: {
      young: 7305,
      adult: 7306,
      mature: 7306,
    },
  };
  
  return voices[gender][age] || 7299;
}

// ElevenLabs voices (high quality, character-specific)
export function getElevenLabsVoice(avatarUrl: string): string {
  const seed = extractAvatarSeed(avatarUrl).toLowerCase();
  
  // Character-specific ElevenLabs voice IDs
  const characterVoices: { [key: string]: string } = {
    'sarah': 'Xb7hH8MSUJpSbSDYk0k2',   // Sarah - Young professional female
    'michael': 'pNInz6obpgDQGcFmaJgB', // Michael - Authoritative male
    'emily': 'XB0fDUnXU5powFXDhCwa',   // Emily - Warm friendly female
  };
  
  // Fallback to gender-based selection
  const { gender, age } = getAvatarCharacteristics(avatarUrl);
  
  const fallbackVoices = {
    female: {
      young: 'Xb7hH8MSUJpSbSDYk0k2',  // Sarah
      adult: 'XB0fDUnXU5powFXDhCwa',  // Bella
      mature: 'Xb7hH8MSUJpSbSDYk0k2', // Sarah
    },
    male: {
      young: 'pNInz6obpgDQGcFmaJgB',  // Adam
      adult: 'pNInz6obpgDQGcFmaJgB',  // Adam
      mature: 'pNInz6obpgDQGcFmaJgB', // Adam
    },
    neutral: {
      young: 'Xb7hH8MSUJpSbSDYk0k2',
      adult: 'pNInz6obpgDQGcFmaJgB',
      mature: 'pNInz6obpgDQGcFmaJgB',
    },
  };
  
  return characterVoices[seed] || fallbackVoices[gender][age] || 'Xb7hH8MSUJpSbSDYk0k2';
}

// Google TTS voices (WaveNet)
export function getGoogleVoice(avatarUrl: string): string {
  const { gender, age } = getAvatarCharacteristics(avatarUrl);
  
  const voices = {
    female: {
      young: 'en-US-Wavenet-F',
      adult: 'en-US-Wavenet-C',
      mature: 'en-US-Wavenet-E',
    },
    male: {
      young: 'en-US-Wavenet-A',
      adult: 'en-US-Wavenet-D',
      mature: 'en-US-Wavenet-B',
    },
    neutral: {
      young: 'en-US-Wavenet-A',
      adult: 'en-US-Wavenet-D',
      mature: 'en-US-Wavenet-B',
    },
  };
  
  return voices[gender][age] || 'en-US-Wavenet-A';
}

// OpenAI TTS voices (alloy, echo, fable, onyx, nova, shimmer)
export function getOpenAIVoice(avatarUrl: string): string {
  const { gender, age, personality } = getAvatarCharacteristics(avatarUrl);
  
  // Map characteristics to OpenAI voices
  const voices = {
    female: {
      professional: 'nova',    // Professional female
      friendly: 'shimmer',     // Warm female
      casual: 'fable',         // Casual female
    },
    male: {
      professional: 'onyx',    // Authoritative male
      friendly: 'echo',        // Friendly male
      casual: 'echo',          // Casual male
    },
    neutral: {
      professional: 'alloy',   // Neutral professional
      friendly: 'alloy',       // Neutral friendly
      casual: 'alloy',         // Neutral casual
    },
  };
  
  return voices[gender][personality] || 'alloy';
}

// Legacy function for backward compatibility
export function getVoiceForAvatar(avatarUrl: string): string {
  return getGoogleVoice(avatarUrl);
}
