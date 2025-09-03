/**
 * OAuth Token Refresh Endpoint  
 * Handles secure refresh of access tokens using refresh tokens
 * Following Dotloop API v2 OAuth 2.0 guidelines
 */

export default async function handler(req, res) {
  const startTime = Date.now();
  const timestamp = new Date().toISOString();
  
  console.log(`\n🔄 [${timestamp}] OAuth Token Refresh`);
  
  // Only allow POST requests
  if (req.method !== 'POST') {
    console.log('❌ [REFRESH] Method not allowed:', req.method);
    return res.status(405).json({ 
      error: 'Method not allowed',
      allowed: ['POST'] 
    });
  }

  const { refresh_token } = req.body;

  // Validate required parameters
  if (!refresh_token) {
    console.log('❌ [REFRESH] Missing refresh token');
    return res.status(400).json({ 
      error: 'Missing refresh token',
      required: ['refresh_token'] 
    });
  }

  try {
    // Get server-side environment variables
    const CLIENT_ID = process.env.NEXT_PUBLIC_DOTLOOP_CLIENT_ID;
    const CLIENT_SECRET = process.env.DOTLOOP_CLIENT_SECRET;
    const DOTLOOP_AUTH = process.env.NEXT_PUBLIC_DOTLOOP_AUTH_URL || 'https://auth.dotloop.com';

    console.log('🔄 [REFRESH] Environment check:', {
      CLIENT_ID: CLIENT_ID ? '✅ Set' : '❌ Missing',
      CLIENT_SECRET: CLIENT_SECRET ? '✅ Set' : '❌ Missing',
      DOTLOOP_AUTH
    });

    if (!CLIENT_ID || !CLIENT_SECRET) {
      console.error('❌ [REFRESH] Missing environment variables');
      return res.status(500).json({ 
        error: 'Server configuration error - missing credentials' 
      });
    }

    // Prepare token refresh request following Dotloop guidelines
    const tokenUrl = `${DOTLOOP_AUTH}/oauth/token`;
    const credentials = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');
    
    const requestBody = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refresh_token
    });

    console.log('🔄 [REFRESH] Making token refresh request...');

    // Make the token refresh request with HTTP Basic Authentication
    const tokenResponse = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Dotloop-Next-App/1.0',
        'Accept': 'application/json'
      },
      body: requestBody
    });

    const responseTime = Date.now() - startTime;
    console.log(`🔄 [REFRESH] Dotloop response: ${tokenResponse.status} (${responseTime}ms)`);

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('❌ [REFRESH] Token refresh failed:', {
        status: tokenResponse.status,
        statusText: tokenResponse.statusText,
        error: errorText
      });
      
      return res.status(tokenResponse.status).json({ 
        error: 'Token refresh failed',
        details: errorText,
        dotloop_status: tokenResponse.status
      });
    }

    const tokenData = await tokenResponse.json();
    
    // Log successful refresh (without sensitive data)
    console.log('✅ [REFRESH] Token refresh successful:', {
      access_token: tokenData.access_token ? '✅ Present' : '❌ Missing',
      refresh_token: tokenData.refresh_token ? '✅ Present' : '❌ Missing',
      expires_in: tokenData.expires_in,
      token_type: tokenData.token_type,
      scope: tokenData.scope,
      responseTime: `${responseTime}ms`
    });

    // Return refreshed tokens to client
    res.status(200).json(tokenData);

  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error('❌ [REFRESH] Server error:', {
      message: error.message,
      responseTime: `${responseTime}ms`,
      timestamp
    });
    
    res.status(500).json({ 
      error: 'Internal server error during token refresh',
      message: error.message
    });
  }
}