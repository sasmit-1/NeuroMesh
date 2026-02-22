import os
import json
import numpy as np
import pydicom
from skimage.measure import marching_cubes
from PIL import Image
import trimesh

# --- 1. DATA EXTRACTION & SLICING ---
def process_dicom_folder(dicom_dir):
    """
    Reads raw DICOM files, sorts them into a 3D volume, extracts metadata,
    and saves the required arrays and 2D images to the 'uploaded_mri' folder.
    """
    output_dir = "uploaded_mri"
    slices_dir = os.path.join(output_dir, "slices")
    
    os.makedirs(output_dir, exist_ok=True)
    os.makedirs(slices_dir, exist_ok=True)

    print(f"Loading DICOM files from {dicom_dir}...")
    dicom_files = []
    
    # THE FIX: Recursively search all subfolders and check for actual DICOM data
    for root, dirs, files in os.walk(dicom_dir):
        for f in files:
            file_path = os.path.join(root, f)
            try:
                # Test if it's a valid DICOM file, even if it has no file extension!
                pydicom.dcmread(file_path, stop_before_pixels=True)
                dicom_files.append(file_path)
            except Exception:
                # If it is a hidden system file or junk, just ignore it
                pass
                
    if not dicom_files:
        raise ValueError("No valid DICOM files found in the uploaded archive.")

    # Read and sort the slices by their spatial position (Z-axis)
    slices = [pydicom.dcmread(f) for f in dicom_files]
    slices.sort(key=lambda x: float(x.ImagePositionPatient[2]))

    print(f"Successfully loaded {len(slices)} MRI slices.")

    # Build the 3D Numpy Array
    # DICOM images are usually (rows, columns). We stack them into (Z, Y, X)
    image_3d = np.stack([s.pixel_array for s in slices])
    
    # Save the raw mathematical array for the 3D generator to use later
    np.save(os.path.join(output_dir, "image_3d.npy"), image_3d)

    # Extract exact physical dimensions for the 3D Clinical Ruler
    pixel_spacing = slices[0].PixelSpacing
    slice_thickness = slices[0].SliceThickness
    spacing_tuple = (float(slice_thickness), float(pixel_spacing[0]), float(pixel_spacing[1]))
    
    print(f"Calculated physical spacing (Z, Y, X): {spacing_tuple}")

    # Generate the Metadata JSON
    metadata = {
        "patient_id": getattr(slices[0], "PatientID", "UNKNOWN"),
        "modality": getattr(slices[0], "Modality", "UNKNOWN"),
        "slice_count": len(slices),
        "voxel_size": f"{spacing_tuple[1]:.2f} x {spacing_tuple[2]:.2f} x {spacing_tuple[0]:.2f} mm",
        "spacing_tuple": spacing_tuple
    }
    
    with open(os.path.join(output_dir, "metadata.json"), "w") as f:
        json.dump(metadata, f, indent=4)

    # Export 2D PNG slices for the Picture-in-Picture viewer
    print("Exporting 2D slices for Picture-in-Picture viewer...")
    for i, s in enumerate(slices):
        img_array = s.pixel_array.astype(float)
        # Normalize the image colors to standard 8-bit PNG format (0-255)
        img_array = (np.maximum(img_array, 0) / img_array.max()) * 255.0
        img_array = np.uint8(img_array)
        
        img = Image.fromarray(img_array)
        img.save(os.path.join(slices_dir, f"slice_{i}.png"))
        
    print("Data extraction complete!")


# --- 2. THE 3D MATH ENGINE (WITH TAUBIN SMOOTHING) ---
def generate_mesh(image_3d, spacing, threshold_percent=None):
    """
    Converts a 3D numpy array of pixels into a 3D geometry mesh.
    """
    if threshold_percent is None:
        threshold_level = np.mean(image_3d) 
    else:
        print(f"Running Marching Cubes. Density target: {threshold_percent}%...")
        min_val = np.min(image_3d)
        max_val = np.max(image_3d)
        threshold_level = min_val + (max_val - min_val) * (float(threshold_percent) / 100.0)
        
    # Generate the raw, jagged surface
    verts, faces, normals, values = marching_cubes(image_3d, level=threshold_level, spacing=spacing)
    
    # The Smoothing Filter
    print(f"Applying Taubin Smoothing to remove jagged MRI artifacts...")
    try:
        mesh = trimesh.Trimesh(vertices=verts, faces=faces, process=False)
        trimesh.smoothing.filter_taubin(mesh, iterations=10)
        verts = mesh.vertices
        faces = mesh.faces
        print("Smoothing complete!")
    except Exception as e:
        print(f"Warning: Smoothing failed, falling back to raw mesh. Error: {e}")

    print(f"Calculated {len(verts)} vertices and {len(faces)} faces.")
    return verts, faces


# --- 3. THE EXPORTER ---
def export_to_obj(verts, faces, filename):
    """
    Saves the calculated 3D geometry to an .obj file that React can read.
    """
    print(f"Writing 3D data to {filename}...")
    with open(filename, 'w') as f:
        for v in verts:
            f.write(f"v {v[0]} {v[1]} {v[2]}\n")
        for face in faces:
            # OBJ files are 1-indexed, so we add 1 to every coordinate ID
            f.write(f"f {face[0]+1} {face[1]+1} {face[2]+1}\n")
    print("Export complete!")