import os
import shutil
import zipfile
import json
from fastapi import FastAPI, UploadFile, File
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import processing

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/api/upload")
async def upload_mri_zip(file: UploadFile = File(...)):
    """Receives a ZIP file from React, extracts it, and prepares it."""
    upload_dir = "uploaded_mri"
    
    if os.path.exists(upload_dir):
        shutil.rmtree(upload_dir) 
    os.makedirs(upload_dir)

    zip_path = os.path.join(upload_dir, "temp.zip")
    with open(zip_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    with zipfile.ZipFile(zip_path, 'r') as zip_ref:
        zip_ref.extractall(upload_dir)
    
    os.remove(zip_path)

    for f in os.listdir("."):
        if f.startswith("neuromesh_brain_") and f.endswith(".obj"):
            os.remove(f)

    return {"status": "Success", "message": "MRI data uploaded and extracted."}


@app.get("/api/mesh")
def get_3d_mesh(threshold: int = 25):
    """Generates the 3D mesh based on the requested tissue density."""
    file_path = f"neuromesh_brain_{threshold}.obj"
    
    if os.path.exists("uploaded_mri") and len(os.listdir("uploaded_mri")) > 0:
        mri_folder = "uploaded_mri"
    else:
        mri_folder = "sample_mri"
    
    if not os.path.exists(file_path):
        print(f"Processing MRI Data from '{mri_folder}' at {threshold}% Density...")
        try:
            image_3d, spacing = processing.process_dicom_folder(mri_folder)
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


@app.get("/api/metadata")
def get_metadata():
    """Returns the clinical metadata for the HUD."""
    target_dir = "uploaded_mri" if os.path.exists("uploaded_mri/metadata.json") else "sample_mri"
    meta_path = os.path.join(target_dir, "metadata.json")
    
    if os.path.exists(meta_path):
        with open(meta_path, "r") as f:
            return json.load(f)
    return JSONResponse(status_code=404, content={"error": "Metadata not found."})


@app.get("/api/slice/{slice_index}")
def get_2d_slice(slice_index: int):
    """Returns a specific 2D PNG image for the Picture-in-Picture viewer."""
    target_dir = "uploaded_mri" if os.path.exists("uploaded_mri/slices") else "sample_mri"
    slice_path = os.path.join(target_dir, "slices", f"slice_{slice_index}.png")
    
    if os.path.exists(slice_path):
        return FileResponse(slice_path, media_type="image/png")
    return JSONResponse(status_code=404, content={"error": "Slice not found."})