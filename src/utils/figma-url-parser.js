/**
 * Utility functions for working with Figma URLs and file keys
 */

/**
 * Extract file key from a Figma URL
 * @param {string} url - The Figma URL
 * @returns {string|null} The file key or null if invalid URL
 */
function extractFileKey(url) {
  if (!url || typeof url !== 'string') {
    return null;
  }

  // Figma URL patterns:
  // https://www.figma.com/file/:file_key/:file_name
  // https://www.figma.com/design/:file_key/:file_name
  // https://figma.com/file/:file_key/:file_name
  
  const patterns = [
    /figma\.com\/(?:file|design)\/([a-zA-Z0-9]+)/,
    /figma\.com\/[^\/]+\/([a-zA-Z0-9]+)/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  // If no pattern matches, check if the input is already a file key
  if (/^[a-zA-Z0-9]+$/.test(url) && url.length > 10) {
    return url;
  }

  return null;
}

/**
 * Validate if a string is a valid Figma file key
 * @param {string} key - The potential file key
 * @returns {boolean} True if valid file key format
 */
function isValidFileKey(key) {
  if (!key || typeof key !== 'string') {
    return false;
  }
  
  // Figma file keys are typically alphanumeric and 22+ characters
  return /^[a-zA-Z0-9]{15,}$/.test(key);
}

/**
 * Extract node ID from Figma URL
 * @param {string} url - The Figma URL
 * @returns {string|null} The node ID or null if not found
 */
function extractNodeId(url) {
  if (!url || typeof url !== 'string') {
    return null;
  }

  // Node IDs are typically after 'node-id=' in the URL
  const nodeMatch = url.match(/node-id=([^&]+)/);
  if (nodeMatch && nodeMatch[1]) {
    // URL decode the node ID
    return decodeURIComponent(nodeMatch[1]);
  }

  return null;
}

/**
 * Parse a complete Figma URL and extract all useful parts
 * @param {string} url - The Figma URL
 * @returns {Object} Parsed URL components
 */
function parseFigmaUrl(url) {
  const result = {
    fileKey: null,
    nodeId: null,
    fileName: null,
    isValid: false,
    originalUrl: url
  };

  if (!url || typeof url !== 'string') {
    return result;
  }

  // Extract file key
  result.fileKey = extractFileKey(url);
  
  // Extract node ID
  result.nodeId = extractNodeId(url);
  
  // Extract file name (if present in URL)
  const nameMatch = url.match(/figma\.com\/(?:file|design)\/[^\/]+\/([^\/\?]+)/);
  if (nameMatch && nameMatch[1]) {
    result.fileName = decodeURIComponent(nameMatch[1].replace(/-/g, ' '));
  }

  result.isValid = !!result.fileKey;

  return result;
}

module.exports = {
  extractFileKey,
  isValidFileKey,
  extractNodeId,
  parseFigmaUrl
}; 