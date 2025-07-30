// This plugin will open a window to prompt the user to enter a number, and
// it will then create that many rectangles on the screen.

// This file holds the main code for plugins. Code in this file has access to
// the *figma document* via the figma global object.
// You can access browser APIs in the <script> tag inside "ui.html" which has a
// full browser environment (See https://www.figma.com/plugin-docs/how-plugins-run).

interface ShapeConfig {
  type: 'rectangle' | 'ellipse' | 'star' | 'polygon' | 'line' | 'frame' | 'text';
  position?: { x: number; y: number };
  size?: { width: number; height: number };
  fills?: ReadonlyArray<Paint>;
  strokes?: ReadonlyArray<Paint>;
  strokeWeight?: number;
  cornerRadius?: number;
  
  // Star-specific properties
  pointCount?: number;
  innerRadius?: number;
  
  // Polygon-specific properties
  polygonPointCount?: number;
  
  // Text-specific properties
  text?: string;
  fontSize?: number;
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
  
  // Apply common properties
  if (config.position) {
    node.x = config.position.x;
    node.y = config.position.y;
  }
  
  if (config.size && 'resize' in node) {
    node.resize(config.size.width, config.size.height);
  }
  
  if (config.fills && 'fills' in node) {
    node.fills = config.fills;
  }
  
  if (config.strokes && 'strokes' in node) {
    node.strokes = config.strokes;
  }
  
  if (config.strokeWeight && 'strokeWeight' in node) {
    node.strokeWeight = config.strokeWeight;
  }
  
  return node;
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
figma.ui.onmessage = async (msg: {type: string, count: number, config?: ShapeConfig}) => {
  // One way of distinguishing between different types of messages sent from
  // your HTML page is to use an object with a "type" property like this.
  if (msg.type === 'create-star') {
    const starNode = await generateShape({
      type: 'star',
      position: { x: 50, y: 50 },
      size: { width: 200, height: 200 },
      pointCount: 7,
      innerRadius: 0.6,
      fills: [createSolidFill(1, 0, 0)]
    });
    figma.currentPage.appendChild(starNode);
    figma.currentPage.selection = [starNode];
    figma.viewport.scrollAndZoomIntoView([starNode]);
  }
  if (msg.type === 'create-shape-from-json' && msg.config) {
    const newNode = await generateShape(msg.config);
    figma.currentPage.appendChild(newNode);
    figma.currentPage.selection = [newNode];
    figma.viewport.scrollAndZoomIntoView([newNode]);
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

