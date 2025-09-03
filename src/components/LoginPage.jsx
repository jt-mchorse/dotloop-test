import { useDotloopAuth } from '../hooks/useDotloopAuth';

const LoginPage = () => {
  const { login, isLoading } = useDotloopAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-blue-100">
            <svg
              className="h-8 w-8 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Dotloop API Test App
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Test the Dotloop Public API integration
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Authentication Required
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                This application requires access to your Dotloop account to test the API integration.
                You&apos;ll be redirected to Dotloop to authorize this application.
              </p>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-blue-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">
                    Required Permissions
                  </h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <ul className="list-disc list-inside space-y-1">
                      <li>account:read - Read account information</li>
                      <li>profile:read - Read profile information</li>
                      <li>loop:read - Read loop data (includes documents)</li>
                      <li>contact:read - Read contact information</li>
                      <li>template:read - Read template data</li>
                      <li>admin:read - Read admin data</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            
            <button
              onClick={login}
              disabled={isLoading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processing...
                </>
              ) : (
                'Connect to Dotloop'
              )}
            </button>
          </div>
        </div>
        
        <div className="text-center">
          <p className="text-xs text-gray-500">
            This is a test application for the Dotloop Public API v2
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage; 