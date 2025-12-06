import React, { useEffect, useState } from 'react';

const OAuthDebug = () => {
  const [urlInfo, setUrlInfo] = useState({});

  useEffect(() => {
    const url = window.location.href;
    const hash = window.location.hash;
    const search = window.location.search;
    
    // Parse hash params
    const hashParams = {};
    if (hash) {
      const params = new URLSearchParams(hash.substring(1));
      params.forEach((value, key) => {
        hashParams[key] = value;
      });
    }
    
    // Parse query params
    const searchParams = {};
    if (search) {
      const params = new URLSearchParams(search);
      params.forEach((value, key) => {
        searchParams[key] = value;
      });
    }
    
    setUrlInfo({
      fullUrl: url,
      hash: hash,
      search: search,
      hashParams: hashParams,
      searchParams: searchParams,
      sessionIdFromHash: hashParams.session_id || null,
      sessionIdFromSearch: searchParams.session_id || null
    });
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8 font-mono text-sm">
      <h1 className="text-2xl mb-6">OAuth Callback Debug Info</h1>
      
      <div className="space-y-4">
        <div className="bg-gray-800 p-4 rounded">
          <h2 className="text-lg mb-2 text-yellow-400">Full URL:</h2>
          <code className="break-all">{urlInfo.fullUrl}</code>
        </div>
        
        <div className="bg-gray-800 p-4 rounded">
          <h2 className="text-lg mb-2 text-yellow-400">Hash (#):</h2>
          <code>{urlInfo.hash || '(empty)'}</code>
        </div>
        
        <div className="bg-gray-800 p-4 rounded">
          <h2 className="text-lg mb-2 text-yellow-400">Search (?):</h2>
          <code>{urlInfo.search || '(empty)'}</code>
        </div>
        
        <div className="bg-gray-800 p-4 rounded">
          <h2 className="text-lg mb-2 text-yellow-400">Hash Parameters:</h2>
          <pre>{JSON.stringify(urlInfo.hashParams, null, 2)}</pre>
        </div>
        
        <div className="bg-gray-800 p-4 rounded">
          <h2 className="text-lg mb-2 text-yellow-400">Query Parameters:</h2>
          <pre>{JSON.stringify(urlInfo.searchParams, null, 2)}</pre>
        </div>
        
        <div className="bg-gray-800 p-4 rounded">
          <h2 className="text-lg mb-2 text-green-400">Session ID Found:</h2>
          <code className="text-xl">
            {urlInfo.sessionIdFromHash || urlInfo.sessionIdFromSearch || 'NOT FOUND'}
          </code>
          {(urlInfo.sessionIdFromHash || urlInfo.sessionIdFromSearch) && (
            <p className="mt-2 text-green-500">✓ Session ID detected!</p>
          )}
          {!(urlInfo.sessionIdFromHash || urlInfo.sessionIdFromSearch) && (
            <p className="mt-2 text-red-500">✗ No session ID found</p>
          )}
        </div>
      </div>
      
      <div className="mt-8">
        <button
          onClick={() => window.location.href = '/login'}
          className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded"
        >
          Back to Login
        </button>
      </div>
    </div>
  );
};

export default OAuthDebug;
