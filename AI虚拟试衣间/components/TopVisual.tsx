import React from 'react';

interface TopVisualProps {
  personImage: string | null;
  clothImage: string | null;
  resultImage: string | null;
  isGenerating: boolean;
}

const TopVisual: React.FC<TopVisualProps> = ({ personImage, clothImage, resultImage, isGenerating }) => {
  return (
    <div className="relative w-full h-[520px] bg-gradient-to-b from-indigo-50/50 to-white overflow-hidden flex items-center justify-center perspective-1000">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5"></div>
      
      {/* Container for the 3 cards to center them */}
      <div className="relative flex items-center justify-center h-full w-full max-w-5xl preserve-3d">
        
        {/* Card 1: Person (Left) */}
        <div className={`
          absolute left-4 md:left-20 lg:left-32
          w-28 h-40 md:w-48 md:h-72 rounded-2xl shadow-xl bg-white border-4 border-white
          transition-all duration-700 ease-out transform origin-center animate-float
          ${personImage ? 'translate-x-0 translate-z-0 rotate-y-12 opacity-100' : '-translate-x-12 rotate-y-6 opacity-40 grayscale'}
          ${(resultImage || isGenerating) ? 'scale-90 blur-[1px] -translate-x-16' : 'scale-100'}
        `} style={{ transform: 'rotateY(15deg) translateZ(-50px)' }}>
          <div className="w-full h-full bg-gray-100 rounded-xl overflow-hidden flex items-center justify-center relative">
            {personImage ? (
              <img src={personImage} alt="Person" className="w-full h-full object-cover" />
            ) : (
              <div className="flex flex-col items-center justify-center text-gray-300">
                <svg className="w-8 h-8 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="text-xs font-bold uppercase tracking-widest">模特</span>
              </div>
            )}
             <div className="absolute inset-0 bg-gradient-to-tr from-black/10 to-transparent pointer-events-none"></div>
          </div>
          {personImage && (
            <div className="absolute -bottom-3 -right-3 bg-primary text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg z-20">
              1. 模特
            </div>
          )}
        </div>

        {/* Card 2: Cloth (Right) */}
        <div className={`
          absolute right-4 md:right-20 lg:right-32
          w-28 h-40 md:w-48 md:h-72 rounded-2xl shadow-xl bg-white border-4 border-white
          transition-all duration-700 ease-out transform origin-center animate-float
          ${clothImage ? 'translate-x-0 translate-z-0 -rotate-y-12 opacity-100' : 'translate-x-12 -rotate-y-6 opacity-40 grayscale'}
          ${(resultImage || isGenerating) ? 'scale-90 blur-[1px] translate-x-16' : 'scale-100'}
        `} style={{ transform: 'rotateY(-15deg) translateZ(-50px)', animationDelay: '2s' }}>
          <div className="w-full h-full bg-gray-100 rounded-xl overflow-hidden flex items-center justify-center relative">
            {clothImage ? (
              <img src={clothImage} alt="Cloth" className="w-full h-full object-cover" />
            ) : (
              <div className="flex flex-col items-center justify-center text-gray-300">
                <svg className="w-8 h-8 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span className="text-xs font-bold uppercase tracking-widest">服饰</span>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-tl from-black/10 to-transparent pointer-events-none"></div>
          </div>
          {clothImage && (
            <div className="absolute -bottom-3 -left-3 bg-secondary text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg z-20">
              2. 服饰
            </div>
          )}
        </div>

        {/* Card 3: Result (Center/Front) */}
        {/* Adjusted to use object-contain for full visibility */}
        <div className={`
          relative z-50 
          w-36 h-80 md:w-48 md:h-[28rem]
          rounded-2xl shadow-2xl bg-white border-[6px] border-white
          transition-all duration-1000 ease-out preserve-3d
          ${(resultImage || isGenerating) ? 'opacity-100 translate-y-0' : 'scale-75 translate-y-24 opacity-0 pointer-events-none'}
        `}>
          <div className="w-full h-full bg-white rounded-xl overflow-hidden flex items-center justify-center relative group">
            {resultImage ? (
               <div className="relative w-full h-full overflow-hidden bg-white">
                 {/* Sprite Animation Container */}
                 <div className="w-full h-full relative overflow-hidden flex items-center justify-center">
                    {/* 
                      Using object-contain and h-full ensures head/feet are never cropped. 
                      width: 400% scales it so that 1/4th (one person) fits the width roughly,
                      but object-contain handles the vertical bounds.
                    */}
                    <div className="h-full w-full relative overflow-hidden">
                       <img 
                        src={resultImage} 
                        alt="Result 3D Sprite" 
                        className="absolute top-0 left-0 max-w-none h-full animate-sprite object-contain"
                        style={{ width: '400%' }}
                      />
                    </div>
                 </div>
                 
                 <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-6 flex flex-col items-center justify-end h-1/3 pointer-events-none">
                  <span className="text-white font-bold text-lg tracking-widest uppercase drop-shadow-md">3D 环视</span>
                  <span className="text-white/80 text-[10px] uppercase tracking-wider mt-1">AI Generated Rotation</span>
                </div>
               </div>
            ) : isGenerating ? (
              <div className="flex flex-col items-center justify-center w-full h-full space-y-4">
                 <div className="relative w-20 h-20">
                    <div className="absolute inset-0 border-4 border-indigo-100 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-primary rounded-full border-t-transparent animate-spin"></div>
                    <div className="absolute inset-4 bg-white rounded-full flex items-center justify-center shadow-inner">
                       <span className="text-xl animate-pulse">✨</span>
                    </div>
                 </div>
                 <div className="text-center">
                   <p className="text-sm font-bold text-indigo-900">正在生成...</p>
                   <p className="text-xs text-indigo-400 mt-1">Nano Banana AI</p>
                 </div>
              </div>
            ) : (
              <div className="text-center p-4">
                <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-2 animate-pulse"></div>
              </div>
            )}
          </div>
          
          {resultImage && (
            <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-pink-500 to-violet-500 text-white text-sm font-bold px-4 py-1.5 rounded-full shadow-xl animate-bounce z-50 whitespace-nowrap">
              ✨ 3D 全身效果
            </div>
          )}
          
          {/* Reflection/Shadow for 3D feel */}
          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-[80%] h-5 bg-black/20 blur-xl rounded-[100%] transition-all duration-1000 group-hover:w-[90%]"></div>
        </div>

      </div>
    </div>
  );
};

export default TopVisual;