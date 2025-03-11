'use client';

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "../ui/textarea";
import { useState } from "react";
import { toast } from "../ui/use-toast";
import { useRouter } from "next/navigation";

interface Knowledge {
  id?: string;
  name: string;
  desc: string;
}

interface KnowledgeModalProps {
  mode: 'create' | 'edit';
  knowledge?: Knowledge;
  trigger?: React.ReactNode;
  onComplete?: () => void;
}

export function KnowledgeModal({ mode, knowledge, trigger, onComplete }: KnowledgeModalProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(knowledge?.name || '');
  const [desc, setDesc] = useState(knowledge?.desc || '');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);

      const url = mode === 'create' ? '/api/knowledges' : `/api/knowledges/${knowledge?.id}`;
      const method = mode === 'create' ? 'POST' : 'PUT';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          desc,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to ${mode} knowledge`);
      }

      toast({
        title: "Success",
        description: `Knowledge ${mode === 'create' ? 'created' : 'updated'} successfully`,
      });

      // Reset form if creating
      if (mode === 'create') {
        setName('');
        setDesc('');
      }

      // Close modal
      setOpen(false);

      // Call onComplete callback for refresh
      if (onComplete) {
        onComplete();
      }

    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : `Failed to ${mode} knowledge`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant={mode === 'create' ? 'default' : 'outline'} size={mode === 'create' ? 'default' : 'sm'}>
            {mode === 'create' ? 'Create Knowledge' : 'Edit'}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{mode === 'create' ? 'Create Knowledge' : 'Edit Knowledge'}</DialogTitle>
            <DialogDescription>
              {mode === 'create' 
                ? 'Add a new knowledge base here.' 
                : 'Make changes to your knowledge base here.'} Click save when you&apos;re done.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="col-span-3"
                placeholder={mode === 'create' ? 'Enter knowledge name' : undefined}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="desc" className="text-right">
                Description
              </Label>
              <Textarea
                id="desc"
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                className="col-span-3"
                placeholder={mode === 'create' ? 'Enter knowledge description' : undefined}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : (mode === 'create' ? "Create" : "Save changes")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
