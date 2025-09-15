const { getAudioLanguage, getAudioTitle, LANGUAGE_MAP } = require('./audioUtils');

// Subtitle codec compatibility with browsers
const SUBTITLE_BROWSER_COMPATIBILITY = {
  'subrip': { compatible: true, name: 'SRT' },
  'srt': { compatible: true, name: 'SRT' },
  'webvtt': { compatible: true, name: 'WebVTT' },
  'vtt': { compatible: true, name: 'WebVTT' },
  'ass': { compatible: false, name: 'ASS/SSA' },
  'ssa': { compatible: false, name: 'ASS/SSA' },
  'dvd_subtitle': { compatible: false, name: 'DVD Sub' },
  'hdmv_pgs_subtitle': { compatible: false, name: 'PGS' },
  'pgs': { compatible: false, name: 'PGS' }
};

/**
 * Check if a subtitle codec is browser compatible
 */
function isSubtitleBrowserCompatible(codecName) {
  if (!codecName) return false;
  const codec = codecName.toLowerCase();
  return SUBTITLE_BROWSER_COMPATIBILITY[codec]?.compatible || false;
}

/**
 * Get subtitle codec display name
 */
function getSubtitleCodecName(codecName) {
  if (!codecName) return 'Unknown';
  const codec = codecName.toLowerCase();
  return SUBTITLE_BROWSER_COMPATIBILITY[codec]?.name || codecName.toUpperCase();
}

/**
 * Get subtitle language from stream
 */
function getSubtitleLanguage(stream) {
  return getAudioLanguage(stream); // Reuse audio language detection logic
}

/**
 * Get subtitle title with fallback
 */
function getSubtitleTitle(stream, index) {
  const title = stream.tags?.title || stream.tags?.handler_name;
  if (title && title !== 'SubtitleHandler') {
    return title;
  }
  
  const language = getSubtitleLanguage(stream);
  const codec = getSubtitleCodecName(stream.codec_name);
  return `${language} (${codec})`;
}

/**
 * Extract all subtitle tracks from video metadata
 */
function getAllSubtitleTracks(metadata) {
  if (!metadata || !metadata.streams) {
    // No metadata or streams found for subtitle detection
    return [];
  }

  const subtitleStreams = metadata.streams.filter(stream => stream.codec_type === 'subtitle');
  // Found subtitle streams in metadata

  const subtitleTracks = subtitleStreams.map((stream, arrayIndex) => {
    const language = getSubtitleLanguage(stream);
    const codecName = stream.codec_name || 'unknown';
    const isBrowserCompatible = isSubtitleBrowserCompatible(codecName);
    const title = getSubtitleTitle(stream, arrayIndex);
    
    const track = {
      index: arrayIndex, // 0-based index in subtitle array
      streamIndex: stream.index, // Original stream index from FFmpeg
      language: language,
      codec: codecName,
      codecDisplayName: getSubtitleCodecName(codecName),
      isBrowserCompatible: isBrowserCompatible,
      title: title,
      displayName: `${language} (${getSubtitleCodecName(codecName)})`,
      tags: stream.tags || {},
      disposition: stream.disposition || {},
      isDefault: stream.disposition?.default === 1,
      isForced: stream.disposition?.forced === 1
    };

    // Subtitle track processed
    //   language: track.language,
    //   codec: track.codec,
    //   compatible: track.isBrowserCompatible,
    //   streamIndex: track.streamIndex,
    //   displayName: track.displayName
    // });

    return track;
  });

  // Sort by preference: browser compatible first, then by language
  subtitleTracks.sort((a, b) => {
    // Browser compatible first
    if (a.isBrowserCompatible !== b.isBrowserCompatible) {
      return b.isBrowserCompatible ? 1 : -1;
    }
    
    // Default subtitles first
    if (a.isDefault !== b.isDefault) {
      return b.isDefault ? 1 : -1;
    }
    
    // Then by language preference (English, then alphabetical)
    if (a.language === 'English' && b.language !== 'English') return -1;
    if (b.language === 'English' && a.language !== 'English') return 1;
    
    return a.language.localeCompare(b.language);
  });

  // Processed subtitle tracks
  //   subtitleTracks.map(track => ({
  //     index: track.index,
  //     language: track.language,
  //     codec: track.codec,
  //     compatible: track.isBrowserCompatible,
  //     displayName: track.displayName
  //   }))
  // );

  return subtitleTracks;
}

/**
 * Get optimal subtitle settings for streaming
 */
function getOptimalSubtitleSettings(subtitleTrack) {
  if (!subtitleTrack) {
    return {
      enabled: false,
      trackIndex: -1,
      convert: false,
      codec: null
    };
  }

  const settings = {
    enabled: true,
    trackIndex: subtitleTrack.index,
    streamIndex: subtitleTrack.streamIndex,
    language: subtitleTrack.language,
    codec: subtitleTrack.codec,
    convert: false,
    outputCodec: null
  };

  // Check if we need to convert the subtitle format
  if (!subtitleTrack.isBrowserCompatible) {
    // Subtitle codec not browser compatible, will convert to WebVTT
    settings.convert = true;
    settings.outputCodec = 'webvtt';
  } else {
    // Subtitle codec is browser compatible, using as-is
    settings.convert = false;
    settings.outputCodec = subtitleTrack.codec;
  }

  return settings;
}

/**
 * Get subtitle output options for FFmpeg
 */
function getSubtitleOutputOptions(subtitleSettings) {
  const options = [];

  if (!subtitleSettings.enabled) {
    return options;
  }

  // For MP4 streaming, we need to be more careful with subtitle handling
  // MP4 containers have limited subtitle support, especially with piped output
  
  if (subtitleSettings.convert || subtitleSettings.codec !== 'subrip') {
    // Convert to WebVTT for better browser/MP4 compatibility
    options.push(`-c:s webvtt`);
  } else {
    // For SRT, still convert to WebVTT for MP4 streaming compatibility
    options.push(`-c:s webvtt`);
  }

  return options;
}

/**
 * Get subtitle format for HTTP response
 */
function getSubtitleContentType(codec) {
  const codecLower = codec?.toLowerCase() || '';
  
  switch (codecLower) {
    case 'webvtt':
    case 'vtt':
      return 'text/vtt';
    case 'subrip':
    case 'srt':
      return 'text/srt';
    default:
      return 'text/plain';
  }
}

/**
 * Check if subtitle should be embedded in video stream
 */
function shouldEmbedSubtitles(subtitleSettings) {
  // For now, we'll extract subtitles as separate tracks
  // This allows users to toggle them on/off
  return false;
}

module.exports = {
  getAllSubtitleTracks,
  getOptimalSubtitleSettings,
  getSubtitleOutputOptions,
  getSubtitleContentType,
  getSubtitleLanguage,
  getSubtitleTitle,
  getSubtitleCodecName,
  isSubtitleBrowserCompatible,
  shouldEmbedSubtitles,
  SUBTITLE_BROWSER_COMPATIBILITY
};
