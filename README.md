# Dotloop API Integration - Next.js Application

A modern Next.js application for testing and demonstrating the Dotloop Public API v2 integration with secure authentication, comprehensive API coverage, and production-ready architecture.

## 🚀 Features

- ✅ **OAuth2 Authentication** - Complete authorization flow with Dotloop
- ✅ **Secure Token Management** - Server-side token exchange and refresh handling
- ✅ **Complete API Coverage** - Integration with all major Dotloop endpoints
- ✅ **Next.js Architecture** - Server-side rendering with API routes
- ✅ **Modern UI/UX** - Responsive design with Tailwind CSS
- ✅ **Real-time Data** - Dynamic loading with React Query
- ✅ **Error Handling** - Comprehensive error states and recovery
- ✅ **Production Ready** - Secure deployment with Vercel support

## 📋 Prerequisites

- **Node.js** v18 or higher
- **npm** or **yarn**
- **Dotloop Developer Account** with API credentials
- **Environment Variables** configured

## ⚡ Quick Start

### 1. Clone & Install

```bash
git clone <repository-url>
cd dotloop-test-app
npm install
```

### 2. Environment Configuration

Create `.env.local` file in the root directory:

```env
# Dotloop API Configuration for Next.js

# Public environment variables (exposed to the client)
NEXT_PUBLIC_DOTLOOP_CLIENT_ID=your_client_id_here
NEXT_PUBLIC_DOTLOOP_AUTH_URL=https://auth.dotloop.com
NEXT_PUBLIC_DOTLOOP_API_URL=https://api-gateway.dotloop.com/public/v2
NEXT_PUBLIC_REDIRECT_URI=http://localhost:3000/callback

# Private environment variables (server-side only)
DOTLOOP_CLIENT_SECRET=your_client_secret_here
```

### 3. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:3000` to see the application.

### 4. Build for Production

```bash
npm run build
npm start
```

## 🏗️ Architecture Overview

### Next.js API Routes Structure

```
pages/api/dotloop/
├── auth/
│   ├── token.js              # OAuth token exchange
│   └── refresh.js            # Token refresh endpoint
└── proxy/
    └── [...path].js          # Authenticated API proxy
```

### Frontend Architecture

```
src/
├── components/
│   ├── Dashboard.jsx         # Main dashboard with API testing
│   ├── LoopsDisplay.jsx      # Loop data visualization
│   ├── FolderDocuments.jsx   # Folder/document management
│   ├── LoginPage.jsx         # Authentication page
│   └── OAuthCallback.jsx     # OAuth callback handler
├── hooks/
│   └── useDotloopAuth.js     # Authentication state management
├── services/
│   └── dotloopApiClient.js   # Secure API client
└── utils/
    └── helpers.js            # Utility functions
```

## 🔐 Security Architecture

### Server-Side Security Features

1. **Client Secret Protection**: Never exposed to browser
2. **Token Proxy**: All API requests go through secure Next.js routes
3. **HTTP Basic Auth**: Token exchanges use proper authentication headers
4. **HTTPS Only**: All communications use secure protocols

### Client-Side Security Features

1. **Token Storage**: Secure localStorage with expiration handling
2. **Automatic Refresh**: Tokens refresh before expiration
3. **Error Recovery**: Graceful handling of authentication failures
4. **Method Binding**: Prevents context loss in React components

## 🛠️ API Documentation

### Authentication Flow

#### 1. Initial Authorization
```javascript
// Redirect user to Dotloop authorization
const authUrl = dotloopApi.getAuthUrl(state);
window.location.href = authUrl;
```

#### 2. Token Exchange (Server-Side)
```javascript
// POST /api/dotloop/auth/token
{
  "code": "authorization_code",
  "redirect_uri": "http://localhost:3000/callback"
}

// Response
{
  "access_token": "...",
  "refresh_token": "...",
  "expires_in": 43200,
  "token_type": "Bearer"
}
```

#### 3. Token Refresh (Server-Side)
```javascript
// POST /api/dotloop/auth/refresh
{
  "refresh_token": "existing_refresh_token"
}
```

