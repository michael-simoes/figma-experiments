// This plugin will open a window to prompt the user to enter a number, and
// it will then create that many rectangles on the screen.

// This file holds the main code for plugins. Code in this file has access to
// the *figma document* via the figma global object.
// You can access browser APIs in the <script> tag inside "ui.html" which has a
// full browser environment (See https://www.figma.com/plugin-docs/how-plugins-run).

interface ShapeConfig {
  type: 'rectangle' | 'ellipse' | 'star' | 'polygon' | 'line' | 'frame' | 'text';
  x: number;
  y: number;
  width: number;
  height: number;
  fill?: string; // Hex color, color name, or 'transparent'
  stroke?: string;
  strokeWidth?: number;
  cornerRadius?: number;
  zIndex?: number;
  text?: string;
  fontSize?: number;
  // Star-specific
  pointCount?: number;
  innerRadius?: number;
  // Polygon-specific
  polygonPointCount?: number;
}

interface MultiShapeConfig {
  shapes: ShapeConfig[];
}

async function generateShape(config: ShapeConfig): Promise<SceneNode> {
  let node: SceneNode;
  
  // Create the base shape
  switch (config.type) {
    case 'rectangle':
      node = figma.createRectangle();
      if (config.cornerRadius !== undefined) {
        (node as RectangleNode).cornerRadius = config.cornerRadius;
      }
      break;
      
    case 'ellipse':
      node = figma.createEllipse();
      break;
      
    case 'star':
      const star = figma.createStar();
      if (config.pointCount) star.pointCount = config.pointCount;
      if (config.innerRadius) star.innerRadius = config.innerRadius;
      node = star;
      break;
      
    case 'polygon':
      const polygon = figma.createPolygon();
      if (config.polygonPointCount) polygon.pointCount = config.polygonPointCount;
      node = polygon;
      break;
      
    case 'line':
      node = figma.createLine();
      break;
      
    case 'frame':
      node = figma.createFrame();
      break;
      
    case 'text':
      await figma.loadFontAsync({ family: "Inter", style: "Regular" });
      const textNode = figma.createText();
      if (config.text) textNode.characters = config.text;
      if (config.fontSize) textNode.fontSize = config.fontSize;
      node = textNode;
      break;
      
    default:
      throw new Error(`Unsupported shape type: ${config.type}`);
  }
  
  // Apply position
  node.x = config.x;
  node.y = config.y;
  
  // Apply size
  if ('resize' in node) {
    node.resize(config.width, config.height);
  }
  
  // Apply fill color
  if (config.fill && config.fill !== 'transparent' && 'fills' in node) {
    const hexColor = normalizeColor(config.fill);
    if (hexColor !== 'transparent') {
      node.fills = [{
        type: 'SOLID' as const,
        color: hexToRgb(hexColor)
      }];
    }
  }
  
  // Apply stroke color
  if (config.stroke && 'strokes' in node) {
    const hexColor = normalizeColor(config.stroke);
    node.strokes = [{
      type: 'SOLID' as const,
      color: hexToRgb(hexColor)
    }];
    if (config.strokeWidth && 'strokeWeight' in node) {
      node.strokeWeight = config.strokeWidth;
    }
  }
  
  return node;
}

// Color name to hex mapping
const colorNames: { [key: string]: string } = {
  'transparent': 'transparent',
  'red': '#ff0000',
  'green': '#00ff00',
  'blue': '#0000ff',
  'black': '#000000',
  'white': '#ffffff',
  'gray': '#808080',
  'grey': '#808080',
  'yellow': '#ffff00',
  'orange': '#ffa500',
  'purple': '#800080',
  'pink': '#ffc0cb',
  'brown': '#a52a2a',
  'primary': '#007bff',
  'secondary': '#6c757d',
  'success': '#28a745',
  'danger': '#dc3545',
  'warning': '#ffc107',
  'info': '#17a2b8',
  'light': '#f8f9fa',
  'dark': '#343a40',
};

