const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: process.env.NODE_ENV === 'production' ? 'env.production' : 'env.development' });

class FigmaFileReader {
  constructor() {
    this.token = process.env.FIGMA_TOKEN;
    this.baseUrl = 'https://api.figma.com/v1';
    
    if (!this.token) {
      throw new Error('FIGMA_TOKEN environment variable is required');
    }
  }

  /**
   * Read a Figma file by its key
   * @param {string} fileKey - The Figma file key (from the URL)
   * @param {Object} options - Optional parameters
   * @param {string} options.version - Specific version ID
   * @param {string} options.ids - Comma separated list of node IDs
   * @param {number} options.depth - How deep to traverse the document tree
   * @param {string} options.geometry - Set to "paths" to export vector data
   * @param {string} options.pluginData - Plugin IDs to include data for
   * @param {boolean} options.branchData - Include branch metadata
   * @returns {Promise<Object>} The Figma file data
   */
  async readFile(fileKey, options = {}) {
    try {
      console.log(`📄 Reading Figma file: ${fileKey}`);
      
      // Build query parameters
      const params = new URLSearchParams();
      if (options.version) params.append('version', options.version);
      if (options.ids) params.append('ids', options.ids);
      if (options.depth) params.append('depth', options.depth.toString());
      if (options.geometry) params.append('geometry', options.geometry);
      if (options.pluginData) params.append('plugin_data', options.pluginData);
      if (options.branchData) params.append('branch_data', options.branchData.toString());

      const url = `${this.baseUrl}/files/${fileKey}${params.toString() ? '?' + params.toString() : ''}`;
      
      console.log(`🔗 API URL: ${url}`);
      
      const response = await axios.get(url, {
        headers: {
          'X-FIGMA-TOKEN': this.token,
          'Content-Type': 'application/json'
        }
      });

      console.log(`✅ Successfully read file: ${response.data.name}`);
      console.log(`📊 File info:`);
      console.log(`   - Name: ${response.data.name}`);
      console.log(`   - Version: ${response.data.version}`);
      console.log(`   - Last Modified: ${response.data.lastModified}`);
      console.log(`   - Editor Type: ${response.data.editorType}`);
      console.log(`   - Schema Version: ${response.data.schemaVersion}`);
      
      if (response.data.branches && response.data.branches.length > 0) {
        console.log(`   - Branches: ${response.data.branches.length}`);
      }

      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  /**
   * Save Figma file data to a JSON file
   * @param {Object} fileData - The Figma file data
   * @param {string} outputPath - Path to save the file
   */
  async saveToFile(fileData, outputPath = null) {
    try {
      if (!outputPath) {
        outputPath = `output/${fileData.name.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.json`;
      }

      // Ensure output directory exists
      const dir = path.dirname(outputPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      await fs.promises.writeFile(outputPath, JSON.stringify(fileData, null, 2));
      console.log(`💾 File saved to: ${outputPath}`);
      return outputPath;
    } catch (error) {
      console.error('❌ Error saving file:', error.message);
      throw error;
    }
  }

  /**
   * Extract specific information from the Figma file
   * @param {Object} fileData - The Figma file data
   * @returns {Object} Extracted information
   */
  extractInfo(fileData) {
    const info = {
      metadata: {
        name: fileData.name,
        version: fileData.version,
        lastModified: fileData.lastModified,
        editorType: fileData.editorType
      },
      pages: [],
      components: Object.keys(fileData.components || {}).length,
      componentSets: Object.keys(fileData.componentSets || {}).length,
      styles: Object.keys(fileData.styles || {}).length
    };

    // Extract page information
    if (fileData.document && fileData.document.children) {
      info.pages = fileData.document.children
        .filter(child => child.type === 'CANVAS')
        .map(page => ({
          id: page.id,
          name: page.name,
          childCount: page.children ? page.children.length : 0
        }));
    }

    return info;
  }

  /**
   * Handle API errors
   * @param {Error} error - The error object
   */
  handleError(error) {
    if (error.response) {
      const status = error.response.status;
      const message = error.response.data?.message || error.response.statusText;
      
      switch (status) {
        case 403:
          console.error('❌ Authentication Error: Invalid or expired Figma token');
          break;
        case 404:
          console.error('❌ Not Found: The specified file was not found or you don\'t have access');
          break;
        default:
          console.error(`❌ API Error (${status}): ${message}`);
      }
    } else if (error.request) {
      console.error('❌ Network Error: No response received from Figma API');
    } else {
      console.error('❌ Error:', error.message);
    }
  }
}

// Example usage and CLI functionality
async function main() {
  try {
    const figmaReader = new FigmaFileReader();
    
    // Get file key from command line arguments or use a default example
    const fileKey = process.argv[2] || 'hh6x4c5QYq6KL4txwrVRvX'; // Example file key
    
    if (!process.argv[2]) {
      console.log('ℹ️  No file key provided, using example file key');
      console.log('Usage: node src/figma-reader.js <file_key>');
      console.log('Example: node src/figma-reader.js hh6x4c5QYq6KL4txwrVRvX');
      console.log('');
    }

    // Example 1: Read entire file
    console.log('📖 Reading entire Figma file...\n');
    const fileData = await figmaReader.readFile(fileKey);
    
    // Extract and display key information
    const info = figmaReader.extractInfo(fileData);
    console.log('\n📋 File Summary:');
    console.log(`   - Pages: ${info.pages.length}`);
    console.log(`   - Components: ${info.components}`);
    console.log(`   - Component Sets: ${info.componentSets}`);
    console.log(`   - Styles: ${info.styles}`);
    
    if (info.pages.length > 0) {
      console.log('\n📄 Pages:');
      info.pages.forEach(page => {
        console.log(`   - ${page.name} (${page.childCount} children)`);
      });
    }

    // Save the file data
    await figmaReader.saveToFile(fileData);

    // Example 2: Read with specific options
    console.log('\n📖 Reading with depth limit (2)...');
    const limitedData = await figmaReader.readFile(fileKey, { depth: 2 });
    console.log(`✅ Limited read complete - reduced data size`);

  } catch (error) {
    console.error('\n💥 Script failed:', error.message);
    process.exit(1);
  }
}

// Export the class for use in other modules
module.exports = FigmaFileReader;

// Run the main function if this file is executed directly
if (require.main === module) {
  main();
} 