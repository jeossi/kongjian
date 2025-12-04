import React from 'react';
import { GenerationHistory } from '../types';

interface HistoryGalleryProps {
  history: GenerationHistory[];
}

const HistoryGallery: React.FC<HistoryGalleryProps> = ({ history }) => {
  if (history.length === 0) return null;

  return (
    <div className="w-full max-w-6xl mx-auto mt-12 p-6">
      <h3 className="text-lg font-bold text-slate-400 mb-4 uppercase tracking-wider text-xs">历史记录 Gallery</h3>
      <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar snap-x">
        {history.map((item) => (
          <div key={item.id} className="snap-start shrink-0 w-48 bg-white rounded-xl p-2 shadow-sm border border-slate-100">
            <div className="aspect-[3/4] rounded-lg overflow-hidden bg-gray-100 mb-2">
              <img src={item.resultImage} alt="Result" className="w-full h-full object-cover" />
            </div>
            <div className="flex gap-1">
              <div className="w-1/2 aspect-square rounded-md overflow-hidden bg-gray-50">
                 <img src={item.personImage} alt="Src" className="w-full h-full object-cover opacity-70" />
              </div>
              <div className="w-1/2 aspect-square rounded-md overflow-hidden bg-gray-50">
                 <img src={item.clothImage} alt="Src" className="w-full h-full object-cover opacity-70" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HistoryGallery;
