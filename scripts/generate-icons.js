const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const rootDir = path.join(__dirname, '..');
const publicDir = path.join(rootDir, 'public');
const sourceIcon = path.join(rootDir, 'vault-icon.png');

const icons = [
  { name: 'icon-192x192.png', size: 192 },
  { name: 'icon-256x256.png', size: 256 },
  { name: 'icon-384x384.png', size: 384 },
  { name: 'icon-512x512.png', size: 512 },
  { name: 'favicon.ico', size: 32 }
];

console.log('Generating PWA icons from vault-icon.png...\n');

(async () => {
  // Check if source icon exists
  if (!fs.existsSync(sourceIcon)) {
    console.error(`✗ Source icon not found: ${sourceIcon}`);
    console.error('  Please ensure vault-icon.png exists in the project root.\n');
    process.exit(1);
  }

  console.log(`✓ Using source: ${path.basename(sourceIcon)}`);

  // Get source image dimensions
  const metadata = await sharp(sourceIcon).metadata();
  console.log(`  Source dimensions: ${metadata.width}x${metadata.height}\n`);

  for (const icon of icons) {
    const iconPath = path.join(publicDir, icon.name);

    try {
      await sharp(sourceIcon)
        .resize(icon.size, icon.size, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 0 }
        })
        .png()
        .toFile(iconPath);

      const stats = fs.statSync(iconPath);
      console.log(`✓ Created ${icon.name} (${icon.size}x${icon.size}, ${(stats.size / 1024).toFixed(2)} KB)`);
    } catch (error) {
      console.error(`✗ Failed to create ${icon.name}:`, error.message);
    }
  }

  console.log('\n✅ All PWA icons generated successfully from vault-icon.png!\n');
})();
