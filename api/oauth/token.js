// Vercel serverless function for secure OAuth token exchange
// This runs on the server side to avoid CORS issues

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { code, redirect_uri } = req.body;

  if (!code) {
    return res.status(400).json({ error: 'Authorization code is required' });
  }

  try {
    // Get environment variables (these should be set in Vercel dashboard)
    const CLIENT_ID = process.env.VITE_DOTLOOP_CLIENT_ID;
    const CLIENT_SECRET = process.env.VITE_DOTLOOP_CLIENT_SECRET;
    const DOTLOOP_AUTH = process.env.VITE_DOTLOOP_AUTH_URL || "https://auth.dotloop.com";

    if (!CLIENT_ID || !CLIENT_SECRET) {
      console.error('Missing environment variables:', { CLIENT_ID: !!CLIENT_ID, CLIENT_SECRET: !!CLIENT_SECRET });
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // Create Basic Auth credentials
    const credentials = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');

    console.log('Making token exchange request to Dotloop...');

    // Make the token exchange request to Dotloop
    const tokenResponse = await fetch(`${DOTLOOP_AUTH}/oauth/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirect_uri || process.env.VITE_REDIRECT_URI
      })
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Dotloop token exchange failed:', tokenResponse.status, errorText);
      return res.status(tokenResponse.status).json({ 
        error: 'Token exchange failed',
        details: errorText 
      });
    }

    const tokenData = await tokenResponse.json();
    console.log('Token exchange successful');

    // Return the token data to the client
    res.status(200).json(tokenData);

  } catch (error) {
    console.error('Token exchange error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}