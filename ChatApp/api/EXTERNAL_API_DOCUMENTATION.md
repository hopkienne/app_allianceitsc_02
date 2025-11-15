# ChatApp External System API Documentation

## Overview

The ChatApp External System API allows external applications to integrate with the ChatApp platform. This API uses **Client Credentials Authentication** with custom headers for secure access.

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Authentication](#authentication)
3. [Available Scopes](#available-scopes)
4. [API Endpoints](#api-endpoints)
   - [Create OAuth Client](#1-create-oauth-client)
   - [Sync Users from External System](#2-sync-users-from-external-system)
   - [Create Conversation Group](#3-create-conversation-group)
5. [Error Handling](#error-handling)
6. [Code Examples](#code-examples)

---

## Getting Started

### Prerequisites

- Access to the ChatApp API (base URL: `https://your-domain.com/api`)
- HTTPS connection (required for security)
- Ability to set custom HTTP headers

### Integration Flow

1. **Create an OAuth Client** - Request client credentials from ChatApp
2. **Save Your Credentials** - Store `clientId` and `clientSecret` securely
3. **Make API Calls** - Use credentials in headers to access protected endpoints

---

## Authentication

All external API endpoints (except client creation) require authentication using custom headers.

### Authentication Headers

| Header Name | Description | Example |
|------------|-------------|---------|
| `X-Client-Id` | Your unique client identifier | `019a858d-1234-5678-9abc-def012345678` |
| `X-Client-Secret` | Your client secret (plain-text) | `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6` |

### Important Security Notes

⚠️ **CRITICAL**: 
- The `X-Client-Secret` must be the **plain-text secret** you received when creating the client
- **DO NOT** use the hashed version stored in the database
- Always use **HTTPS** in production to protect credentials in transit
- Store credentials securely (environment variables, secure vaults)
- Never commit credentials to source control

---

## Available Scopes

Scopes control what operations your client can perform. Request only the scopes you need.

### User Management Scopes

| Scope | Description | Used For |
|-------|-------------|----------|
| `chatapp.users.read` | Read user information | Querying user data |
| `chatapp.users.create` | Create and sync users | Sync users from external system |
| `chatapp.users.update` | Update user information | Modifying user details |
| `chatapp.users.delete` | Delete users | Removing users |

### External Conversation Scopes

| Scope | Description | Used For |
|-------|-------------|----------|
| `chatapp.external_conversation.read` | Read conversations | Querying conversation data |
| `chatapp.external_conversation.create` | Create conversations | Creating conversation groups |
| `chatapp.external_conversation.update` | Update conversations | Modifying conversations |
| `chatapp.external_conversation.delete` | Delete conversations | Removing conversations |

### Recommended Scope Combinations

**For User Synchronization Only:**
```json
["chatapp.users.create"]
```

**For Conversation Management Only:**
```json
["chatapp.external_conversation.create", "chatapp.external_conversation.read"]
```

**For Full Integration:**
```json
[
  "chatapp.users.create",
  "chatapp.users.read",
  "chatapp.external_conversation.create",
  "chatapp.external_conversation.read"
]
```

---

## API Endpoints

### 1. Create OAuth Client

Create a new OAuth client to receive credentials for API access.

#### Endpoint
```
POST /api/auth/create-client
```

#### Authentication
No authentication required (public endpoint)

#### Request Headers
```
Content-Type: application/json
```

#### Request Body
```json
{
  "name": "My External Application",
  "scopes": [
    "chatapp.users.create",
    "chatapp.external_conversation.create"
  ],
  "expiresAt": "2026-12-31T23:59:59Z"
}
```

#### Request Parameters

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | A descriptive name for your client |
| `scopes` | string[] | Yes | Array of scope strings (see [Available Scopes](#available-scopes)) |
| `expiresAt` | DateTime | No | When the client secret expires (ISO 8601 format) |

#### Response (Success - 200 OK)
```json
{
  "id": "019a858c-782a-74b1-b246-cb59f7b55d50",
  "clientId": "019a858d-1234-5678-9abc-def012345678",
  "clientSecret": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6"
}
```

#### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | Guid | Database primary key (for reference only) |
| `clientId` | string | Use this value in `X-Client-Id` header |
| `clientSecret` | string | Use this value in `X-Client-Secret` header |

⚠️ **IMPORTANT**: Save the `clientSecret` immediately! It cannot be retrieved later. If lost, you must create a new client.

#### Example cURL
```bash
curl -X POST 'https://your-domain.com/api/auth/create-client' \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "Production Integration",
    "scopes": [
      "chatapp.users.create",
      "chatapp.external_conversation.create"
    ],
    "expiresAt": "2026-12-31T23:59:59Z"
  }'
```

---

### 2. Sync Users from External System

Synchronize users from your external system into ChatApp. This endpoint creates or updates users in bulk.

#### Endpoint
```
POST /api/externalsystem/sync-from-external
```

#### Authentication
**Required Scope**: `chatapp.users.create`

#### Request Headers
```
Content-Type: application/json
X-Client-Id: your-client-id
X-Client-Secret: your-client-secret
```

#### Request Body
```json
{
  "users": [
    {
      "applicationCode": "ERP",
      "applicationUserCode": "ERP001",
      "fullName": "John Doe",
      "userName": "johndoe",
      "displayName": "John",
      "email": "john.doe@company.com"
    },
    {
      "applicationCode": "ERP",
      "applicationUserCode": "ERP002",
      "fullName": "Jane Smith",
      "userName": "janesmith",
      "displayName": "Jane",
      "email": "jane.smith@company.com"
    }
  ]
}
```

#### Request Parameters

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `users` | array | Yes | Array of user objects to sync |
| `users[].applicationCode` | string | Yes | Your external system identifier (e.g., "ERP", "CRM") |
| `users[].applicationUserCode` | string | Yes | User's ID in your external system |
| `users[].fullName` | string | Yes | User's full legal name |
| `users[].userName` | string | Yes | Unique username for login |
| `users[].displayName` | string | Yes | Display name shown in the application |
| `users[].email` | string | Yes | User's email address |

#### Response (Success - 200 OK)
```json
true
```

#### Response Codes

| Code | Description |
|------|-------------|
| 200 | Users synced successfully |
| 401 | Invalid or missing credentials |
| 403 | Client lacks required scope |
| 400 | Invalid request body |

#### Example cURL
```bash
curl -X POST 'https://your-domain.com/api/externalsystem/sync-from-external' \
  -H 'Content-Type: application/json' \
  -H 'X-Client-Id: 019a858d-1234-5678-9abc-def012345678' \
  -H 'X-Client-Secret: a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6' \
  -d '{
    "users": [
      {
        "applicationCode": "ERP",
        "applicationUserCode": "ERP001",
        "fullName": "John Doe",
        "userName": "johndoe",
        "displayName": "John",
        "email": "john.doe@company.com"
      }
    ]
  }'
```

#### Notes
- Users are matched by `userName` - existing users will be updated
- Batch operations are supported (send multiple users in one request)
- Invalid users in the batch may cause the entire operation to fail

---

### 3. Create Conversation Group

Create a group conversation with specified users from your external system.

#### Endpoint
```
POST /api/externalsystem/create-conversation-group
```

#### Authentication
**Required Scope**: `chatapp.external_conversation.create`

#### Request Headers
```
Content-Type: application/json
X-Client-Id: your-client-id
X-Client-Secret: your-client-secret
```

#### Request Body
```json
{
  "name": "Project Alpha Discussion",
  "userNames": [
    "johndoe",
    "janesmith",
    "bobwilson"
  ]
}
```

#### Request Parameters

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Name of the conversation group |
| `userNames` | string[] | Yes | Array of usernames to add to the group |

#### Response (Success - 200 OK)
```json
true
```

#### Response (Error - 400 Bad Request)
```json
"One or more usernames do not exist."
```

#### Response Codes

| Code | Description |
|------|-------------|
| 200 | Conversation group created successfully |
| 400 | One or more usernames not found |
| 401 | Invalid or missing credentials |
| 403 | Client lacks required scope |

#### Example cURL
```bash
curl -X POST 'https://your-domain.com/api/externalsystem/create-conversation-group' \
  -H 'Content-Type: application/json' \
  -H 'X-Client-Id: 019a858d-1234-5678-9abc-def012345678' \
  -H 'X-Client-Secret: a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6' \
  -d '{
    "name": "Project Alpha Discussion",
    "userNames": [
      "johndoe",
      "janesmith",
      "bobwilson"
    ]
  }'
```

#### Notes
- All usernames must exist in the system (sync users first if needed)
- The conversation is automatically associated with your client
- Duplicate usernames are handled automatically

---

## Error Handling

### Common Error Responses

#### 401 Unauthorized

**Missing Headers**
```json
{
  "error": "Unauthorized",
  "message": "Missing X-Client-Id header"
}
```

**Invalid Client ID**
```json
{
  "error": "Unauthorized",
  "message": "Invalid client_id"
}
```

**Invalid Client Secret**
```json
{
  "error": "Unauthorized",
  "message": "Invalid client_secret"
}
```

**Troubleshooting 401 Errors:**
- Verify `X-Client-Id` and `X-Client-Secret` headers are set
- Ensure you're using the plain-text secret (not the hash)
- Check that the client is active and not expired
- Confirm the secret hasn't expired

#### 403 Forbidden

```json
{
  "error": "Forbidden",
  "message": "Client lacks required scope"
}
```

**Troubleshooting 403 Errors:**
- Verify your client has the required scope for the endpoint
- Check the [Available Scopes](#available-scopes) section
- You may need to create a new client with additional scopes

#### 400 Bad Request

```json
{
  "errors": {
    "Name": ["The Name field is required."]
  }
}
```

**Troubleshooting 400 Errors:**
- Validate all required fields are present
- Check data types match the specification
- Ensure JSON is properly formatted

---

## Best Practices

### Security
1. **Never expose credentials** in client-side code or public repositories
2. **Use environment variables** for storing credentials
3. **Rotate secrets regularly** by creating new clients
4. **Use HTTPS only** in production environments
5. **Implement retry logic** with exponential backoff
6. **Monitor failed authentication** attempts

### Performance
1. **Batch user synchronization** when possible (send multiple users per request)
2. **Cache credentials** in memory rather than reading from disk repeatedly
3. **Reuse HTTP connections** (connection pooling)
4. **Implement rate limiting** on your side to avoid overwhelming the API

### Error Handling
1. **Log all API errors** for debugging
2. **Implement retry logic** for transient failures (5xx errors)
3. **Validate data** before sending to the API
4. **Handle specific error codes** appropriately (don't retry 401/403 errors)

## Changelog

### Version 1.0.0 (2025-11-15)
- Initial release
- Create OAuth Client endpoint
- Sync Users from External System endpoint
- Create Conversation Group endpoint
- Client Credentials authentication with custom headers
