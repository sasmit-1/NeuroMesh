import os
import numpy as np
import pydicom
from skimage.measure import marching_cubes

# --- 1. The Core Medical Logic (Extension-Proof + True Scale) ---
def process_dicom_folder(dicom_folder_path):
    """Reads real DICOM files and calculates their true physical dimensions."""
    slices = []
    
    for filename in os.listdir(dicom_folder_path):
        file_path = os.path.join(dicom_folder_path, filename)
        
        if os.path.isfile(file_path):
            try:
                dicom_file = pydicom.dcmread(file_path)
                if hasattr(dicom_file, 'pixel_array') and hasattr(dicom_file, 'ImagePositionPatient'):
                    slices.append(dicom_file)
            except Exception:
                pass

    if len(slices) == 0:
        raise ValueError(f"Could not find any valid DICOM files in '{dicom_folder_path}'!")

    slices.sort(key=lambda x: float(x.ImagePositionPatient[2]))
    
    # --- EXTRACT PHYSICAL SPACING ---
    try:
        y_spacing, x_spacing = map(float, slices[0].PixelSpacing)
    except AttributeError:
        y_spacing, x_spacing = 1.0, 1.0
        
    try:
        z_spacing = float(slices[0].SliceThickness)
    except AttributeError:
        if len(slices) > 1:
            z_spacing = abs(float(slices[1].ImagePositionPatient[2]) - float(slices[0].ImagePositionPatient[2]))
        else:
            z_spacing = 1.0

    # Normalization Safeguard
    if z_spacing < 0.5:
        print(f"Warning: Z-spacing of {z_spacing:.2f} is suspiciously small. Normalizing to 3.0mm.")
        z_spacing = 3.0
        
    spacing_tuple = (z_spacing, y_spacing, x_spacing)
    print(f"Successfully loaded {len(slices)} MRI slices.")
    print(f"Calculated physical spacing (Z, Y, X): {spacing_tuple}")

    image_3d = np.stack([s.pixel_array for s in slices])
    
    return image_3d, spacing_tuple


# --- 2. The Dummy Generator (For Testing) ---
def generate_dummy_mri():
    """Generates a fake 3D sphere so we can test without downloading datasets."""
    grid = np.zeros((50, 50, 50))
    for z in range(50):
        for y in range(50):
            for x in range(50):
                if (x-25)**2 + (y-25)**2 + (z-25)**2 < 15**2:
                    grid[z, y, x] = 255
    return grid, (1.0, 1.0, 1.0)


# --- 3. The Marching Cubes Math ---
# --- 3. The Marching Cubes Math ---
def generate_mesh(image_3d, spacing, threshold_percent=None):
    """Runs the Marching Cubes algorithm with dynamic tissue density."""
    
    if threshold_percent is None:
        print("Running Marching Cubes at average density...")
        threshold_level = np.mean(image_3d) 
    else:
        print(f"Running Marching Cubes. Density target: {threshold_percent}%...")
        # Calculate the exact pixel value based on the React percentage slider
        min_val = np.min(image_3d)
        max_val = np.max(image_3d)
        threshold_level = min_val + (max_val - min_val) * (float(threshold_percent) / 100.0)
        
    verts, faces, normals, values = marching_cubes(image_3d, level=threshold_level, spacing=spacing)
    print(f"Calculated {len(verts)} vertices and {len(faces)} faces.")
    return verts, faces


# --- 4. The 3D Exporter (COORDINATE SWAP FIX) ---
def export_to_obj(verts, faces, filename="output.obj"):
    """Translates the raw math into a standard 3D .obj file for the web."""
    print(f"Writing 3D data to {filename}...")
    with open(filename, "w") as f:
        # THE FIX: Swap the axes so it matches WebGL (Width, Height, Depth)
        for v in verts:
            f.write(f"v {v[2]} {v[1]} {v[0]}\n")
            
        for face in faces:
            f.write(f"f {face[0]+1} {face[1]+1} {face[2]+1}\n")
            
    print("Export complete!")