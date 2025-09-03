// Next.js API route for proxying Dotloop API requests with comprehensive logging

export default async function handler(req, res) {
  const startTime = Date.now();
  const timestamp = new Date().toISOString();
  
  // Extract path from the dynamic route
  const { path } = req.query;
  const apiPath = Array.isArray(path) ? path.join('/') : path;
  
  console.log(`\n🌐 [${timestamp}] Dotloop API Proxy Request`);
  console.log('🌐 [PROXY] Method:', req.method);
  console.log('🌐 [PROXY] API Path:', apiPath);
  console.log('🌐 [PROXY] Query:', JSON.stringify(req.query, null, 2));
  console.log('🌐 [PROXY] Headers:', JSON.stringify({
    authorization: req.headers.authorization ? '✅ Present' : '❌ Missing',
    'content-type': req.headers['content-type'],
    'user-agent': req.headers['user-agent']
  }, null, 2));
  
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('🌐 [PROXY] Body:', JSON.stringify(req.body, null, 2));
  }
  
  // Get authorization header from client
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('❌ [PROXY] Missing or invalid authorization header');
    return res.status(401).json({ 
      error: 'Authorization header required',
      expected: 'Bearer <token>',
      received: authHeader ? 'Invalid format' : 'Missing',
      timestamp
    });
  }

  try {
    const DOTLOOP_API = process.env.VITE_DOTLOOP_API_URL || "https://api-gateway.dotloop.com/public/v2";
    const url = `${DOTLOOP_API}/${apiPath}`;
    
    console.log('🌐 [PROXY] Target URL:', url);

    // Forward the request to Dotloop API
    const fetchOptions = {
      method: req.method,
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'Dotloop-Next-App/1.0'
      }
    };

    // Add body for POST/PUT/PATCH requests
    if (req.method !== 'GET' && req.method !== 'DELETE') {
      if (req.body) {
        fetchOptions.body = JSON.stringify(req.body);
        console.log('🌐 [PROXY] Request body added for', req.method, 'request');
      }
    }

    // Add query parameters if they exist (excluding the 'path' parameter)
    const queryParams = new URLSearchParams();
    Object.keys(req.query).forEach(key => {
      if (key !== 'path') {
        queryParams.append(key, req.query[key]);
      }
    });
    
    const finalUrl = queryParams.toString() ? `${url}?${queryParams.toString()}` : url;
    console.log('🌐 [PROXY] Final URL with query params:', finalUrl);

    console.log('🌐 [PROXY] Making request to Dotloop API...');
    const response = await fetch(finalUrl, fetchOptions);
    
    const responseTime = Date.now() - startTime;
    console.log(`🌐 [PROXY] Dotloop API response: ${response.status} ${response.statusText} (${responseTime}ms)`);
    
    // Log response headers
    const responseHeaders = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });
    console.log('🌐 [PROXY] Response headers:', JSON.stringify(responseHeaders, null, 2));

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ [PROXY] Dotloop API error:', {
        status: response.status,
        statusText: response.statusText,
        data,
        responseTime: `${responseTime}ms`,
        url: finalUrl
      });
      return res.status(response.status).json(data);
    }

    console.log('✅ [PROXY] Dotloop API request successful:', {
      status: response.status,
      dataSize: JSON.stringify(data).length,
      responseTime: `${responseTime}ms`,
      hasData: !!data,
      dataKeys: data && typeof data === 'object' ? Object.keys(data) : 'Not an object'
    });

    console.log('🌐 [PROXY] Sending successful response to client');
    console.log('─'.repeat(80));

    res.status(200).json(data);

  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error('❌ [PROXY] Proxy error:', {
      message: error.message,
      stack: error.stack,
      responseTime: `${responseTime}ms`,
      timestamp,
      apiPath
    });
    
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message,
      apiPath,
      timestamp
    });
  }
}