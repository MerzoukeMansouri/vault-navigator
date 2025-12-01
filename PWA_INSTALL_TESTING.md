# PWA Install Prompt - Testing Guide

The app now includes a custom PWA install prompt with smart persistence. Here's how it works and how to test it.

## Features

✅ **Custom Install Prompt**: Beautiful UI that appears when the browser triggers the `beforeinstallprompt` event
✅ **Smart Persistence**: If user declines, the prompt won't appear again for 1 week
✅ **localStorage TTL**: Uses timestamp-based TTL (7 days / 604,800,000 ms)
✅ **Responsive Design**: Works on mobile and desktop
✅ **Animated**: Smooth slide-up animation using Framer Motion

## How It Works

1. Browser triggers `beforeinstallprompt` event when PWA criteria are met
2. Component checks localStorage for previous decline
3. If declined within last 7 days, prompt is suppressed
4. After 7 days, localStorage entry is automatically cleared
5. User can either:
   - **Install**: Triggers browser's native install flow
   - **Not now**: Stores decline timestamp, hides for 1 week
   - **Close (X)**: Same as "Not now"

## Testing the Install Prompt

### Prerequisites

```bash
# Build the production version (PWA only works in production mode)
pnpm build

# Start production server
pnpm start
```

### Method 1: Chrome/Edge Desktop

1. Open Chrome/Edge DevTools (F12)
2. Go to **Application** tab → **Manifest** section
3. Verify manifest is loaded correctly
4. Visit the app in a **new incognito window** (to avoid cached state)
5. The install prompt should appear at the bottom of the screen

**Note**: Chrome may delay showing the prompt until the user has engaged with the site.

### Method 2: Chrome DevTools Simulation

1. Open DevTools (F12)
2. Go to **Application** tab → **Service Workers**
3. Verify service worker is registered
4. Open **Console** tab
5. Trigger the event manually:

```javascript
// Simulate the beforeinstallprompt event
window.dispatchEvent(new Event('beforeinstallprompt'));
```

### Method 3: Mobile Testing

1. Build and deploy to a server (or use ngrok for local testing)
2. Visit on Chrome Android or Safari iOS
3. The prompt should appear after a few seconds of interaction

## Testing TTL Persistence

### Test Scenario 1: Decline and Verify Storage

1. When prompt appears, click **"Not now"** or the **X** button
2. Open DevTools → **Application** → **Local Storage**
3. Verify entry: `pwa-install-declined` with timestamp
4. Refresh the page → Prompt should NOT appear

### Test Scenario 2: Clear Storage and Re-test

```javascript
// In browser console
localStorage.removeItem('pwa-install-declined');
// Refresh page, prompt should appear again
```

### Test Scenario 3: Simulate Expired TTL

1. Decline the prompt
2. Open DevTools Console and run:

```javascript
// Set timestamp to 8 days ago (older than 7 day TTL)
const eightDaysAgo = Date.now() - (8 * 24 * 60 * 60 * 1000);
localStorage.setItem('pwa-install-declined', JSON.stringify({ timestamp: eightDaysAgo }));
```

3. Refresh the page
4. Prompt should appear again (TTL expired)

### Test Scenario 4: Already Installed

1. Install the app (click "Install" button)
2. Open the installed PWA
3. Prompt should NOT appear (app already installed)

## Debugging

### Check if PWA criteria are met:

```javascript
// In console
window.matchMedia('(display-mode: standalone)').matches
// false = not installed, true = installed as PWA
```

### Check localStorage state:

```javascript
// View current decline status
const data = localStorage.getItem('pwa-install-declined');
if (data) {
  const parsed = JSON.parse(data);
  const ageInDays = (Date.now() - parsed.timestamp) / (24 * 60 * 60 * 1000);
  console.log(`Declined ${ageInDays.toFixed(2)} days ago`);
} else {
  console.log('No decline record found');
}
```

### Force show the prompt:

```javascript
// Clear storage and reload
localStorage.removeItem('pwa-install-declined');
location.reload();
```

## Browser Support

| Browser | Install Prompt | Notes |
|---------|---------------|-------|
| Chrome (Desktop) | ✅ Full Support | Best testing experience |
| Chrome (Android) | ✅ Full Support | Native install flow |
| Edge (Desktop) | ✅ Full Support | Same as Chrome |
| Safari (iOS) | ⚠️ Limited | Uses native Add to Home Screen, no custom prompt |
| Firefox | ⚠️ Limited | PWA support varies by platform |

## Common Issues

### Prompt doesn't appear:

1. **Check HTTPS**: PWA requires HTTPS (or localhost)
2. **Check Service Worker**: Must be registered successfully
3. **Check Manifest**: Must be valid and linked in HTML
4. **Check Engagement**: Chrome requires user interaction first
5. **Check Storage**: User may have declined recently
6. **Check Install Status**: App may already be installed

### Prompt appears every time:

- Check localStorage is working (not in private/incognito mode)
- Check browser console for errors

## Component Location

- Component: `components/pwa-install-prompt.tsx`
- Integrated in: `app/layout.tsx`
- Storage Key: `pwa-install-declined`
- TTL Duration: 7 days (604,800,000 ms)

## Customization

To change the TTL duration, edit `components/pwa-install-prompt.tsx`:

```typescript
const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000; // Change this value
```

Examples:
- 1 day: `24 * 60 * 60 * 1000`
- 3 days: `3 * 24 * 60 * 60 * 1000`
- 2 weeks: `14 * 24 * 60 * 60 * 1000`
- 1 month: `30 * 24 * 60 * 60 * 1000`
