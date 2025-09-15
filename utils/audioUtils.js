const ffmpeg = require("fluent-ffmpeg");

/**
 * Language code to name mapping
 */
const LANGUAGE_MAP = {
  'eng': 'English',
  'en': 'English',
  'english': 'English',
  'tam': 'Tamil',
  'ta': 'Tamil',
  'tamil': 'Tamil',
  'tel': 'Telugu',
  'te': 'Telugu',
  'telugu': 'Telugu',
  'hin': 'Hindi',
  'hi': 'Hindi',
  'hindi': 'Hindi',
  'kan': 'Kannada',
  'kn': 'Kannada',
  'kannada': 'Kannada',
  'mal': 'Malayalam',
  'ml': 'Malayalam',
  'malayalam': 'Malayalam',
  'spa': 'Spanish',
  'es': 'Spanish',
  'spanish': 'Spanish',
  'fre': 'French',
  'fr': 'French',
  'french': 'French',
  'ger': 'German',
  'de': 'German',
  'german': 'German',
  'jpn': 'Japanese',
  'ja': 'Japanese',
  'japanese': 'Japanese',
  'kor': 'Korean',
  'ko': 'Korean',
  'korean': 'Korean',
  'chi': 'Chinese',
  'zh': 'Chinese',
  'chinese': 'Chinese',
  'ara': 'Arabic',
  'ar': 'Arabic',
  'arabic': 'Arabic',
  'por': 'Portuguese',
  'pt': 'Portuguese',
  'portuguese': 'Portuguese',
  'rus': 'Russian',
  'ru': 'Russian',
  'russian': 'Russian',
  'ita': 'Italian',
  'it': 'Italian',
  'italian': 'Italian',
  'dut': 'Dutch',
  'nl': 'Dutch',
  'dutch': 'Dutch',
  'swe': 'Swedish',
  'sv': 'Swedish',
  'swedish': 'Swedish',
  'nor': 'Norwegian',
  'no': 'Norwegian',
  'norwegian': 'Norwegian',
  'dan': 'Danish',
  'da': 'Danish',
  'danish': 'Danish',
  'fin': 'Finnish',
  'fi': 'Finnish',
  'finnish': 'Finnish',
  'pol': 'Polish',
  'pl': 'Polish',
  'polish': 'Polish',
  'cze': 'Czech',
  'cs': 'Czech',
  'czech': 'Czech',
  'hun': 'Hungarian',
  'hu': 'Hungarian',
  'hungarian': 'Hungarian',
  'gre': 'Greek',
  'el': 'Greek',
  'greek': 'Greek',
  'tur': 'Turkish',
  'tr': 'Turkish',
  'turkish': 'Turkish',
  'heb': 'Hebrew',
  'he': 'Hebrew',
  'hebrew': 'Hebrew',
  'tha': 'Thai',
  'th': 'Thai',
  'thai': 'Thai',
  'vie': 'Vietnamese',
  'vi': 'Vietnamese',
  'vietnamese': 'Vietnamese',
  'ind': 'Indonesian',
  'id': 'Indonesian',
  'indonesian': 'Indonesian',
  'may': 'Malay',
  'ms': 'Malay',
  'malay': 'Malay',
  'fil': 'Filipino',
  'tl': 'Filipino',
  'filipino': 'Filipino',
  'urd': 'Urdu',
  'ur': 'Urdu',
  'urdu': 'Urdu',
  'ben': 'Bengali',
  'bn': 'Bengali',
  'bengali': 'Bengali',
  'guj': 'Gujarati',
  'gu': 'Gujarati',
  'gujarati': 'Gujarati',
  'mar': 'Marathi',
  'mr': 'Marathi',
  'marathi': 'Marathi',
  'pan': 'Punjabi',
  'pa': 'Punjabi',
  'punjabi': 'Punjabi'
};

/**
 * Get audio language from stream metadata
 * @param {Object} stream - Audio stream object
 * @returns {string} - Language name
 */
