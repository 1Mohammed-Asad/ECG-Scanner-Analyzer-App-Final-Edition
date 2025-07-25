



import React, { useEffect, useRef } from 'react';
import { TransformWrapper, TransformComponent, useControls } from 'react-zoom-pan-pinch';
import { Annotation } from '../types';
import { MaximizeIcon } from './icons/MaximizeIcon';
import { ChevronLeftIcon } from './icons/ChevronLeftIcon';
import { ChevronRightIcon } from './icons/ChevronRightIcon';

interface InteractiveEcgViewerProps {
    imageUrl: string;
    annotations: Annotation[];
    activeAnnotationIndex: number | null;
    hoveredAnnotationIndex: number | null;
    onAnnotationSelect: (index: number | null) => void;
}

const pulseKeyframes = `
@keyframes pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(250, 204, 21, 0.7); }
  50% { box-shadow: 0 0 0 8px rgba(250, 204, 21, 0); }
}`;

const Controls: React.FC<{
    activeAnnotationIndex: number | null;
    annotations: Annotation[];
    onAnnotationSelect: (index: number | null) => void;
}> = ({ activeAnnotationIndex, annotations, onAnnotationSelect }) => {
    const { zoomToElement, resetTransform } = useControls();
    const prevActiveIndexRef = useRef<number | null>(null);
    
    useEffect(() => {
        if (activeAnnotationIndex === prevActiveIndexRef.current) return;

        if (activeAnnotationIndex !== null && annotations[activeAnnotationIndex]) {
            const elementId = `annotation-marker-${activeAnnotationIndex}`;
            zoomToElement(elementId, 3, 400); // Zoom to 3x scale over 400ms
        } else {
            resetTransform(400);
        }
        prevActiveIndexRef.current = activeAnnotationIndex;
    }, [activeAnnotationIndex, annotations, zoomToElement, resetTransform]);

    const handlePrev = () => {
        if (!annotations || annotations.length === 0) return;
        const newIndex = activeAnnotationIndex === null || activeAnnotationIndex === 0
          ? annotations.length - 1
          : activeAnnotationIndex - 1;
        onAnnotationSelect(newIndex);
      };
      const handleNext = () => {
        if (!annotations || annotations.length === 0) return;
        const newIndex = activeAnnotationIndex === null || activeAnnotationIndex === annotations.length - 1
          ? 0
          : activeAnnotationIndex + 1;
        onAnnotationSelect(newIndex);
      };
    
    return (
        <div className="flex items-center gap-1">
            <button
                onClick={handlePrev}
                title="Previous Finding"
                disabled={!annotations || annotations.length === 0}
                className="p-2 bg-slate-700 hover:bg-cyan-600 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <ChevronLeftIcon className="w-4 h-4" />
            </button>
            <button
                onClick={handleNext}
                title="Next Finding"
                disabled={!annotations || annotations.length === 0}
                className="p-2 bg-slate-700 hover:bg-cyan-600 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <ChevronRightIcon className="w-4 h-4" />
            </button>
            <button
                onClick={() => onAnnotationSelect(null)}
                title="Reset View"
                className="flex items-center gap-2 text-xs p-2 bg-slate-700 hover:bg-slate-600 text-white rounded-md transition-colors"
            >
                <MaximizeIcon className="w-4 h-4" />
            </button>
        </div>
    );
};

