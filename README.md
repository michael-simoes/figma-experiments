# Figma API Reader

Simple tool to read Figma files and extract geometry data using the Figma API.

## Usage

Two simple commands:

```bash
# Display geometry paths in CLI
node src/cli.js cli <file_key_or_url>

# Save geometry data to JSON file  
node src/cli.js json <file_key_or_url>
```

Or use npm scripts:

```bash
# Display in CLI
npm run cli <file_key_or_url>

# Save to JSON
npm run json <file_key_or_url>
```

## Setup

1. Install dependencies: `npm install`
2. Your Figma token is already configured in the environment files
3. Run the commands above with your Figma file URL or file key

## Examples

```bash
# From URL - display in CLI
npm run cli "https://www.figma.com/design/YOUR_FILE_KEY/Your-Design"

# From file key - save to JSON
npm run json YOUR_FILE_KEY
``` 