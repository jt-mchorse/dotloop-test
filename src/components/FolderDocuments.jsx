import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import dotloopApi from '../services/dotloopApiClient';

const FolderDocuments = ({ folder, profileId, loopId }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Fetch documents for this folder when expanded
  const {
    data: documentsData,
    isLoading: documentsLoading,
    error: documentsError
  } = useQuery({
    queryKey: ['documents', profileId, loopId, folder.id],
    queryFn: () => dotloopApi.getDocuments(profileId, loopId, folder.id),
    enabled: isExpanded,
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000,
    onSuccess: (data) => {
      console.log('✅ [DOCUMENTS] Documents received for folder:', folder.name);
      console.log('✅ [DOCUMENTS] Documents data:', data);
      console.log('✅ [DOCUMENTS] Number of documents:', data?.meta?.total);
      if (data?.data?.length > 0) {
        console.log('✅ [DOCUMENTS] First document structure:', data.data[0]);
      }
    }
  });

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };


  const getFileIcon = (filename) => {
    if (!filename) return '📄';
    const ext = filename.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'pdf': return '📄';
      case 'doc':
      case 'docx': return '📝';
      case 'xls':
      case 'xlsx': return '📊';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif': return '🖼️';
      case 'zip':
      case 'rar': return '🗜️';
      default: return '📄';
    }
  };

  const documents = documentsData?.data || [];

  return (
    <div className="border border-gray-200 rounded-lg">
      {/* Folder Header */}
      <div 
        className="p-4 bg-gray-50 cursor-pointer hover:bg-gray-100 flex items-center justify-between"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-3">
          <span className="text-lg">📁</span>
          <div>
            <h5 className="font-medium text-gray-900">
              {folder.name || 'Unnamed Folder'}
            </h5>
            <div className="text-sm text-gray-600">
              Folder ID: {folder.id}
              {isExpanded && documentsData?.meta?.total !== undefined && (
                <span className="ml-2">• {documentsData.meta.total} document{documentsData.meta.total !== 1 ? 's' : ''}</span>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          {folder.created && (
            <span className="text-sm text-gray-500">
              Created: {formatDate(folder.created)}
            </span>
          )}
          <button className="text-blue-600 hover:text-blue-800">
            {isExpanded ? '▼' : '▶'}
          </button>
        </div>
      </div>

      {/* Documents List */}
      {isExpanded && (
        <div className="border-t border-gray-200">
          {documentsLoading && (
            <div className="p-4 flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span className="text-sm text-gray-600">Loading documents...</span>
            </div>
          )}

          {documentsError && (
            <div className="p-4 bg-red-50">
              <p className="text-red-600 text-sm">
                Error loading documents: {documentsError.response?.data?.message || documentsError.message}
              </p>
            </div>
          )}

          {documents.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {documents.map((document) => (
                <div key={document.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 flex-1">
                      <span className="text-lg">
                        {getFileIcon(document.name)}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <h6 className="font-medium text-gray-900 truncate">
                            {document.name || 'Unnamed Document'}
                          </h6>
                        </div>
                        
                        <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500">
                          <span>ID: {document.id}</span>
                          <span>Folder ID: {document.folderId}</span>
                          {document.created && (
                            <span>Created: {formatDate(document.created)}</span>
                          )}
                          {document.updated && document.updated !== document.created && (
                            <span>Updated: {formatDate(document.updated)}</span>
                          )}
                        </div>

                        {document.description && (
                          <p className="mt-2 text-sm text-gray-600 truncate">
                            {document.description}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Document Actions */}
                    <div className="flex items-center space-x-2 ml-4">
                      {document.download_url && (
                        <a
                          href={document.download_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
                        >
                          Download
                        </a>
                      )}
                      {document.view_url && (
                        <a
                          href={document.view_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200"
                        >
                          View
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            !documentsLoading && (
              <div className="p-4 text-center">
                <p className="text-gray-500 text-sm">No documents in this folder</p>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
};

export default FolderDocuments;