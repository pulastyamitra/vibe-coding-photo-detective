import React, { useState, useRef } from 'react';
import { AnalysisState, AnalysisResult } from './types';
import { analyzeImageEdits } from './services/geminiService';
import { getExifDeviceData } from './services/metadataService';
import AnalysisChart from './components/AnalysisChart';
import { LoadingSpinner } from './components/LoadingSpinner';

const App: React.FC = () => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [analysisState, setAnalysisState] = useState<AnalysisState>(AnalysisState.IDLE);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        setImageFile(file);
        const objectUrl = URL.createObjectURL(file);
        setImagePreview(objectUrl);
        
        // Reset state
        setResult(null);
        setAnalysisState(AnalysisState.IDLE);
        setErrorMsg(null);
      } else {
        alert("Please upload a valid image file.");
      }
    }
  };

  const handleAnalyze = async () => {
    if (!imageFile) return;

    setAnalysisState(AnalysisState.ANALYZING);
    setErrorMsg(null);

    try {
      // Run Gemini analysis and Metadata extraction in parallel
      const [aiData, metadataDevice] = await Promise.all([
        analyzeImageEdits(imageFile),
        getExifDeviceData(imageFile)
      ]);

      // Merge findings
      const finalResult: AnalysisResult = {
        ...aiData,
        metadataDevice: metadataDevice
      };

      setResult(finalResult);
      setAnalysisState(AnalysisState.SUCCESS);
    } catch (err: any) {
      console.error(err);
      setAnalysisState(AnalysisState.ERROR);
      setErrorMsg(err.message || "Failed to analyze image. Please try again.");
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-4 md:p-8 font-sans selection:bg-cyan-500/30">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header */}
        <header className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/20 mb-4 p-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-full h-full text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
              {/* Sherlock Hat */}
              <path d="M5 8.5c0-4 2.5-5.5 7-5.5s7 1.5 7 5.5" />
              <path d="M2 8.5h20" />
              <path d="M12 3v-1" />

              {/* Robot Head */}
              <rect x="5" y="8.5" width="14" height="11.5" rx="2" />
              
              {/* Robot Face Details */}
              <circle cx="9" cy="13.5" r="1" fill="currentColor" />
              <circle cx="15" cy="13.5" r="1" fill="currentColor" />
              <path d="M8 17h8" />
              <path d="M10 17v2" />
              <path d="M14 17v2" />

              {/* Magnifying Glass (Overlaying) */}
              <circle cx="14" cy="14" r="5" className="stroke-2" />
              <path d="M17.5 17.5l3.5 3.5" strokeWidth={2.5} />
            </svg>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500">
            Photo Detective
          </h1>
          <p className="text-slate-400 max-w-lg mx-auto">
            Forensic analysis powered by Gemini 3 Pro. Detect and traces image manipulation.
          </p>
        </header>

        {/* Main Content Area */}
        <main className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-3xl p-6 md:p-8 shadow-2xl">
          
          <div className="flex flex-col gap-8">
            
            {/* Top Section: Upload & Preview */}
            <div className="space-y-6 w-full">
              <div 
                className={`relative group border-2 border-dashed rounded-2xl p-4 transition-all duration-300 ease-in-out
                  ${imagePreview ? 'border-slate-600 bg-slate-900/50' : 'border-cyan-500/50 hover:border-cyan-400 hover:bg-slate-800 cursor-pointer'}
                  min-h-[300px] flex flex-col items-center justify-center text-center w-full
                `}
                onClick={!imagePreview ? triggerFileInput : undefined}
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  accept="image/*" 
                  className="hidden" 
                />

                {imagePreview ? (
                  <div className="relative w-full h-full flex items-center justify-center py-4">
                    <img 
                      src={imagePreview} 
                      alt="Preview" 
                      className="max-h-[500px] w-auto rounded-lg shadow-md object-contain"
                    />
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setImageFile(null);
                        setImagePreview(null);
                        setResult(null);
                        setAnalysisState(AnalysisState.IDLE);
                      }}
                      className="absolute top-4 right-4 bg-slate-900/80 hover:bg-red-500/80 text-white p-2 rounded-full backdrop-blur-md transition-colors"
                      title="Remove image"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                     <div className="w-16 h-16 bg-slate-700/50 rounded-full flex items-center justify-center mx-auto group-hover:bg-cyan-500/20 transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-slate-400 group-hover:text-cyan-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-lg font-medium text-slate-200">Drop an image here</p>
                      <p className="text-sm text-slate-400">or click to upload</p>
                    </div>
                  </div>
                )}
              </div>

              {imageFile && analysisState === AnalysisState.IDLE && (
                <button
                  onClick={handleAnalyze}
                  className="w-full py-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold rounded-xl shadow-lg shadow-cyan-900/50 transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
                >
                  Analyze Image
                </button>
              )}
            </div>

            {/* Bottom Section: Results */}
            {/* Only show bottom section if not idle or if we want a placeholder area. 
                User requested moving analysis below. I will hide the placeholder when IDLE to keep it clean. */}
            {analysisState !== AnalysisState.IDLE && (
              <div className="flex flex-col w-full animate-fadeIn">
                
                {analysisState === AnalysisState.ANALYZING && (
                  <div className="flex items-center justify-center border border-slate-700/30 rounded-2xl bg-slate-900/20 py-12">
                    <LoadingSpinner />
                  </div>
                )}

                {analysisState === AnalysisState.ERROR && (
                  <div className="flex flex-col items-center justify-center p-6 border border-red-900/50 bg-red-900/10 rounded-2xl text-red-200">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-2 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-center font-medium">Analysis Failed</p>
                    <p className="text-sm text-red-400 mt-2 text-center">{errorMsg}</p>
                  </div>
                )}

                {analysisState === AnalysisState.SUCCESS && result && (
                  <div className="space-y-6">
                    
                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Visual Estimate */}
                      <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700 flex flex-col justify-center">
                        <span className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Visual Estimate</span>
                        <span className="text-lg font-bold text-white leading-tight truncate" title={result.originalDevice}>{result.originalDevice}</span>
                      </div>

                      {/* Metadata Device */}
                      <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700 flex flex-col justify-center">
                        <span className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
                          Metadata Device
                          {result.metadataDevice && (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          )}
                        </span>
                        {result.metadataDevice ? (
                          <span className="text-lg font-bold text-green-400 leading-tight truncate" title={result.metadataDevice}>{result.metadataDevice}</span>
                        ) : (
                          <span className="text-sm italic text-slate-500">Not found in file</span>
                        )}
                      </div>

                      <div className="col-span-1 md:col-span-2 bg-slate-900/50 rounded-xl p-4 border border-slate-700 flex flex-row items-center justify-between">
                        <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Est. Edit Layers</span>
                        <span className="text-2xl font-bold text-cyan-400">{result.estimatedEditLayerCount}</span>
                      </div>
                    </div>

                    <div className="bg-slate-900 rounded-xl p-6 border border-slate-700 shadow-inner">
                      <h3 className="text-cyan-400 text-sm font-bold uppercase tracking-wider mb-2">Overall Assessment</h3>
                      <p className="text-slate-300 leading-relaxed text-sm">
                        {result.overallAssessment}
                      </p>
                    </div>
                    
                    <div>
                      <h3 className="text-slate-200 font-semibold mb-2 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                        </svg>
                        Tool Probability Score
                      </h3>
                      <div className="bg-slate-900 rounded-xl border border-slate-700 p-2">
                        <AnalysisChart data={result.detectedTools} />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h3 className="text-slate-200 font-semibold mb-2 text-sm">Detailed Breakdown</h3>
                      {result.detectedTools.map((tool, idx) => (
                        <div key={idx} className="flex flex-col sm:flex-row sm:items-start gap-2 text-sm border-b border-slate-700/50 pb-3 last:border-0 last:pb-0">
                            <div className="min-w-[120px] font-medium text-slate-200">{tool.name}</div>
                            <div className="flex-1 text-slate-400">{tool.reasoning}</div>
                        </div>
                      ))}
                    </div>

                  </div>
                )}

              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;