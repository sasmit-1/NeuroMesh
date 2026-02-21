import './App.css';
import Viewer3D from './components/Viewer3D'; // Import our new 3D engine

function App() {
  return (
    <div className="app-container">
      <h1 style={{ position: 'absolute', top: '20px', zIndex: 10, pointerEvents: 'none' }}>
        NeuroMesh Engine
      </h1>
      
      {/* Our 3D Canvas drops in right here */}
      <Viewer3D />
      
    </div>
  );
}

export default App;