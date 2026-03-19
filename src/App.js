import React from 'react';
import HubShell from './components/layout/HubShell';
import { GradingProvider } from './context/GradingContext';
import { StudentProvider } from './context/StudentContext';
import './App.css'; // Keep your global styles if you have them

function App() {
  return (
    <GradingProvider>
      <StudentProvider>
        <div className="App">
          <HubShell />
        </div>
      </StudentProvider>
    </GradingProvider>
  );
}

export default App;
