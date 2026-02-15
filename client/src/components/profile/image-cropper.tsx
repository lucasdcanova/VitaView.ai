import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Loader2, ZoomIn, ZoomOut, RotateCw } from 'lucide-react';
import { getCroppedImg } from '@/lib/image-utils';

interface ImageCropperProps {
    imageSrc: string | null;
    isOpen: boolean;
    onClose: () => void;
    onCropComplete: (croppedImageIdx: Blob) => void;
    isLoading?: boolean;
}

export function ImageCropper({ imageSrc, isOpen, onClose, onCropComplete, isLoading }: ImageCropperProps) {
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [rotation, setRotation] = useState(0);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

    const onCropChange = (crop: { x: number; y: number }) => {
        setCrop(crop);
    };

    const onZoomChange = (zoom: number) => {
        setZoom(zoom);
    };

    const onRotationChange = (rotation: number) => {
        setRotation(rotation);
    };

    const onCropCompleteHandler = useCallback((croppedArea: any, croppedAreaPixels: any) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const handleSave = async () => {
        if (!imageSrc || !croppedAreaPixels) return;
        try {
            const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels, rotation);
            if (croppedImage) {
                onCropComplete(croppedImage);
            }
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Ajustar foto de perfil</DialogTitle>
                </DialogHeader>

                <div className="relative h-64 w-full bg-black rounded-md overflow-hidden">
                    {imageSrc && (
                        <Cropper
                            image={imageSrc}
                            crop={crop}
                            zoom={zoom}
                            rotation={rotation}
                            aspect={1}
                            onCropChange={onCropChange}
                            onZoomChange={onZoomChange}
                            onRotationChange={onRotationChange}
                            onCropComplete={onCropCompleteHandler}
                            cropShape="round"
                            showGrid={false}
                        />
                    )}
                </div>

                <div className="space-y-4 py-4">
                    <div className="flex items-center gap-4">
                        <ZoomOut className="h-4 w-4 text-gray-500" />
                        <Slider
                            value={[zoom]}
                            min={1}
                            max={3}
                            step={0.1}
                            onValueChange={(value) => setZoom(value[0])}
                            className="flex-1"
                        />
                        <ZoomIn className="h-4 w-4 text-gray-500" />
                    </div>
                    <div className="flex items-center gap-4">
                        <RotateCw className="h-4 w-4 text-gray-500 cursor-pointer" onClick={() => setRotation((r) => r + 90)} />
                        <span className="text-xs text-muted-foreground">Rotacionar</span>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isLoading}>
                        Cancelar
                    </Button>
                    <Button onClick={handleSave} disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Salvar Foto
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
