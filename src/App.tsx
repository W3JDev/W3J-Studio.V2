/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/


import React, { useState, useCallback, useRef, useEffect } from 'react';
import ReactCrop, { type Crop, type PixelCrop } from 'react-image-crop';
import { generateEditedImage, generateFilteredImage, generateAdjustedImage, enhancePrompt, getAiSuggestions, upscaleImage, removeObjectInpainting, type AiSuggestion } from './services/geminiService';
import Header from './components/Header';
import Spinner from './components/Spinner';
import FilterPanel from './components/FilterPanel';
import AdjustmentPanel from './components/AdjustmentPanel';
import CropPanel from './components/CropPanel';
import StudioPanel from './components/StudioPanel';
import SolutionsPanel from './components/SolutionsPanel';
import LayersPanel from './components/LayersPanel';
import SuggestionsModal from './components/SuggestionsModal';
import DownloadModal, { type DownloadOptions } from './components/DownloadModal';
import { UndoIcon, RedoIcon, EyeIcon, LightBulbIcon, MagicWandIcon, LayersIcon, EditIcon, CropIcon, AdjustIcon, ToolsIcon, CameraIcon, CubeIcon } from './components/icons';
import StartScreen from './components/StartScreen';
import EditToolbar from './components/EditToolbar';
import MagicBrushCanvas from './components/MagicBrushCanvas';
import ProductStudioPanel from './components/ProductStudioPanel';