function getAudioLanguage(stream) {
  if (!stream.tags) return 'Unknown';
  
  // Check multiple possible language fields
  const languageFields = [
    'language',
    'LANGUAGE',
    'lang',
    'LANG',
    'audio_language',
    'AUDIO_LANGUAGE',
    'track_language',
    'TRACK_LANGUAGE'
  ];
  
  for (const field of languageFields) {
    if (stream.tags[field]) {
      const langCode = stream.tags[field].toLowerCase();
      return LANGUAGE_MAP[langCode] || stream.tags[field];
    }
  }
  
  // Check if language is embedded in title
  const title = stream.tags.title || stream.tags.TITLE || '';
  const titleLower = title.toLowerCase();
  
  // Look for language patterns in title
  for (const [code, name] of Object.entries(LANGUAGE_MAP)) {
    if (titleLower.includes(code) || titleLower.includes(name.toLowerCase())) {
      return name;
    }
  }
  
  // Check for common language patterns
  const languagePatterns = [
    { pattern: /(?:audio|track|sound)[\s_-]*(eng|english)/i, lang: 'English' },
    { pattern: /(?:audio|track|sound)[\s_-]*(tam|tamil)/i, lang: 'Tamil' },
    { pattern: /(?:audio|track|sound)[\s_-]*(tel|telugu)/i, lang: 'Telugu' },
    { pattern: /(?:audio|track|sound)[\s_-]*(hin|hindi)/i, lang: 'Hindi' },
    { pattern: /(?:audio|track|sound)[\s_-]*(kan|kannada)/i, lang: 'Kannada' },
    { pattern: /(?:audio|track|sound)[\s_-]*(mal|malayalam)/i, lang: 'Malayalam' },
    { pattern: /(?:audio|track|sound)[\s_-]*(spa|spanish)/i, lang: 'Spanish' },
    { pattern: /(?:audio|track|sound)[\s_-]*(fre|french)/i, lang: 'French' },
    { pattern: /(?:audio|track|sound)[\s_-]*(ger|german)/i, lang: 'German' },
    { pattern: /(?:audio|track|sound)[\s_-]*(jpn|japanese)/i, lang: 'Japanese' },
    { pattern: /(?:audio|track|sound)[\s_-]*(kor|korean)/i, lang: 'Korean' },
    { pattern: /(?:audio|track|sound)[\s_-]*(chi|chinese)/i, lang: 'Chinese' }
  ];
  
  for (const { pattern, lang } of languagePatterns) {
    if (pattern.test(title)) {
      return lang;
    }
  }
  
  return 'Unknown';
}

/**
 * Get audio title from stream metadata
 * @param {Object} stream - Audio stream object
 * @param {number} index - Track index
 * @returns {string} - Audio track title
 */
function getAudioTitle(stream, index) {
  if (!stream.tags) return `Track ${index + 1}`;
  
  // Check multiple possible title fields
  const titleFields = [
    'title',
    'TITLE',
    'audio_title',
    'AUDIO_TITLE',
    'track_title',
    'TRACK_TITLE',
    'handler_name',
    'HANDLER_NAME'
  ];
  
  for (const field of titleFields) {
    if (stream.tags[field] && stream.tags[field].trim()) {
      return stream.tags[field].trim();
    }
  }
  
  // If no title found, use language + track number
  const language = getAudioLanguage(stream);
  if (language !== 'Unknown') {
    return `${language} Track ${index + 1}`;
  }
  
  return `Track ${index + 1}`;
}

/**
 * Get all audio tracks from video metadata
 * @param {Object} metadata - FFprobe metadata object
 * @returns {Array} - Array of audio track objects
 */
function getAllAudioTracks(metadata) {
  // getAllAudioTracks called with metadata
  //   hasStreams: !!metadata.streams,
  //   streamsLength: metadata.streams?.length || 0,
  //   streams: metadata.streams?.map(s => ({ index: s.index, codec_type: s.codec_type, codec_name: s.codec_name })) || []
  // });
  
  const audioStreams = metadata.streams.filter(stream => stream.codec_type === 'audio');
  // Filtered audio streams
  
  if (!audioStreams.length) {
    // No audio streams found in metadata
    return [];
  }

  // Debug: Log stream metadata to help identify language information (uncomment for debugging)
  // Audio streams metadata processed
  //   index: stream.index,
  //   codec: stream.codec_name,
  //   tags: stream.tags,
  //   disposition: stream.disposition
  // })));

  return audioStreams.map((stream, index) => {
    const bitrate = parseInt(stream.bit_rate) || 0;
    const sampleRate = parseInt(stream.sample_rate) || 48000;
    const channels = parseInt(stream.channels) || 2;
    const codec = stream.codec_name;
    
    // Enhanced language detection - check multiple possible locations
    const language = getAudioLanguage(stream);
    const title = getAudioTitle(stream, index);

    // Determine quality level
    let quality = 'Standard';
    if (bitrate >= 320000) quality = 'High';
    else if (bitrate >= 256000) quality = 'Good';
    else if (bitrate >= 192000) quality = 'Standard';
    else if (bitrate >= 128000) quality = 'Basic';
    else quality = 'Low';

    const track = {
      index: index,
      streamIndex: stream.index,
      codec: codec,
      bitrate: bitrate,
      sampleRate: sampleRate,
      channels: channels,
      language: language,
      title: title,
      quality: quality,
      isBrowserCompatible: isAudioBrowserCompatible(stream),
      displayName: language !== 'Unknown' ? 
        `${language} (${quality} - ${Math.round(bitrate/1000)}kbps)` : 
        `${title} (${quality} - ${Math.round(bitrate/1000)}kbps)`
    };
    
    // Created audio track
    return track;
  });
}

