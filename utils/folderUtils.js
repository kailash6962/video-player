const fs = require('fs');
const path = require('path');

const VIDEOS_DIR = process.env.VIDEO_DIR;

/**
 * Resolves the actual folder name from a sanitized folder name
 * This handles special characters in folder names by finding the matching actual folder
 * @param {string} sanitizedFolderName - The sanitized folder name (e.g., from URL params)
 * @returns {string} - The actual folder name with special characters
 */
function resolveActualFolderName(sanitizedFolderName) {
  if (!sanitizedFolderName || sanitizedFolderName === "home") {
    return sanitizedFolderName;
  }

  try {
    const allFolders = fs.readdirSync(VIDEOS_DIR).filter(folder =>
      fs.statSync(path.join(VIDEOS_DIR, folder)).isDirectory()
    );
    
    // Find the folder that matches when sanitized
    const safeFolderName = sanitizedFolderName.replace(/[^a-zA-Z0-9_-]/g, '');
    const actualFolder = allFolders.find(folder => 
      folder.replace(/[^a-zA-Z0-9_-]/g, '') === safeFolderName
    );
    
    return actualFolder || sanitizedFolderName;
  } catch (error) {
    console.error('Error resolving folder name:', error);
    return sanitizedFolderName;
  }
}

module.exports = {
  resolveActualFolderName
};
