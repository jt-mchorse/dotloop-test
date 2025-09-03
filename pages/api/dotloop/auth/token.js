/**
 * OAuth Token Exchange Endpoint
 * Handles the secure exchange of authorization code for access/refresh tokens
 * Following Dotloop API v2 OAuth 2.0 guidelines
 */

export default async function handler(req, res) {
  const startTime = Date.now();
  const timestamp = new Date().toISOString();
  
  console.log(`\n🔐 [${timestamp}] OAuth Token Exchange`);
  
  // Only allow POST requests
  if (req.method !== 'POST') {
    console.log('❌ [AUTH] Method not allowed:', req.method);
    return res.status(405).json({ 
      error: 'Method not allowed',
      allowed: ['POST'] 
    });
  }

  const { code, state, redirect_uri } = req.body;

  // Validate required parameters
  if (!code) {
    console.log('❌ [AUTH] Missing authorization code');
    return res.status(400).json({ 
      error: 'Missing authorization code',
      required: ['code'] 
    });
  }

  try {
    // Get server-side environment variables
    const CLIENT_ID = process.env.NEXT_PUBLIC_DOTLOOP_CLIENT_ID;
    const CLIENT_SECRET = process.env.DOTLOOP_CLIENT_SECRET;
    const DOTLOOP_AUTH = process.env.NEXT_PUBLIC_DOTLOOP_AUTH_URL || 'https://auth.dotloop.com';

    console.log('🔐 [AUTH] Environment check:', {
      CLIENT_ID: CLIENT_ID ? '✅ Set' : '❌ Missing',
      CLIENT_SECRET: CLIENT_SECRET ? '✅ Set' : '❌ Missing',
      DOTLOOP_AUTH,
      redirect_uri: redirect_uri || process.env.NEXT_PUBLIC_REDIRECT_URI
    });

    if (!CLIENT_ID || !CLIENT_SECRET) {
      console.error('❌ [AUTH] Missing environment variables');
      return res.status(500).json({ 
        error: 'Server configuration error - missing credentials' 
      });
    }

    // Prepare token exchange request following Dotloop guidelines
    const tokenUrl = `${DOTLOOP_AUTH}/oauth/token`;
    const credentials = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');
    
    const requestBody = new URLSearchParams({
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: redirect_uri || process.env.NEXT_PUBLIC_REDIRECT_URI
    });

    console.log('🔐 [AUTH] Making token exchange request...');

    // Make the token exchange request with HTTP Basic Authentication
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
    console.log(`🔐 [AUTH] Dotloop response: ${tokenResponse.status} (${responseTime}ms)`);

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('❌ [AUTH] Token exchange failed:', {
        status: tokenResponse.status,
        statusText: tokenResponse.statusText,
        error: errorText
      });
      
      return res.status(tokenResponse.status).json({ 
        error: 'Token exchange failed',
        details: errorText,
        dotloop_status: tokenResponse.status
      });
    }

    const tokenData = await tokenResponse.json();
    
    // Log successful exchange (without sensitive data)
    console.log('✅ [AUTH] Token exchange successful:', {
      access_token: tokenData.access_token ? '✅ Present' : '❌ Missing',
      refresh_token: tokenData.refresh_token ? '✅ Present' : '❌ Missing',
      expires_in: tokenData.expires_in,
      token_type: tokenData.token_type,
      scope: tokenData.scope,
      responseTime: `${responseTime}ms`
    });

    // Return tokens to client
    res.status(200).json(tokenData);

  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error('❌ [AUTH] Server error:', {
      message: error.message,
      responseTime: `${responseTime}ms`,
      timestamp
    });
    
    res.status(500).json({ 
      error: 'Internal server error during token exchange',
      message: error.message
    });
  }
}