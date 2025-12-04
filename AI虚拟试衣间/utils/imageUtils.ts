/**
 * Converts a File object to a Base64 string.
 */
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result);
    };
    reader.onerror = (error) => reject(error);
  });
};

/**
 * Fetches an image from a URL and converts it to Base64.
 */
export const urlToBase64 = async (url: string): Promise<string> => {
  try {
    const response = await fetch(url, { mode: 'cors' });
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }
    const blob = await response.blob();
    return await fileToBase64(new File([blob], "image.png", { type: blob.type }));
  } catch (error) {
    console.error("CORS or Fetch error converting URL to base64:", error);
    throw new Error("无法加载该预设图片 (可能是跨域限制)，请尝试下载后上传。");
  }
};

export const stripBase64Prefix = (base64: string): string => {
  return base64.replace(/^data:image\/[a-z]+;base64,/, "");
};

/**
 * Merges multiple base64 images horizontally into a single sprite sheet.
 * All images are resized to fit within a standard height to ensure alignment.
 * 
 * @param base64Images Array of base64 image strings
 * @returns Promise<string> Base64 string of the combined image
 */
export const mergeImagesHorizontally = (base64Images: string[]): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (base64Images.length === 0) {
      resolve(""); 
      return;
    }

    const images: HTMLImageElement[] = [];
    let loadedCount = 0;

    // Target dimensions for each frame in the sprite (Portrait 9:16 usually)
    // We use a fixed height to ensure they line up for the animation
    const targetHeight = 1024;
    const targetWidth = 576; // 9:16 ratio roughly

    base64Images.forEach((src, index) => {
      const img = new Image();
      img.onload = () => {
        images[index] = img; // Store in correct order
        loadedCount++;
        if (loadedCount === base64Images.length) {
          drawCanvas();
        }
      };
      img.onerror = () => reject(new Error("Failed to load one of the images for merging"));
      img.src = src;
    });

    const drawCanvas = () => {
      const canvas = document.createElement('canvas');
      const totalWidth = targetWidth * base64Images.length;
      canvas.width = totalWidth;
      canvas.height = targetHeight;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error("Canvas context failed"));
        return;
      }

      // Fill background with white
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      images.forEach((img, i) => {
        // Draw image "contained" within its slot
        // Calculate scaling to fit
        const scale = Math.min(targetWidth / img.width, targetHeight / img.height);
        const w = img.width * scale;
        const h = img.height * scale;
        const x = (i * targetWidth) + (targetWidth - w) / 2;
        const y = (targetHeight - h) / 2;

        ctx.drawImage(img, x, y, w, h);
      });

      resolve(canvas.toDataURL('image/png'));
    };
  });
};