# Exif-Hound License API Documentation

This document explains how to use the Exif-Hound license API for verification and management.

## License Verification API

### Verify a License Key

**Endpoint:** `POST /api/verify-license`

**Request:**
```json
{
  "licenseKey": "EXH-XXXXX-XXXXX-XXXXX-XXXXX"
}
```

**Success Response:**
```json
{
  "valid": true,
  "productId": "exif-hound",
  "expiresAt": "2025-04-04T23:59:59.999Z"
}
```

**Error Responses:**

- Invalid license key format:
```json
{
  "valid": false,
  "error": "Invalid license key format"
}
```

- License key not found:
```json
{
  "valid": false,
  "error": "License key not found"
}
```

- License key expired:
```json
{
  "valid": false,
  "error": "License key expired",
  "expiresAt": "2023-04-04T23:59:59.999Z"
}
```

## Testing with cURL

You can test the license verification API using cURL:

```bash
# Verify a license key
curl -X POST http://localhost:3000/api/verify-license \
  -H "Content-Type: application/json" \
  -d '{"licenseKey": "EXH-ABCDE-FGHIJ-KLMNO-PQRST"}'
```

## Integrating with Desktop Applications

For desktop applications, you can verify licenses by making HTTP requests to the verification endpoint:

```typescript
async function verifyLicense(licenseKey: string): Promise<boolean> {
  try {
    const response = await fetch('https://your-domain.com/api/verify-license', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ licenseKey }),
    });
    
    const data = await response.json();
    return data.valid === true;
  } catch (error) {
    console.error('Error verifying license:', error);
    return false;
  }
}
```

## License Storage

The licenses are stored in the `data/licenses.json` file with the following structure:

```json
[
  {
    "id": "unique-id",
    "key": "EXH-XXXXX-XXXXX-XXXXX-XXXXX",
    "email": "customer@example.com",
    "productId": "exif-hound",
    "createdAt": "2024-04-04T12:00:00.000Z",
    "expiresAt": "2025-04-04T12:00:00.000Z",
    "stripeSessionId": "cs_test_xxxxxxxxxxxxx",
    "activated": true
  }
]
```

## Security Considerations

For production use, consider implementing:

1. **Rate limiting** to prevent brute force attacks
2. **API keys** for authentication
3. **HTTPS** for secure transmission
4. **IP filtering** to limit access to specific regions
5. **Logging** for audit purposes 