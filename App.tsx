import React, { useState, useCallback, ChangeEvent, ReactNode } from 'react';
import { classifyWasteImage } from './services/geminiService';
import { WasteCategory } from './types';

const imageToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(',')[1]); // Get only base64 part
    reader.onerror = (error) => reject(error);
  });
};

const LoadingSpinner: React.FC = () => (
  <div className="flex items-center justify-center space-x-2">
    <div className="w-6 h-6 border-4 border-blue-500 border-solid rounded-full border-t-transparent animate-spin"></div>
    <span className="text-gray-700">Classifying...</span>
  </div>
);

interface ResultCardProps {
  category: WasteCategory;
}

const ResultCard: React.FC<ResultCardProps> = ({ category }) => {
  let bgColor = 'bg-gray-200';
  let textColor = 'text-gray-800';
  let iconClass = 'fa-question-circle'; // Default for Unknown

  switch (category) {
    case WasteCategory.PLASTIC:
      bgColor = 'bg-sky-100';
      textColor = 'text-sky-700';
      iconClass = 'fa-prescription-bottle'; // Represents plastic bottles/containers
      break;
    case WasteCategory.PAPER:
      bgColor = 'bg-stone-100';
      textColor = 'text-stone-700';
      iconClass = 'fa-newspaper'; // Represents paper
      break;
    case WasteCategory.CARDBOARD:
      bgColor = 'bg-amber-100';
      textColor = 'text-amber-700';
      iconClass = 'fa-box-open'; // Represents cardboard boxes
      break;
    case WasteCategory.GLASS:
      bgColor = 'bg-cyan-100';
      textColor = 'text-cyan-700';
      iconClass = 'fa-wine-glass'; // Represents glass items
      break;
    case WasteCategory.METAL:
      bgColor = 'bg-slate-200';
      textColor = 'text-slate-700';
      iconClass = 'fa-tools'; // Represents metal items (could also use fa-cogs or similar)
      break;
    case WasteCategory.UNKNOWN:
      bgColor = 'bg-red-100';
      textColor = 'text-red-700';
      iconClass = 'fa-question-circle';
      break;
  }

  return (
    <div className={`p-6 rounded-lg shadow-md ${bgColor} ${textColor} flex flex-col items-center space-y-3`}>
      <i className={`fas ${iconClass} fa-3x`}></i>
      <h3 className="text-2xl font-semibold">{category}</h3>
      {category === WasteCategory.UNKNOWN && <p className="text-sm">Could not confidently classify the item.</p>}
    </div>
  );
};


const App: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imageBase64Preview, setImageBase64Preview] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string | null>(null);
  const [classificationResult, setClassificationResult] = useState<WasteCategory | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setClassificationResult(null);
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Please upload a valid image file (PNG, JPG, GIF, WEBP, etc.).');
        setSelectedFile(null);
        setImageBase64Preview(null);
        setMimeType(null);
        return;
      }
      setSelectedFile(file);
      setMimeType(file.type);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageBase64Preview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setSelectedFile(null);
      setImageBase64Preview(null);
      setMimeType(null);
    }
  };

  const handleClassify = useCallback(async () => {
    if (!selectedFile || !mimeType) {
      setError("Please select an image file first.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setClassificationResult(null);

    try {
      const base64Data = await imageToBase64(selectedFile);
      const result = await classifyWasteImage(base64Data, mimeType);
      
      if (result.error) {
        setError(result.error);
        setClassificationResult(WasteCategory.UNKNOWN); 
      } else {
        setClassificationResult(result.category);
      }
    } catch (err) {
      console.error("Classification process error:", err);
      setError("An unexpected error occurred during classification.");
      setClassificationResult(WasteCategory.UNKNOWN);
    } finally {
      setIsLoading(false);
    }
  }, [selectedFile, mimeType]);
  
  const handleRemoveImage = () => {
    setSelectedFile(null);
    setImageBase64Preview(null);
    setMimeType(null);
    setClassificationResult(null);
    setError(null);
    const fileInput = document.getElementById('file-upload') as HTMLInputElement;
    if (fileInput) {
        fileInput.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-400 via-teal-500 to-blue-600 py-8 px-4 flex flex-col items-center">
      <header className="mb-10 text-center">
        <h1 className="text-5xl font-bold text-white shadow-sm">
          <i className="fas fa-recycle mr-3"></i>AI Waste Sorter
        </h1>
        <p className="text-xl text-green-100 mt-2">Upload an image to classify waste into Plastic, Paper, Cardboard, Glass, or Metal!</p>
      </header>

      <main className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-2xl">
        <div className="space-y-6">
          <div>
            <label htmlFor="file-upload" className="block text-lg font-medium text-gray-700 mb-2">
              Upload Waste Image
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-green-500 transition-colors">
              <div className="space-y-1 text-center">
                <i className="fas fa-cloud-upload-alt text-5xl text-gray-400"></i>
                <div className="flex text-sm text-gray-600">
                  <label
                    htmlFor="file-upload"
                    className="relative cursor-pointer bg-white rounded-md font-medium text-green-600 hover:text-green-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-green-500"
                  >
                    <span>Upload a file</span>
                    <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} accept="image/*" />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-gray-500">PNG, JPG, GIF, WEBP up to 10MB</p>
              </div>
            </div>
          </div>

          {imageBase64Preview && (
            <div className="mt-6 p-4 border border-gray-200 rounded-lg shadow-sm bg-gray-50 relative">
              <h3 className="text-lg font-medium text-gray-800 mb-2">Image Preview:</h3>
              <img src={imageBase64Preview} alt="Selected waste item" className="max-w-full h-auto max-h-96 mx-auto rounded-md shadow-md" />
              <button
                  onClick={handleRemoveImage}
                  className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full hover:bg-red-600 transition-colors text-xs"
                  aria-label="Remove image"
              >
                  <i className="fas fa-times"></i>
              </button>
            </div>
          )}

          {selectedFile && !isLoading && (
            <button
              onClick={handleClassify}
              disabled={isLoading || !selectedFile}
              className="w-full flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-gray-400 transition-transform transform hover:scale-105 active:scale-95"
            >
              <i className="fas fa-search mr-2"></i> Classify Waste
            </button>
          )}

          {isLoading && (
            <div className="mt-6 flex justify-center">
              <LoadingSpinner />
            </div>
          )}

          {error && (
            <div className="mt-6 p-4 bg-red-100 text-red-700 rounded-md shadow flex items-center">
              <i className="fas fa-exclamation-triangle mr-3 text-red-500"></i>
              <p>{error}</p>
            </div>
          )}

          {classificationResult && !isLoading && !error && (
            <div className="mt-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4 text-center">Classification Result:</h2>
              <ResultCard category={classificationResult} />
            </div>
          )}
           {!process.env.API_KEY && (
             <div className="mt-6 p-4 bg-yellow-100 text-yellow-700 rounded-md shadow flex items-center">
               <i className="fas fa-exclamation-triangle mr-3 text-yellow-500"></i>
               <p><strong>Warning:</strong> The API_KEY environment variable is not set. Classification may not work.</p>
             </div>
           )}
        </div>
      </main>
      <footer className="mt-12 text-center text-green-100">
        <p>&copy; {new Date().getFullYear()} AI Waste Sorter. Powered by Gemini.</p>
      </footer>
    </div>
  );
};

export default App;