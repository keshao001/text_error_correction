import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from '@/lib/utils';
import { useRouter } from 'next/navigation';

interface ReferenceDocument {
  id: string;
  title: string;
  content: string;
  type: string;
  tags: string[];
  userId: string;
  createdAt: string;
  updatedAt: string;
  selected?: boolean;
}

interface ReferenceDocsListProps {
  onDocumentSelect: (selectedDocs: string[]) => void;
}

export function ReferenceDocsList({ onDocumentSelect }: ReferenceDocsListProps) {
  const router = useRouter();
  const [documents, setDocuments] = useState<ReferenceDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchReferenceDocuments();
  }, []);

  const fetchReferenceDocuments = async () => {
    try {
      const response = await fetch('/api/knowledges');
      if (!response.ok) {
        throw new Error('获取参考文档列表失败');
      }
      const { documents: docs } = await response.json();
      setDocuments(docs.map((doc: ReferenceDocument) => ({ ...doc, selected: false })));
      setIsLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : '发生错误');
      setIsLoading(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('请选择要上传的文件');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/knowledges/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('上传参考文档失败');
      }

      await fetchReferenceDocuments();
      setFile(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : '上传失败');
    } finally {
      setIsUploading(false);
    }
  };

  const toggleDocumentSelection = (docId: string) => {
    const updatedDocs = documents.map(doc => 
      doc.id === docId ? { ...doc, selected: !doc.selected } : doc
    );
    setDocuments(updatedDocs);
    
    const selectedDocIds = updatedDocs
      .filter(doc => doc.selected)
      .map(doc => doc.id);
    
    onDocumentSelect(selectedDocIds);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-end gap-4">
        <div className="flex-1">
          <Input
            type="file"
            onChange={handleFileChange}
            accept=".txt,.pdf"
            className="max-w-sm"
          />
        </div>
        <Button 
          onClick={handleUpload}
          disabled={!file || isUploading}
        >
          {isUploading ? '上传中...' : '上传参考文档'}
        </Button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">选择</TableHead>
              <TableHead>文档名称</TableHead>
              <TableHead>标签</TableHead>
              <TableHead>上传时间</TableHead>
              <TableHead className="w-24">预览</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {documents.map((doc) => (
              <TableRow key={doc.id}>
                <TableCell>
                  <input
                    type="checkbox"
                    checked={doc.selected}
                    onChange={() => toggleDocumentSelection(doc.id)}
                    className="w-4 h-4"
                  />
                </TableCell>
                <TableCell>{doc.title}</TableCell>
                <TableCell>{doc.tags.join(', ')}</TableCell>
                <TableCell>{formatDate(doc.createdAt)}</TableCell>
                <TableCell>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => window.open(`/knowledges/${doc.id}`, '_blank')}
                  >
                    预览
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
