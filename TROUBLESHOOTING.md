# Troubleshooting Guide

This guide helps you resolve common issues with Vault Navigator.

## No Secrets Loading

### Issue: "No secrets found" message appears

**Common Causes:**

1. **KV Engine Not Mounted at "secret"**
   - Vault Navigator looks for secrets in the `secret/` mount by default
   - Check if your KV v2 engine is mounted at a different path

   **Solution:**
   ```bash
   # Check your mounts
   vault secrets list

   # If KV is mounted elsewhere (e.g., "kv/"), you'll need to adjust the code
   # Or mount a new KV engine at "secret/"
   vault secrets enable -path=secret kv-v2
   ```

2. **Using KV v1 instead of KV v2**
   - Vault Navigator is designed for KV v2 (which uses `/data/` and `/metadata/` paths)

   **Solution:**
   - Upgrade to KV v2 or mount a new KV v2 engine:
   ```bash
   vault secrets enable -path=secret -version=2 kv
   ```

3. **Insufficient Permissions**
   - Your token may not have list/read permissions

   **Solution:**
   - Check your token capabilities:
   ```bash
   vault token capabilities secret/
   ```
   - You need at least `list` and `read` permissions

4. **Wrong Namespace**
   - You might be in the wrong namespace

   **Solution:**
   - Switch to the root namespace or the correct namespace in the header dropdown

### Issue: Error messages in the browser

Check the browser console (F12) for detailed error messages:

- **403 Forbidden**: Permission denied - check token permissions
- **404 Not Found**: Path doesn't exist or KV engine not mounted
- **500 Internal Error**: Vault server issue
- **Network Error**: Can't reach Vault server

## Connection Issues

### Issue: "Connection test failed"

**Common Causes:**

1. **Incorrect Vault URL**
   - Make sure URL includes protocol: `https://vault.example.com`
   - No trailing slash in URL

   **Solution:**
   ```
   ✅ Correct: https://vault.example.com
   ✅ Correct: https://vault.example.com:8200
   ❌ Wrong: vault.example.com
   ❌ Wrong: https://vault.example.com/
   ```

2. **CORS Issues**
   - Vault needs CORS configured for browser access

   **Solution:**
   - Add CORS configuration to Vault:
   ```hcl
   # In vault.hcl
   ui = true
   api_addr = "https://vault.example.com"
   ```
   - Or use the API:
   ```bash
   vault write sys/config/cors enabled=true \
     allowed_origins="http://localhost:3000"
   ```

3. **Invalid Token**
   - Token may be expired or invalid

   **Solution:**
   - Generate a new token:
   ```bash
   vault token create
   ```
   - Update the configuration with the new token

4. **Self-Signed Certificates**
   - Browser may block self-signed certs

   **Solution:**
   - Accept the certificate in your browser first by visiting Vault UI directly
   - Or configure proper SSL certificates

## Namespace Issues

### Issue: Can't see secrets after switching namespace

**Common Causes:**

1. **Namespace Doesn't Exist**
   - The namespace might not be configured in Vault

   **Solution:**
   ```bash
   # List namespaces (requires Vault Enterprise)
   vault namespace list
   ```

2. **Token Not Valid in Namespace**
   - Your token needs permissions in that namespace

   **Solution:**
   - Create a token in the correct namespace:
   ```bash
   vault token create -namespace=your-namespace
   ```

3. **Namespace Syntax**
   - Namespace names should not include trailing slashes

   **Solution:**
   ```
   ✅ Correct: my-namespace
   ❌ Wrong: my-namespace/
   ```

## Edit/Create/Delete Issues

### Issue: Can't save secrets

**Common Causes:**

1. **Read-Only Token**
   - Token only has read permissions

   **Solution:**
   - Token needs `create` and `update` capabilities:
   ```bash
   # Check capabilities
   vault token capabilities secret/myapp/config
   ```

2. **Invalid JSON in JSON Mode**
   - JSON syntax error

   **Solution:**
   - Validate your JSON using the error message
   - Switch to Form mode for simpler editing

### Issue: Delete fails

**Common Cause:**
- Token needs `delete` capability on the metadata path

**Solution:**
```bash
# Check capabilities
vault token capabilities secret/metadata/myapp/config
```

## Performance Issues

### Issue: Search is slow

**Common Causes:**
- Large number of secrets
- Deep folder structure

**Solution:**
- Search is recursive and reads all secrets
- Consider organizing secrets in shallower structures
- Use more specific search terms

## Browser Console Debugging

To see detailed logs:

1. Open browser DevTools (F12)
2. Go to Console tab
3. Look for messages starting with:
   - "Listing secrets from:"
   - "Reading secret from:"
   - "Error loading secrets:"

These logs show the exact API calls being made and can help identify issues.

## Common Error Messages Explained

| Error Message | Meaning | Solution |
|--------------|---------|----------|
| "permission denied" | Token lacks required permissions | Update token policy |
| "* secret/ not found" | KV engine not mounted at "secret" | Mount KV engine or check path |
| "Upgrading from non-versioned to versioned data" | Need KV v2 migration | Migrate to KV v2 |
| "Network Error" | Can't reach Vault | Check URL and network |
| "unsupported path" | Invalid path format | Check path syntax |

## Still Having Issues?

1. **Check Vault Logs**
   ```bash
   vault audit list
   vault read sys/audit/file
   ```

2. **Verify Token**
   ```bash
   vault token lookup
   ```

3. **Test with Vault CLI**
   ```bash
   # Try listing secrets with CLI
   vault kv list secret/
   vault kv get secret/myapp/config
   ```

4. **Check Browser Network Tab**
   - Open DevTools → Network
   - Watch API calls to Vault
   - Check request/response details

## Tips for Smooth Operation

1. **Use Long-Lived Tokens for Testing**
   ```bash
   vault token create -ttl=8h
   ```

2. **Organize Secrets Hierarchically**
   ```
   secret/
   ├── app1/
   │   ├── dev/
   │   └── prod/
   └── app2/
       ├── dev/
       └── prod/
   ```

3. **Test Connection Before Saving**
   - Always use "Test Connection" button
   - Verify before saving configuration

4. **Use Descriptive Configuration Names**
   - Name configs by environment: "Production Vault", "Dev Vault"
   - Include region if applicable: "AWS US-East Production"

## Getting Help

If you're still stuck:
- Check the browser console for errors
- Review Vault server logs
- Verify token permissions with `vault token lookup`
- Test the same operations with the Vault CLI
