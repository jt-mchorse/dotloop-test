import { useState } from 'react';
import dotloopApi from '../services/dotloopApiClient';

const ApiDebugger = () => {
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState({});

  const testEndpoint = async (name, apiCall) => {
    setLoading(prev => ({ ...prev, [name]: true }));
    try {
      console.log(`🧪 [DEBUG] Testing ${name}...`);
      const result = await apiCall();
      console.log(`✅ [DEBUG] ${name} success:`, result);
      setResults(prev => ({ ...prev, [name]: { success: true, data: result } }));
    } catch (error) {
      console.error(`❌ [DEBUG] ${name} failed:`, error);
      setResults(prev => ({ 
        ...prev, 
        [name]: { 
          success: false, 
          error: error.message,
          status: error.response?.status,
          data: error.response?.data
        }
      }));
    } finally {
      setLoading(prev => ({ ...prev, [name]: false }));
    }
  };

  const runTests = async () => {
    // Test account endpoint
    await testEndpoint('Account', () => dotloopApi.getAccount());
    
    // Test profiles endpoint
    await testEndpoint('Profiles', () => dotloopApi.getProfiles());
    
    // Get profile ID for other tests
    let profilesResult;
    try {
      profilesResult = await dotloopApi.getProfiles();
    } catch (error) {
      console.error('❌ [DEBUG] Failed to get profiles for further testing:', error);
      return;
    }
    
    const profileId = profilesResult?.data?.[0]?.id;
    
    if (profileId) {
      console.log(`🔍 [DEBUG] Using profile ID: ${profileId}`);
      
      // Test profile-specific endpoints
      await testEndpoint('Single Profile', () => dotloopApi.getProfile(profileId));
      await testEndpoint('Loops', () => dotloopApi.getLoops(profileId));
      
      // Test both profile-based and global contacts/templates
      await testEndpoint('Contacts (Global)', () => dotloopApi.getContacts());
      await testEndpoint('Contacts (Profile-based)', () => dotloopApi.getContacts(profileId));
      await testEndpoint('Templates (Global)', () => dotloopApi.getTemplates());
      await testEndpoint('Templates (Profile-based)', () => dotloopApi.getTemplates(profileId));
    } else {
      console.error('❌ [DEBUG] No profile ID available for further tests');
      
      // Still test global endpoints without profile
      await testEndpoint('Contacts (Global)', () => dotloopApi.getContacts());
      await testEndpoint('Templates (Global)', () => dotloopApi.getTemplates());
    }
  };

  const ResultDisplay = ({ name, result }) => {
    if (loading[name]) {
      return <div className="text-blue-600">Loading...</div>;
    }

    if (!result) {
      return <div className="text-gray-400">Not tested</div>;
    }

    if (result.success) {
      return (
        <div className="text-green-600">
          ✅ Success
          <details className="mt-1">
            <summary className="cursor-pointer text-sm">Show data</summary>
            <pre className="text-xs bg-gray-100 p-2 mt-1 overflow-auto">
              {JSON.stringify(result.data, null, 2)}
            </pre>
          </details>
        </div>
      );
    }

    return (
      <div className="text-red-600">
        ❌ Failed: {result.error}
        {result.status && <div className="text-sm">Status: {result.status}</div>}
        {result.data && (
          <details className="mt-1">
            <summary className="cursor-pointer text-sm">Show error details</summary>
            <pre className="text-xs bg-red-100 p-2 mt-1 overflow-auto">
              {JSON.stringify(result.data, null, 2)}
            </pre>
          </details>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">API Endpoint Debugger</h2>
        <div className="space-x-2">
          <button
            onClick={() => {
              dotloopApi.clearTokens();
              alert('Tokens cleared! Please refresh the page and log in again with new scopes.');
            }}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm"
          >
            Clear Tokens & Re-auth
          </button>
          <button
            onClick={runTests}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
            disabled={Object.values(loading).some(Boolean)}
          >
            Run All Tests
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {[
          'Account',
          'Profiles', 
          'Single Profile',
          'Loops',
          'Contacts (Global)',
          'Contacts (Profile-based)',
          'Templates (Global)',
          'Templates (Profile-based)'
        ].map(endpoint => (
          <div key={endpoint} className="border-l-4 border-gray-200 pl-4">
            <div className="font-medium">{endpoint}</div>
            <ResultDisplay name={endpoint} result={results[endpoint]} />
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-gray-50 rounded">
        <h3 className="font-medium mb-2">Current OAuth Scopes:</h3>
        <code className="text-sm">
          account:read, profile:*, loop:*, contact:*, template:*
        </code>
      </div>
    </div>
  );
};

export default ApiDebugger;