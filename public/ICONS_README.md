# PWA Icons Guide

This application is configured as a Progressive Web App (PWA) with properly sized icon files.

## Current Status ✅

The following icons have been generated with **correct dimensions**:

1. `favicon.ico` - 32x32 PNG favicon
2. `icon-192x192.png` - 192x192 PNG icon (maskable)
3. `icon-256x256.png` - 256x256 PNG icon
4. `icon-384x384.png` - 384x384 PNG icon
5. `icon-512x512.png` - 512x512 PNG icon

These are **simple placeholder icons** with "VN" (Vault Navigator) branding. You should replace them with your actual app icons for better visual appeal.

## Quick Regeneration

If you need to regenerate the placeholder icons:

```bash
pnpm generate:icons
```

This will recreate all icons with proper dimensions using the built-in script.

## How to Replace with Your Own Icons

### Option 1: Using the Provided Script (Recommended)

1. Edit `scripts/generate-icons.js` to customize the SVG design
2. Run `pnpm generate:icons` to regenerate all sizes
3. Icons will be automatically created in the correct dimensions

### Option 2: Using Online Tools

- Visit [RealFaviconGenerator](https://realfavicongenerator.net/)
- Upload your logo/icon
- Generate all required sizes
- Download and replace files in `public/` directory

### Option 3: Using ImageMagick (Command Line)

```bash
# Install ImageMagick if not already installed
# macOS: brew install imagemagick
# Ubuntu: sudo apt-get install imagemagick

# Generate icons from your custom SVG
magick your-icon.svg -resize 192x192 icon-192x192.png
magick your-icon.svg -resize 256x256 icon-256x256.png
magick your-icon.svg -resize 384x384 icon-384x384.png
magick your-icon.svg -resize 512x512 icon-512x512.png
magick your-icon.svg -resize 32x32 favicon.ico
```

### Option 4: Using Sharp (Programmatically)

The project includes `sharp` as a dev dependency. See `scripts/generate-icons.js` for an example of programmatic icon generation.

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
