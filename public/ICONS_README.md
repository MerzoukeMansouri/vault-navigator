# PWA Icons Guide

This application is configured as a Progressive Web App (PWA). You need to create the following icon files in this directory:

## Required Icon Files

1. `favicon.ico` - Traditional favicon (16x16 or 32x32)
2. `icon-192x192.png` - 192x192 PNG icon (maskable)
3. `icon-256x256.png` - 256x256 PNG icon
4. `icon-384x384.png` - 384x384 PNG icon
5. `icon-512x512.png` - 512x512 PNG icon

## How to Generate Icons

You can use the provided `icon.svg` as a starting point and:

### Option 1: Using Online Tools
- Visit [RealFaviconGenerator](https://realfavicongenerator.net/)
- Upload your logo/icon
- Generate all required sizes

### Option 2: Using ImageMagick (Command Line)
```bash
# Install ImageMagick if not already installed
# macOS: brew install imagemagick
# Ubuntu: sudo apt-get install imagemagick

# Generate icons from SVG
magick icon.svg -resize 192x192 icon-192x192.png
magick icon.svg -resize 256x256 icon-256x256.png
magick icon.svg -resize 384x384 icon-384x384.png
magick icon.svg -resize 512x512 icon-512x512.png
magick icon.svg -resize 32x32 favicon.ico
```

### Option 3: Using a Node.js Package
```bash
npm install -g pwa-asset-generator
pwa-asset-generator icon.svg ./public
```

## Maskable Icons

The 192x192 icon is configured as "maskable" in the manifest. This means it should have some padding around the main content to ensure it looks good on all platforms (especially Android).

- Keep the important content within the center 80% of the image
- Use a solid background color
- Avoid transparency in maskable icons

## Current Status

The app will work without these icons, but users won't see proper icons when:
- Installing the app
- Viewing it in their app launcher
- Seeing it in browser tabs

Replace the placeholder icons with your actual app icons for the best user experience.
