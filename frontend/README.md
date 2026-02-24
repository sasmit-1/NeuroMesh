# 🧠 NeuroMesh Engine

NeuroMesh is a high-performance, browser-native 3D rendering pipeline for clinical DICOM processing and spatial analysis. It bridges the gap between heavy mathematical processing in Python and lightning-fast WebGL rendering in the browser.

Built to run entirely locally without cloud dependencies, it leverages the Marching Cubes algorithm and Taubin geometry smoothing to generate highly accurate 3D medical models from standard 2D MRI and CT scans.

## 🚀 Key Features
- **Omnidirectional Scalpel:** Real-time 3D clipping planes mapped to X, Y, and Z axes for complex cross-sectional analysis.
- **2D/3D Synchronization:** An interactive reference monitor that tracks the physical depth of the 3D scalpel to display the exact corresponding 2D DICOM slice.
- **Taubin Smoothing:** Enterprise-grade algorithm that eliminates voxel-stepping artifacts without shrinking the underlying geometry.
- **WebGL Acceleration:** Powered by Three.js to render over 400,000 polygons locally at 60FPS.

---

## 🛠️ Architecture
NeuroMesh is a split-stack application:
* **Backend:** Python (FastAPI, Trimesh, Scikit-Image, Pydicom) handling the heavy lifting of array extraction, segmentation, and mesh generation.
* **Frontend:** React + Vite (Three.js, Framer Motion) handling the WebGL visualization and cinematic user interface.

---

## 💻 How to Run Locally

### Prerequisites
Make sure you have [Python 3.8+](https://www.python.org/downloads/) and [Node.js](https://nodejs.org/) installed on your machine.

### Setup Instructions

1. **Clone the repository:**
   ```bash
   git clone [https://github.com/sasmit-1/neuromesh.git](https://github.com/sasmit-1/neuromesh.git)
   cd neuromesh

2   **START THE PYTHON BACKEND**

   cd backend
python -m venv venv

# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

pip install -r requirements.txt
cd ..

3. **SET UP REACT BACKEND**
cd frontend
npm install
cd ..

⚡ Starting the Engine (Windows)
If you are on Windows, simply double-click the included start_engine.bat file in the root directory. It will automatically activate your virtual environment, launch both the FastAPI server and the React frontend, and bind them together.

Manual Start:
If you prefer to start them manually or are on Mac/Linux:

Terminal 1: cd backend && venv\Scripts\activate && uvicorn main:app --reload

Terminal 2: cd frontend && npm run dev

Navigate to http://localhost:5173 in your browser to enter the engine.

Architect: Sasmit Mondal | GitHub