import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog"
import { Loader2 } from "lucide-react"

interface LoadingModalProps {
  isOpen: boolean;
  message?: string;
  title?: string;
}

export function LoadingModal({ 
  isOpen, 
  message = "处理中...",
  title = "加载中" 
}: LoadingModalProps) {
  return (
    <Dialog open={isOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogTitle className="text-center">
          {title}
        </DialogTitle>
        <div className="flex flex-col items-center justify-center gap-4 py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-center text-sm text-muted-foreground">
            {message}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
