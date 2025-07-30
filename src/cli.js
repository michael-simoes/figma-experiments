#!/usr/bin/env node

const FigmaFileReader = require('./figma-reader');
const { parseFigmaUrl } = require('./utils/figma-url-parser');

// Load environment variables
require('dotenv').config({ path: process.env.NODE_ENV === 'production' ? 'env.production' : 'env.development' });

function showHelp() {
  console.log(`
🎨 Figma File Reader

Usage:
  node src/cli.js <command> <file_key_or_url>

Commands:
  json    Read file with geometry data and save to JSON
  cli     Read file with geometry data and display paths in CLI

Examples:
  # Save geometry data to JSON file
  node src/cli.js json hh6x4c5QYq6KL4txwrVRvX
  node src/cli.js json "https://www.figma.com/design/abc123/My-Design"

  # Display geometry paths in CLI
  node src/cli.js cli hh6x4c5QYq6KL4txwrVRvX
  node src/cli.js cli "https://www.figma.com/design/abc123/My-Design"

Environment:
  FIGMA_TOKEN must be set in your environment file
`);
}

function formatGeometry(fileData) {
  let output = `
🎨 Geometry Data: ${fileData.name}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

`;

  function extractGeometry(node, pageName = '', depth = 0) {
    const indent = '  '.repeat(depth);
    let hasGeometry = false;
    
    if (node.fillGeometry && node.fillGeometry.length > 0) {
      output += `${indent}📐 ${node.type}: ${node.name} (${pageName})\n`;
      node.fillGeometry.forEach((geo, index) => {
        output += `${indent}  Fill Path ${index + 1}: ${geo.path}\n`;
        if (geo.windingRule) output += `${indent}  Winding Rule: ${geo.windingRule}\n`;
      });
      hasGeometry = true;
    }
    
    if (node.strokeGeometry && node.strokeGeometry.length > 0) {
      if (!hasGeometry) {
        output += `${indent}📐 ${node.type}: ${node.name} (${pageName})\n`;
      }
      node.strokeGeometry.forEach((geo, index) => {
        output += `${indent}  Stroke Path ${index + 1}: ${geo.path}\n`;
        if (geo.windingRule) output += `${indent}  Winding Rule: ${geo.windingRule}\n`;
      });
      hasGeometry = true;
    }
    
    if (hasGeometry) {
      output += '\n';
    }
    
    if (node.children) {
      node.children.forEach(child => {
        extractGeometry(child, pageName, depth + 1);
      });
    }
  }

  if (fileData.document && fileData.document.children) {
    for (const page of fileData.document.children) {
      extractGeometry(page, page.name);
    }
  }

  if (!output.includes('📐')) {
    output += `No geometry data found.\n`;
  }

  return output;
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 2 || args[0] === '--help' || args[0] === '-h') {
    showHelp();
    process.exit(0);
  }

  const command = args[0];
  const fileInput = args[1];

  if (!['json', 'cli'].includes(command)) {
    console.error('❌ Invalid command. Use "json" or "cli"');
    showHelp();
    process.exit(1);
  }

  try {
    console.log('🎨 Figma File Reader\n');

    const figmaReader = new FigmaFileReader();
    
    // Parse file key from URL if needed
    let fileKey = fileInput;
    const urlParts = parseFigmaUrl(fileInput);
    if (urlParts.isValid) {
      fileKey = urlParts.fileKey;
      console.log(`🔗 Extracted file key from URL: ${fileKey}`);
      if (urlParts.fileName) {
        console.log(`📝 File name: ${urlParts.fileName}`);
      }
      console.log('');
    }

    // Read the file with geometry data
    const fileData = await figmaReader.readFile(fileKey, { geometry: 'paths' });

    if (command === 'json') {
      // Save to JSON file
      const savedPath = await figmaReader.saveToFile(fileData);
      console.log(`\n✅ File with geometry data saved to: ${savedPath}`);
      
    } else if (command === 'cli') {
      // Display geometry in CLI
      console.log(formatGeometry(fileData));
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { main, formatGeometry }; 