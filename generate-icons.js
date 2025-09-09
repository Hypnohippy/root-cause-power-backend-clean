const fs = require('fs');
const path = require('path');

// Simple SVG to create basic icons
function createIconSVG(size) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#10b981;stop-opacity:1" />
        <stop offset="100%" style="stop-color:#059669;stop-opacity:1" />
      </linearGradient>
    </defs>
    <circle cx="${size/2}" cy="${size/2}" r="${size/2 - 2}" fill="url(#bg)"/>
    <circle cx="${size/2}" cy="${size/2}" r="${size/2 - size/8}" fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="1"/>
    <text x="${size/2}" y="${size/2 + size/12}" text-anchor="middle" font-family="Arial, sans-serif" font-size="${size/8}" fill="white" font-weight="bold">RCP</text>
  </svg>`;
}

const sizes = [
  { name: 'icon-16x16', size: 16 },
  { name: 'icon-32x32', size: 32 },
  { name: 'icon-72x72', size: 72 },
  { name: 'icon-76x76', size: 76 },
  { name: 'icon-96x96', size: 96 },
  { name: 'icon-120x120', size: 120 },
  { name: 'icon-128x128', size: 128 },
  { name: 'icon-144x144', size: 144 },
  { name: 'icon-152x152', size: 152 },
  { name: 'icon-180x180', size: 180 },
  { name: 'icon-192x192', size: 192 },
  { name: 'icon-384x384', size: 384 },
  { name: 'icon-512x512', size: 512 },
  { name: 'favicon-16x16', size: 16 },
  { name: 'favicon-32x32', size: 32 },
  { name: 'apple-touch-icon-76x76', size: 76 },
  { name: 'apple-touch-icon-120x120', size: 120 },
  { name: 'apple-touch-icon-152x152', size: 152 },
  { name: 'apple-touch-icon-180x180', size: 180 }
];

const iconsDir = path.join(__dirname, 'public', 'icons');

// Create icons directory if it doesn't exist
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Generate SVG icons (browsers can handle these directly)
sizes.forEach(iconSpec => {
  const svgContent = createIconSVG(iconSpec.size);
  const svgPath = path.join(iconsDir, `${iconSpec.name}.svg`);
  
  try {
    fs.writeFileSync(svgPath, svgContent);
    console.log(`✅ Created ${iconSpec.name}.svg`);
  } catch (error) {
    console.error(`❌ Failed to create ${iconSpec.name}.svg:`, error.message);
  }
});

// Create a simple favicon.ico (just copy the 32x32 SVG as fallback)
const faviconPath = path.join(iconsDir, 'favicon.ico');
const favicon32 = createIconSVG(32);
try {
  fs.writeFileSync(faviconPath, favicon32);
  console.log('✅ Created favicon.ico');
} catch (error) {
  console.error('❌ Failed to create favicon.ico:', error.message);
}

console.log('🎨 Icon generation complete!');
console.log('📝 Note: For production, consider converting SVGs to PNG using an image processing tool.');