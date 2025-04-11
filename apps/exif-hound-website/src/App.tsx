import { useState } from 'react';
import { EmergencyTest } from './EmergencyTest';

function App() {
  // Test flag - set to true to show emergency test
  const showEmergencyTest = true;
  
  // If emergency test is enabled, show it
  if (showEmergencyTest) {
    console.log('App.tsx: Showing EmergencyTest component');
    return <EmergencyTest />;
  }
  
  // Original App component code continues below
  const [images, setImages] = useState<ImageData[]>([]);
  
  // Simple state for UI testing
  const [count, setCount] = useState(0);
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex flex-col items-center justify-center z-50 text-white">
      <h1 className="text-3xl font-bold mb-6">Emergency Test Mode</h1>
      
      <div className="bg-zinc-800 p-8 rounded-lg max-w-md w-full">
        <h2 className="text-xl font-bold mb-4">Debugging License Modal Issues</h2>
        
        <p className="mb-4">
          This is a minimal test component replacing the entire App to verify rendering works.
          If you see this, your React app is functioning but there may be issues with:
        </p>
        
        <ul className="list-disc pl-5 mb-6 space-y-2">
          <li>Component imports</li>
          <li>Context providers</li>
          <li>Build configuration</li>
        </ul>
        
        <div className="flex items-center justify-center space-x-4 mb-6">
          <button 
            className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700"
            onClick={() => setCount(count + 1)}
          >
            Count: {count}
          </button>
          
          <button
            className="px-4 py-2 bg-red-600 rounded hover:bg-red-700"
            onClick={() => alert("Button clicked!")}
          >
            Test Alert
          </button>
        </div>
        
        <div className="text-sm text-gray-400">
          This test confirms your App component is rendering properly.
          The license modal implementation can be fixed after this test.
        </div>
      </div>
    </div>
  );
}

export default App; 