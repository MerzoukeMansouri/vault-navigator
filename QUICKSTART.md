# Quick Start Guide

Get up and running with Vault Navigator in minutes!

## Installation

Since you may need to use npm instead of pnpm (due to Node version requirements), here are both options:

### Option 1: Using npm
```bash
npm install
npm run dev
```

### Option 2: Using pnpm (requires Node 18+)
```bash
pnpm install
pnpm dev
```

## First Run

1. Open your browser to [http://localhost:3000](http://localhost:3000)

2. You'll see the welcome screen. Click **"Configure Connection"**

3. Add your first Vault configuration:
   ```
   Configuration Name: My Vault
   Vault URL: https://vault.yourdomain.com
   Vault Token: hvs.XXXXXXXXXX
   Namespaces: (optional, comma-separated)
   ```

4. Click **Save**, then click on the configuration card to connect

5. You're ready to browse and manage secrets!

## Key Features to Try

### 1. Browse Secrets
- Click on folders in the left panel to expand them
- Click on secrets to view their contents
- Use the tree navigation to explore your vault

### 2. Search Secrets
- Use the search bar at the top
- Search by secret name or content
- Results appear in a dropdown

### 3. View & Edit Secrets
- Click on any secret to view it
- Click "Edit" to modify values
- Toggle between Form and JSON modes
- Click "Save" when done

### 4. Create New Secrets
- Click "Create Secret" button
- Enter a path (e.g., `secret/myapp/config`)
- Add key-value pairs or use JSON mode
- Click "Create"

### 5. Switch Namespaces
- Click the namespace dropdown in the header
- Select a different namespace
- The entire view updates automatically

### 6. Manage Multiple Vaults
- Go to "Configurations" in the header
- Add multiple Vault connections
- Switch between them with one click

## Troubleshooting

### Cannot connect to Vault
- Verify your Vault URL is correct and accessible
- Check that your token has the necessary permissions
- Ensure CORS is configured on your Vault server if accessing from a different domain

### Secrets not loading
- Verify the namespace is correct
- Check that your token has read permissions
- Try switching to the root namespace

### Build errors
- Make sure all dependencies are installed: `npm install` or `pnpm install`
- Clear node_modules and reinstall if needed
- Check that you're using Node.js 16 or higher

## Security Best Practices

1. **Use short-lived tokens**: Configure Vault to issue tokens with limited TTL
2. **Rotate tokens regularly**: Update your token in the configuration when it expires
3. **Limit permissions**: Use tokens with minimal required permissions
4. **Don't commit tokens**: Never commit `.env` files or configurations with tokens
5. **Use HTTPS**: Always connect to Vault over HTTPS in production

## Next Steps

- Explore the README.md for detailed documentation
- Configure multiple namespaces for better organization
- Set up different configurations for dev, staging, and production
- Customize the UI by modifying components in the `components/` directory

Enjoy using Vault Navigator! 🚀
