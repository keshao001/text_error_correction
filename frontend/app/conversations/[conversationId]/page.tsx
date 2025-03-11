'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import 'github-markdown-css/github-markdown-light.css'
import { cn } from "@/lib/utils"
import axios from 'axios';
import { Loader2 } from "lucide-react"

interface Message {
  id: string
  content: string
  sender: 'user' | 'ai'
  timestamp: number
}

export default function ConversationPage() {
  const params = useParams()
  const router = useRouter()
  const conversationId = params.conversationId as string

  // Refs for scrolling and messages
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<Message[]>([])
  const [conversationTitle, setConversationTitle] = useState('对话')
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Auto-scroll to bottom when messages change
  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  // Use effect to scroll when messages update
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Load conversation history on component mount
  useEffect(() => {
    const loadConversation = async () => {
      try {
        const response = await fetch(`/api/conversations/history?id=${conversationId}`)
        if (response.ok) {
          const data = await response.json()
          console.log('Conversation history:', data);
          setMessages(data.history || [])
          setConversationTitle(data.title || '对话')
          setError(null)
        } else if (response.status === 404) {
          setError('对话未找到')
        } else {
          setError('加载对话失败')
        }
      } catch (error) {
        console.error('Failed to load conversation:', error)
        setError('网络错误，无法加载对话')
      }
    }

    loadConversation()
  }, [conversationId, router])

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const newUserMessage: Message = {
      id: Math.random().toString(36).substring(2, 15),
      content: inputMessage,
      sender: 'user',
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, newUserMessage]);
    setInputMessage('');
    setIsLoading(true);

    let placeholderMessageId = Math.random().toString(36).substring(2, 15);

    // Create a placeholder AI message with loading indicator
    const initialAiMessage: Message = {
      id: placeholderMessageId,
      content: '<div class="flex items-center gap-2 justify-start"><span>AI思考中</span><span class="animate-bounce">...</span></div>',
      sender: 'ai',
      timestamp: Date.now()
    };
    setMessages(prev => [...prev, initialAiMessage]);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
        },
        cache: 'no-store',
        keepalive: true,
        body: JSON.stringify({
          message: inputMessage,
          conversationId
        })
      });

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let currentContent = '';
      let index = 0;

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        console.log('Received chunk:', index++, value);
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.trim() === '') continue;
          if (line.startsWith('data: ')) {
            const jsonStr = line.slice(6).trim();
            if (jsonStr === '[DONE]') continue;

            try {
              const message = JSON.parse(jsonStr);
              if (message.content) {
                currentContent += message.content;
                setMessages(prev =>
                  prev.map(msg =>
                    msg.id === placeholderMessageId
                      ? { ...msg, content: currentContent }
                      : msg
                  )
                );
                scrollToBottom();
              }
            } catch (e) {
              console.error('Error parsing message:', e);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error in conversation:', error);
      const errorMessage: Message = {
        id: Math.random().toString(36).substring(2, 15),
        content: '对话出现错误，请稍后重试',
        sender: 'ai',
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Render error if exists
  if (error) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex items-center mb-4">
          <Button
            variant="outline"
            onClick={() => router.push('/conversations')}
            className="mr-4"
          >
            返回会话列表
          </Button>
        </div>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">错误：</strong>
          <span className="block sm:inline">{error}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center mb-4">
        <Button
          variant="outline"
          onClick={() => router.push('/conversations')}
          className="mr-4"
        >
          返回会话列表
        </Button>
      </div>
      <Card>
        <CardContent>
          <div className="space-y-4">
            <h1 className="text-xl m-4 font-semibold">{conversationTitle}</h1>
            <div
              ref={messagesContainerRef}
              className="h-96 overflow-y-auto border rounded p-4 markdown-body"
            >
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    "mb-2 p-2 rounded",
                    msg.sender === 'user'
                      ? 'bg-blue-100 text-right'
                      : 'bg-green-100 text-left'
                  )}
                >
                  {msg.content.startsWith('<div class="flex items-center') ? (
                    <div dangerouslySetInnerHTML={{ __html: msg.content }} />
                  ) : (
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        a: ({ node, ...props }) => (
                          <a
                            {...props}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          />
                        )
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>
                  )}
                </div>
              ))}
              {/* Ref for auto-scrolling */}
              <div ref={messagesEndRef} />
            </div>

            <div className="flex flex-col space-y-2">
              <Textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="输入您的消息..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                disabled={isLoading}
                className="min-h-[80px] resize-none"
                rows={3}
              />
              <Button
                onClick={handleSendMessage}
                disabled={isLoading || !inputMessage.trim()}
                className="w-full"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    发送中...
                  </div>
                ) : '发送'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
