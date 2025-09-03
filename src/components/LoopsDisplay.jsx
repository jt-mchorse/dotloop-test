import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import dotloopApi from '../services/dotloopApi';
import FolderDocuments from './FolderDocuments';

console.log('📥 [LOOPS] dotloopApi imported:', dotloopApi);

const LoopsDisplay = () => {
  const [selectedLoop, setSelectedLoop] = useState(null);
  const [expandedLoop, setExpandedLoop] = useState(null);

  // Fetch profiles first to get profile ID
  const {
    data: profilesData,
    isLoading: profilesLoading,
    error: profilesError
  } = useQuery({
    queryKey: ['profiles'],
    queryFn: () => dotloopApi.getProfiles(),
    retry: 1,
  });

  // Get the primary profile ID from profiles data
  const primaryProfileId = profilesData?.data?.find(p => p.is_default)?.profile_id || profilesData?.data?.[0]?.profile_id;

  console.log('🔍 [LOOPS] Profiles data:', profilesData);
  console.log('🔍 [LOOPS] Primary profile ID:', primaryProfileId);

  // Fetch loops
  const {
    data: loopsData,
    isLoading: loopsLoading,
    error: loopsError
  } = useQuery({
    queryKey: ['loops', primaryProfileId],
    queryFn: () => dotloopApi.getLoops(primaryProfileId),
    enabled: !!primaryProfileId,
    retry: 1,
  });

  // Fetch loop details for selected loop
  const {
    data: loopDetails,
    isLoading: detailsLoading,
    error: detailsError
  } = useQuery({
    queryKey: ['loopDetails', primaryProfileId, selectedLoop?.loop_id],
    queryFn: () => dotloopApi.getLoopDetails(primaryProfileId, selectedLoop.loop_id),
    enabled: !!(primaryProfileId && selectedLoop),
    retry: 1,
  });

  // Fetch folders for expanded loop
  const {
    data: foldersData,
    isLoading: foldersLoading,
    error: foldersError
  } = useQuery({
    queryKey: ['folders', primaryProfileId, expandedLoop?.loop_id],
    queryFn: () => dotloopApi.getFolders(primaryProfileId, expandedLoop.loop_id),
    enabled: !!(primaryProfileId && expandedLoop),
    retry: 1,
  });

  const handleLoopClick = (loop) => {
    setSelectedLoop(loop);
    setExpandedLoop(loop === expandedLoop ? null : loop);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const formatCurrency = (amount) => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (profilesLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="text-gray-600">Loading profiles...</span>
        </div>
      </div>
    );
  }

  if (profilesError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600">Error loading profiles</p>
        <p className="text-red-500 text-sm mt-2">
          {profilesError.response?.data?.message || profilesError.message}
        </p>
      </div>
    );
  }

  if (!primaryProfileId) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600">No profile found</p>
        <p className="text-red-500 text-sm mt-2">
          Debug: profiles count={profilesData?.data?.length || 0}
        </p>
      </div>
    );
  }

  if (loopsLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="text-gray-600">Loading loops...</span>
        </div>
      </div>
    );
  }

  if (loopsError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <h3 className="text-lg font-medium text-red-800">Error Loading Loops</h3>
        <p className="text-red-600 mt-2">
          {loopsError.response?.data?.message || loopsError.message}
        </p>
      </div>
    );
  }

  const loops = loopsData?.data || [];

  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Your Loops ({loops.length})
          </h2>
        </div>

        <div className="divide-y divide-gray-200">
          {loops.map((loop) => (
            <div key={loop.loop_id} className="p-6">
              {/* Loop Header */}
              <div 
                className="cursor-pointer hover:bg-gray-50 -m-6 p-6 rounded-lg"
                onClick={() => handleLoopClick(loop)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-lg font-medium text-gray-900">
                        {loop.loop_name || 'Unnamed Loop'}
                      </h3>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        loop.status === 'Active' 
                          ? 'bg-green-100 text-green-800'
                          : loop.status === 'Archived'
                          ? 'bg-gray-100 text-gray-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {loop.status || 'Unknown'}
                      </span>
                    </div>
                    
                    <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">Created:</span> {formatDate(loop.created)}
                      </div>
                      <div>
                        <span className="font-medium">Updated:</span> {formatDate(loop.updated)}
                      </div>
                      <div>
                        <span className="font-medium">Loop ID:</span> {loop.loop_id}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button className="text-blue-600 hover:text-blue-800">
                      {expandedLoop?.loop_id === loop.loop_id ? '▼' : '▶'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Expanded Content */}
              {expandedLoop?.loop_id === loop.loop_id && (
                <div className="mt-6 space-y-6">
                  {/* Loop Details */}
                  {detailsLoading && (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      <span className="text-sm text-gray-600">Loading details...</span>
                    </div>
                  )}
                  
                  {loopDetails && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-3">Property Details</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        {loopDetails.data?.street_name && (
                          <div>
                            <span className="font-medium">Address:</span> {loopDetails.data.street_name}
                          </div>
                        )}
                        {loopDetails.data?.city && (
                          <div>
                            <span className="font-medium">City:</span> {loopDetails.data.city}
                          </div>
                        )}
                        {loopDetails.data?.state_province && (
                          <div>
                            <span className="font-medium">State:</span> {loopDetails.data.state_province}
                          </div>
                        )}
                        {loopDetails.data?.zip_postal_code && (
                          <div>
                            <span className="font-medium">ZIP:</span> {loopDetails.data.zip_postal_code}
                          </div>
                        )}
                        {loopDetails.data?.purchase_sale_price && (
                          <div>
                            <span className="font-medium">Price:</span> {formatCurrency(loopDetails.data.purchase_sale_price)}
                          </div>
                        )}
                        {loopDetails.data?.property_type && (
                          <div>
                            <span className="font-medium">Type:</span> {loopDetails.data.property_type}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Folders and Documents */}
                  {foldersLoading && (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      <span className="text-sm text-gray-600">Loading folders...</span>
                    </div>
                  )}

                  {foldersError && (
                    <div className="bg-red-50 border border-red-200 rounded p-3">
                      <p className="text-red-600 text-sm">
                        Error loading folders: {foldersError.response?.data?.message || foldersError.message}
                      </p>
                    </div>
                  )}

                  {foldersData && (
                    <div className="space-y-4">
                      <h4 className="font-medium text-gray-900">Folders & Documents</h4>
                      {foldersData.data?.map((folder) => (
                        <FolderDocuments 
                          key={folder.folder_id}
                          folder={folder}
                          profileId={primaryProfileId}
                          loopId={loop.loop_id}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {loops.length === 0 && (
          <div className="p-6 text-center">
            <p className="text-gray-500">No loops found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoopsDisplay;