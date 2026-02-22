import './App.css';
import Viewer3D from './components/Viewer3D'; // Import our new 3D engine

function App() {
  return (
    <div className="app-container">
      {/* Our 3D Canvas drops in right here */}
      <Viewer3D />
      
    </div>
  );
}

export default App;