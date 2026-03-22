import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface CopyButtonProps {
  textToCopy: string;
}

export function CopyButton({ textToCopy }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="p-2 text-slate-400 hover:text-indigo-600 dark:text-slate-500 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-full transition-colors"
      title="Copy to clipboard"
      aria-label="Copy to clipboard"
    >
      {copied ? <Check className="w-5 h-5 text-emerald-500" /> : <Copy className="w-5 h-5" />}
    </button>
  );
}
