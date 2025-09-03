import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useDotloopAuth } from '../hooks/useDotloopAuth';

const OAuthCallback = () => {
  const router = useRouter();
  const { handleCallback } = useDotloopAuth();
  const [status, setStatus] = useState('Processing...');

  useEffect(() => {
    const processCallback = async () => {
      console.log("🔄 [CALLBACK] OAuth callback component mounted");
      console.log("🔄 [CALLBACK] Current URL:", window.location.href);
      console.log("🔄 [CALLBACK] Router query:", router.query);
      
      const { code, state, error } = router.query;

      console.log("🔄 [CALLBACK] URL parameters:");
      console.log("🔄 [CALLBACK] - Code:", code ? "✅ Present" : "❌ Missing");
      console.log("🔄 [CALLBACK] - State:", state ? "✅ Present" : "❌ Missing");
      console.log("🔄 [CALLBACK] - Error:", error ? `❌ ${error}` : "✅ None");

      if (error) {
        console.error("❌ [CALLBACK] OAuth error received:", error);
        setStatus(`Error: ${error}`);
        setTimeout(() => router.push('/'), 3000);
        return;
      }

      if (!code) {
        console.error("❌ [CALLBACK] No authorization code received");
        setStatus('No authorization code received');
        setTimeout(() => router.push('/'), 3000);
        return;
      }

      try {
        console.log("🔄 [CALLBACK] Starting token exchange process...");
        setStatus('Exchanging code for token...');
        const success = await handleCallback(code, state);
        
        if (success) {
          console.log("✅ [CALLBACK] Authentication successful, redirecting to dashboard");
          setStatus('Authentication successful! Redirecting...');
          setTimeout(() => router.push('/dashboard'), 1500);
        } else {
          console.error("❌ [CALLBACK] Authentication failed");
          setStatus('Authentication failed');
          setTimeout(() => router.push('/'), 3000);
        }
      } catch (err) {
        console.error("❌ [CALLBACK] Error during callback processing:", err);
        setStatus(`Error: ${err.message}`);
        setTimeout(() => router.push('/'), 3000);
      }
    };

    if (router.isReady) {
      processCallback();
    }
  }, [router.isReady, router.query, handleCallback, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Processing Authentication
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {status}
          </p>
          <div className="mt-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OAuthCallback; 