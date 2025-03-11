'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button"
import { Input } from '@/components/ui/input';
import { useToast } from "@/components/ui/use-toast"
import * as mammoth from 'mammoth';
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';
import { MAX_LINES_PER_PAGE, PAGINATION } from '@/app/constants';

interface UploadDocumentProps {
  onUploadComplete?: (fileInfo: FileInfo) => void;
  onCancel?: () => void;
}


interface FileInfo {
  id?: string;
  name: string;
  type: string;
  displayType: string;
  title: string;
  parsedContent: string;
  originalContent?: string;
  status?: string;
  fileSize: number;
  totalPages: number;
  fileHash?: string;
}

// Initialize PDF.js worker
if (typeof window !== 'undefined') {
  GlobalWorkerOptions.workerSrc = '/pdfjs-dist/build/pdf.worker.min.mjs';
}

const PreviewPagination = ({ currentPage, totalPages, onPageChange }: { 
  currentPage: number; 
  totalPages: number; 
  onPageChange: (page: number) => void 
}) => {
  const range = Math.min(PAGINATION.RANGE, totalPages);
  const start = Math.max(1, currentPage - Math.floor(range / 2));
  const end = Math.min(totalPages, start + range - 1);

  return (
    <div className="flex items-center justify-center gap-2 py-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(1)}
        disabled={currentPage === 1}
      >
        First
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        &lt; Prev
      </Button>
      
      {Array.from({ length: end - start + 1 }, (_, i) => start + i).map((page) => (
        <Button
          key={page}
          variant={currentPage === page ? "default" : "outline"}
          size="sm"
          onClick={() => onPageChange(page)}
        >
          {page}
        </Button>
      ))}
      
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        Next &gt;
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(totalPages)}
        disabled={currentPage === totalPages}
      >
        Last
      </Button>
    </div>
  );
};

