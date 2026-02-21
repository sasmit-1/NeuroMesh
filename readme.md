# NeuroMesh 🧠
An industry-grade medical 3D visualization engine that converts 2D DICOM MRI scans into interactive 3D meshes.

### Features
- **Dynamic Isosurface Extraction:** Adjust tissue density to toggle between skin, brain, and bone.
- **Real-time Cross-Sectioning:** Z-axis clipping plane for surgical internal views.
- **Anatomical Scaling:** Automatic normalization of MRI slice thickness and pixel spacing.

### Tech Stack
- **Backend:** Python, FastAPI, Pydicom, Scikit-Image (Marching Cubes)
- **Frontend:** React, Vite, Three.js (WebGL)