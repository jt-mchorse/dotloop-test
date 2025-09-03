import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import dotloopApi from '../services/dotloopApiClient';
import FolderDocuments from './FolderDocuments';

console.log('📥 [LOOPS] DotloopApiClient imported');

const LoopsDisplay = () => {
  const [selectedLoop, setSelectedLoop] = useState(null);
  const [expandedLoop, setExpandedLoop] = useState(null);
  const queryClient = useQueryClient();

  // Fetch profiles first to get profile ID
  const {
    data: profilesData,
    isLoading: profilesLoading,
    error: profilesError
  } = useQuery({
    queryKey: ['profiles'],
    queryFn: () => dotloopApi.getProfiles(),
    retry: false, // Disable retries to prevent infinite calls
    refetchOnWindowFocus: false,
    refetchOnMount: false, // Only fetch once
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });

  // Get the primary profile ID from profiles data (using correct API field names)
  const primaryProfileId = profilesData?.data?.find(p => p.default)?.id || profilesData?.data?.[0]?.id;

  console.log('🔍 [LOOPS] Profiles data:', profilesData);
  console.log('🔍 [LOOPS] Profiles raw data:', profilesData?.data);
  console.log('🔍 [LOOPS] Number of profiles:', profilesData?.data?.length);
  if (profilesData?.data?.length > 0) {
    profilesData.data.forEach((profile, index) => {
      console.log(`🔍 [LOOPS] Profile ${index}:`, {
        id: profile.id,
        name: profile.name,
        default: profile.default,
        type: profile.type
      });
    });
  }
  console.log('🔍 [LOOPS] Selected primary profile ID:', primaryProfileId);

  // Fetch loops
  const {
    data: loopsData,
    isLoading: loopsLoading,
    error: loopsError
  } = useQuery({
    queryKey: ['loops', primaryProfileId],
    queryFn: () => {
      console.log('🚀 [LOOPS] Fetching loops for profile ID:', primaryProfileId);
      return dotloopApi.getLoops(primaryProfileId);
    },
    enabled: !!primaryProfileId,
    retry: false, // Disable retries to prevent infinite calls
    refetchOnWindowFocus: false,
    refetchOnMount: false, // Only fetch once
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    onSuccess: (data) => {
      console.log('✅ [LOOPS] Loops data received:', data);
      console.log('✅ [LOOPS] Number of loops:', data?.data?.length);
      if (data?.data?.length > 0) {
        data.data.forEach((loop, index) => {
          console.log(`✅ [LOOPS] Loop ${index}:`, {
            id: loop.id,
            loop_name: loop.loop_name,
            status: loop.status,
            created: loop.created,
            updated: loop.updated
          });
        });
      }
    },
    onError: (error) => {
      console.error('❌ [LOOPS] Error fetching loops:', error);
      console.error('❌ [LOOPS] Error details:', error.response?.data);
    }
  });

  // Fetch loop details for selected loop
  const {
    data: loopDetails,
    isLoading: detailsLoading
  } = useQuery({
    queryKey: ['loopDetails', primaryProfileId, selectedLoop?.id],
    queryFn: () => dotloopApi.getLoopDetails(primaryProfileId, selectedLoop.id),
    enabled: !!(primaryProfileId && selectedLoop),
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000,
    onSuccess: (data) => {
      console.log('✅ [LOOP_DETAILS] Loop details received:', data);
      console.log('✅ [LOOP_DETAILS] Data structure:', JSON.stringify(data, null, 2));
      if (data?.data) {
        console.log('✅ [LOOP_DETAILS] Available keys:', Object.keys(data.data));
        if (data.data["Property Address"]) {
          console.log('✅ [LOOP_DETAILS] Property Address keys:', Object.keys(data.data["Property Address"]));
        }
      }
    }
  });

  // Fetch folders for expanded loop
  const {
    data: foldersData,
    isLoading: foldersLoading,
    error: foldersError
  } = useQuery({
    queryKey: ['folders', primaryProfileId, expandedLoop?.id],
    queryFn: () => dotloopApi.getFolders(primaryProfileId, expandedLoop.id),
    enabled: !!(primaryProfileId && expandedLoop),
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000,
    onSuccess: (data) => {
      console.log('✅ [FOLDERS] Folders received for loop:', expandedLoop.name);
      console.log('✅ [FOLDERS] Folders data:', data);
      console.log('✅ [FOLDERS] Number of folders:', data?.meta?.total);
      if (data?.data?.length > 0) {
        console.log('✅ [FOLDERS] First folder structure:', data.data[0]);
      }
    }
  });

  const handleLoopClick = (loop) => {
    setSelectedLoop(loop);
    setExpandedLoop(loop === expandedLoop ? null : loop);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
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
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">
            Your Loops ({loops.length})
          </h2>
          <button
            onClick={() => {
              queryClient.invalidateQueries(['profiles']);
              queryClient.invalidateQueries(['loops']);
              queryClient.invalidateQueries(['folders']);
              queryClient.invalidateQueries(['documents']);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm font-medium"
          >
            Refresh Loops
          </button>
        </div>

        <div className="divide-y divide-gray-200">
          {loops.map((loop) => (
            <div key={loop.id} className="p-6">
              {/* Loop Header */}
              <div 
                className="cursor-pointer hover:bg-gray-50 -m-6 p-6 rounded-lg"
                onClick={() => handleLoopClick(loop)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-lg font-medium text-gray-900">
                        {loop.name || 'Unnamed Loop'}
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
                        <span className="font-medium">Loop ID:</span> {loop.id}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button className="text-blue-600 hover:text-blue-800">
                      {expandedLoop?.id === loop.id ? '▼' : '▶'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Expanded Content */}
              {expandedLoop?.id === loop.id && (
                <div className="mt-6 space-y-6">
                  {/* Loop Details */}
                  {detailsLoading && (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      <span className="text-sm text-gray-600">Loading details...</span>
                    </div>
                  )}
                  
                  {loopDetails && loopDetails.data && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-3">Property Details</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        {loopDetails.data["Property Address"] && (
                          <>
                            {/* Full Address */}
                            {(loopDetails.data["Property Address"]["Street Number"] || loopDetails.data["Property Address"]["Street Name"]) && (
                              <div>
                                <span className="font-medium">Address:</span> {
                                  [
                                    loopDetails.data["Property Address"]["Street Number"],
                                    loopDetails.data["Property Address"]["Street Name"]
                                  ].filter(Boolean).join(' ')
                                }
                              </div>
                            )}
                            
                            {/* County/City */}
                            {loopDetails.data["Property Address"]["County"] && (
                              <div>
                                <span className="font-medium">County:</span> {loopDetails.data["Property Address"]["County"]}
                              </div>
                            )}
                            
                            {/* State/Province */}
                            {loopDetails.data["Property Address"]["State/Prov"] && (
                              <div>
                                <span className="font-medium">State/Province:</span> {loopDetails.data["Property Address"]["State/Prov"]}
                              </div>
                            )}
                            
                            {/* ZIP/Postal Code */}
                            {loopDetails.data["Property Address"]["Zip/Postal Code"] && (
                              <div>
                                <span className="font-medium">ZIP/Postal Code:</span> {loopDetails.data["Property Address"]["Zip/Postal Code"]}
                              </div>
                            )}
                            
                            {/* Country */}
                            {loopDetails.data["Property Address"]["Country"] && (
                              <div>
                                <span className="font-medium">Country:</span> {loopDetails.data["Property Address"]["Country"]}
                              </div>
                            )}
                          </>
                        )}
                        
                        {/* Handle case when Property Address is not available but other data exists */}
                        {!loopDetails.data["Property Address"] && Object.keys(loopDetails.data).length > 0 && (
                          <div className="col-span-full">
                            <div className="text-gray-700 mb-2 font-medium">Additional Details:</div>
                            {Object.entries(loopDetails.data).map(([key, value]) => {
                              // Skip nested objects for now, display simple key-value pairs
                              if (typeof value !== 'object' && value) {
                                return (
                                  <div key={key} className="text-sm mb-1">
                                    <span className="font-medium">{key}:</span> {value}
                                  </div>
                                );
                              }
                              return null;
                            })}
                          </div>
                        )}
                        
                        {/* Handle case when no data is available */}
                        {Object.keys(loopDetails.data).length === 0 && (
                          <div className="col-span-full text-gray-500 italic">
                            No property details available
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
                      <h4 className="font-medium text-gray-900">
                        Folders & Documents
                        {foldersData.meta?.total !== undefined && (
                          <span className="ml-2 text-sm font-normal text-gray-600">
                            ({foldersData.meta.total} folder{foldersData.meta.total !== 1 ? 's' : ''})
                          </span>
                        )}
                      </h4>
                      {foldersData.data?.map((folder) => (
                        <FolderDocuments 
                          key={folder.id}
                          folder={folder}
                          profileId={primaryProfileId}
                          loopId={loop.id}
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