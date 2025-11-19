import React, { useState } from 'react';
import { FileUpload } from './components/FileUpload';
import { Dashboard } from './components/Dashboard';
import { BaAggregatedData, AnalysisResult } from './types';
import { analyzeClusters } from './services/geminiService';
import { BrainCircuit, RefreshCcw, CheckCircle2, Loader2 } from 'lucide-react';

function App() {
  const [aggregatedData, setAggregatedData] = useState<BaAggregatedData[] | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState<'upload' | 'processing' | 'analyzing' | 'done'>('upload');

  const handleDataProcessed = (data: BaAggregatedData[]) => {
    setAggregatedData(data);
    setStage('processing');
    
    // Automatically start AI analysis
    startAnalysis(data);
  };

  const startAnalysis = async (data: BaAggregatedData[]) => {
    setLoading(true);
    setStage('analyzing');
    try {
      // Sort by transaction count or total amount to prioritize significant BAs for the AI sample
      const sortedData = [...data].sort((a, b) => b.totalAmount - a.totalAmount);
      const result = await analyzeClusters(sortedData);
      setAnalysisResult(result);
      setStage('done');
    } catch (error) {
      console.error("Analysis failed:", error);
      alert("การวิเคราะห์ล้มเหลว กรุณาตรวจสอบ API Key หรือลองไฟล์ที่ขนาดเล็กลง");
      setStage('processing'); // Go back to allow retry
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setAggregatedData(null);
    setAnalysisResult(null);
    setStage('upload');
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-2 rounded-lg">
              <BrainCircuit className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              BA Cluster Genius
            </h1>
          </div>
          {stage === 'done' && (
             <button 
               onClick={reset}
               className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors"
             >
               <RefreshCcw className="w-4 h-4" />
               เริ่มใหม่
             </button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Stage: Upload */}
        {stage === 'upload' && (
          <div className="animate-fade-in-up">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">วิเคราะห์และจัดกลุ่มลูกค้าด้วย AI</h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                อัปโหลดไฟล์ CSV ธุรกรรมของคุณ ระบบจะทำการรวบรวมข้อมูล วิเคราะห์พฤติกรรมการใช้จ่าย และจัดกลุ่มลูกค้า (BA) ให้โดยอัตโนมัติด้วย Gemini AI
              </p>
            </div>
            <FileUpload onDataProcessed={handleDataProcessed} />
            
            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 text-center text-sm text-gray-500">
              <div className="p-4">
                <strong className="block text-gray-900 text-lg mb-2">1. อัปโหลด</strong>
                ข้อมูลดิบ CSV (รหัส BA, ยอดเงิน)
              </div>
              <div className="p-4">
                <strong className="block text-gray-900 text-lg mb-2">2. AI ประมวลผล</strong>
                Gemini จัดกลุ่มตามพฤติกรรม
              </div>
              <div className="p-4">
                <strong className="block text-gray-900 text-lg mb-2">3. ผลลัพธ์</strong>
                แผนภูมิภาพและข้อมูลเชิงลึก
              </div>
            </div>
          </div>
        )}

        {/* Stage: Analyzing / Loading */}
        {stage === 'analyzing' && (
           <div className="flex flex-col items-center justify-center h-96 animate-pulse">
             <Loader2 className="w-16 h-16 text-blue-600 animate-spin mb-4" />
             <h3 className="text-xl font-semibold text-gray-800">Gemini กำลังวิเคราะห์รูปแบบข้อมูล...</h3>
             <p className="text-gray-500 mt-2">กำลังจัดกลุ่ม BA ตามยอดซื้อและความถี่</p>
           </div>
        )}

        {/* Stage: Done (Dashboard) */}
        {stage === 'done' && aggregatedData && analysisResult && (
          <Dashboard data={aggregatedData} analysis={analysisResult} />
        )}

      </main>
    </div>
  );
}

export default App;