import React, { useState } from 'react';
import Viewer3D from './components/Viewer3D';
import LandingPage from './components/LandingPage';

function App() {
  const [hasLaunched, setHasLaunched] = useState(false);

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#050505' }}>
      {hasLaunched ? (
        <Viewer3D />
      ) : (
        <LandingPage onLaunch={() => setHasLaunched(true)} />
      )}
    </div>
  );
}

export default App;