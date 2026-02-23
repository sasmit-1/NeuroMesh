import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const Viewer3D = () => {
  const mountRef = useRef(null);
  const sceneRef = useRef(new THREE.Scene());
  
  const planeXRef = useRef(new THREE.Plane(new THREE.Vector3(1, 0, 0), 150));
  const planeYRef = useRef(new THREE.Plane(new THREE.Vector3(0, -1, 0), 150));
  const planeZRef = useRef(new THREE.Plane(new THREE.Vector3(0, 0, -1), 150));
  
  const skinLayerRef = useRef(null);
  const internalLayerRef = useRef(null);
  const currentModelGroupRef = useRef(null); 
  const skinMaterialRef = useRef(null);
  
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);
  const measurementGroupRef = useRef(new THREE.Group());
  
  const loadIdRef = useRef(Date.now());
  
  const [clipX, setClipX] = useState(150); 
  const [clipY, setClipY] = useState(150); 
  const [clipZ, setClipZ] = useState(150); 
  
  const [isCalculating, setIsCalculating] = useState(false);
  const [metadata, setMetadata] = useState(null);

  const [showSkin, setShowSkin] = useState(true);
  const [showInternal, setShowInternal] = useState(true);

  const [isMeasuring, setIsMeasuring] = useState(false);
  const [measurementPoints, setMeasurementPoints] = useState([]);
  const [calculatedDistance, setCalculatedDistance] = useState(null);

  const [sessionToken, setSessionToken] = useState(Date.now());

  const fetchMetadata = async (token) => {
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/metadata?t=${token}`);
      if (response.ok) {
        const data = await response.json();
        setMetadata(data);
      }
    } catch (error) {
      console.error("Failed to fetch metadata:", error);
    }
  };

  const fetchAndLoadSegmentedModel = async () => {
    const currentLoadId = Date.now(); 
    loadIdRef.current = currentLoadId;
    setSessionToken(currentLoadId);
    
    setIsCalculating(true);
    const loader = new OBJLoader();
    
    const activePlanes = [planeXRef.current, planeYRef.current, planeZRef.current];

    skinMaterialRef.current = new THREE.MeshPhysicalMaterial({
      color: 0xd98880,       
      metalness: 0.1,        
      roughness: 0.5,         
      transparent: true,
      opacity: 0.25,         
      transmission: 0.6,     
      depthWrite: false,     
      side: THREE.DoubleSide, 
      clippingPlanes: activePlanes 
    });

    const internalMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xeeeeee,       
      metalness: 0.05,        
      roughness: 0.6,         
      transparent: false,    
      side: THREE.DoubleSide, 
      clippingPlanes: activePlanes 
    });

    const loadObj = (url) => new Promise((resolve, reject) => loader.load(url, resolve, undefined, reject));

    try {
      const skinObj = await loadObj(`http://127.0.0.1:8000/api/mesh?threshold=15&t=${currentLoadId}`);
      const internalObj = await loadObj(`http://127.0.0.1:8000/api/mesh?threshold=38&t=${currentLoadId}`);

      if (currentLoadId !== loadIdRef.current) return; 

      if (currentModelGroupRef.current) {
        sceneRef.current.remove(currentModelGroupRef.current);
      }

      const layerGroup = new THREE.Group();
      let sharedCenter = new THREE.Vector3();

      skinObj.traverse((child) => {
        if (child.isMesh) {
          child.material = skinMaterialRef.current;
          child.geometry.computeBoundingBox();
          child.geometry.boundingBox.getCenter(sharedCenter); 
          child.geometry.translate(-sharedCenter.x, -sharedCenter.y, -sharedCenter.z);
          child.geometry.rotateZ(Math.PI); 
        }
      });
      skinLayerRef.current = skinObj; 
      layerGroup.add(skinObj);

      internalObj.traverse((child) => {
        if (child.isMesh) {
          child.material = internalMaterial;
          child.geometry.translate(-sharedCenter.x, -sharedCenter.y, -sharedCenter.z);
          child.geometry.rotateZ(Math.PI); 
        }
      });
      internalLayerRef.current = internalObj; 
      layerGroup.add(internalObj);

      sceneRef.current.add(layerGroup);
      currentModelGroupRef.current = layerGroup; 
      
      setShowSkin(true);
      setShowInternal(true);
      
      clearMeasurement();
      setIsCalculating(false); 
      fetchMetadata(currentLoadId); 

    } catch (error) {
      if (currentLoadId === loadIdRef.current) {
        console.error('Error loading segmented layers:', error);
        setIsCalculating(false);
      }
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsCalculating(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('http://127.0.0.1:8000/api/upload', { method: 'POST', body: formData });
      if (response.ok) {
          fetchAndLoadSegmentedModel();
      } else {
          setIsCalculating(false);
          alert("Python crashed during the upload! Check your VS Code terminal for the red error text.");
      }
    } catch (error) {
      console.error("Upload failed:", error);
      setIsCalculating(false);
    }
    event.target.value = null; 
  };

  const toggleSkinVisibility = () => {
    if (skinLayerRef.current) {
      skinLayerRef.current.visible = !showSkin;
      setShowSkin(!showSkin);
    }
  };

  const toggleInternalVisibility = () => {
    if (internalLayerRef.current) {
      const newInternalState = !showInternal;
      internalLayerRef.current.visible = newInternalState;
      setShowInternal(newInternalState);

      if (skinMaterialRef.current) {
        skinMaterialRef.current.opacity = newInternalState ? 0.25 : 0.85;
        skinMaterialRef.current.transmission = newInternalState ? 0.6 : 0.0;
      }
    }
  };

  const toggleMeasurementMode = () => {
    const newMode = !isMeasuring;
    setIsMeasuring(newMode);
    if (controlsRef.current) controlsRef.current.enabled = !newMode;
    if (!newMode) clearMeasurement();
  };

  const clearMeasurement = () => {
    while(measurementGroupRef.current.children.length > 0){ 
        measurementGroupRef.current.remove(measurementGroupRef.current.children[0]); 
    }
    setMeasurementPoints([]);
    setCalculatedDistance(null);
  };

  const handleCanvasClick = (event) => {
    if (!isMeasuring || !cameraRef.current || !currentModelGroupRef.current) return;
    if (measurementPoints.length >= 2) return; 

    const rect = mountRef.current.getBoundingClientRect();
    const mouse = new THREE.Vector2();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, cameraRef.current);

    const intersects = raycaster.intersectObjects(currentModelGroupRef.current.children, true);

    const validHit = intersects.find(hit => {
      if (!hit.object.visible) return false;
      if (hit.point.x < -clipX) return false;
      if (hit.point.y > clipY) return false; 
      if (hit.point.z > clipZ) return false; 
      return true;
    });

    if (validHit) {
      const point = validHit.point;
      const sphereGeo = new THREE.SphereGeometry(2, 16, 16);
      const sphereMat = new THREE.MeshBasicMaterial({ color: 0x00ffff });
      const sphere = new THREE.Mesh(sphereGeo, sphereMat);
      sphere.position.copy(point);
      measurementGroupRef.current.add(sphere);

      const newPoints = [...measurementPoints, point];
      setMeasurementPoints(newPoints);

      if (newPoints.length === 2) {
        const lineGeo = new THREE.BufferGeometry().setFromPoints(newPoints);
        const lineMat = new THREE.LineBasicMaterial({ color: 0x00ffff, linewidth: 2 });
        const line = new THREE.Line(lineGeo, lineMat);
        measurementGroupRef.current.add(line);

        const dist = newPoints[0].distanceTo(newPoints[1]);
        setCalculatedDistance(dist.toFixed(2));
        
        setIsMeasuring(false);
        if (controlsRef.current) controlsRef.current.enabled = true;
      }
    }
  };

  useEffect(() => {
    const currentMount = mountRef.current;
    const scene = sceneRef.current;
    
    scene.clear();
    scene.add(measurementGroupRef.current); 

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
    camera.position.z = 600; 
    cameraRef.current = camera; 

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setClearColor(0x050505, 1); 
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
    controlsRef.current = controls; 

    fetchAndLoadSegmentedModel();

    const animate = function () {
      requestAnimationFrame(animate);
      controls.update(); 
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      loadIdRef.current += 1; 
      if (currentMount) currentMount.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, []);

  const handleClipXChange = (e) => {
    const val = parseFloat(e.target.value);
    setClipX(val);
    planeXRef.current.constant = val; 
  };
  const handleClipYChange = (e) => {
    const val = parseFloat(e.target.value);
    setClipY(val);
    planeYRef.current.constant = val; 
  };
  const handleClipZChange = (e) => {
    const val = parseFloat(e.target.value);
    setClipZ(val);
    planeZRef.current.constant = val; 
  };

  // THE FIX: Reversed the tracking direction by flipping the minus to a PLUS
  const getActiveSliceIndex = () => {
    if (!metadata) return 0;
    
    // Extract exact physical depth of the anatomical data (Slices * Z-Spacing)
    const physicalDepth = metadata.slice_count * metadata.spacing_tuple[0];
    const halfDepth = physicalDepth / 2; 
    
    // Inverted math maps the 2D viewer in the exact same direction as the 3D cut
    let percentage = (halfDepth + clipX) / physicalDepth; 
    
    // Clamp so the PNG locks if the scalpel is wandering in "empty air"
    if (percentage < 0) percentage = 0;
    if (percentage >= 1) percentage = 0.999;
    
    return Math.floor(percentage * metadata.slice_count);
  };

  const currentSlice = getActiveSliceIndex();

  return (
    <div 
      style={{ position: 'relative', width: '100vw', height: '100vh', background: '#050505', overflow: 'hidden', cursor: isMeasuring ? 'crosshair' : 'default' }}
      onPointerDown={handleCanvasClick}
    >
      <div ref={mountRef} style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }} />
      
      {metadata && (
        <div style={{
          position: 'absolute', top: '30px', left: '30px', color: '#4ba3e3',
          fontFamily: '"Courier New", Courier, monospace', fontSize: '13px',
          letterSpacing: '1px', pointerEvents: 'none', zIndex: 10,
          textShadow: '0px 0px 4px rgba(75, 163, 227, 0.4)'
        }}>
          <div style={{ 
            fontSize: '18px', fontWeight: 'bold', color: '#00ffff', 
            marginBottom: '16px', letterSpacing: '2px', textTransform: 'uppercase' 
          }}>
            NeuroMesh <span style={{color: '#fff', fontWeight: '400'}}>Engine</span>
          </div>
          <div>PATIENT ID: {metadata.patient_id}</div>
          <div>MODALITY:   {metadata.modality}</div>
          <div>VOXEL SIZE: {metadata.voxel_size}</div>
          <div>SLICES:     {metadata.slice_count}</div>
          <div style={{ marginTop: '10px', color: '#ff4d4d', fontWeight: 'bold' }}>
            ACTIVE 2D SLICE: {currentSlice}
          </div>
        </div>
      )}

      {metadata && (
        <div style={{
          position: 'absolute', bottom: '30px', left: '30px', width: '350px', height: '350px',
          border: '1px solid rgba(75, 163, 227, 0.4)', borderRadius: '8px', background: '#000',
          overflow: 'hidden', boxShadow: '0px 0px 20px rgba(0,0,0,0.8)', zIndex: 10,
          pointerEvents: 'none'
        }}>
          <div style={{
            position: 'absolute', top: 0, left: 0, width: '100%', background: 'rgba(75, 163, 227, 0.2)', 
            color: '#4ba3e3', fontSize: '12px', padding: '6px', textAlign: 'center', 
            fontFamily: 'monospace', fontWeight: 'bold', letterSpacing: '1px'
          }}>
            REFERENCE SLICE {currentSlice}
          </div>
          <img 
            src={`http://127.0.0.1:8000/api/slice/${currentSlice}?t=${sessionToken}`} 
            alt="MRI Slice"
            style={{ width: '100%', height: '100%', objectFit: 'contain', opacity: 0.9 }}
          />
        </div>
      )}

      <div style={{
        position: 'absolute', top: '20px', right: '20px', background: 'rgba(15, 18, 22, 0.75)',
        backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', padding: '24px',
        borderRadius: '16px', border: '1px solid rgba(75, 163, 227, 0.15)',
        boxShadow: '-8px 8px 32px rgba(0, 0, 0, 0.5)', color: '#f0f0f0', display: 'flex',
        flexDirection: 'column', gap: '20px', zIndex: 10, width: '320px',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        
        <div style={{ width: '100%' }}>
          <input type="file" accept=".zip" id="mri-upload" style={{ display: 'none' }} onChange={handleFileUpload} />
          <button
            onClick={() => document.getElementById('mri-upload').click()}
            disabled={isCalculating}
            style={{
              width: '100%', padding: '12px', background: 'rgba(75, 163, 227, 0.05)',
              border: '1px dashed rgba(75, 163, 227, 0.4)', borderRadius: '8px', color: '#4ba3e3',
              cursor: isCalculating ? 'wait' : 'pointer', fontWeight: '600', fontSize: '12px', 
              letterSpacing: '1px', transition: 'all 0.2s ease', textTransform: 'uppercase'
            }}
          >
            {isCalculating ? "Extracting Pipeline..." : "Upload DICOM Archive"}
          </button>
        </div>

        <hr style={{ borderColor: 'rgba(75, 163, 227, 0.1)', margin: 0 }} />

        <div style={{ width: '100%' }}>
          <span style={{ fontSize: '11px', fontWeight: '600', color: '#a0aab5', letterSpacing: '1px', display: 'block', marginBottom: '12px' }}>
            CLINICAL SCALPELS
          </span>
          
          <div style={{ marginBottom: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ fontSize: '10px', color: '#4ba3e3', fontWeight: 'bold' }}>MAIN SCALPEL (Slices)</span>
              <span style={{ fontSize: '10px', color: '#4ba3e3', fontFamily: 'monospace' }}>{clipX} mm</span>
            </div>
            <input type="range" min="-150" max="150" step="0.5" value={clipX} onChange={handleClipXChange} style={{ width: '100%', cursor: 'pointer', accentColor: '#4ba3e3' }} />
          </div>

          <div style={{ marginBottom: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ fontSize: '10px', color: '#4ba3e3' }}>AXIS 2</span>
              <span style={{ fontSize: '10px', color: '#4ba3e3', fontFamily: 'monospace' }}>{clipY} mm</span>
            </div>
            <input type="range" min="-150" max="150" step="0.5" value={clipY} onChange={handleClipYChange} style={{ width: '100%', cursor: 'pointer', accentColor: '#4ba3e3' }} />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ fontSize: '10px', color: '#4ba3e3' }}>AXIS 3</span>
              <span style={{ fontSize: '10px', color: '#4ba3e3', fontFamily: 'monospace' }}>{clipZ} mm</span>
            </div>
            <input type="range" min="-150" max="150" step="0.5" value={clipZ} onChange={handleClipZChange} style={{ width: '100%', cursor: 'pointer', accentColor: '#4ba3e3' }} />
          </div>
        </div>

        <hr style={{ borderColor: 'rgba(75, 163, 227, 0.1)', margin: 0 }} />

        <div style={{ width: '100%' }}>
          <span style={{ fontSize: '11px', fontWeight: '600', color: '#a0aab5', letterSpacing: '1px', display: 'block', marginBottom: '12px' }}>
            LAYER VISIBILITY
          </span>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              onClick={toggleSkinVisibility}
              disabled={isCalculating}
              style={{
                flex: 1, padding: '10px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold',
                cursor: 'pointer', border: '1px solid #d98880',
                background: showSkin ? 'rgba(217, 136, 128, 0.2)' : 'transparent',
                color: showSkin ? '#d98880' : '#666', transition: 'all 0.2s ease'
              }}
            >
              SURFACE
            </button>
            <button 
              onClick={toggleInternalVisibility}
              disabled={isCalculating}
              style={{
                flex: 1, padding: '10px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold',
                cursor: 'pointer', border: '1px solid #eeeeee',
                background: showInternal ? 'rgba(238, 238, 238, 0.2)' : 'transparent',
                color: showInternal ? '#eeeeee' : '#666', transition: 'all 0.2s ease'
              }}
            >
              INTERNAL
            </button>
          </div>
        </div>

        <hr style={{ borderColor: 'rgba(75, 163, 227, 0.1)', margin: 0 }} />

        <div style={{ width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '11px', fontWeight: '600', color: '#a0aab5', letterSpacing: '1px' }}>3D CLINICAL RULER</span>
            {calculatedDistance && (
              <button 
                onClick={clearMeasurement}
                style={{ background: 'transparent', border: 'none', color: '#ff4d4d', fontSize: '10px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                CLEAR
              </button>
            )}
          </div>
          
          <button 
            onClick={toggleMeasurementMode}
            disabled={isCalculating}
            style={{
              width: '100%', padding: '10px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold',
              cursor: 'pointer', border: '1px solid #00ffff', marginBottom: '10px',
              background: isMeasuring ? 'rgba(0, 255, 255, 0.2)' : 'transparent',
              color: isMeasuring ? '#00ffff' : '#00a3a3', transition: 'all 0.2s ease'
            }}
          >
            {isMeasuring ? 'CANCEL MEASUREMENT' : 'PLACE MEASUREMENT POINTS'}
          </button>

          <div style={{ fontSize: '12px', color: '#fff', background: 'rgba(0,0,0,0.3)', padding: '10px', borderRadius: '6px', textAlign: 'center', minHeight: '34px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {calculatedDistance ? (
              <span style={{ color: '#00ffff', fontWeight: 'bold', fontSize: '14px' }}>DISTANCE: {calculatedDistance} mm</span>
            ) : isMeasuring ? (
              <span style={{ color: '#ffcc00' }}>
                {measurementPoints.length === 0 ? "Click to place Point 1..." : "Click to place Point 2..."}
              </span>
            ) : (
              <span style={{ color: '#666' }}>Ruler inactive</span>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Viewer3D;