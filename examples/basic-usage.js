const FigmaFileReader = require('../src/figma-reader');
const { parseFigmaUrl } = require('../src/utils/figma-url-parser');

// Load environment variables
require('dotenv').config({ path: process.env.NODE_ENV === 'production' ? 'env.production' : 'env.development' });

async function basicUsage() {
  console.log('🚀 Figma API Basic Usage Examples\n');

  try {
    const figmaReader = new FigmaFileReader();

    // Example 1: Read a file using just the file key
    console.log('📖 Example 1: Reading file with file key');
    const fileKey = 'hh6x4c5QYq6KL4txwrVRvX'; // Replace with your file key
    const fileData = await figmaReader.readFile(fileKey);
    console.log(`✅ Read file: ${fileData.name}\n`);

    // Example 2: Read a file using a Figma URL
    console.log('📖 Example 2: Reading file from URL');
    const figmaUrl = 'https://www.figma.com/file/hh6x4c5QYq6KL4txwrVRvX/Example-Design';
    const urlParts = parseFigmaUrl(figmaUrl);
    
    if (urlParts.isValid) {
      console.log(`   - Extracted file key: ${urlParts.fileKey}`);
      console.log(`   - File name: ${urlParts.fileName}`);
      
      const urlFileData = await figmaReader.readFile(urlParts.fileKey);
      console.log(`✅ Read file from URL: ${urlFileData.name}\n`);
    }

    // Example 3: Read with specific parameters
    console.log('📖 Example 3: Reading with parameters');
    const limitedData = await figmaReader.readFile(fileKey, {
      depth: 2,
      geometry: 'paths'
    });
    console.log(`✅ Read with depth=2 and geometry=paths\n`);

    // Example 4: Extract and display file information
    console.log('📖 Example 4: Extracting file information');
    const info = figmaReader.extractInfo(fileData);
    console.log('File Information:');
    console.log(`   - Name: ${info.metadata.name}`);
    console.log(`   - Version: ${info.metadata.version}`);
    console.log(`   - Last Modified: ${info.metadata.lastModified}`);
    console.log(`   - Pages: ${info.pages.length}`);
    console.log(`   - Components: ${info.components}`);
    console.log(`   - Styles: ${info.styles}\n`);

    // Example 5: Save file data
    console.log('📖 Example 5: Saving file data');
    const savedPath = await figmaReader.saveToFile(fileData);
    console.log(`✅ File saved to: ${savedPath}\n`);

  } catch (error) {
    console.error('❌ Error in basic usage example:', error.message);
  }
}

// Example of reading specific nodes
async function readSpecificNodes() {
  console.log('🎯 Example: Reading Specific Nodes\n');

  try {
    const figmaReader = new FigmaFileReader();
    const fileKey = 'hh6x4c5QYq6KL4txwrVRvX'; // Replace with your file key

    // First, get the full file to see available nodes
    console.log('📖 Getting full file to identify nodes...');
    const fullFile = await figmaReader.readFile(fileKey, { depth: 2 });
    
    // Extract some node IDs from the first page
    if (fullFile.document && fullFile.document.children && fullFile.document.children.length > 0) {
      const firstPage = fullFile.document.children[0];
      console.log(`📄 First page: ${firstPage.name} (ID: ${firstPage.id})`);
      
      if (firstPage.children && firstPage.children.length > 0) {
        const nodeIds = firstPage.children.slice(0, 2).map(child => child.id);
        console.log(`🎯 Reading specific nodes: ${nodeIds.join(', ')}`);
        
        // Read only specific nodes
        const specificNodes = await figmaReader.readFile(fileKey, {
          ids: nodeIds.join(',')
        });
        
        console.log(`✅ Read ${nodeIds.length} specific nodes`);
      }
    }

  } catch (error) {
    console.error('❌ Error reading specific nodes:', error.message);
  }
}

// Run examples
async function runExamples() {
  await basicUsage();
  console.log('─'.repeat(50));
  await readSpecificNodes();
}

if (require.main === module) {
  runExamples();
}

module.exports = {
  basicUsage,
  readSpecificNodes
}; 