/**
 * Job Test Page - Simple test of the job scheduling system
 */
import { useState, useEffect } from 'react';
import { JobList } from '../components/dashboard/JobList';
import { Card, CardContent } from '../components/common/Card';
import { Button } from '../components/common/Button';

export function JobTest() {
  const [apiStatus, setApiStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    testAPIConnection();
  }, []);

  const testAPIConnection = async () => {
    try {
      setApiStatus('loading');
      setErrorMessage('');

      // Test basic API connection
      const response = await fetch('http://localhost:3001/api/health');
      if (response.ok) {
        setApiStatus('success');
      } else {
        setApiStatus('error');
        setErrorMessage(`API returned status ${response.status}`);
      }
    } catch (error) {
      setApiStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Unknown error');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Job Scheduling System Test</h1>
        <p className="text-gray-600">Testing the complete job scheduling implementation</p>
      </div>

      <div className="mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">API Connection Status</h3>
                <p className="text-sm text-gray-600">
                  {apiStatus === 'loading' && 'Testing API connection...'}
                  {apiStatus === 'success' && 'API connection successful'}
                  {apiStatus === 'error' && `API connection failed: ${errorMessage}`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${
                  apiStatus === 'loading' ? 'bg-yellow-500' :
                  apiStatus === 'success' ? 'bg-green-500' :
                  'bg-red-500'
                }`}></div>
                <Button onClick={testAPIConnection} size="sm">
                  Test Again
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {apiStatus === 'success' && (
        <JobList />
      )}

      {apiStatus === 'error' && (
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <h3 className="font-semibold text-red-600 mb-2">Connection Error</h3>
              <p className="text-gray-600 mb-4">
                Please make sure the backend server is running on port 3001
              </p>
              <Button onClick={testAPIConnection}>
                Retry Connection
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