### API Client Usage

#### Initialize Client
```javascript
import dotloopApi from '../services/dotloopApiClient';

// Client automatically handles:
// - Token loading from localStorage
// - Method binding for React compatibility
// - Automatic token refresh on 401 errors
```

#### Profile Management
```javascript
// Get all profiles
const profiles = await dotloopApi.getProfiles();

// Get specific profile
const profile = await dotloopApi.getProfile(profileId);

// Response structure:
{
  "meta": { "total": 1 },
  "data": [
    {
      "id": 19855667,
      "name": "Default Profile",
      "type": "INDIVIDUAL",
      "default": true
    }
  ]
}
```

#### Loop Management
```javascript
// Get loops for a profile
const loops = await dotloopApi.getLoops(profileId);

// Get loop details with property information
const loopDetails = await dotloopApi.getLoopDetails(profileId, loopId);

// Loop details response structure:
{
  "data": {
    "Property Address": {
      "Country": "United Kingdom",
      "Street Number": "3",
      "Street Name": "Goldsmith Street",
      "State/Prov": "England",
      "Zip/Postal Code": "EX4 3EF",
      "County": "Devon"
    }
  }
}
```

#### Folder & Document Management
```javascript
// Get folders for a loop
const folders = await dotloopApi.getFolders(profileId, loopId);

// Get documents in a folder
const documents = await dotloopApi.getDocuments(profileId, loopId, folderId);

// Folder response structure:
{
  "meta": { "total": 1 },
  "data": [
    {
      "id": 217294335,
      "name": "Folder",
      "created": "2025-07-18T09:26:29Z",
      "updated": "2025-07-18T09:26:29Z"
    }
  ]
}

// Document response structure:
{
  "meta": { "total": 1 },
  "data": [
    {
      "id": 1352920739,
      "folderId": 217294335,
      "name": "Document Name",
      "created": "2025-07-18T09:27:17Z",
      "updated": "2025-07-18T09:27:17Z"
    }
  ]
}
```

#### Contact Management
```javascript
// Get all contacts
const contacts = await dotloopApi.getContacts();

// Get specific contact
const contact = await dotloopApi.getContact(contactId);
```

#### Template Management
```javascript
// Get all templates
const templates = await dotloopApi.getTemplates();

// Get specific template
const template = await dotloopApi.getTemplate(templateId);
```

### React Integration with React Query

#### Data Fetching Pattern
```javascript
import { useQuery } from '@tanstack/react-query';
import dotloopApi from '../services/dotloopApiClient';

function ProfileComponent() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['profiles'],
    queryFn: () => dotloopApi.getProfiles(),
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {data?.data?.map(profile => (
        <div key={profile.id}>{profile.name}</div>
      ))}
    </div>
  );
}
```

#### Error Handling Pattern
```javascript
const { data, error, refetch } = useQuery({
  queryKey: ['loops', profileId],
  queryFn: () => dotloopApi.getLoops(profileId),
  enabled: !!profileId,
  onError: (error) => {
    console.error('Failed to fetch loops:', error);
    // Handle specific error cases
    if (error.response?.status === 401) {
      // Token expired, handled automatically by client
    }
  }
});
```

## 🔧 API Client Configuration

### Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_DOTLOOP_CLIENT_ID` | Your Dotloop Client ID | `edb0f8b1-971a-49a9-874c-7143ad5960d8` |
| `NEXT_PUBLIC_DOTLOOP_AUTH_URL` | Dotloop Auth Server URL | `https://auth.dotloop.com` |
| `NEXT_PUBLIC_DOTLOOP_API_URL` | Dotloop API Gateway URL | `https://api-gateway.dotloop.com/public/v2` |
| `NEXT_PUBLIC_REDIRECT_URI` | OAuth Callback URL | `http://localhost:3000/callback` |
| `DOTLOOP_CLIENT_SECRET` | Your Dotloop Client Secret (Server-only) | `da0795b3-de9b-4799-b2a4-9ca29110017e` |