export function UploadDocument({ onUploadComplete, onCancel }: UploadDocumentProps) {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filePreviewContent, setFilePreviewContent] = useState<string>('');
  const [isPreviewVisible, setIsPreviewVisible] = useState(false);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [fileInfo, setFileInfo] = useState<{
    name: string;
    type: string;
    displayType: string;
    title: string;
    parsedContent: string;
    fileType: string;
    fileSize: number;
    totalPages: number;
  } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pdfPageMap, setPdfPageMap] = useState<{ [key: number]: number }>({});
  const [totalPdfPages, setTotalPdfPages] = useState<number>(0);
  const [isPdfFile, setIsPdfFile] = useState<boolean>(false);
  const [parsedContent, setParsedContent] = useState<string>('');

  // Function to determine file type display name
  const getFileDisplayType = (file: File): string => {
    const extension = file.name.split('.').pop()?.toLowerCase() || '';
    const mimeType = file.type.toLowerCase();

    if (mimeType === 'application/pdf' || extension === 'pdf') {
      return 'PDF';
    } else if (
      mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      mimeType === 'application/msword' ||
      extension === 'doc' ||
      extension === 'docx'
    ) {
      return 'Word';
    } else if (
      extension === 'md' ||
      extension === 'markdown' ||
      mimeType === 'text/markdown'
    ) {
      return 'Markdown';
    } else if (
      extension === 'txt' ||
      mimeType === 'text/plain'
    ) {
      return '文本';
    }
    return '未知类型';
  };

  // Function to read text file
  const readTextFile = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        resolve(e.target?.result as string || '');
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read text file'));
      };
      
      reader.readAsText(file, 'UTF-8');
    });
  };

  const handleFilePreview = async (selectedFile: File) => {
    try {
      setFilePreviewContent('');
      setIsPreviewVisible(false);
      setIsPreviewLoading(true);
      setError(null);

      const fileType = selectedFile.type.toLowerCase();
      const extension = selectedFile.name.split('.').pop()?.toLowerCase() || '';
      let extractedText = '';
      let pageCount = 0;

      if (fileType === 'application/pdf' || extension === 'pdf') {
        setIsPdfFile(true);
        const arrayBuffer = await selectedFile.arrayBuffer();
        
        const loadingTask = getDocument({
          data: arrayBuffer,
          cMapUrl: '/pdfjs-dist/cmaps/',
          cMapPacked: true,
        });
        
        const pdf = await loadingTask.promise;
        pageCount = pdf.numPages;
        setTotalPdfPages(pageCount);
        
        const pageMap: { [key: number]: number } = {};
        let lineCounter = 0;
        let allText = '';
        
        for (let i = 1; i <= pdf.numPages; i++) {
          pageMap[i] = lineCounter;
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items
            .map((item: any) => item.str)
            .join('')
            .split(/(?<=[。！？\n])/g)
            .filter(sentence => sentence.trim());
          
          if (pageText.length > 0) {
            allText += `=== Page ${i} ===\n`;
            lineCounter++;
            
            pageText.forEach(sentence => {
              allText += sentence.trim() + '\n';
              lineCounter++;
            });
            
            allText += '\n';
            lineCounter++;
          }
          
          pageMap[i + 1] = lineCounter;
        }

        extractedText = allText.trim();
        setPdfPageMap(pageMap);
      } else {
        setIsPdfFile(false);
        setTotalPdfPages(0);

        if (
          fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
          fileType === 'application/msword' ||
          extension === 'doc' ||
          extension === 'docx'
        ) {
          const arrayBuffer = await selectedFile.arrayBuffer();
          const result = await mammoth.extractRawText({ arrayBuffer });
          extractedText = result.value;
        } else {
          extractedText = await readTextFile(selectedFile);
        }

        // Split content into pages based on MAX_LINES_PER_PAGE
        const lines = extractedText.split('\n').filter(line => line.trim());
        pageCount = Math.ceil(lines.length / MAX_LINES_PER_PAGE);
      }

      if (!extractedText.trim()) {
        throw new Error('File content is empty');
      }

      setParsedContent(extractedText);
      setFilePreviewContent(extractedText);
      setCurrentPage(1);
      setIsPreviewVisible(true);

      // Update fileInfo with the correct page count
      setFileInfo(prev => {
        if (!prev) return null;
        return {
          ...prev,
          totalPages: pageCount,
          parsedContent: extractedText
        };
      });

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to preview file');
      toast({
        variant: "destructive",
        title: "Error",
        description: err instanceof Error ? err.message : 'Failed to preview file',
      });
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setFileInfo({
      name: selectedFile.name,
      type: selectedFile.type,
      displayType: getFileDisplayType(selectedFile),
      title: selectedFile.name,
      parsedContent: '',
      fileType: getFileDisplayType(selectedFile),
      fileSize: selectedFile.size,
      totalPages: 0
    });

    await handleFilePreview(selectedFile);
  };

  const handleUpload = async () => {
    if (!file || !fileInfo) return;

    try {
      setIsUploading(true);
      setError(null);

      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to upload file');
      }

      const data = await response.json();
      
      toast({
        title: "Success",
        description: "File uploaded successfully",
      });

      console.log('fileInfo', fileInfo);

      if (onUploadComplete) {
        onUploadComplete({
          ...data,
          title: fileInfo.title,
          content: fileInfo.parsedContent,
          fileType: fileInfo.displayType,
          fileSize: fileInfo.fileSize,
          totalPages: fileInfo.totalPages,
          parsedContent: fileInfo.parsedContent
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload file');
      toast({
        variant: "destructive",
        title: "Error",
        description: err instanceof Error ? err.message : 'Failed to upload file',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const contentLines = filePreviewContent?.split('\n').filter(line => line.trim() !== '') || [];
  const totalPages = isPdfFile ? totalPdfPages : Math.ceil(contentLines.length / MAX_LINES_PER_PAGE);
  
  const getCurrentPageContent = () => {
    if (isPdfFile) {
      const pageStart = pdfPageMap[currentPage] || 0;
      const pageEnd = pdfPageMap[currentPage + 1] || contentLines.length;
      return contentLines.slice(pageStart, pageEnd).join('\n');
    } else {
      const startIdx = (currentPage - 1) * MAX_LINES_PER_PAGE;
      const endIdx = startIdx + MAX_LINES_PER_PAGE;
      const pageLines = contentLines.slice(startIdx, endIdx);
      return `=== Page ${currentPage} ===\n${pageLines.join('\n')}`;
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-800 mb-2">Supported File Types:</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li className="flex items-center">
            <span className="w-24">Documents:</span>
            <span>PDF, Word (DOC/DOCX)</span>
          </li>
          <li className="flex items-center">
            <span className="w-24">Text Files:</span>
            <span>TXT, Markdown (MD)</span>
          </li>
        </ul>
        <p className="text-xs text-blue-600 mt-2">
          Note: Maximum file size is 10MB
        </p>
      </div>

      <div className="flex items-center space-x-4">
        <Input
          type="file"
          accept=".pdf,.doc,.docx,.txt,.md,.markdown"
          onChange={handleFileChange}
          disabled={isUploading}
        />
        <Button
          onClick={handleUpload}
          disabled={!file || isUploading}
        >
          {isUploading ? 'Uploading...' : 'Upload'}
        </Button>
        {onCancel && (
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>

      {fileInfo && (
        <div className="space-y-2">
          <div className="text-sm">
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-gray-500">File Name</span>
              <span className="text-gray-900 font-medium">{fileInfo.name}</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-gray-500">File Type</span>
              <span className="text-gray-900 font-medium">{fileInfo.displayType}</span>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="text-red-500">{error}</div>
      )}

      {isPreviewLoading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="text-lg font-medium">Processing file content...</p>
          </div>
        </div>
      )}

      {isPreviewVisible && filePreviewContent && (
        <div className="mt-4">
          <div className="border rounded p-4 bg-white">
            <h3 className="font-semibold mb-2">Preview</h3>
            <div className="h-[600px] overflow-y-auto">
              <div className="whitespace-pre-wrap text-sm text-gray-700 leading-relaxed">
                {getCurrentPageContent()}
              </div>
            </div>
          </div>
          {totalPages > 1 && (
            <PreviewPagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          )}
        </div>
      )}
    </div>
  );
}
