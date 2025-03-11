import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const knowledgeSchema = z.object({
  title: z.string().min(1, '标题不能为空'),
  content: z.string().min(1, '内容不能为空'),
  type: z.string().min(1, '类型不能为空'),
  tags: z.string().optional(),
});

type KnowledgeFormData = z.infer<typeof knowledgeSchema>;

interface KnowledgeFormProps {
  initialData?: {
    id: string;
    title: string;
    content: string;
    type: string;
    tags?: string[];
  };
  isEditing?: boolean;
}

export function KnowledgeForm({ initialData, isEditing = false }: KnowledgeFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<KnowledgeFormData>({
    resolver: zodResolver(knowledgeSchema),
    defaultValues: {
      title: initialData?.title || '',
      content: initialData?.content || '',
      type: initialData?.type || '',
      tags: initialData?.tags?.join(', ') || '',
    },
  });

  const onSubmit = async (data: KnowledgeFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const endpoint = isEditing
        ? `/api/knowledges/${initialData?.id}`
        : '/api/knowledges';
      const method = isEditing ? 'PATCH' : 'POST';

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          tags: data.tags ? data.tags.split(',').map(tag => tag.trim()) : [],
        }),
      });

      if (!response.ok) {
        throw new Error('保存知识条目失败');
      }

      router.push('/knowledges');
    } catch (err) {
      setError(err instanceof Error ? err.message : '发生错误');
    } finally {
      setIsSubmitting(false);
    }
  };

  const typeOptions = [
    { value: '', label: '选择类型' },
    { value: 'note', label: '笔记' },
    { value: 'article', label: '文章' },
    { value: 'reference', label: '参考资料' },
    { value: 'tutorial', label: '教程' },
  ];

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {error && (
          <div className="bg-red-50 text-red-500 p-4 rounded-lg mb-4">
            {error}
          </div>
        )}

        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>标题</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>类型</FormLabel>
              <FormControl>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择类型" />
                  </SelectTrigger>
                  <SelectContent>
                    {typeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel>内容</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  rows={10}
                  className="font-mono"
                />
              </FormControl>
              <FormDescription>
                支持 Markdown 格式
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="tags"
          render={({ field }) => (
            <FormItem>
              <FormLabel>标签</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormDescription>
                多个标签请用逗号分隔
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/knowledges')}
          >
            取消
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? '保存中...' : isEditing ? '更新' : '创建'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
