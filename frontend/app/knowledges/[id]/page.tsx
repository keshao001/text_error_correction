'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../../context/auth-context';
import { AuthLoading } from '@/components/auth/auth-loading';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import { X, Download, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface Knowledge {
  id: string;
  name: string;
  desc: string;
  createdAt: string;
  updatedAt: string;
}

interface File {
  id: string;
  name: string;
  fileType: string;
  fileSize: number;
  createdAt: string;
  filePath?: string;
}

function formatFileSize(size: number) {
  if (size < 1024) {
    return `${size} bytes`;
  } else if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(2)} KB`;
  } else {
    return `${(size / (1024 * 1024)).toFixed(2)} MB`;
  }
}

async function handleDeleteFile(id: string, params: { id: string }, setFileList: (files: File[]) => void) {
  try {
    const response = await fetch(`/api/knowledge-files/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Failed to delete file');
    }

    // Refresh the file list
    const updatedResponse = await fetch(`/api/knowledge-files?knowledgeId=${params.id}`);
    if (!updatedResponse.ok) {
      throw new Error('Failed to refresh file list');
    }
    const updatedData = await updatedResponse.json();
    setFileList(updatedData);
  } catch (error) {
    console.error('Error deleting file:', error);
  }
}

async function handleDownloadFile(file: File) {
  try {
    const response = await fetch(`/api/knowledge-files/${file.id}/download`);
    if (!response.ok) {
      throw new Error('Failed to download file');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } catch (error) {
    console.error('Error downloading file:', error);
    toast.error('Failed to download file');
  }
}

export default function KnowledgeDetail({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [knowledge, setKnowledge] = useState<Knowledge | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newTag, setNewTag] = useState('');
  const [isEditingTags, setIsEditingTags] = useState(false);
  const [editedTags, setEditedTags] = useState<string[]>([]);

  const [fileList, setFileList] = useState<File[]>([]);
  const [isFecthingFiles, setIsFetchingFiles] = useState(false);

  useEffect(() => {
    const fetchKnowledge = async () => {
      try {
        const response = await fetch(`/api/knowledges/${params.id}`);
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('知识库条目未找到');
          }
          throw new Error('获取知识库条目失败');
        }
        const data = await response.json();
        setKnowledge(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : '发生错误');
      } finally {
        setIsLoading(false);
      }
    };

    const fetchFiles = async () => {
      setIsFetchingFiles(true);
      try {
        const response = await fetch(`/api/knowledge-files?knowledgeId=${params.id}`);
        if (!response.ok) {
          throw new Error('获取知识库文件失败');
        }
        const data = await response.json();
        setFileList(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : '发生错误');
      } finally {
        setIsFetchingFiles(false);
      }
    };

    if (!authLoading) {
      fetchKnowledge();
      fetchFiles();
    }
  }, [authLoading, params.id]);

  if (authLoading) {
    return <AuthLoading />;
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={() => router.push('/knowledges')}>
            返回知识库
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading || !knowledge) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <Link href="/knowledges">
          <Button variant="outline">← 返回知识库</Button>
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">{knowledge.name}</h1>
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span>更新时间: {knowledge.updatedAt}</span>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">描述</h2>
          <div className="bg-gray-50 p-4 rounded-lg">
            <pre className="whitespace-pre-wrap text-sm break-words font-mono">
              {knowledge.desc || '暂无描述'}
            </pre>
          </div>
        </div>

        <div className="mt-8 pt-4 border-t text-sm text-gray-500">
          创建时间: {knowledge.createdAt}
        </div>

        <div className="mt-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Files</h2>
            <Button asChild>
              <Link href={`/upload?mode=knowledge&knowledgeId=${params.id}`}>
                Upload Files
              </Link>
            </Button>
          </div>

          {isFecthingFiles ? (
            <div className="text-center py-8">
              <span className="loading loading-spinner loading-md"></span>
            </div>
          ) : fileList.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No files uploaded yet
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-2 text-left font-medium text-gray-500">File Name</th>
                    <th className="px-4 py-2 text-left font-medium text-gray-500">File Type</th>
                    <th className="px-4 py-2 text-left font-medium text-gray-500">Size</th>
                    <th className="px-4 py-2 text-left font-medium text-gray-500">Created At</th>
                    <th className="px-4 py-2 text-right font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {fileList.map((file) => (
                    <tr key={file.id} className="border-t hover:bg-gray-50">
                      <td className="px-4 py-2">{file.name}</td>
                      <td className="px-4 py-2">{file.fileType}</td>
                      <td className="px-4 py-2">{formatFileSize(file.fileSize)}</td>
                      <td className="px-4 py-2">{file.createdAt}</td>
                      <td className="px-4 py-2 text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownloadFile(file)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteFile(file.id, params, setFileList)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
