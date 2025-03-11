import { useState } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { normalizeWhitespace, findExactDiff, type DiffSegment } from '@/utils/textDiff'

interface ManualCorrectionProps {
  originalText?: string;
  onCorrection?: (correctedText: string) => void;
}

export default function ManualCorrection({ originalText = '', onCorrection }: ManualCorrectionProps) {
  const [correctedText, setCorrectedText] = useState(originalText)
  const [corrections, setCorrections] = useState<Array<{ 
    type: 'deletion' | 'addition';
    original: string;
    corrected: string;
    hasSpace: boolean;
    position: { line: number; column: number };
    absolutePosition: number;
  }>>([])
  const [elements, setElements] = useState<React.ReactNode[]>([])

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setCorrectedText(newText);

    // Normalize whitespace
    const originalNormalized = normalizeWhitespace(originalText);
    const correctedNormalized = normalizeWhitespace(newText);

    // Build position map for original text
    const positionMap = new Map<number, { line: number; column: number }>();
    let currentLine = 0;
    let currentColumn = 0;

    for (let i = 0; i < originalText.length; i++) {
      positionMap.set(i, { line: currentLine, column: currentColumn });
      if (originalText[i] === '\n') {
        currentLine++;
        currentColumn = 0;
      } else {
        currentColumn++;
      }
    }
    positionMap.set(originalText.length, { line: currentLine, column: currentColumn });

    // Get diffs
    const diffs = findExactDiff(originalText, newText);
    
    // Convert diffs to corrections
    const changes: Array<{
      type: 'deletion' | 'addition';
      original: string;
      corrected: string;
      hasSpace: boolean;
      position: { line: number; column: number };
      absolutePosition: number;
    }> = [];

    for (const diff of diffs) {
      if (diff.type === 'unchanged') continue;
      
      // Skip pure whitespace changes
      const normalizedText = normalizeWhitespace(diff.text);
      if (!normalizedText) continue;
      
      const pos = positionMap.get(diff.aStart) || { line: 0, column: 0 };
      
      changes.push({
        type: diff.type,
        original: diff.type === 'deletion' ? diff.text : '',
        corrected: diff.type === 'addition' ? diff.text : '',
        hasSpace: diff.text.includes(' ') || diff.text.includes('\n'),
        position: pos,
        absolutePosition: diff.aStart
      });
    }

    setCorrections(changes);
  };

  const renderDiffColumns = () => {
    if (!originalText || !correctedText) return null;

    // Get diffs
    const diffs = findExactDiff(originalText, correctedText);
    
    // Group diffs by line
    const diffsByLine = new Map<number, {
      lineNumber: number,
      originalLine: string,
      correctedLine: string,
      diffs: DiffSegment[]
    }>();

    // Split texts into lines
    const originalLines = originalText.split('\n');
    const correctedLines = correctedText.split('\n');
    
    // Process each diff
    diffs.forEach(diff => {
      const lineNumber = Math.floor(diff.aStart / 1000);
      
      if (!diffsByLine.has(lineNumber)) {
        diffsByLine.set(lineNumber, {
          lineNumber,
          originalLine: originalLines[lineNumber] || '',
          correctedLine: correctedLines[lineNumber] || '',
          diffs: []
        });
      }
      diffsByLine.get(lineNumber)?.diffs.push(diff);
    });

    // Sort lines by number
    const sortedLines = Array.from(diffsByLine.values()).sort((a, b) => a.lineNumber - b.lineNumber);

    // Render each line with differences
    return sortedLines.map(({ lineNumber, originalLine, correctedLine, diffs }) => {
      // Render original line with deletions highlighted
      const renderOriginalLine = () => {
        let result = [];
        let pos = 0;
        
        // Sort diffs by position
        const deletions = diffs.filter(d => d.type === 'deletion')
          .sort((a, b) => (a.aStart % 1000) - (b.aStart % 1000));
        
        for (const deletion of deletions) {
          const start = deletion.aStart % 1000;
          // Add unchanged text before deletion
          if (start > pos) {
            result.push(
              <span key={`unchanged-${pos}`} className="text-gray-900">
                {originalLine.slice(pos, start)}
              </span>
            );
          }
          // Add deletion
          result.push(
            <span key={`deletion-${start}`} className="bg-red-100 line-through text-red-700">
              {deletion.text}
            </span>
          );
          pos = deletion.aEnd % 1000;
        }
        // Add remaining unchanged text
        if (pos < originalLine.length) {
          result.push(
            <span key={`unchanged-${pos}`} className="text-gray-900">
              {originalLine.slice(pos)}
            </span>
          );
        }
        return result;
      };

      // Render corrected line with additions highlighted
      const renderCorrectedLine = () => {
        let result = [];
        let pos = 0;
        
        // Sort diffs by position
        const additions = diffs.filter(d => d.type === 'addition')
          .sort((a, b) => (a.bStart % 1000) - (b.bStart % 1000));
        
        for (const addition of additions) {
          const start = addition.bStart % 1000;
          // Add unchanged text before addition
          if (start > pos) {
            result.push(
              <span key={`unchanged-${pos}`} className="text-gray-900">
                {correctedLine.slice(pos, start)}
              </span>
            );
          }
          // Add addition
          result.push(
            <span key={`addition-${start}`} className="bg-green-100 text-green-700">
              {addition.text}
            </span>
          );
          pos = addition.bEnd % 1000;
        }
        // Add remaining unchanged text
        if (pos < correctedLine.length) {
          result.push(
            <span key={`unchanged-${pos}`} className="text-gray-900">
              {correctedLine.slice(pos)}
            </span>
          );
        }
        return result;
      };

      return (
        <div key={`line-${lineNumber}`} className="flex gap-4 py-2 hover:bg-gray-50">
          <div className="w-8 flex-shrink-0 text-gray-400 text-sm text-right">
            {lineNumber + 1}
          </div>
          <div className="flex-1 grid grid-cols-2 gap-4">
            {/* Original Text Column */}
            <div className="relative font-mono whitespace-pre-wrap">
              {renderOriginalLine()}
            </div>
            {/* Corrected Text Column */}
            <div className="relative border-l pl-4 font-mono whitespace-pre-wrap">
              {renderCorrectedLine()}
            </div>
          </div>
        </div>
      );
    });
  };

  const handleSaveCorrections = () => {
    onCorrection?.(correctedText)
  }

  return (
    <Card className="p-4">
      <h2 className="text-lg font-semibold mb-4">手动校对</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">校对文本</label>
          <Textarea
            value={correctedText}
            onChange={handleTextChange}
            placeholder="在此输入校对后的文本"
            className="h-40 mb-2 font-mono"
          />
          <div className="mt-4">
            <div className="border rounded-lg overflow-hidden">
              {/* Header */}
              <div className="flex gap-4 bg-gray-50 p-2 border-b">
                <div className="w-8"></div>
                <div className="flex-1 grid grid-cols-2 gap-4">
                  <div className="font-medium">原文</div>
                  <div className="font-medium border-l pl-4">校对</div>
                </div>
              </div>
              {/* Diff Content */}
              <div className="p-2">
                {renderDiffColumns()}
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={handleSaveCorrections}>保存校对</Button>
        </div>
      </div>
    </Card>
  )
}