### OAuth Scopes

The application requests the following permissions:

```javascript
const SCOPES = [
  'account:read',    // Account details
  'profile:read',    // Profile information  
  'loop:read',       // Loop information, details, folders, documents
  'contact:read',    // Contact information
  'template:read',   // Loop templates
];
```

## 🚦 API Response Patterns

### Success Response
```javascript
{
  "meta": {
    "total": 10,
    "page": 1,
    "per_page": 25
  },
  "data": [
    // Array of objects
  ]
}
```

### Error Response
```javascript
{
  "error": "invalid_request",
  "error_description": "The request is missing a required parameter"
}
```

### API Client Error Handling
```javascript
try {
  const data = await dotloopApi.getProfiles();
  // Handle success
} catch (error) {
  if (error.response?.status === 401) {
    // Authentication error - client handles token refresh automatically
  } else if (error.response?.status === 403) {
    // Permission denied
  } else if (error.response?.status >= 500) {
    // Server error
  }
  // Handle error appropriately
}
```

## 📊 Debugging & Logging

The application includes comprehensive logging for troubleshooting:

### API Client Logs
```
🏗️ [API] DotloopApiClient initialized
✅ [API] DotloopApiClient methods bound and initialized
🔍 [API] makeRequest method: function
🌐 [API] Making request to: /profile
✅ [API] Request successful: /profile
```

### Authentication Logs
```
🔐 [AUTH] OAuth Token Exchange Request
✅ [AUTH] Token exchange successful
🔄 [TOKENS] Refreshing access token...
✅ [TOKENS] Token refreshed successfully
```

### Data Fetching Logs
```
✅ [LOOPS] Loops data received
✅ [FOLDERS] Folders received for loop: MyLoop
✅ [DOCUMENTS] Documents received for folder: Documents
```

## 🚀 Deployment

### Vercel Deployment

1. **Environment Variables**: Set all required environment variables in Vercel dashboard
2. **Build Command**: `npm run build`
3. **Output Directory**: `.next`
4. **Install Command**: `npm install`

### Production Considerations

- ✅ Client secrets are server-side only
- ✅ All API requests go through secure Next.js routes
- ✅ Tokens are properly managed and refreshed
- ✅ Error handling for production scenarios
- ✅ HTTPS enforcement for security

## 🛠️ Development Tips

### Adding New API Endpoints

1. **Add method to API client**:
```javascript
// In dotloopApiClient.js
async getNewEndpoint(param) {
  return this.makeRequest(`/new-endpoint/${param}`);
}
```

2. **Use in components**:
```javascript
const { data } = useQuery({
  queryKey: ['newEndpoint', param],
  queryFn: () => dotloopApi.getNewEndpoint(param),
});
```

### Custom Hook Pattern
```javascript
// Custom hook for specific API operations
export function useLoopData(profileId) {
  return useQuery({
    queryKey: ['loops', profileId],
    queryFn: () => dotloopApi.getLoops(profileId),
    enabled: !!profileId,
  });
}
```

## ❓ Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| "makeRequest is undefined" | Check method binding in constructor |
| "Profile ID is undefined" | Verify API field mappings (use `id`, not `profile_id`) |
| "401 Unauthorized" | Token expired - client handles refresh automatically |
| "CORS errors" | Use Next.js API routes (already implemented) |
| "Build fails" | Check environment variables are set correctly |

### Debug Mode

Enable detailed logging by checking browser console for:
- API client initialization logs
- Request/response data
- Error messages with stack traces

## 📚 Resources

- **Dotloop API Documentation**: https://dotloop.github.io/public-api/
- **Next.js Documentation**: https://nextjs.org/docs
- **React Query Documentation**: https://tanstack.com/query/latest
- **Tailwind CSS Documentation**: https://tailwindcss.com/docs

## 📄 License

This project is for educational and development purposes. Please review Dotloop's API terms of service for production use.

---

**Built with ❤️ using Next.js, React Query, and Tailwind CSS**