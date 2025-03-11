import axios from 'axios';

interface DocumentResponse {
  content: string;
  error?: string;
  pageCount?: number;
}

export async function parseDocument(file: File): Promise<DocumentResponse> {
  try {
    console.log(`Processing file: ${file.name}`);
    
    // Check file type
    const fileType = file.type.toLowerCase();
    if (!fileType.includes('text/plain') && !fileType.includes('application/pdf')) {
      throw new Error('只支持 TXT 和 PDF 格式的文件');
    }

    // For TXT files, directly read the content
    if (fileType.includes('text/plain')) {
      const content = await file.text();
      return {
        content,
        pageCount: 1
      };
    }

    // For PDF files, use DashScope API to parse
    if (fileType.includes('application/pdf')) {
      const arrayBuffer = await file.arrayBuffer();
      const base64Content = Buffer.from(arrayBuffer).toString('base64');

      const response = await axios.post(
        'https://dashscope.aliyuncs.com/api/v1/services/docmind/document-parse',
        {
          model: 'docmind-v1',
          input: {
            document: {
              content: base64Content,
              name: file.name,
              format: 'base64'
            }
          },
          parameters: {
            result_type: 'text'
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${process.env.DASHSCOPE_API_KEY}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );

      if (response.data.code && response.data.code !== "200") {
        throw new Error(response.data.message || 'PDF 解析失败');
      }

      return {
        content: response.data.output?.text || '',
        pageCount: response.data.output?.page_count || 1
      };
    }

    throw new Error('不支持的文件格式');
  } catch (error) {
    console.error(`Error processing ${file.name}:`, error);
    return {
      content: '',
      error: error instanceof Error ? error.message : '文件处理失败',
      pageCount: 0
    };
  }
}
