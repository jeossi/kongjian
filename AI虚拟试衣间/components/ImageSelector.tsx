import React, { useRef } from 'react';
import { PresetImage } from '../types';
import { urlToBase64, fileToBase64 } from '../utils/imageUtils';

interface ImageSelectorProps {
  title: string;
  presets: PresetImage[];
  selectedImage: string | null;
  onSelect: (base64: string) => void;
  isLoading?: boolean;
}

const ImageSelector: React.FC<ImageSelectorProps> = ({ title, presets, selectedImage, onSelect, isLoading }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePresetClick = async (url: string) => {
    if (isLoading) return;
    try {
      // Optimistic UI update could happen here, but we wait for base64
      const base64 = await urlToBase64(url);
      onSelect(base64);
    } catch (e) {
      alert((e as Error).message);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      try {
        const base64 = await fileToBase64(e.target.files[0]);
        onSelect(base64);
      } catch (error) {
        console.error("Upload failed", error);
      }
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6 bg-white rounded-3xl shadow-sm border border-slate-100">
      <h2 className="text-2xl font-bold mb-6 text-slate-800 flex items-center gap-2">
        {title}
        {isLoading && <span className="text-sm font-normal text-primary animate-pulse">(处理中...)</span>}
      </h2>
      
      <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {/* Upload Button */}
        <div 
          onClick={() => fileInputRef.current?.click()}
          className="aspect-[3/4] border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-primary hover:bg-slate-50 transition-colors group"
        >
          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mb-2 group-hover:bg-white group-hover:shadow-md transition-all">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-slate-400 group-hover:text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <span className="text-sm font-medium text-slate-500 group-hover:text-primary">上传照片</span>
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*" 
            onChange={handleFileUpload}
          />
        </div>

        {/* Presets */}
        {presets.map((preset) => (
          <div 
            key={preset.id}
            onClick={() => handlePresetClick(preset.url)}
            className={`
              relative aspect-[3/4] rounded-xl overflow-hidden cursor-pointer group
              ${isLoading ? 'opacity-50 pointer-events-none' : ''}
            `}
          >
            <img 
              src={preset.url} 
              alt="Preset" 
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
              loading="lazy"
            />
            {/* Selection Overlay */}
            <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity duration-200 ${selectedImage && selectedImage.includes(preset.id) ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
               <button className="bg-white/20 backdrop-blur-md text-white px-3 py-1 rounded-full text-xs font-bold border border-white/50">
                 选择
               </button>
            </div>
            
            {/* Active Indicator - Simplified matching logic needed if we compare base64, but here we just rely on visual feedback or parent state if we tracked IDs */}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ImageSelector;
