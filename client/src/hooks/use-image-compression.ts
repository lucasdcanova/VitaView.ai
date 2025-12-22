
import { useState, useCallback } from 'react';

interface CompressionOptions {
    maxSizeMB: number;
    maxWidthOrHeight: number;
    useWebWorker?: boolean;
}

interface CompressedFile {
    file: File;
    originalSize: number;
    compressedSize: number;
    compressionRatio: number;
}

export function useImageCompression() {
    const [isCompressing, setIsCompressing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const compressImage = useCallback(async (
        imageFile: File,
        options: CompressionOptions = { maxSizeMB: 1, maxWidthOrHeight: 1920 }
    ): Promise<CompressedFile> => {
        setIsCompressing(true);
        setError(null);

        try {
            // In a real implementation with a library like 'browser-image-compression',
            // we would do the actual compression here.
            // Since we don't want to add heavy dependencies right now without user permission,
            // we will implement a basic canvas-based resizing/compression.

            return await new Promise<CompressedFile>((resolve, reject) => {
                const reader = new FileReader();
                reader.readAsDataURL(imageFile);

                reader.onload = (event) => {
                    const img = new Image();
                    img.src = event.target?.result as string;

                    img.onload = () => {
                        const canvas = document.createElement('canvas');
                        let width = img.width;
                        let height = img.height;

                        // Calculate new dimensions
                        if (width > height) {
                            if (width > options.maxWidthOrHeight) {
                                height *= options.maxWidthOrHeight / width;
                                width = options.maxWidthOrHeight;
                            }
                        } else {
                            if (height > options.maxWidthOrHeight) {
                                width *= options.maxWidthOrHeight / height;
                                height = options.maxWidthOrHeight;
                            }
                        }

                        canvas.width = width;
                        canvas.height = height;

                        const ctx = canvas.getContext('2d');
                        if (!ctx) {
                            reject(new Error('Could not get canvas context'));
                            return;
                        }

                        ctx.drawImage(img, 0, 0, width, height);

                        // Compress to JPEG with 0.8 quality
                        canvas.toBlob(
                            (blob) => {
                                if (!blob) {
                                    reject(new Error('Compression failed'));
                                    return;
                                }

                                const compressedFile = new File([blob], imageFile.name, {
                                    type: 'image/jpeg',
                                    lastModified: Date.now(),
                                });

                                resolve({
                                    file: compressedFile,
                                    originalSize: imageFile.size,
                                    compressedSize: compressedFile.size,
                                    compressionRatio: (1 - compressedFile.size / imageFile.size) * 100
                                });
                            },
                            'image/jpeg',
                            0.8
                        );
                    };

                    img.onerror = (err) => reject(err);
                };

                reader.onerror = (err) => reject(err);
            });

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error during compression';
            setError(errorMessage);
            throw err;
        } finally {
            setIsCompressing(false);
        }
    }, []);

    return { compressImage, isCompressing, error };
}