// Helper to convert a data URL string to a File object
const dataURLtoFile = (dataurl: string, filename: string): File => {
    const arr = dataurl.split(',');
    if (arr.length < 2) throw new Error("Invalid data URL");
    const mimeMatch = arr[0].match(/:(.*?);/);
    if (!mimeMatch || !mimeMatch[1]) throw new Error("Could not parse MIME type from data URL");

    const mime = mimeMatch[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while(n--){
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, {type:mime});
}

type Tab = 'edit' | 'solutions' | 'studio' | 'product' | 'adjust' | 'filters' | 'crop';
type EditTool = 'point' | 'brush' | 'erase';

interface Layer {
  id: string;
  imageUrl: string; // Data URL from Gemini
  prompt: string;
}

interface AppState {
  imageFile: File;
  imageUrl: string; // Object URL for base image
  layers: Layer[];
}


const App: React.FC = () => {
  const [history, setHistory] = useState<AppState[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [activeLayerId, setActiveLayerId] = useState<string | null>(null);

  const [prompt, setPrompt] = useState<string>('');
  const [loadingMessage, setLoadingMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Edit tool state
  const [activeTab, setActiveTab] = useState<Tab>('edit');
  const [activeTool, setActiveTool] = useState<EditTool>('point');
  const [brushSize, setBrushSize] = useState(30);
  const [maskImage, setMaskImage] = useState<string | null>(null); // base64 data URL
  const [editHotspot, setEditHotspot] = useState<{ x: number, y: number } | null>(null);
  const [displayHotspot, setDisplayHotspot] = useState<{ x: number, y: number } | null>(null);
  
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [aspect, setAspect] = useState<number | undefined>();
  const [isComparing, setIsComparing] = useState<boolean>(false);
  
  const [isEnhancingPrompt, setIsEnhancingPrompt] = useState<boolean>(false);
  const [isSuggestionsModalOpen, setIsSuggestionsModalOpen] = useState<boolean>(false);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState<boolean>(false);
  const [isSuggesting, setIsSuggesting] = useState<boolean>(false);
  const [aiSuggestions, setAiSuggestions] = useState<AiSuggestion[] | null>(null);
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number, naturalWidth: number, naturalHeight: number } | null>(null);

  const imgRef = useRef<HTMLImageElement>(null);
  
  const currentState = history[historyIndex] ?? null;
  const currentImageFile = currentState?.imageFile ?? null;
  const currentImageUrl = currentState?.imageUrl ?? null;
  const currentLayers = currentState?.layers ?? [];
  const originalImageUrl = history[0]?.imageUrl ?? null;
  const activeLayer = currentLayers.find(l => l.id === activeLayerId) ?? null;
  const isLoading = loadingMessage !== null;
  
  // Effect to update image dimensions for canvas sizing
  useEffect(() => {
    if (imgRef.current) {
        const observer = new ResizeObserver(entries => {
            for (let entry of entries) {
                const { width, height } = entry.contentRect;
                const { naturalWidth, naturalHeight } = imgRef.current as HTMLImageElement;
                setImageDimensions({ width, height, naturalWidth, naturalHeight });
            }
        });
        observer.observe(imgRef.current);
        return () => observer.disconnect();
    }
  }, [currentImageUrl]);


  // Effect to populate prompt input when a layer is selected
  useEffect(() => {
    if (activeTab !== 'edit') return;
    if (activeLayer) {
      setPrompt(activeLayer.prompt);
    } else {
      setPrompt('');
    }
  }, [activeLayer, activeTab]);
  
  // Effect to reset edit state when switching tabs
  useEffect(() => {
    if (activeTab !== 'edit') {
      setDisplayHotspot(null);
    } else {
        // Reset to point tool if there's no layer selected
        if (!activeLayer) setActiveTool('point');
    }
  }, [activeTab, activeLayer]);
  
  // Effect to clear mask when switching to point tool
  useEffect(() => {
    if (activeTool === 'point') {
        setMaskImage(null);
    }
  }, [activeTool]);

  // Effect to clean up object URLs on unmount
  useEffect(() => {
    return () => {
      history.forEach(state => URL.revokeObjectURL(state.imageUrl));
    };
  }, []);


  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  const addImageToHistory = useCallback((newAppState: AppState) => {
    if (historyIndex < history.length - 1) {
        history.slice(historyIndex + 1).forEach(state => URL.revokeObjectURL(state.imageUrl));
    }
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newAppState);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    setCrop(undefined);
    setCompletedCrop(undefined);
    setMaskImage(null);
  }, [history, historyIndex]);

  const handleImageUpload = useCallback((file: File) => {
    setError(null);
    const imageUrl = URL.createObjectURL(file);
    const initialState: AppState = { imageFile: file, imageUrl, layers: [] };
    setHistory([initialState]);
    setHistoryIndex(0);
    setActiveLayerId(null);
    setEditHotspot(null);
    setDisplayHotspot(null);
    setActiveTab('edit');
    setActiveTool('point');
    setCrop(undefined);
    setCompletedCrop(undefined);
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!currentImageFile) {
        setError('No image loaded to edit.');
        return;
    }
    
    if (!prompt.trim()) {
        setError(activeLayer ? 'Please describe your changes to the layer.' : 'Please enter a description for your edit.');
        return;
    }
    
    const hasPointSelection = activeTool === 'point' && !!editHotspot;
    const hasBrushSelection = activeTool !== 'point' && !!maskImage;

    if (!activeLayer && !hasPointSelection && !hasBrushSelection) {
        setError('Please select an area on the image to edit.');
        return;
    }

    setLoadingMessage(activeLayer ? 'Updating layer...' : 'Generating new layer...');
    setError(null);
    
    try {
        const options = {
            hotspot: hasPointSelection ? editHotspot! : undefined,
            maskImage: hasBrushSelection ? maskImage! : undefined,
        };

        const newLayerUrl = await generateEditedImage(currentImageFile, prompt, options);
        
        let newLayers: Layer[];
        let newActiveLayerId: string;

        if (activeLayer) {
            const updatedLayer = { ...activeLayer, imageUrl: newLayerUrl, prompt };
            newLayers = currentLayers.map(l => l.id === activeLayer.id ? updatedLayer : l);
            newActiveLayerId = activeLayer.id;
        } else {
            const newLayer: Layer = { id: Date.now().toString(), imageUrl: newLayerUrl, prompt };
            newLayers = [...currentLayers, newLayer];
            newActiveLayerId = newLayer.id;
        }

        const newState: AppState = { ...currentState!, layers: newLayers };
        addImageToHistory(newState);
        setActiveLayerId(newActiveLayerId);
        setEditHotspot(null);
        setDisplayHotspot(null);

    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
        setError(`Failed to generate the image. ${errorMessage}`);
        console.error(err);
    } finally {
        setLoadingMessage(null);
    }
  }, [currentImageFile, prompt, editHotspot, addImageToHistory, activeLayer, currentLayers, currentState, activeTool, maskImage]);
  
  const handleRemove = useCallback(async () => {
    if (!currentImageFile || !maskImage) {
        setError('Please use the brush to select an area to remove.');
        return;
    }

    setLoadingMessage('Removing selected object...');
    setError(null);

    try {
        const fileToEdit = await flattenImage();
        const editedImageUrl = await removeObjectInpainting(fileToEdit, maskImage);

        const newImageFile = dataURLtoFile(editedImageUrl, `removed-${Date.now()}.png`);
        const newImageUrl = URL.createObjectURL(newImageFile);

        const newState: AppState = {
            imageFile: newImageFile,
            imageUrl: newImageUrl,
            layers: [] // This action flattens layers
        };
        addImageToHistory(newState);
        setActiveLayerId(null);
        setEditHotspot(null);
        setDisplayHotspot(null);
        setMaskImage(null);

    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
        setError(`Failed to remove the object. ${errorMessage}`);
        console.error(err);
    } finally {
        setLoadingMessage(null);
    }
  }, [currentImageFile, maskImage, addImageToHistory]);
  
  const handleApplyGlobalEdit = useCallback(async (
    editFunction: (file: File, prompt: string) => Promise<string>, 
    prompt: string,
    message: string,
    ) => {
    if (!currentImageFile || !currentState) {
        setError('No image loaded to apply an edit to.');
        return;
    }
    
    setLoadingMessage(message);
    setError(null);
    
    try {
        const fileToEdit = await flattenImage();

        const editedImageUrl = await editFunction(fileToEdit, prompt);
        const newImageFile = dataURLtoFile(editedImageUrl, `edited-${Date.now()}.png`);
        const newImageUrl = URL.createObjectURL(newImageFile);

        const newState: AppState = {
            imageFile: newImageFile,
            imageUrl: newImageUrl,
            layers: [] // Global edits flatten layers
        };
        addImageToHistory(newState);
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
        setError(`Failed to apply the edit. ${errorMessage}`);
        console.error(err);
    } finally {
        setLoadingMessage(null);
    }
  }, [currentImageFile, currentState, addImageToHistory]);

  const flattenImage = async (): Promise<File> => {
    if (!currentImageUrl || !currentState || currentLayers.length === 0) return currentImageFile!;

    const baseImg = new Image();
    baseImg.src = currentImageUrl;

    await new Promise(r => baseImg.onload = r);

    const canvas = document.createElement('canvas');
    canvas.width = baseImg.naturalWidth;
    canvas.height = baseImg.naturalHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return currentState.imageFile;

    ctx.drawImage(baseImg, 0, 0);

    for (const layer of currentLayers) {
        await new Promise<void>((resolve, reject) => {
            const layerImg = new Image();
            layerImg.crossOrigin = "anonymous";
            layerImg.onload = () => {
                ctx.drawImage(layerImg, 0, 0, canvas.width, canvas.height);
                resolve();
            };
            layerImg.onerror = reject;
            layerImg.src = layer.imageUrl;
        });
    }

    const dataUrl = canvas.toDataURL('image/png');
    return dataURLtoFile(dataUrl, `flattened-${Date.now()}.png`);
  };

  const handleApplyCrop = useCallback(async () => {
    if (!completedCrop || !imgRef.current) {
        setError('Please select an area to crop.');
        return;
    }

    setLoadingMessage('Applying crop...');
    const flattenedFile = await flattenImage();
    const flattenedUrl = URL.createObjectURL(flattenedFile);
    
    const image = new Image();
    image.onload = () => {
        const canvas = document.createElement('canvas');
        const scaleX = image.naturalWidth / imgRef.current!.width;
        const scaleY = image.naturalHeight / imgRef.current!.height;
        
        canvas.width = completedCrop.width;
        canvas.height = completedCrop.height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
            setError('Could not process the crop.');
            setLoadingMessage(null);
            URL.revokeObjectURL(flattenedUrl);
            return;
        }

        const pixelRatio = window.devicePixelRatio || 1;
        canvas.width = completedCrop.width * pixelRatio;
        canvas.height = completedCrop.height * pixelRatio;
        ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
        ctx.imageSmoothingQuality = 'high';

        ctx.drawImage(
          image,
          completedCrop.x * scaleX,
          completedCrop.y * scaleY,
          completedCrop.width * scaleX,
          completedCrop.height * scaleY,
          0,
          0,
          completedCrop.width,
          completedCrop.height,
        );
        
        URL.revokeObjectURL(flattenedUrl);

        const croppedImageUrl = canvas.toDataURL('image/png');
        const newImageFile = dataURLtoFile(croppedImageUrl, `cropped-${Date.now()}.png`);
        const newImageUrl = URL.createObjectURL(newImageFile);

        const newState: AppState = {
            imageFile: newImageFile,
            imageUrl: newImageUrl,
            layers: [] // Crop flattens layers
        };
        addImageToHistory(newState);
        setLoadingMessage(null);
    };
    image.src = flattenedUrl;

  }, [completedCrop, addImageToHistory]);
  
  const handleEnhancePrompt = useCallback(async () => {
    if (!prompt.trim()) return;
    setIsEnhancingPrompt(true);
    try {
        const enhanced = await enhancePrompt(prompt);
        setPrompt(enhanced);
    } catch (err) {
        console.error("Enhancement failed:", err);
    } finally {
        setIsEnhancingPrompt(false);
    }
  }, [prompt]);

  const handleGetSuggestions = useCallback(async () => {
    if (!currentImageFile) return;
    setIsSuggestionsModalOpen(true);
    setIsSuggesting(true);
    setAiSuggestions(null);
    setError(null);
    try {
        const suggestions = await getAiSuggestions(currentImageFile);
        setAiSuggestions(suggestions);
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
        setError(`Failed to get suggestions. ${errorMessage}`);
        setAiSuggestions(null);
    } finally {
        setIsSuggesting(false);
    }
  }, [currentImageFile]);

  const handleApplySuggestion = useCallback((suggestionPrompt: string, title: string) => {
    setIsSuggestionsModalOpen(false);
    handleApplyGlobalEdit(generateAdjustedImage, suggestionPrompt, `Applying ${title}...`);
  }, [handleApplyGlobalEdit]);


  const handleUndo = useCallback(() => {
    if (canUndo) {
      setHistoryIndex(historyIndex - 1);
      setEditHotspot(null);
      setDisplayHotspot(null);
      setActiveLayerId(null);
      setMaskImage(null);
    }
  }, [canUndo, historyIndex]);
  
  const handleRedo = useCallback(() => {
    if (canRedo) {
      setHistoryIndex(historyIndex + 1);
      setEditHotspot(null);
      setDisplayHotspot(null);
      setActiveLayerId(null);
      setMaskImage(null);
    }
  }, [canRedo, historyIndex]);

  const handleReset = useCallback(() => {
    if (history.length > 0) {
      setHistoryIndex(0);
      setError(null);
      setEditHotspot(null);
      setDisplayHotspot(null);
      setActiveLayerId(null);
      setMaskImage(null);
    }
  }, [history]);

  const handleUploadNew = useCallback(() => {
      setHistory([]);
      setHistoryIndex(-1);
      setError(null);
      setPrompt('');
      setEditHotspot(null);
      setDisplayHotspot(null);
      setActiveLayerId(null);
      setMaskImage(null);
  }, []);

  const handleConfirmDownload = useCallback(async (options: DownloadOptions) => {
    setIsDownloadModalOpen(false);
    if (!currentImageFile) return;

    setLoadingMessage('Preparing download...');
    setError(null);

    try {
        let fileToProcess = await flattenImage();

        if (options.upscale) {
            setLoadingMessage('Upscaling image...');
            const upscaledDataUrl = await upscaleImage(fileToProcess);
            fileToProcess = dataURLtoFile(upscaledDataUrl, 'upscaled.png');
        }

        const image = new Image();
        image.src = URL.createObjectURL(fileToProcess);
        await new Promise(r => image.onload = r);

        const canvas = document.createElement('canvas');
        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error("Could not create canvas context");
        ctx.drawImage(image, 0, 0);

        if (options.addWatermark) {
            ctx.font = `bold ${Math.max(16, Math.round(canvas.width / 80))}px Inter, sans-serif`;
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.textAlign = 'right';
            ctx.textBaseline = 'bottom';
            ctx.fillText('Made with W3J Studio', canvas.width - 10, canvas.height - 10);
        }

        const mimeType = options.format === 'jpeg' ? 'image/jpeg' : 'image/png';
        const quality = options.format === 'jpeg' ? options.quality / 100 : undefined;
        const dataUrl = canvas.toDataURL(mimeType, quality);

        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = `w3j-studio-edit.${options.format}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(image.src);

    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
        setError(`Failed to process the download. ${errorMessage}`);
        console.error(err);
    } finally {
        setLoadingMessage(null);
    }
  }, [currentImageFile, flattenImage]);

  const handleFileSelect = (files: FileList | null) => {
    if (files && files[0]) {
      handleImageUpload(files[0]);
    }
  };

  const handleBaseImageClick = (e: React.MouseEvent<HTMLImageElement>) => {
    if (activeTab !== 'edit' || activeTool !== 'point') return;
    
    const img = e.currentTarget;
    const rect = img.getBoundingClientRect();

    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;
    
    const { naturalWidth, naturalHeight, clientWidth, clientHeight } = img;
    const scaleX = naturalWidth / clientWidth;
    const scaleY = naturalHeight / clientHeight;

    const originalX = Math.round(offsetX * scaleX);
    const originalY = Math.round(offsetY * scaleY);
    
    setEditHotspot({ x: originalX, y: originalY });
    setDisplayHotspot({ x: offsetX, y: offsetY });
    setActiveLayerId(null);
    setMaskImage(null);
  };

  const handleSelectLayer = (layerId: string) => {
    if (activeTab !== 'edit') return;
    setActiveLayerId(layerId);
    setEditHotspot(null);
    setDisplayHotspot(null);
    setMaskImage(null);
    setActiveTool('brush'); // Switch to brush tool when a layer is selected for editing
  };

  const handleLayerClick = (e: React.MouseEvent<HTMLImageElement>, layer: Layer) => {
    e.stopPropagation();
    handleSelectLayer(layer.id);
  };

  const handleDeleteLayer = useCallback((layerId: string) => {
    if (!currentState) return;

    const newLayers = currentLayers.filter(l => l.id !== layerId);
    const newState: AppState = { ...currentState, layers: newLayers };
    
    addImageToHistory(newState);

    if (activeLayerId === layerId) {
        setActiveLayerId(null);
        setActiveTool('point');
    }
  }, [currentState, currentLayers, addImageToHistory, activeLayerId]);

  const mainTabs: { id: Tab, name: string, icon: React.FC<{className?: string}> }[] = [
      { id: 'edit', name: 'Edit', icon: EditIcon },
      { id: 'solutions', name: 'AI Solutions', icon: ToolsIcon },
      { id: 'studio', name: 'Scene Studio', icon: CameraIcon },
      { id: 'product', name: 'Product Studio', icon: CubeIcon },
      { id: 'adjust', name: 'Adjust', icon: AdjustIcon },
      { id: 'filters', name: 'Creative Filters', icon: MagicWandIcon },
      { id: 'crop', name: 'Crop', icon: CropIcon },
  ];
  
  const getCursor = () => {
    if (activeTab !== 'edit') return 'default';
    if (activeTool === 'point' && !activeLayer) return 'crosshair';
    if (activeTool === 'brush' || activeTool === 'erase') return 'none'; // Custom cursor handled by MagicBrushCanvas
    return 'default';
  }

  const renderContent = () => {
    if (error && !isSuggestionsModalOpen) {
       return (
           <div className="text-center animate-fade-in bg-red-900/20 border border-red-500/20 p-8 rounded-2xl max-w-2xl mx-auto flex flex-col items-center gap-4 shadow-2xl shadow-red-900/50">
            <h2 className="text-2xl font-bold text-red-300">An Error Occurred</h2>
            <p className="text-md text-red-400">{error}</p>
            <button
                onClick={() => setError(null)}
                className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-6 rounded-lg text-md transition-colors"
              >
                Try Again
            </button>
          </div>
        );
    }
    
    if (!currentImageUrl) {
      return <StartScreen onFileSelect={handleFileSelect} />;
    }

    const imageDisplay = (
      <div className="relative" style={{ cursor: getCursor() }}>
        {originalImageUrl && (
            <img
                key={`original-${originalImageUrl}`}
                src={originalImageUrl}
                alt="Original"
                className="w-full h-auto object-contain max-h-[60vh] rounded-xl pointer-events-none"
            />
        )}
        <img
            ref={imgRef}
            key={`current-${currentImageUrl}`}
            src={currentImageUrl}
            alt="Current"
            onClick={handleBaseImageClick}
            className={`absolute top-0 left-0 w-full h-auto object-contain max-h-[60vh] rounded-xl transition-opacity duration-200 ease-in-out ${isComparing ? 'opacity-0' : 'opacity-100'}`}
        />
        {currentLayers.map(layer => (
            <img 
                key={layer.id}
                src={layer.imageUrl}
                alt={layer.prompt}
                onClick={(e) => handleLayerClick(e, layer)}
                className={`absolute top-0 left-0 w-full h-auto object-contain max-h-[60vh] rounded-xl pointer-events-auto transition-all duration-200 ${isComparing ? 'opacity-0' : 'opacity-100'} ${activeTab === 'edit' ? 'cursor-pointer' : ''} ${activeLayerId === layer.id ? 'ring-4 ring-cyan-400 shadow-2xl shadow-cyan-500/50' : 'hover:ring-2 ring-cyan-500/50'}`}
            />
        ))}
        {activeTab === 'edit' && activeTool !== 'point' && imageDimensions && (
            <MagicBrushCanvas
                imageDimensions={imageDimensions}
                tool={activeTool}
                brushSize={brushSize}
                onMaskChange={setMaskImage}
                initialMask={maskImage}
            />
        )}
      </div>
    );
    
    const cropImageElement = (
      <img 
        ref={imgRef}
        key={`crop-${currentImageUrl}`}
        src={currentImageUrl} 
        alt="Crop this image"
        className="w-full h-auto object-contain max-h-[60vh] rounded-xl"
      />
    );


    return (
      <div className="w-full flex flex-col lg:flex-row items-start justify-center gap-8">
        <div className="flex-grow w-full flex flex-col items-center gap-6 animate-fade-in lg:max-w-4xl xl:max-w-5xl">
            <SuggestionsModal
                isOpen={isSuggestionsModalOpen}
                onClose={() => setIsSuggestionsModalOpen(false)}
                isLoading={isSuggesting}
                suggestions={aiSuggestions}
                onApplySuggestion={handleApplySuggestion}
            />
            <DownloadModal
                isOpen={isDownloadModalOpen}
                onClose={() => setIsDownloadModalOpen(false)}
                onConfirm={handleConfirmDownload}
            />
            <div className={`relative w-full shadow-2xl shadow-black/50 rounded-2xl overflow-hidden bg-black/50 ${isLoading ? 'glowing-border' : ''}`}>
                {isLoading && (
                    <div className="absolute inset-0 bg-black/80 z-40 flex flex-col items-center justify-center gap-4 animate-fade-in backdrop-blur-sm">
                        <Spinner className="w-16 h-16 text-white" />
                        <p className="text-gray-300 text-lg font-semibold">{loadingMessage}</p>
                    </div>
                )}
                
                {activeTab === 'crop' ? (
                  <ReactCrop 
                    crop={crop} 
                    onChange={c => setCrop(c)} 
                    onComplete={c => setCompletedCrop(c)}
                    aspect={aspect}
                    className="max-h-[60vh]"
                  >
                    {cropImageElement}
                  </ReactCrop>
                ) : imageDisplay }

                {displayHotspot && !isLoading && activeTab === 'edit' && activeTool === 'point' && !activeLayer && (
                    <div 
                        className="absolute rounded-full w-6 h-6 bg-cyan-500/50 border-2 border-white pointer-events-none -translate-x-1/2 -translate-y-1/2 z-10"
                        style={{ left: `${displayHotspot.x}px`, top: `${displayHotspot.y}px` }}
                    >
                        <div className="absolute inset-0 rounded-full w-6 h-6 animate-ping bg-cyan-400"></div>
                    </div>
                )}
            </div>
            
            <div className="w-full bg-[var(--surface-color)] border border-[var(--border-color)] rounded-xl p-2 flex items-center justify-start sm:justify-center gap-1 backdrop-blur-xl overflow-x-auto">
                {mainTabs.map(tab => (
                     <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`w-full sm:w-auto flex-shrink-0 flex items-center justify-center gap-2 capitalize font-semibold py-3 px-4 rounded-lg transition-all duration-200 text-base ${
                            activeTab === tab.id 
                            ? 'bg-white/10 text-white shadow-lg' 
                            : 'text-[var(--text-secondary)] hover:text-white hover:bg-white/5'
                        }`}
                    >
                        <tab.icon className="w-5 h-5" />
                        <span className="hidden sm:inline">{tab.name}</span>
                    </button>
                ))}
            </div>
            
            <div className="w-full">
                {activeTab === 'edit' && (
                    <EditToolbar
                        prompt={prompt}
                        onPromptChange={setPrompt}
                        onGenerate={handleGenerate}
                        onRemove={handleRemove}
                        isLoading={isLoading}
                        isEnhancing={isEnhancingPrompt}
                        onEnhance={handleEnhancePrompt}
                        activeTool={activeTool}
                        onToolChange={setActiveTool}
                        brushSize={brushSize}
                        onBrushSizeChange={setBrushSize}
                        canGenerate={!!prompt.trim() && (activeTool === 'point' ? !!editHotspot : !!maskImage)}
                        canRemove={activeTool !== 'point' && !!maskImage}
                        activeLayer={activeLayer}
                        maskImage={maskImage}
                    />
                )}
                {activeTab === 'solutions' && <SolutionsPanel onApplyTool={(p, name) => handleApplyGlobalEdit(generateAdjustedImage, p, `Applying ${name}...`)} isLoading={isLoading} />}
                {activeTab === 'studio' && <StudioPanel onApplyAdjustment={(p) => handleApplyGlobalEdit(generateAdjustedImage, p, 'Generating new scene...')} isLoading={isLoading} />}
                {activeTab === 'product' && <ProductStudioPanel onApplyProductScene={(p, name) => handleApplyGlobalEdit(generateAdjustedImage, p, `Creating ${name} shot...`)} isLoading={isLoading} />}
                {activeTab === 'crop' && <CropPanel onApplyCrop={handleApplyCrop} onSetAspect={setAspect} isLoading={isLoading} isCropping={!!completedCrop?.width && completedCrop.width > 0} />}
                {activeTab === 'adjust' && <AdjustmentPanel onApplyAdjustment={(p) => handleApplyGlobalEdit(generateAdjustedImage, p, 'Applying adjustment...')} isLoading={isLoading} />}
                {activeTab === 'filters' && <FilterPanel onApplyFilter={(p) => handleApplyGlobalEdit(generateFilteredImage, p, 'Applying creative filter...')} isLoading={isLoading} />}
            </div>
            
            <div className="w-full bg-[var(--surface-color)] border border-[var(--border-color)] rounded-xl p-4 flex flex-wrap items-center justify-center gap-3 mt-4 backdrop-blur-xl">
                <button 
                    onClick={handleUndo}
                    disabled={!canUndo}
                    className="flex items-center justify-center text-center bg-white/5 border border-white/10 text-[var(--text-primary)] font-semibold py-2 px-4 rounded-lg transition-all duration-200 ease-in-out hover:bg-white/10 hover:border-white/20 active:scale-95 text-base disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Undo last action"
                >
                    <UndoIcon className="w-5 h-5 mr-2" />
                    Undo
                </button>
                <button 
                    onClick={handleRedo}
                    disabled={!canRedo}
                    className="flex items-center justify-center text-center bg-white/5 border border-white/10 text-[var(--text-primary)] font-semibold py-2 px-4 rounded-lg transition-all duration-200 ease-in-out hover:bg-white/10 hover:border-white/20 active:scale-95 text-base disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Redo last action"
                >
                    <RedoIcon className="w-5 h-5 mr-2" />
                    Redo
                </button>
                 <button 
                    onClick={handleReset}
                    disabled={!canUndo}
                    className="text-center text-[var(--text-secondary)] font-semibold py-2 px-4 rounded-lg transition-all duration-200 ease-in-out hover:bg-white/10 hover:text-white active:scale-95 text-base disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Reset
                </button>
                
                <div className="h-6 w-px bg-white/10 mx-1 hidden sm:block"></div>

                {canUndo && (
                  <button 
                      onMouseDown={() => setIsComparing(true)}
                      onMouseUp={() => setIsComparing(false)}
                      onMouseLeave={() => setIsComparing(false)}
                      onTouchStart={() => setIsComparing(true)}
                      onTouchEnd={() => setIsComparing(false)}
                      className="flex items-center justify-center text-center bg-white/5 border border-white/10 text-[var(--text-primary)] font-semibold py-2 px-4 rounded-lg transition-all duration-200 ease-in-out hover:bg-white/10 hover:border-white/20 active:scale-95 text-base"
                      aria-label="Press and hold to see original image"
                  >
                      <EyeIcon className="w-5 h-5 mr-2" />
                      Compare
                  </button>
                )}
                
                 <button 
                    onClick={handleGetSuggestions}
                    className="flex items-center justify-center text-center bg-yellow-500/10 border border-yellow-500/20 text-yellow-300 font-semibold py-2 px-4 rounded-lg transition-all duration-200 ease-in-out hover:bg-yellow-500/20 hover:border-yellow-500/30 active:scale-95 text-base"
                    aria-label="Get AI Suggestions"
                >
                    <LightBulbIcon className="w-5 h-5 mr-2" />
                    AI Art Director
                </button>

                <div className="flex-grow"></div>

                <button 
                    onClick={handleUploadNew}
                    className="text-center bg-white/10 border border-white/20 text-[var(--text-primary)] font-semibold py-2 px-4 rounded-lg transition-all duration-200 ease-in-out hover:bg-white/20 hover:border-white/30 active:scale-95 text-base"
                >
                    Upload New
                </button>

                <button 
                    onClick={() => setIsDownloadModalOpen(true)}
                    className="bg-green-500 text-white font-bold py-2 px-5 rounded-lg transition-all duration-300 ease-in-out shadow-lg shadow-green-500/20 hover:shadow-xl hover:shadow-green-500/40 hover:-translate-y-px active:scale-95 active:shadow-inner text-base"
                >
                    Download
                </button>
            </div>
        </div>

        {currentLayers.length > 0 && (
             <div className="w-full lg:w-80 lg:flex-shrink-0 lg:sticky lg:top-28 animate-fade-in">
                <LayersPanel 
                    layers={currentLayers}
                    activeLayerId={activeLayerId}
                    onSelectLayer={handleSelectLayer}
                    onDeleteLayer={handleDeleteLayer}
                />
            </div>
        )}
      </div>
    );
  };
  
  return (
    <div className="min-h-screen text-[var(--text-primary)] flex flex-col">
      <Header />
      <main className={`flex-grow w-full max-w-[1600px] mx-auto p-4 md:p-8 flex ${currentImageFile ? 'justify-center items-start' : 'justify-center items-center'}`}>
        {renderContent()}
      </main>
    </div>
  );
};

export default App;