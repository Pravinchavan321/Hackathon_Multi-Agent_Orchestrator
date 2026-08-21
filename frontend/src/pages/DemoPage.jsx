import { useEffect, useState } from 'react';
import { checkHealth } from '../api/aiAPI';

const DemoPage = () => {
  const [healthStatus, setHealthStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyHealth = async () => {
      setLoading(true);
      const data = await checkHealth();
      setHealthStatus(data);
      setLoading(false);
    };

    verifyHealth();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-xl mx-auto bg-white p-6 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-4 text-gray-800">Phase 1: Frontend Skeleton</h1>
        
        <div className="p-4 rounded mb-4 text-lg font-medium bg-gray-50 border">
          {loading ? (
            <span className="text-gray-500">Connecting to backend...</span>
          ) : healthStatus?.status === 'ok' ? (
            <span className="text-green-600">Backend: Connected ✅</span>
          ) : (
            <span className="text-red-600">Backend: Offline ❌</span>
          )}
        </div>

        <div className="bg-gray-900 text-green-400 p-4 rounded font-mono text-sm overflow-x-auto">
          <p className="mb-2 text-gray-400">// Raw JSON Response:</p>
          <pre>
            {JSON.stringify(healthStatus || { error: "Failed to connect" }, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default DemoPage;
