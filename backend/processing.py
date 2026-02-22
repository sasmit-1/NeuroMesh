import os
import json
import numpy as np
import pydicom
from skimage.measure import marching_cubes
from PIL import Image

def process_dicom_folder(dicom_folder_path):
    """Reads real DICOM files, digging through any nested sub-folders."""
    slices = []
    
    for root, dirs, files in os.walk(dicom_folder_path):
        for filename in files:
            file_path = os.path.join(root, filename)
            
            if os.path.isfile(file_path):
                try:
                    dicom_file = pydicom.dcmread(file_path)
                    if hasattr(dicom_file, 'pixel_array') and hasattr(dicom_file, 'ImagePositionPatient'):
                        slices.append(dicom_file)
                except Exception:
                    pass

    if len(slices) == 0:
        raise ValueError(f"Could not find any valid DICOM files in '{dicom_folder_path}' or its subfolders!")

    slices.sort(key=lambda x: float(x.ImagePositionPatient[2]))
    
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

    if z_spacing < 0.5:
        print(f"Warning: Z-spacing of {z_spacing:.2f} is suspiciously small. Normalizing to 3.0mm.")
        z_spacing = 3.0
        
    spacing_tuple = (z_spacing, y_spacing, x_spacing)
    
    print("Extracting Clinical Metadata...")
    metadata = {
        "patient_id": str(getattr(slices[0], 'PatientID', 'ANON-9921')),
        "modality": str(getattr(slices[0], 'Modality', 'MRI')),
        "slice_count": len(slices),
        "voxel_size": f"{spacing_tuple[2]:.2f} x {spacing_tuple[1]:.2f} x {spacing_tuple[0]:.2f} mm"
    }
    
    with open(os.path.join(dicom_folder_path, "metadata.json"), "w") as f:
        json.dump(metadata, f)

    print("Exporting 2D slices for Picture-in-Picture viewer...")
    slices_dir = os.path.join(dicom_folder_path, "slices")
    os.makedirs(slices_dir, exist_ok=True)
    
    for i, s in enumerate(slices):
        img_array = s.pixel_array.astype(float)
        if img_array.max() > 0:
            img_scaled = (img_array / img_array.max()) * 255.0
        else:
            img_scaled = img_array
            
        img = Image.fromarray(np.uint8(img_scaled))
        img.save(os.path.join(slices_dir, f"slice_{i}.png"))

    print(f"Successfully loaded {len(slices)} MRI slices.")
    print(f"Calculated physical spacing (Z, Y, X): {spacing_tuple}")

    image_3d = np.stack([s.pixel_array for s in slices])
    
    return image_3d, spacing_tuple


def generate_dummy_mri():
    grid = np.zeros((50, 50, 50))
    for z in range(50):
        for y in range(50):
            for x in range(50):
                if (x-25)**2 + (y-25)**2 + (z-25)**2 < 15**2:
                    grid[z, y, x] = 255
    return grid, (1.0, 1.0, 1.0)


def generate_mesh(image_3d, spacing, threshold_percent=None):
    if threshold_percent is None:
        print("Running Marching Cubes at average density...")
        threshold_level = np.mean(image_3d) 
    else:
        print(f"Running Marching Cubes. Density target: {threshold_percent}%...")
        min_val = np.min(image_3d)
        max_val = np.max(image_3d)
        threshold_level = min_val + (max_val - min_val) * (float(threshold_percent) / 100.0)
        
    verts, faces, normals, values = marching_cubes(image_3d, level=threshold_level, spacing=spacing)
    print(f"Calculated {len(verts)} vertices and {len(faces)} faces.")
    return verts, faces


def export_to_obj(verts, faces, filename="output.obj"):
    print(f"Writing 3D data to {filename}...")
    with open(filename, "w") as f:
        for v in verts:
            f.write(f"v {v[2]} {v[1]} {v[0]}\n")
            
        for face in faces:
            f.write(f"f {face[0]+1} {face[1]+1} {face[2]+1}\n")
            
    print("Export complete!")