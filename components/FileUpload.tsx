import React, { useState } from 'react';
import Papa from 'papaparse';
import { Upload, FileText, AlertCircle } from 'lucide-react';
import { BaAggregatedData } from '../types';

interface FileUploadProps {
  onDataProcessed: (data: BaAggregatedData[]) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onDataProcessed }) => {
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const processCSV = (file: File) => {
    setError(null);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const rawData = results.data as Record<string, any>[];
          if (rawData.length === 0) {
            throw new Error("CSV file is empty");
          }

          // Heuristic to find columns
          const keys = Object.keys(rawData[0]);
          // Look for "BA" or assume first column is ID
          const baKey = keys.find(k => k.toLowerCase().includes('ba') || k.toLowerCase().includes('customer') || k.toLowerCase().includes('id')) || keys[0];
          // Look for "Amount", "Net", "Value" or assume first numeric-like column that isn't the ID
          const amountKey = keys.find(k => 
            (k.toLowerCase().includes('amount') || k.toLowerCase().includes('net') || k.toLowerCase().includes('value') || k.toLowerCase().includes('dmbtr')) && k !== baKey
          );

          if (!amountKey) {
            throw new Error(`Could not identify an 'Amount' column. Found columns: ${keys.join(', ')}`);
          }

          // Aggregate Data
          const aggregationMap = new Map<string, number[]>();

          rawData.forEach(row => {
            const ba = String(row[baKey] || 'Unknown');
            const amount = parseFloat(String(row[amountKey]).replace(/,/g, '')); // Handle "1,000.00"
            
            if (!isNaN(amount)) {
              if (!aggregationMap.has(ba)) {
                aggregationMap.set(ba, []);
              }
              aggregationMap.get(ba)!.push(amount);
            }
          });

          const processedData: BaAggregatedData[] = Array.from(aggregationMap.entries()).map(([baId, amounts]) => {
            const totalAmount = amounts.reduce((a, b) => a + b, 0);
            const transactionCount = amounts.length;
            const averageAmount = totalAmount / transactionCount;
            
            // Calculate Std Dev
            const squareDiffs = amounts.map(value => Math.pow(value - averageAmount, 2));
            const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / transactionCount;
            const stdDevAmount = Math.sqrt(avgSquareDiff);

            return {
              baId,
              totalAmount,
              transactionCount,
              averageAmount,
              stdDevAmount
            };
          });

          onDataProcessed(processedData);
        } catch (err: any) {
          setError(err.message || "Failed to parse CSV");
        }
      },
      error: (err) => {
        setError(err.message);
      }
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type === 'text/csv') {
      processCSV(file);
    } else {
      setError("Please upload a valid CSV file.");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processCSV(file);
  };

  return (
    <div className="max-w-2xl mx-auto mt-10">
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`
          border-2 border-dashed rounded-xl p-10 text-center transition-all cursor-pointer
          ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400 bg-white'}
        `}
      >
        <input
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          className="hidden"
          id="csv-upload"
        />
        <label htmlFor="csv-upload" className="cursor-pointer flex flex-col items-center justify-center">
          <Upload className={`w-12 h-12 mb-4 ${isDragging ? 'text-blue-500' : 'text-gray-400'}`} />
          <p className="text-xl font-medium text-gray-700">Drop your CSV here</p>
          <p className="text-sm text-gray-500 mt-2">or click to browse (e.g., H_ZCSR181H_Cleaned.csv)</p>
          <div className="mt-4 flex items-center gap-2 text-xs text-gray-400 bg-gray-50 px-3 py-1 rounded-full">
            <FileText className="w-3 h-3" />
            <span>Supports standard CSV format</span>
          </div>
        </label>
      </div>

      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};