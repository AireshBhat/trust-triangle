import { useState } from 'react';
import { Copy, Check, Fingerprint } from 'lucide-react';

interface NodeIdDisplayProps {
  nodeId: string;
  label?: string;
  variant?: 'employee' | 'issuer' | 'verifier';
}

export default function NodeIdDisplay({ 
  nodeId, 
  label = 'Your Node ID',
  variant = 'employee' 
}: NodeIdDisplayProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(nodeId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Variant-specific colors
  const variantStyles = {
    employee: {
      gradient: 'from-blue-500 to-cyan-500',
      bg: 'bg-blue-900/20',
      border: 'border-blue-700/50',
      text: 'text-blue-300',
      badge: 'bg-blue-500/20 text-blue-300',
      button: 'hover:bg-blue-700 active:bg-blue-600',
    },
    issuer: {
      gradient: 'from-emerald-500 to-teal-500',
      bg: 'bg-emerald-900/20',
      border: 'border-emerald-700/50',
      text: 'text-emerald-300',
      badge: 'bg-emerald-500/20 text-emerald-300',
      button: 'hover:bg-emerald-700 active:bg-emerald-600',
    },
    verifier: {
      gradient: 'from-amber-500 to-orange-500',
      bg: 'bg-amber-900/20',
      border: 'border-amber-700/50',
      text: 'text-amber-300',
      badge: 'bg-amber-500/20 text-amber-300',
      button: 'hover:bg-amber-700 active:bg-amber-600',
    },
  };

  const styles = variantStyles[variant];

  return (
    <div className={`${styles.bg} border ${styles.border} rounded-xl p-4`}>
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={`w-10 h-10 bg-gradient-to-br ${styles.gradient} rounded-lg flex items-center justify-center flex-shrink-0`}>
          <Fingerprint className="w-5 h-5 text-white" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-sm font-semibold text-white">{label}</h3>
            <span className={`${styles.badge} text-xs px-2 py-0.5 rounded-full font-medium`}>
              {variant.charAt(0).toUpperCase() + variant.slice(1)}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Node ID */}
            <div className="flex-1 min-w-0">
              <code className={`${styles.text} text-sm font-mono block truncate`}>
                did:web:{nodeId}
              </code>
              <p className="text-xs text-slate-500 mt-1">
                Share this ID with peers to connect
              </p>
            </div>

            {/* Copy Button */}
            <button
              onClick={handleCopy}
              className={`flex-shrink-0 p-2 bg-slate-700 ${styles.button} rounded-lg transition-colors relative group`}
              title="Copy to clipboard"
            >
              {copied ? (
                <Check className="w-4 h-4 text-green-400" />
              ) : (
                <Copy className="w-4 h-4 text-slate-300" />
              )}
              
              {/* Tooltip */}
              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                {copied ? 'Copied!' : 'Copy Node ID'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

