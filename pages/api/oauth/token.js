// Next.js API route for OAuth token exchange with comprehensive logging

export default async function handler(req, res) {
  const startTime = Date.now();
  const timestamp = new Date().toISOString();
  
  console.log(`\n🔐 [${timestamp}] OAuth Token Exchange Request`);
  console.log('🔐 [OAUTH] Method:', req.method);
  console.log('🔐 [OAUTH] Headers:', JSON.stringify(req.headers, null, 2));
  console.log('🔐 [OAUTH] Body:', JSON.stringify(req.body, null, 2));

  // Only allow POST requests
  if (req.method !== 'POST') {
    console.log('❌ [OAUTH] Method not allowed:', req.method);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { code, redirect_uri } = req.body;

  if (!code) {
    console.log('❌ [OAUTH] Missing authorization code');
    return res.status(400).json({ error: 'Authorization code is required' });
  }

  try {
    // Get environment variables (these should be set in Vercel dashboard)
    const CLIENT_ID = process.env.NEXT_PUBLIC_DOTLOOP_CLIENT_ID;
    const CLIENT_SECRET = process.env.DOTLOOP_CLIENT_SECRET; // Keep secret on server-side only
    const DOTLOOP_AUTH = process.env.NEXT_PUBLIC_DOTLOOP_AUTH_URL || "https://auth.dotloop.com";

    console.log('🔐 [OAUTH] Environment check:', {
      CLIENT_ID: CLIENT_ID ? '✅ Set' : '❌ Missing',
      CLIENT_SECRET: CLIENT_SECRET ? '✅ Set' : '❌ Missing',
      DOTLOOP_AUTH,
      redirect_uri: redirect_uri || process.env.NEXT_PUBLIC_REDIRECT_URI
    });

    if (!CLIENT_ID || !CLIENT_SECRET) {
      console.error('❌ [OAUTH] Missing environment variables:', { CLIENT_ID: !!CLIENT_ID, CLIENT_SECRET: !!CLIENT_SECRET });
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // Create Basic Auth credentials
    const credentials = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');
    console.log('🔐 [OAUTH] Basic auth credentials generated successfully');

    console.log('🔐 [OAUTH] Making token exchange request to Dotloop...');
    const tokenUrl = `${DOTLOOP_AUTH}/oauth/token`;
    const requestBody = new URLSearchParams({
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: redirect_uri || process.env.NEXT_PUBLIC_REDIRECT_URI
    });

    console.log('🔐 [OAUTH] Token URL:', tokenUrl);
    console.log('🔐 [OAUTH] Request body:', requestBody.toString());

    // Make the token exchange request to Dotloop
    const tokenResponse = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Dotloop-Next-App/1.0'
      },
      body: requestBody
    });

    const responseTime = Date.now() - startTime;
    console.log(`🔐 [OAUTH] Dotloop response received: ${tokenResponse.status} (${responseTime}ms)`);

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('❌ [OAUTH] Dotloop token exchange failed:', {
        status: tokenResponse.status,
        statusText: tokenResponse.statusText,
        error: errorText,
        responseTime: `${responseTime}ms`
      });
      
      return res.status(tokenResponse.status).json({ 
        error: 'Token exchange failed',
        details: errorText,
        status: tokenResponse.status,
        timestamp
      });
    }

    const tokenData = await tokenResponse.json();
    console.log('✅ [OAUTH] Token exchange successful:', {
      access_token: tokenData.access_token ? '✅ Present' : '❌ Missing',
      refresh_token: tokenData.refresh_token ? '✅ Present' : '❌ Missing',
      expires_in: tokenData.expires_in,
      token_type: tokenData.token_type,
      scope: tokenData.scope,
      responseTime: `${responseTime}ms`
    });

    console.log('🔐 [OAUTH] Sending successful response to client');
    console.log('─'.repeat(80));

    // Return the token data to the client
    res.status(200).json(tokenData);

  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error('❌ [OAUTH] Token exchange error:', {
      message: error.message,
      stack: error.stack,
      responseTime: `${responseTime}ms`,
      timestamp
    });
    
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message,
      timestamp
    });
  }
}