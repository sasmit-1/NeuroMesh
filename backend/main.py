import os
from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
import processing

app = FastAPI()

# --- CORS VIP PASS ---
# Allows your Vite frontend (localhost:5173) to securely download the 3D file
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"status": "NeuroMesh Backend is Online"}

@app.get("/api/mesh")
def get_3d_mesh(threshold: int = 25): # Default to 25% (usually soft tissue/brain)
    """
    Accepts a dynamic density threshold to isolate specific tissues.
    """
    # Create a unique filename for the specific density requested
    file_path = f"neuromesh_brain_{threshold}.obj"
    real_mri_folder = "sample_mri" 
    
    # Built-in Caching: Only run the heavy math if we haven't generated this density yet!
    if not os.path.exists(file_path):
        print(f"Processing Real MRI Data at {threshold}% Density...")
        try:
            image_3d, spacing = processing.process_dicom_folder(real_mri_folder)
            
            # Pass the threshold down to the math engine
            vertices, triangles = processing.generate_mesh(image_3d, spacing, threshold)
            processing.export_to_obj(vertices, triangles, file_path)
            
        except Exception as e:
            return {"error": f"Failed to process MRI data: {str(e)}"}
    else:
        print(f"Loading cached geometry for {threshold}% Density...")
    
    return FileResponse(
        path=file_path, 
        media_type="application/octet-stream", 
        filename=file_path
    )