/**
 * Get optimal audio settings for a specific audio track
 * @param {Object} audioTrack - Audio track object
 * @returns {Object} - Audio settings object
 */
function getOptimalAudioSettingsForTrack(audioTrack) {
  if (!audioTrack) {
    return getDefaultAudioSettings();
  }

  const sourceBitrate = audioTrack.bitrate;
  const sourceSampleRate = audioTrack.sampleRate;
  const sourceChannels = audioTrack.channels;
  const sourceCodec = audioTrack.codec;

  // Determine optimal bitrate based on source quality
  let targetBitrate;
  if (sourceBitrate >= 320000) { // 320kbps or higher
    targetBitrate = "320k";
  } else if (sourceBitrate >= 256000) { // 256kbps or higher
    targetBitrate = "256k";
  } else if (sourceBitrate >= 192000) { // 192kbps or higher
    targetBitrate = "192k";
  } else if (sourceBitrate >= 128000) { // 128kbps or higher
    targetBitrate = "128k";
  } else {
    targetBitrate = "128k"; // minimum for decent quality
  }

  // Determine optimal sample rate (browsers support up to 48kHz well)
  const targetSampleRate = Math.min(sourceSampleRate, 48000);

  // Determine optimal channels (stereo is most compatible)
  const targetChannels = Math.min(sourceChannels, 2);

  return {
    codec: "aac", // AAC is most compatible with browsers
    bitrate: targetBitrate,
    sampleRate: targetSampleRate,
    channels: targetChannels,
    sourceInfo: {
      bitrate: sourceBitrate,
      sampleRate: sourceSampleRate,
      channels: sourceChannels,
      codec: sourceCodec
    }
  };
}

/**
 * Get optimal audio settings based on source video metadata (legacy function)
 * @param {Object} metadata - FFprobe metadata object
 * @returns {Object} - Audio settings object
 */
function getOptimalAudioSettings(metadata) {
  const audioStream = metadata.streams.find(stream => stream.codec_type === 'audio');
  
  if (!audioStream) {
    return getDefaultAudioSettings();
  }

  const audioTrack = {
    bitrate: parseInt(audioStream.bit_rate) || 0,
    sampleRate: parseInt(audioStream.sample_rate) || 48000,
    channels: parseInt(audioStream.channels) || 2,
    codec: audioStream.codec_name
  };

  return getOptimalAudioSettingsForTrack(audioTrack);
}

/**
 * Get default audio settings for fallback
 * @returns {Object} - Default audio settings
 */
function getDefaultAudioSettings() {
  return {
    codec: "aac",
    bitrate: "192k",
    sampleRate: 48000,
    channels: 2,
    sourceInfo: null
  };
}

/**
 * Get audio settings for high-quality videos (4K, Blu-ray, etc.)
 * @returns {Object} - High-quality audio settings
 */
function getHighQualityAudioSettings() {
  return {
    codec: "aac",
    bitrate: "320k",
    sampleRate: 48000,
    channels: 2
  };
}

/**
 * Get audio settings for standard quality videos
 * @returns {Object} - Standard quality audio settings
 */
function getStandardQualityAudioSettings() {
  return {
    codec: "aac",
    bitrate: "192k",
    sampleRate: 48000,
    channels: 2
  };
}

/**
 * Check if source audio is already browser-compatible
 * @param {Object} audioStream - Audio stream metadata
 * @returns {Boolean} - True if compatible, false otherwise
 */
function isAudioBrowserCompatible(audioStream) {
  if (!audioStream) return false;
  
  const codec = audioStream.codec_name;
  const sampleRate = parseInt(audioStream.sample_rate) || 0;
  const channels = parseInt(audioStream.channels) || 0;
  
  // Check if it's AAC and within browser limits
  return codec === 'aac' && 
         sampleRate <= 48000 && 
         channels <= 2;
}

/**
 * Get FFmpeg audio output options based on settings
 * @param {Object} settings - Audio settings object
 * @returns {Array} - Array of FFmpeg output options
 */
function getAudioOutputOptions(settings) {
  const options = [
    `-c:a ${settings.codec}`,
    `-b:a ${settings.bitrate}`,
    `-ar ${settings.sampleRate}`,
    `-ac ${settings.channels}`
  ];

  // Add quality settings for AAC
  if (settings.codec === 'aac') {
    options.push('-aac_coder twoloop'); // Better quality AAC encoding
    options.push('-profile:a aac_low'); // AAC-LC profile for better compatibility
  }

  return options;
}

module.exports = {
  getAllAudioTracks,
  getOptimalAudioSettingsForTrack,
  getOptimalAudioSettings,
  getDefaultAudioSettings,
  getHighQualityAudioSettings,
  getStandardQualityAudioSettings,
  isAudioBrowserCompatible,
  getAudioOutputOptions,
  getAudioLanguage,
  getAudioTitle,
  LANGUAGE_MAP
};
