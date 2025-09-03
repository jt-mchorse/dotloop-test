/**
 * Dotloop API Proxy Endpoint
 * Secure proxy for authenticated Dotloop API requests
 * Following Dotloop API v2 guidelines and Next.js security best practices
 */

export default async function handler(req, res) {
  const startTime = Date.now();
  const timestamp = new Date().toISOString();
  
  // Extract path from the dynamic route
  const { path } = req.query;
  const apiPath = Array.isArray(path) ? path.join('/') : path;
  
  console.log(`\n🌐 [${timestamp}] Dotloop API Proxy`);
  console.log('🌐 [PROXY] Method:', req.method);
  console.log('🌐 [PROXY] API Path:', apiPath);
  
  // Get authorization header from client
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('❌ [PROXY] Missing or invalid authorization header');
    return res.status(401).json({ 
      error: 'Authorization required',
      message: 'Bearer token must be provided in Authorization header',
      format: 'Authorization: Bearer <access_token>'
    });
  }

  try {
    const DOTLOOP_API = process.env.NEXT_PUBLIC_DOTLOOP_API_URL || 'https://api-gateway.dotloop.com/public/v2';
    const url = `${DOTLOOP_API}/${apiPath}`;
    
    console.log('🌐 [PROXY] Target URL:', url);

    // Prepare request options following Dotloop API guidelines
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
    if (req.method !== 'GET' && req.method !== 'DELETE' && req.body) {
      fetchOptions.body = JSON.stringify(req.body);
      console.log('🌐 [PROXY] Request body added for', req.method, 'request');
    }

    // Add query parameters if they exist (excluding the 'path' parameter)
    const queryParams = new URLSearchParams();
    Object.keys(req.query).forEach(key => {
      if (key !== 'path') {
        const value = req.query[key];
        if (Array.isArray(value)) {
          value.forEach(v => queryParams.append(key, v));
        } else {
          queryParams.append(key, value);
        }
      }
    });
    
    const finalUrl = queryParams.toString() ? `${url}?${queryParams.toString()}` : url;
    console.log('🌐 [PROXY] Final URL:', finalUrl);

    console.log('🌐 [PROXY] Making request to Dotloop API...');
    const response = await fetch(finalUrl, fetchOptions);
    
    const responseTime = Date.now() - startTime;
    console.log(`🌐 [PROXY] Dotloop response: ${response.status} ${response.statusText} (${responseTime}ms)`);

    // Handle different content types
    const contentType = response.headers.get('content-type');
    let data;
    
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else if (contentType && (
      contentType.includes('application/pdf') || 
      contentType.includes('application/octet-stream') ||
      contentType.includes('image/') ||
      contentType.includes('application/zip') ||
      contentType.includes('application/msword') ||
      contentType.includes('application/vnd.')
    )) {
      // Handle binary file downloads
      console.log('🔽 [PROXY] Binary file download detected, content-type:', contentType);
      const arrayBuffer = await response.arrayBuffer();
      data = Buffer.from(arrayBuffer);
    } else {
      data = await response.text();
    }

    // Log response details (without sensitive data)
    if (!response.ok) {
      console.error('❌ [PROXY] Dotloop API error:', {
        status: response.status,
        statusText: response.statusText,
        contentType,
        dataPreview: typeof data === 'string' ? data.substring(0, 200) : 'JSON object',
        responseTime: `${responseTime}ms`,
        url: finalUrl
      });
      
      return res.status(response.status).json({
        error: 'Dotloop API error',
        status: response.status,
        statusText: response.statusText,
        details: data
      });
    }

    console.log('✅ [PROXY] Dotloop API request successful:', {
      status: response.status,
      contentType,
      responseTime: `${responseTime}ms`,
      hasData: !!data
    });

    // Set appropriate content type and headers for response
    if (contentType) {
      res.setHeader('Content-Type', contentType);
    }

    // For binary downloads, set additional headers
    if (data instanceof Buffer) {
      const contentDisposition = response.headers.get('content-disposition');
      if (contentDisposition) {
        res.setHeader('Content-Disposition', contentDisposition);
      }
      const contentLength = response.headers.get('content-length');
      if (contentLength) {
        res.setHeader('Content-Length', contentLength);
      }
      
      res.status(response.status).end(data);
    } else {
      res.status(response.status).send(data);
    }

  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error('❌ [PROXY] Server error:', {
      message: error.message,
      stack: error.stack,
      responseTime: `${responseTime}ms`,
      timestamp,
      apiPath
    });
    
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to proxy request to Dotloop API',
      details: error.message,
      apiPath
    });
  }
}