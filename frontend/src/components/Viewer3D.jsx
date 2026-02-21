import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const Viewer3D = () => {
  const mountRef = useRef(null);
  
  // THREE.JS REFS: We need these to persist so we can delete the old organ when a new one loads
  const sceneRef = useRef(new THREE.Scene());
  const currentModelRef = useRef(null); 
  const planeRef = useRef(new THREE.Plane(new THREE.Vector3(0, 0, -1), 100));
  
  // REACT STATE
  const [clipZ, setClipZ] = useState(100); 
  const [density, setDensity] = useState(25); // Start at 25% to see the softer tissue
  const [isCalculating, setIsCalculating] = useState(false);

  // The Clinical Ivory Material
  const material = new THREE.MeshPhysicalMaterial({
    color: 0xebd5c1,
    metalness: 0.05,        
    roughness: 0.5,         
    transmission: 0.1,      
    thickness: 2.0,         
    wireframe: false,
    transparent: true,
    side: THREE.DoubleSide, 
    clippingPlanes: [planeRef.current] 
  });

  // THE PIPELINE: Pings Python, catches the new file, and swaps the 3D objects
  const fetchAndLoadModel = (thresholdPercentage) => {
    setIsCalculating(true);
    const loader = new OBJLoader();
    
    loader.load(
      `http://127.0.0.1:8000/api/mesh?threshold=${thresholdPercentage}`, 
      (object) => {
        // 1. Destroy the old organ if it exists
        if (currentModelRef.current) {
          sceneRef.current.remove(currentModelRef.current);
        }

        // 2. Prep the new organ
        object.traverse((child) => {
          if (child.isMesh) {
            child.material = material;
            child.geometry.computeBoundingBox();
            const boundingBox = child.geometry.boundingBox;
            const center = new THREE.Vector3();
            boundingBox.getCenter(center);
            child.geometry.translate(-center.x, -center.y, -center.z);
          }
        });

        // 3. Put it on the screen
        sceneRef.current.add(object);
        currentModelRef.current = object; 
        setIsCalculating(false); // Turn the button back on
      },
      undefined,
      (error) => {
        console.error('Error loading OBJ:', error);
        setIsCalculating(false);
      }
    );
  };

  useEffect(() => {
    const currentMount = mountRef.current;
    const scene = sceneRef.current;

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
    camera.position.z = 600; 

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.localClippingEnabled = true; 
    currentMount.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0x404040, 3); 
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 2); 
    directionalLight.position.set(10, 20, 30).normalize();
    scene.add(directionalLight);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true; 

    // Kick off the very first download when the page loads
    fetchAndLoadModel(density);

    const animate = function () {
      requestAnimationFrame(animate);
      controls.update(); 
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      if (currentMount) {
        currentMount.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  // UI Handlers
  const handleClipChange = (e) => {
    const val = parseFloat(e.target.value);
    setClipZ(val);
    planeRef.current.constant = val; 
  };

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh' }}>
      <div ref={mountRef} style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }} />
      
      {/* The Upgraded Clinical Dashboard */}
      <div style={{
        position: 'absolute',
        bottom: '40px',
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'rgba(10, 10, 10, 0.85)',
        padding: '25px 40px',
        borderRadius: '12px',
        border: '1px solid #4ba3e3',
        boxShadow: '0px 0px 20px rgba(75, 163, 227, 0.2)',
        color: '#4ba3e3',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '20px',
        zIndex: 10,
        width: '400px'
      }}>
        
        {/* Tool 1: The Scalpel */}
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <label htmlFor="clipSlider" style={{ fontWeight: 'bold', letterSpacing: '2px', fontSize: '12px' }}>
            Z-AXIS CROSS SECTION
          </label>
          <input
            id="clipSlider"
            type="range"
            min="-100"
            max="100"
            step="0.5"
            value={clipZ}
            onChange={handleClipChange}
            style={{ width: '100%', cursor: 'pointer', marginTop: '10px' }}
          />
        </div>

        <hr style={{ width: '100%', borderColor: '#4ba3e3', opacity: 0.3 }} />

        {/* Tool 2: The X-Ray */}
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <label htmlFor="densitySlider" style={{ fontWeight: 'bold', letterSpacing: '2px', fontSize: '12px' }}>
            TISSUE DENSITY: {density}%
          </label>
          <div style={{ display: 'flex', gap: '15px', width: '100%', marginTop: '10px' }}>
            <input
              id="densitySlider"
              type="range"
              min="5"
              max="80"
              step="5"
              value={density}
              onChange={(e) => setDensity(parseInt(e.target.value))}
              style={{ flexGrow: 1, cursor: 'pointer' }}
            />
            <button 
              onClick={() => fetchAndLoadModel(density)} 
              disabled={isCalculating}
              style={{
                background: isCalculating ? '#555' : '#4ba3e3',
                color: '#000',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '6px',
                fontWeight: 'bold',
                cursor: isCalculating ? 'wait' : 'pointer',
                minWidth: '120px'
              }}
            >
              {isCalculating ? 'CALCULATING...' : 'APPLY'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Viewer3D;