/**
 * Parses a JPEG file to extract EXIF Make and Model information.
 * This is a lightweight implementation to avoid heavy external dependencies for basic metadata.
 */
export const getExifDeviceData = async (file: File): Promise<string | null> => {
  // Only process JPEG images for EXIF
  if (file.type !== 'image/jpeg' && file.type !== 'image/jpg') {
    return null;
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    
    // Read the first 64KB, which is usually enough for the header
    reader.onload = (e) => {
      try {
        const buffer = e.target?.result as ArrayBuffer;
        const view = new DataView(buffer);
        
        // Check for JPEG SOI marker (FF D8)
        if (view.getUint16(0, false) !== 0xFFD8) {
          resolve(null);
          return;
        }

        const length = view.byteLength;
        let offset = 2;

        while (offset < length) {
          // Check for valid marker start
          if (view.getUint8(offset) !== 0xFF) break;

          const marker = view.getUint8(offset + 1);

          // APP1 Marker (FF E1) contains Exif data
          if (marker === 0xE1) {
            const chunkLength = view.getUint16(offset + 2, false);
            // Check for "Exif" identifier (0x45786966) plus two null bytes
            if (view.getUint32(offset + 4, false) === 0x45786966) {
              const result = parseExifChunk(view, offset + 10);
              resolve(result);
              return;
            }
            // Move to next marker
            offset += 2 + chunkLength;
          } 
          // SOS (Start of Scan) - image data follows, stop parsing
          else if (marker === 0xDA) {
            break;
          } 
          // Skip other markers with length
          else {
            const chunkLength = view.getUint16(offset + 2, false);
            offset += 2 + chunkLength;
          }
        }
        resolve(null);
      } catch (err) {
        console.warn("Failed to parse EXIF data:", err);
        resolve(null);
      }
    };

    reader.onerror = () => resolve(null);
    reader.readAsArrayBuffer(file.slice(0, 65536));
  });
};

function parseExifChunk(view: DataView, tiffStart: number): string | null {
  try {
    // Check Byte Order
    const byteOrder = view.getUint16(tiffStart, false);
    const littleEndian = byteOrder === 0x4949; // 'II'

    // Check 42 (0x002A)
    if (view.getUint16(tiffStart + 2, littleEndian) !== 0x002A) return null;

    // Offset to 0th IFD
    const firstIFDOffset = view.getUint32(tiffStart + 4, littleEndian);
    if (firstIFDOffset < 0x00000008) return null;

    const dirStart = tiffStart + firstIFDOffset;
    const entries = view.getUint16(dirStart, littleEndian);

    let make = "";
    let model = "";

    for (let i = 0; i < entries; i++) {
      const entryOffset = dirStart + 2 + (i * 12);
      const tag = view.getUint16(entryOffset, littleEndian);
      
      // Tag 0x010F: Make
      if (tag === 0x010F) {
        make = getStringFromEntry(view, entryOffset, tiffStart, littleEndian);
      }
      // Tag 0x0110: Model
      else if (tag === 0x0110) {
        model = getStringFromEntry(view, entryOffset, tiffStart, littleEndian);
      }
    }

    if (make || model) {
      // Clean up string: some cameras duplicate Make in Model (e.g. "Canon" "Canon EOS...")
      const cleanMake = make.trim();
      const cleanModel = model.trim();
      
      if (cleanModel.startsWith(cleanMake)) {
        return cleanModel;
      }
      return `${cleanMake} ${cleanModel}`.trim();
    }
    return null;
  } catch (e) {
    return null;
  }
}

function getStringFromEntry(view: DataView, entryOffset: number, tiffStart: number, littleEndian: boolean): string {
  const type = view.getUint16(entryOffset + 2, littleEndian);
  const count = view.getUint32(entryOffset + 4, littleEndian);
  
  // ASCII string is type 2
  if (type !== 2) return "";

  // If data fits in 4 bytes, it's stored directly in the value offset field
  // Otherwise it's an offset to the data
  const valueOffset = view.getUint32(entryOffset + 8, littleEndian);
  
  let offset = (count <= 4) ? (entryOffset + 8) : (tiffStart + valueOffset);
  
  let str = "";
  for (let i = 0; i < count; i++) {
    // Bounds check
    if (offset + i >= view.byteLength) break;
    
    const charCode = view.getUint8(offset + i);
    if (charCode === 0) break; // null terminator
    str += String.fromCharCode(charCode);
  }
  return str;
}