// Helper function to convert color name or hex to hex
function normalizeColor(color: string): string {
  if (color === 'transparent') return 'transparent';
  if (color.startsWith('#')) return color;
  if (colorNames[color.toLowerCase()]) return colorNames[color.toLowerCase()];
  return color; // Return as-is if not found
}

// Helper function to convert hex color to RGB
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) {
    throw new Error(`Invalid hex color: ${hex}`);
  }
  return {
    r: parseInt(result[1], 16) / 255,
    g: parseInt(result[2], 16) / 255,
    b: parseInt(result[3], 16) / 255,
  };
}



// Function to generate multiple shapes
async function generateShapes(config: MultiShapeConfig): Promise<SceneNode[]> {
  const nodes: SceneNode[] = [];
  
  // Sort shapes by zIndex (lower numbers first, undefined zIndex defaults to 0)
  const sortedShapes = [...config.shapes].sort((a, b) => {
    const aZ = a.zIndex ?? 0;
    const bZ = b.zIndex ?? 0;
    return aZ - bZ;
  });
  
  for (const shapeConfig of sortedShapes) {
    const node = await generateShape(shapeConfig);
    nodes.push(node);
  }
  
  return nodes;
}



// Helper function for solid colors
function createSolidFill(r: number, g: number, b: number): SolidPaint {
  return {
    type: 'SOLID',
    color: { r, g, b }
  };
}


// This shows the HTML page in "ui.html".
figma.showUI(__html__, { width: 500, height: 520 });

// Calls to "parent.postMessage" from within the HTML page will trigger this
// callback. The callback will be passed the "pluginMessage" property of the
// posted message.
figma.ui.onmessage = async (msg: {type: string, count: number, config?: ShapeConfig | MultiShapeConfig}) => {
  // One way of distinguishing between different types of messages sent from
  // your HTML page is to use an object with a "type" property like this.
  if (msg.type === 'create-star') {
    const starNode = await generateShape({
      type: 'star',
      x: 50,
      y: 50,
      width: 200,
      height: 200,
      pointCount: 7,
      innerRadius: 0.6,
      fill: 'red'
    });
    figma.currentPage.appendChild(starNode);
    figma.currentPage.selection = [starNode];
    figma.viewport.scrollAndZoomIntoView([starNode]);
  }
  if (msg.type === 'create-shape-from-json' && msg.config) {
    // Check if it's a multi-shape config (has 'shapes' property)
    if ('shapes' in msg.config) {
      const newNodes = await generateShapes(msg.config as MultiShapeConfig);
      newNodes.forEach(node => figma.currentPage.appendChild(node));
      figma.currentPage.selection = newNodes;
      figma.viewport.scrollAndZoomIntoView(newNodes);
    } else {
      // Single shape config
      const newNode = await generateShape(msg.config as ShapeConfig);
      figma.currentPage.appendChild(newNode);
      figma.currentPage.selection = [newNode];
      figma.viewport.scrollAndZoomIntoView([newNode]);
    }
  }
  if (msg.type === 'create-shapes') {
    // This plugin creates rectangles on the screen.
    const numberOfRectangles = msg.count;

    const nodes: SceneNode[] = [];
    for (let i = 0; i < numberOfRectangles; i++) {
      const rect = figma.createRectangle();
      rect.x = i * 150;
      rect.fills = [{ type: 'SOLID', color: { r: 1, g: 0.5, b: 0 } }];
      figma.currentPage.appendChild(rect);
      nodes.push(rect);
    }
    figma.currentPage.selection = nodes;
    figma.viewport.scrollAndZoomIntoView(nodes);
  }

  // Make sure to close the plugin when you're done. Otherwise the plugin will
  // keep running, which shows the cancel button at the bottom of the screen.
  if (msg.type !== 'create-shape-from-json') {
    figma.closePlugin();
  }
};

