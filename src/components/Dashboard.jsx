import { useState, useEffect } from 'react';
import { useDotloopAuth } from '../hooks/useDotloopAuth';
import dotloopApi from '../services/dotloopApi';
import LoopsDisplay from './LoopsDisplay';

const Dashboard = () => {
  const { user, logout } = useDotloopAuth();
  const [profiles, setProfiles] = useState([]);
  const [loops, setLoops] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState({
    profiles: false,
    loops: false,
    contacts: false,
    templates: false,
    documents: false
  });
  const [error, setError] = useState(null);

  const fetchData = async (apiCall, setter, key) => {
    try {
      setLoading(prev => ({ ...prev, [key]: true }));
      const data = await apiCall();
      setter(data.data || data);
    } catch (err) {
      console.error(`Error fetching ${key}:`, err);
      setError(`Failed to load ${key}: ${err.message}`);
    } finally {
      setLoading(prev => ({ ...prev, [key]: false }));
    }
  };

  useEffect(() => {
    if (user) {
      fetchData(dotloopApi.getProfiles, setProfiles, 'profiles');
      fetchData(dotloopApi.getContacts, setContacts, 'contacts');
      fetchData(dotloopApi.getTemplates, setTemplates, 'templates');
    }
  }, [user]);

  const DataCard = ({ title, data, loading, error }) => (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      {loading ? (
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        </div>
      ) : error ? (
        <p className="text-red-600 text-sm">{error}</p>
      ) : (
        <div className="space-y-2">
          {Array.isArray(data) && data.length > 0 ? (
            data.slice(0, 5).map((item, index) => (
              <div key={index} className="text-sm text-gray-600 p-2 bg-gray-50 rounded">
                {item.name || item.title || item.email || `Item ${index + 1}`}
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-sm">No data available</p>
          )}
          {Array.isArray(data) && data.length > 5 && (
            <p className="text-xs text-gray-400">Showing first 5 items...</p>
          )}
        </div>
      )}
    </div>
  );

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Not authenticated</h2>
          <p className="text-gray-600">Please log in to access the dashboard</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dotloop Dashboard</h1>
              <p className="text-sm text-gray-600">
                Welcome, {user.attributes?.name || user.attributes?.email || 'User'}
              </p>
            </div>
            <button
              onClick={logout}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Account Info */}
        <div className="mb-8 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Account Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Account ID</p>
              <p className="text-sm text-gray-900">{user.id}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Name</p>
              <p className="text-sm text-gray-900">{user.attributes?.name || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Email</p>
              <p className="text-sm text-gray-900">{user.attributes?.email || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Type</p>
              <p className="text-sm text-gray-900">{user.type}</p>
            </div>
          </div>
        </div>

        {/* Current Scopes */}
        <div className="mb-8 bg-blue-50 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Current App Permissions</h2>
          <p className="text-sm text-gray-600 mb-4">
            These are the permissions your app currently has access to:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="flex items-center">
              <span className="text-green-500 mr-2">✅</span>
              <span className="text-sm font-medium">account:read</span>
              <span className="text-xs text-gray-500 ml-2">- Account stats and info</span>
            </div>
            <div className="flex items-center">
              <span className="text-green-500 mr-2">✅</span>
              <span className="text-sm font-medium">profile:read</span>
              <span className="text-xs text-gray-500 ml-2">- User profile data</span>
            </div>
            <div className="flex items-center">
              <span className="text-green-500 mr-2">✅</span>
              <span className="text-sm font-medium">loop:read</span>
              <span className="text-xs text-gray-500 ml-2">- List and view loops (includes documents)</span>
            </div>
            <div className="flex items-center">
              <span className="text-green-500 mr-2">✅</span>
              <span className="text-sm font-medium">contact:read</span>
              <span className="text-xs text-gray-500 ml-2">- List and view contacts</span>
            </div>
            <div className="flex items-center">
              <span className="text-green-500 mr-2">✅</span>
              <span className="text-sm font-medium">template:read</span>
              <span className="text-xs text-gray-500 ml-2">- List and view templates</span>
            </div>
            <div className="flex items-center">
              <span className="text-green-500 mr-2">✅</span>
              <span className="text-sm font-medium">admin:read</span>
              <span className="text-xs text-gray-500 ml-2">- Administrative data</span>
            </div>
          </div>
        </div>

        {/* Comprehensive Loops Display */}
        <div className="mb-8">
          <LoopsDisplay user={user} />
        </div>

        {/* Quick Data Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <DataCard
            title="Profiles"
            data={profiles}
            loading={loading.profiles}
            error={error}
          />
          <DataCard
            title="Contacts"
            data={contacts}
            loading={loading.contacts}
            error={error}
          />
          <DataCard
            title="Templates"
            data={templates}
            loading={loading.templates}
            error={error}
          />
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total Profiles:</span>
                <span className="text-sm font-medium">{profiles.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total Contacts:</span>
                <span className="text-sm font-medium">{contacts.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total Templates:</span>
                <span className="text-sm font-medium">{templates.length}</span>
              </div>
            </div>
          </div>
        </div>

        {/* API Testing Section */}
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">API Testing</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => fetchData(dotloopApi.getProfiles, setProfiles, 'profiles')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              Refresh Profiles
            </button>
            <button
              onClick={() => window.location.reload()}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              Refresh All Data
            </button>
            <button
              onClick={() => fetchData(dotloopApi.getContacts, setContacts, 'contacts')}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              Refresh Contacts
            </button>
            <button
              onClick={() => fetchData(dotloopApi.getTemplates, setTemplates, 'templates')}
              className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              Refresh Templates
            </button>
            <button
              onClick={() => console.log('User data:', user)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              Debug User Data
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard; 