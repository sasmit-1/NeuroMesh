from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from typing import Optional
import os
import shutil
import zipfile
import json
import numpy as np

# Import the math and processing functions from your processing.py file
from processing import process_dicom_folder, generate_mesh, export_to_obj

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "uploaded_mri"
EXTRACT_DIR = os.path.join(UPLOAD_DIR, "dicom_files")

@app.post("/api/upload")
async def upload_dicom_zip(file: UploadFile = File(...)):
    # 1. Clean up old data
    if os.path.exists(UPLOAD_DIR):
        shutil.rmtree(UPLOAD_DIR)
    
    # 2. Delete old cached meshes
    for f in os.listdir("."):
        if f.startswith("neuromesh_brain_") and f.endswith(".obj"):
            os.remove(f)

    os.makedirs(EXTRACT_DIR, exist_ok=True)
    
    zip_path = os.path.join(UPLOAD_DIR, "temp.zip")
    with open(zip_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    try:
        # Extract the ZIP
        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
            zip_ref.extractall(EXTRACT_DIR)
        os.remove(zip_path) 
        
        # Run the math pipeline (Strictly 1 argument as your function requires)
        process_dicom_folder(EXTRACT_DIR)
        
        return {"message": "DICOM archive processed successfully."}
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/metadata")
def get_metadata(t: Optional[str] = None):
    metadata_path = os.path.join(UPLOAD_DIR, "metadata.json")
    if not os.path.exists(metadata_path):
        raise HTTPException(status_code=404, detail="Metadata not found")
    
    with open(metadata_path, "r") as f:
        return json.load(f)

@app.get("/api/mesh")
def get_mesh(threshold: int = None, t: Optional[str] = None):
    obj_filename = f"neuromesh_brain_{threshold if threshold else 'avg'}.obj"
    
    if os.path.exists(obj_filename):
        return FileResponse(obj_filename, media_type="text/plain")
        
    npy_path = os.path.join(UPLOAD_DIR, "image_3d.npy")
    metadata_path = os.path.join(UPLOAD_DIR, "metadata.json")
    
    if not os.path.exists(npy_path) or not os.path.exists(metadata_path):
        raise HTTPException(status_code=404, detail="Patient data not found.")
        
    image_3d = np.load(npy_path)
    
    with open(metadata_path, "r") as f:
        metadata = json.load(f)
        
    spacing = metadata.get("spacing_tuple", (1.0, 1.0, 1.0))
    
    verts, faces = generate_mesh(image_3d, spacing, threshold)
    export_to_obj(verts, faces, obj_filename)
    
    return FileResponse(obj_filename, media_type="text/plain")

@app.get("/api/slice/{slice_index}")
def get_slice(slice_index: int, t: Optional[str] = None):
    slice_path = os.path.join(UPLOAD_DIR, "slices", f"slice_{slice_index}.png")
    if not os.path.exists(slice_path):
        raise HTTPException(status_code=404, detail="Slice not found")
        
    return FileResponse(slice_path, media_type="image/png")