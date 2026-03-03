import React from 'react';
import HubShell from './components/layout/HubShell';
import { GradingProvider } from './context/GradingContext';
import './App.css'; // Keep your global styles if you have them

function App() {
  return (
    <GradingProvider>
      <div className="App">
        <HubShell />
      </div>
    </GradingProvider>
  );
}

export default App;
