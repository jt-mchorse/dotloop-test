// Vercel serverless function to proxy all Dotloop API requests
// This handles CORS issues by making requests server-side

export default async function handler(req, res) {
  const { path } = req.query;
  
  // Get the full API path
  const apiPath = Array.isArray(path) ? path.join('/') : path;
  
  // Get authorization header from client
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization header required' });
  }

  try {
    const DOTLOOP_API = process.env.VITE_DOTLOOP_API_URL || "https://api-gateway.dotloop.com/public/v2";
    const url = `${DOTLOOP_API}/${apiPath}`;
    
    console.log(`Proxying ${req.method} request to: ${url}`);

    // Forward the request to Dotloop API
    const fetchOptions = {
      method: req.method,
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    };

    // Add body for POST/PUT/PATCH requests
    if (req.method !== 'GET' && req.method !== 'DELETE') {
      if (req.body) {
        fetchOptions.body = JSON.stringify(req.body);
      }
    }

    // Add query parameters if they exist
    const queryParams = new URLSearchParams();
    Object.keys(req.query).forEach(key => {
      if (key !== 'path') {
        queryParams.append(key, req.query[key]);
      }
    });
    
    const finalUrl = queryParams.toString() ? `${url}?${queryParams.toString()}` : url;

    const response = await fetch(finalUrl, fetchOptions);
    const data = await response.json();

    if (!response.ok) {
      console.error('Dotloop API error:', response.status, data);
      return res.status(response.status).json(data);
    }

    console.log('Dotloop API request successful');
    res.status(200).json(data);

  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}