const AnnotationLabel: React.FC<{ annotation: Annotation, isTopHalf: boolean, isActive: boolean }> = ({ annotation, isTopHalf, isActive }) => {
    const labelPositionClasses = isTopHalf ? 'top-full mt-1.5' : 'bottom-full mb-1.5';
    let labelColorClasses = '';

    if (isActive) {
        labelColorClasses = 'bg-yellow-400 text-slate-900';
    } else if (annotation.category === 'artifact') {
        labelColorClasses = 'bg-orange-500/90 text-white';
    } else {
        labelColorClasses = 'bg-cyan-500/90 text-white';
    }

    return (
        <div className={`absolute left-1/2 -translate-x-1/2 transition-opacity duration-300 opacity-0 group-hover:opacity-100 ${isActive ? '!opacity-100' : ''} ${labelPositionClasses}`}>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-md whitespace-nowrap shadow-lg ${labelColorClasses}`}>
                {annotation.label}
            </span>
        </div>
    );
};

const PointMarker: React.FC<{ annotation: Annotation, isActive: boolean }> = ({ annotation, isActive }) => {
    const { x_min, y_min, x_max, y_max } = annotation.boundingBox;
    const centerX = (x_min + x_max) / 2 * 100;
    const centerY = (y_min + y_max) / 2 * 100;

    let color = annotation.category === 'artifact' ? 'stroke-orange-400' : 'stroke-cyan-400';
    if (isActive) color = 'stroke-yellow-400';

    return (
        <div 
            className="absolute z-30" 
            style={{ 
                left: `${centerX}%`, 
                top: `${centerY}%`, 
                width: '20px', 
                height: '20px',
                transform: 'translate(-50%, -50%)',
                animation: isActive ? 'pulse 2s infinite' : 'none',
                borderRadius: '50%',
            }}
        >
            <svg viewBox="0 0 20 20" className="overflow-visible">
                <line x1="10" y1="0" x2="10" y2="20" className={`${color} transition-all`} strokeWidth="1" />
                <line x1="0" y1="10" x2="20" y2="10" className={`${color} transition-all`} strokeWidth="1" />
            </svg>
            <AnnotationLabel annotation={annotation} isTopHalf={y_min < 0.5} isActive={isActive} />
        </div>
    );
};

const SegmentMarker: React.FC<{ annotation: Annotation, isActive: boolean }> = ({ annotation, isActive }) => {
    let color = annotation.category === 'artifact' ? 'bg-orange-500/80 group-hover:bg-orange-400' : 'bg-cyan-500/80 group-hover:bg-cyan-300';
    if (isActive) color = 'bg-yellow-400';

    return (
        <div 
            className="absolute flex flex-col justify-center items-center z-20 pointer-events-none"
            style={{ animation: isActive ? 'pulse 2s infinite' : 'none', borderRadius: '50%' }}
        >
            <div className={`w-full h-px ${color} transition-colors duration-200 relative`}>
                {/* Left Bracket */}
                <div className={`absolute left-0 top-1/2 -translate-y-1/2 h-2 w-px ${color} transition-colors duration-200`} />
                {/* Right Bracket */}
                <div className={`absolute right-0 top-1/2 -translate-y-1/2 h-2 w-px ${color} transition-colors duration-200`} />
            </div>
            <AnnotationLabel annotation={annotation} isTopHalf={annotation.boundingBox.y_min < 0.5} isActive={isActive} />
        </div>
    );
};

const AreaMarker: React.FC<{ annotation: Annotation, isActive: boolean }> = ({ annotation, isActive }) => {
    let borderClasses = '';
    if (isActive) {
        borderClasses = 'border-yellow-400 border-4';
    } else if (annotation.category === 'artifact') {
        borderClasses = 'border-orange-500/80 border-2 border-dashed group-hover:border-orange-400';
    } else {
        borderClasses = 'border-cyan-500/80 border-2 group-hover:border-cyan-300';
    }
    
    return (
        <div
            className={`absolute rounded-sm z-20 pointer-events-none ${borderClasses}`}
            style={{ animation: isActive ? 'pulse 2s infinite' : 'none' }}
        >
             <AnnotationLabel annotation={annotation} isTopHalf={annotation.boundingBox.y_min < 0.5} isActive={isActive} />
        </div>
    );
};

const InteractiveEcgViewer: React.FC<InteractiveEcgViewerProps> = ({ imageUrl, annotations, activeAnnotationIndex, hoveredAnnotationIndex, onAnnotationSelect }) => {
    return (
        <div className="bg-slate-800 p-4 rounded-xl shadow-lg border border-slate-700 animate-fade-in w-full">
            <style>{pulseKeyframes}</style>
            
             <TransformWrapper
                initialScale={1}
                minScale={0.5}
                maxScale={10}
                limitToBounds={true}
                doubleClick={{ disabled: true }}
             >
                <React.Fragment>
                    <div className="flex justify-between items-center mb-3">
                        <h3 className="text-lg font-semibold text-cyan-400">Interactive ECG</h3>
                        <Controls activeAnnotationIndex={activeAnnotationIndex} annotations={annotations} onAnnotationSelect={onAnnotationSelect} />
                    </div>
                    
                    <div className="w-full h-auto overflow-hidden bg-black rounded-md aspect-video">
                        <TransformComponent wrapperStyle={{ width: '100%', height: '100%' }} contentStyle={{ width: '100%', height: '100%' }}>
                            <div className="relative w-full h-full">
                                <img src={imageUrl} alt="Scanned ECG" className="block w-full h-auto object-contain" />
                                
                                {Array.isArray(annotations) && annotations.map((annotation, index) => {
                                    if (!annotation?.boundingBox) return null;
                                    const { x_min, y_min, x_max, y_max } = annotation.boundingBox;
                                    if ([x_min, y_min, x_max, y_max].some(c => typeof c !== 'number')) return null;

                                    const style = {
                                        left: `${x_min * 100}%`,
                                        top: `${y_min * 100}%`,
                                        width: `${(x_max - x_min) * 100}%`,
                                        height: `${(y_max - y_min) * 100}%`,
                                    };
                                    
                                    const isActive = index === activeAnnotationIndex;
                                    const isHovered = index === hoveredAnnotationIndex;

                                    let MarkerComponent;
                                    switch (annotation.annotationType) {
                                        case 'point':
                                            MarkerComponent = PointMarker;
                                            break;
                                        case 'segment':
                                            MarkerComponent = SegmentMarker;
                                            break;
                                        case 'area':
                                        default:
                                            MarkerComponent = AreaMarker;
                                            break;
                                    }

                                    return (
                                        <div
                                            id={`annotation-marker-${index}`}
                                            key={index}
                                            className="absolute group"
                                            style={style}
                                            onClick={(e) => { e.stopPropagation(); onAnnotationSelect(isActive ? null : index); }}
                                        >
                                            <MarkerComponent annotation={annotation} isActive={isActive || isHovered} />
                                        </div>
                                    );
                                })}
                            </div>
                        </TransformComponent>
                    </div>
                </React.Fragment>
             </TransformWrapper>
        </div>
    );
};

export default InteractiveEcgViewer;