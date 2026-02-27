import React from 'react';
import HubShell from './components/layout/HubShell';
import { GradingProvider } from './context/GradingContext';
import './App.css'; // Keep your global styles if you have them
// Privacy warning banner
function PrivacyBanner() {
  return (
    <div style={{background:'#fef3c7',color:'#92400e',padding:'12px',textAlign:'center',fontWeight:'bold',borderBottom:'2px solid #f59e42'}}>
      Privacy Notice: This app is not HIPAA compliant. Do not use real student names or PHI. For testing only.
    </div>
  );
}

function App() {
  return (
    <GradingProvider>
      <div className="App">
        <PrivacyBanner />
        <HubShell />
      </div>
    </GradingProvider>
  );
}

export default App;
