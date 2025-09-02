# Dotloop API Test Application

A React-based front-end application for testing the Dotloop Public API v2 integration.

## Features

- OAuth2 authentication with Dotloop
- Complete API integration with all Dotloop endpoints
- Modern React UI with Tailwind CSS
- Real-time data fetching and display
- Token management with automatic refresh
- Protected routes and authentication flow

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Dotloop API credentials (Client ID and Client Secret)

## Installation

1. Clone or download this project
2. Install dependencies:

   ```bash
   npm install
   ```

3. Configure environment variables:
   Create a `.env` file in the root directory with the following variables:
   ```
   VITE_DOTLOOP_CLIENT_ID=your_client_id_here
   VITE_DOTLOOP_CLIENT_SECRET=your_client_secret_here
   VITE_DOTLOOP_AUTH_URL=https://auth.dotloop.com
   VITE_DOTLOOP_API_URL=https://api-gateway.dotloop.com/public/v2
   VITE_REDIRECT_URI=http://localhost:5173/callback
   ```

## CORS Configuration

To handle CORS issues during development, you can use a CORS proxy. Create a `.env` file in the root directory with the following configuration:

```env
# Dotloop API Configuration
VITE_DOTLOOP_CLIENT_ID=your_client_id_here
VITE_DOTLOOP_CLIENT_SECRET=your_client_secret_here
VITE_DOTLOOP_AUTH_URL=https://auth.dotloop.com
VITE_DOTLOOP_API_URL=https://api-gateway.dotloop.com/public/v2
VITE_REDIRECT_URI=http://localhost:5173/callback

# CORS Proxy Configuration (for development)
VITE_USE_CORS_PROXY=true
VITE_CORS_PROXY=https://cors-anywhere.herokuapp.com/
```

### Alternative Solutions:

1. **CORS Browser Extension**: Install a CORS browser extension like "CORS Unblock" or "Allow CORS"
2. **Local CORS Proxy**: Run a local CORS proxy server
3. **Backend Proxy**: Create a backend service to handle OAuth token exchange

### Recommended Approach:

For development, use the CORS proxy configuration above. For production, implement a backend service to handle OAuth token exchange securely.

## Development

Start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## Usage

1. **Authentication**: Click "Connect to Dotloop" to start the OAuth2 flow
2. **Authorization**: You'll be redirected to Dotloop to authorize the application
3. **Dashboard**: After successful authentication, you'll see your account data and can test various API endpoints
4. **API Testing**: Use the refresh buttons to test different API calls

## API Endpoints Tested

- **Account**: Get account information
- **Profiles**: List and manage profiles
- **Loops**: List and manage loops
- **Contacts**: List and manage contacts
- **Templates**: List available templates
- **Loop Details**: Get detailed loop information
- **Loop Folders**: Manage loop folders
- **Loop Documents**: Upload and manage documents
- **Loop Participants**: Manage loop participants
- **Loop Tasks**: View task lists and items
- **Loop Activities**: View loop activities
- **Webhooks**: Manage webhook subscriptions and events

## Permissions Required

The application requests the following scopes:

- `account:read` - Read account information
- `profile:read` - Read profile information
- `loop:read` - Read loop data
- `contact:read` - Read contact information
- `template:read` - Read template data
- `admin:read` - Read admin data
- `document:read` - Read document information

## Project Structure

```
src/
├── components/
│   ├── Dashboard.jsx          # Main dashboard component
│   ├── LoginPage.jsx          # Login page component
│   └── OAuthCallback.jsx      # OAuth callback handler
├── hooks/
│   └── useDotloopAuth.js      # Authentication hook
├── services/
│   └── dotloopApi.js          # API service class
├── utils/                     # Utility functions
├── App.jsx                    # Main app component
└── main.jsx                   # App entry point
```

## Authentication Flow

1. User clicks "Connect to Dotloop"
2. User is redirected to Dotloop authorization page
3. User authorizes the application
4. Dotloop redirects back to `/callback` with authorization code
5. Application exchanges code for access token
6. User is redirected to dashboard
7. Tokens are stored in localStorage for future use

## Token Management

- Access tokens expire after 12 hours
- Refresh tokens are used to get new access tokens
- Tokens are automatically refreshed when making API calls
- Tokens are stored securely in localStorage

## Error Handling

The application includes comprehensive error handling for:

- Authentication failures
- API request failures
- Token refresh failures
- Network errors

## Building for Production

```bash
npm run build
```

The built application will be in the `dist` directory.

## Troubleshooting

1. **Authentication Issues**: Ensure your Client ID and Secret are correct
2. **CORS Issues**: Make sure your redirect URI is properly configured
3. **API Errors**: Check the browser console for detailed error messages
4. **Token Issues**: Clear localStorage and try re-authenticating

## API Documentation

For detailed API documentation, visit: https://dotloop.github.io/public-api/

## License

This is a test application for educational and development purposes.
