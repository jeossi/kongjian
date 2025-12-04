import React, { useState, useEffect, useRef } from 'react';
import { 
  AppStep, 
  PRESET_PEOPLE, 
  PRESET_CLOTHES as INITIAL_PRESET_CLOTHES, 
  PresetImage, 
  GenerationHistory 
} from './types';
import TopVisual from './components/TopVisual';
import ImageSelector from './components/ImageSelector';
import HistoryGallery from './components/HistoryGallery';
import { generateClothingImage, generateTryOn } from './services/geminiService';
import { mergeImagesHorizontally } from './utils/imageUtils';

// --- Internal Component: ImageViewer with Zoom/Pan ---
const ImageViewer: React.FC<{ src: string; onClose: () => void }> = ({ src, onClose }) => {
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const imgRef = useRef<HTMLImageElement>(null);
  const startDragRef = useRef({ x: 0, y: 0 });
  const startTranslateRef = useRef({ x: 0, y: 0 });
  const pinchDistRef = useRef<number>(0);
  const startScaleRef = useRef<number>(1);

  // Wheel Zoom (Desktop)
  const handleWheel = (e: React.WheelEvent) => {
    e.stopPropagation();
    const s = e.deltaY > 0 ? 0.9 : 1.1;
    setScale((prev) => Math.min(Math.max(1, prev * s), 8));
  };

  // Mouse Down (Desktop Pan)
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    if (scale > 1) {
      setIsDragging(true);
      startDragRef.current = { x: e.clientX, y: e.clientY };
      startTranslateRef.current = { ...translate };
    }
  };

  // Mouse Move (Desktop Pan)
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - startDragRef.current.x;
    const dy = e.clientY - startDragRef.current.y;
    setTranslate({
      x: startTranslateRef.current.x + dx,
      y: startTranslateRef.current.y + dy,
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  // Touch Start (Mobile Pinch/Pan)
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      // Pinch Start
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      pinchDistRef.current = dist;
      startScaleRef.current = scale;
    } else if (e.touches.length === 1 && scale > 1) {
      // Pan Start
      setIsDragging(true);
      startDragRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      startTranslateRef.current = { ...translate };
    }
  };

  // Touch Move (Mobile Pinch/Pan)
  const handleTouchMove = (e: React.TouchEvent) => {
    e.stopPropagation();
    if (e.touches.length === 2) {
      // Pinch Move
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      if (pinchDistRef.current > 0) {
        const zoomFactor = dist / pinchDistRef.current;
        setScale(Math.min(Math.max(1, startScaleRef.current * zoomFactor), 8));
      }
    } else if (e.touches.length === 1 && isDragging) {
      // Pan Move
      const dx = e.touches[0].clientX - startDragRef.current.x;
      const dy = e.touches[0].clientY - startDragRef.current.y;
      setTranslate({
        x: startTranslateRef.current.x + dx,
        y: startTranslateRef.current.y + dy,
      });
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    pinchDistRef.current = 0;
  };

  // Reset Pan if Zoomed Out
  useEffect(() => {
    if (scale <= 1.05) {
      setTranslate({ x: 0, y: 0 });
    }
  }, [scale]);

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex flex-col overflow-hidden touch-none"
      onWheel={handleWheel}
      onClick={onClose}
    >
      {/* Top Bar */}
      <div className="absolute top-0 w-full flex justify-between items-center p-6 text-white/90 z-20 pointer-events-none">
        <h3 className="text-lg font-medium tracking-wide drop-shadow-md">
          高清预览 <span className="text-xs opacity-70 ml-2 font-normal">(滚轮/双指缩放)</span>
        </h3>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="p-2 bg-black/20 hover:bg-white/10 rounded-full transition-colors pointer-events-auto backdrop-blur-sm"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Image Container */}
      <div
        className="flex-1 flex items-center justify-center w-full h-full overflow-hidden"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking image area
      >
        <img
          ref={imgRef}
          src={src}
          alt="Full Screen Preview"
          style={{
            transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`,
            transition: isDragging ? 'none' : 'transform 0.1s ease-out',
            cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default',
          }}
          className="max-w-full max-h-full object-contain select-none shadow-2xl drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]"
          draggable={false}
        />
      </div>

      {/* Bottom Bar */}
      <div className="absolute bottom-0 w-full p-8 flex justify-center z-20 pointer-events-none pb-10">
        <a
          href={src}
          download={`ai-tryon-highres-${Date.now()}.png`}
          onClick={(e) => e.stopPropagation()}
          className="bg-white text-black px-8 py-3 rounded-full font-bold text-lg hover:scale-105 transition-transform flex items-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.3)] pointer-events-auto cursor-pointer"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          下载原图
        </a>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<AppStep>(AppStep.SELECT_PERSON);
  
  // State for Images (Base64)
  const [personImage, setPersonImage] = useState<string | null>(null);
  const [clothImage, setClothImage] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null); // This will be the merged sprite for TopVisual
  
  // State for Lists
  const [clothPresets, setClothPresets] = useState<PresetImage[]>(INITIAL_PRESET_CLOTHES);
  const [history, setHistory] = useState<GenerationHistory[]>([]);

  // UI State
  const [isLoading, setIsLoading] = useState(false);
  const [clothPrompt, setClothPrompt] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Independent Result Images (Front, Left, Back, Right)
  const [slicedImages, setSlicedImages] = useState<string[]>([]);
  // Modal State
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Step 1 Handler
  const handleSelectPerson = (base64: string) => {
    setPersonImage(base64);
    // Smooth transition
    setTimeout(() => setCurrentStep(AppStep.SELECT_CLOTH), 300);
  };

  // Step 2 Handler
  const handleSelectCloth = (base64: string) => {
    setClothImage(base64);
  };

  // Generate New Cloth Logic
  const handleGenerateCloth = async () => {
    if (!clothPrompt.trim()) return;
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const base64 = await generateClothingImage(clothPrompt);
      // Add to presets
      const newPreset: PresetImage = {
        id: `gen_${Date.now()}`,
        url: base64, // base64 acts as URL for img src
        category: 'cloth'
      };
      setClothPresets([newPreset, ...clothPresets]);
      setClothImage(base64); // Auto select
      setClothPrompt('');
    } catch (error) {
      setErrorMsg("生成服装失败，请重试。");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  // Step 3: Final Try On Generation
  const handleTryOn = async () => {
    if (!personImage || !clothImage) return;
    
    setIsLoading(true);
    setCurrentStep(AppStep.GENERATING);
    setErrorMsg(null);
    setSlicedImages([]); // Clear previous
    setResultImage(null);

    try {
      // Step 3 now returns an array of 4 independent high-res images
      const images = await generateTryOn(personImage, clothImage);
      
      setSlicedImages(images);

      // Create a sprite sheet for the TopVisual 3D rotation effect
      const spriteSheet = await mergeImagesHorizontally(images);
      setResultImage(spriteSheet);
      
      // Add to history (using the sprite as the 'resultImage' thumbnail)
      const historyItem: GenerationHistory = {
        id: Date.now().toString(),
        personImage,
        clothImage,
        resultImage: spriteSheet,
        timestamp: Date.now()
      };
      setHistory(prev => [historyItem, ...prev]);
      setCurrentStep(AppStep.RESULT);
    } catch (error) {
      console.error(error);
      setErrorMsg("换装生成失败，可能是网络问题或图片格式不支持。");
      setCurrentStep(AppStep.SELECT_CLOTH); // Go back
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setPersonImage(null);
    setClothImage(null);
    setResultImage(null);
    setSlicedImages([]);
    setCurrentStep(AppStep.SELECT_PERSON);
  };

  return (
    <div className="min-h-screen font-sans text-slate-700 bg-gray-50 flex flex-col">
      
      {/* Header Title */}
      <header className="absolute top-0 left-0 w-full z-10 p-6">
         <div className="container mx-auto">
            <h1 className="text-2xl font-bold text-slate-800/80 tracking-tight flex items-center gap-2">
               <span className="text-3xl filter drop-shadow-sm">👗</span> 
               <span>AI 虚拟试衣间-大师版</span>
            </h1>
         </div>
      </header>

      {/* Visual Header */}
      <TopVisual 
        personImage={personImage} 
        clothImage={clothImage} 
        resultImage={resultImage} 
        isGenerating={currentStep === AppStep.GENERATING}
      />

      {/* Main Action Area */}
      <div className="flex-1 container mx-auto px-4 -mt-8 relative z-40 pb-20">
        
        {/* Error Toast */}
        {errorMsg && (
          <div className="fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-xl z-50 animate-bounce">
            {errorMsg}
          </div>
        )}

        {/* Step 1: Select Person */}
        {currentStep === AppStep.SELECT_PERSON && (
          <div className="animate-fade-in-up">
            <ImageSelector 
              title="第一步：选择模特" 
              presets={PRESET_PEOPLE} 
              selectedImage={personImage} 
              onSelect={handleSelectPerson}
              isLoading={isLoading}
            />
          </div>
        )}

        {/* Step 2: Select Cloth & Generate */}
        {currentStep === AppStep.SELECT_CLOTH && (
          <div className="animate-fade-in-up space-y-6">
            
            {/* Selected Person Preview (Mini) */}
            <div className="flex items-center justify-between bg-white p-4 rounded-2xl shadow-sm border border-slate-100 max-w-4xl mx-auto">
               <div className="flex items-center gap-4">
                 <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-primary">
                    <img src={personImage!} className="w-full h-full object-cover" alt="Selected" />
                 </div>
                 <div className="text-sm">
                   <p className="font-bold text-slate-800">已选模特</p>
                   <p className="text-slate-400 cursor-pointer hover:text-primary" onClick={() => setCurrentStep(AppStep.SELECT_PERSON)}>点击更换</p>
                 </div>
               </div>
               {clothImage && (
                 <button 
                  onClick={handleTryOn}
                  disabled={isLoading}
                  className="bg-primary hover:bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold text-lg shadow-lg shadow-primary/30 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                 >
                   {isLoading ? '生成中...' : '开始换装 ✨'}
                 </button>
               )}
            </div>

            {/* AI Cloth Generation Input */}
            <div className="max-w-4xl mx-auto bg-gradient-to-r from-purple-50 to-indigo-50 p-6 rounded-3xl border border-indigo-100">
               <label className="block text-sm font-bold text-indigo-900 mb-2">✨ AI 设计服装 (Nano Banana)</label>
               <div className="flex gap-2">
                 <input 
                   type="text" 
                   value={clothPrompt}
                   onChange={(e) => setClothPrompt(e.target.value)}
                   placeholder="例如：一件红色的丝绸晚礼服，带有金色刺绣..." 
                   className="flex-1 px-4 py-3 rounded-xl border border-indigo-200 focus:outline-none focus:ring-2 focus:ring-primary/50 bg-white"
                   onKeyDown={(e) => e.key === 'Enter' && handleGenerateCloth()}
                 />
                 <button 
                   onClick={handleGenerateCloth}
                   disabled={isLoading || !clothPrompt.trim()}
                   className="bg-white text-primary font-bold px-6 py-2 rounded-xl border border-indigo-200 hover:bg-indigo-50 transition-colors disabled:opacity-50"
                 >
                   生成
                 </button>
               </div>
            </div>

            <ImageSelector 
              title="第二步：选择服装" 
              presets={clothPresets} 
              selectedImage={clothImage} 
              onSelect={handleSelectCloth}
              isLoading={isLoading}
            />
          </div>
        )}

        {/* Step 3: Loading / Result */}
        {(currentStep === AppStep.GENERATING || currentStep === AppStep.RESULT) && (
          <div className="max-w-4xl mx-auto text-center animate-fade-in-up pt-10">
            {currentStep === AppStep.GENERATING && (
              <div className="space-y-6">
                 <h2 className="text-2xl font-bold text-slate-800">Nano Banana 正在施展魔法...</h2>
                 <p className="text-slate-500">正在生成 4 张独立的高清视角 (前/左/后/右)</p>
                 <div className="flex justify-center gap-2 mt-4">
                   <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                   <div className="w-2 h-2 bg-primary rounded-full animate-bounce delay-100"></div>
                   <div className="w-2 h-2 bg-primary rounded-full animate-bounce delay-200"></div>
                 </div>
              </div>
            )}

            {currentStep === AppStep.RESULT && slicedImages.length > 0 && (
              <div className="flex flex-col items-center gap-8">
                 
                 <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 w-full">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                      <div className="text-left">
                        <h3 className="text-xl font-bold text-slate-800">试穿完成! ✨</h3>
                        <p className="text-sm text-slate-500">已生成 4 张独立的高清图片。</p>
                      </div>
                      <div className="flex gap-4">
                        <button 
                          onClick={handleReset}
                          className="px-6 py-3 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 transition-colors"
                        >
                          再试一次
                        </button>
                      </div>
                    </div>

                    <hr className="my-6 border-slate-100" />
                    
                    {/* Separate Views Grid */}
                    <div>
                       <p className="text-xs font-bold text-slate-400 mb-4 uppercase tracking-wider text-left">独立高清视图 (点击查看大图)</p>
                       <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {slicedImages.map((img, index) => {
                            const labels = ['正面 (Front)', '左侧 (Left)', '背面 (Back)', '右侧 (Right)'];
                            return (
                              <div key={index} className="flex flex-col gap-2 group cursor-pointer" onClick={() => setPreviewImage(img)}>
                                 <div className="relative w-full aspect-[9/16] rounded-xl overflow-hidden bg-white border border-slate-200 shadow-sm transition-all group-hover:shadow-md group-hover:ring-2 group-hover:ring-primary/50">
                                    <img
                                      src={img}
                                      alt={labels[index]}
                                      className="w-full h-full object-contain"
                                    />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                                       <svg className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transform scale-75 group-hover:scale-100 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                                       </svg>
                                    </div>
                                 </div>
                                 <span className="text-center text-sm font-bold text-slate-600 group-hover:text-primary transition-colors">{labels[index]}</span>
                              </div>
                            );
                          })}
                       </div>
                    </div>
                 </div>
              </div>
            )}
          </div>
        )}

        {/* History */}
        <HistoryGallery history={history} />
        
        {/* Fullscreen Preview Modal */}
        {previewImage && (
          <ImageViewer 
            src={previewImage} 
            onClose={() => setPreviewImage(null)} 
          />
        )}

      </div>
      
      {/* Footer */}
      <footer className="w-full text-center py-8 text-slate-400 text-sm border-t border-slate-100 mt-auto bg-gray-50">
        <p>© {new Date().getFullYear()} AI 虚拟试衣间-大师版. Powered by Google Gemini Nano Banana.</p>
      </footer>
    </div>
  );
};

export default App;