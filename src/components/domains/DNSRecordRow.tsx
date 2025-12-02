/**
 * ============================================================================
 * DNS Record Row Component
 * ============================================================================
 * 
 * Purpose: Display individual DNS record with copy-to-clipboard functionality
 * 
 * Features:
 * - Formatted record display
 * - Copy button for easy copying
 * - Visual feedback on copy
 * - Required/optional indicator
 * - Validation status indicator
 * 
 * Props:
 * - instruction: DNS instruction object with record details
 * 
 * ============================================================================
 */

import { useState } from 'react';
import { Copy, Check, CheckCircle, XCircle } from 'lucide-react';
import { DNSInstruction } from '../../lib/services/domainService';
import domainService from '../../lib/services/domainService';

interface DNSRecordRowProps {
  instruction: DNSInstruction;
}

/**
 * DNS Record Row Component
 */
export default function DNSRecordRow({ instruction }: DNSRecordRowProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  /**
   * Copies text to clipboard and shows feedback
   */
  async function handleCopy(text: string, field: string) {
    const success = await domainService.copyToClipboard(text, field);
    
    if (success) {
      setCopiedField(field);
      // Reset after 2 seconds
      setTimeout(() => setCopiedField(null), 2000);
    }
  }

  const { record } = instruction;

  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-semibold text-gray-900">
              Step {instruction.step}: {instruction.title}
            </h4>
            {instruction.required ? (
              <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded font-medium">
                Required
              </span>
            ) : (
              <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded font-medium">
                Optional
              </span>
            )}
            {record.valid !== undefined && (
              record.valid ? (
                <CheckCircle className="w-4 h-4 text-green-600" />
              ) : (
                <XCircle className="w-4 h-4 text-red-600" />
              )
            )}
          </div>
          <p className="text-sm text-gray-600">{instruction.description}</p>
        </div>
      </div>

      {/* DNS Record Details */}
      <div className="space-y-3 bg-gray-50 rounded-lg p-3">
        {/* Type */}
        <div className="grid grid-cols-4 gap-2 text-sm">
          <div className="font-medium text-gray-700">Type:</div>
          <div className="col-span-3 font-mono text-gray-900">{record.type}</div>
        </div>

        {/* Host */}
        <div className="grid grid-cols-4 gap-2 text-sm">
          <div className="font-medium text-gray-700">Host:</div>
          <div className="col-span-3 flex items-center gap-2">
            <code className="flex-1 px-2 py-1 bg-white border border-gray-200 rounded font-mono text-xs break-all">
              {record.host}
            </code>
            <button
              onClick={() => handleCopy(record.host, `host-${instruction.step}`)}
              className="p-1.5 hover:bg-gray-200 rounded transition-colors flex-shrink-0"
              title="Copy host"
            >
              {copiedField === `host-${instruction.step}` ? (
                <Check className="w-4 h-4 text-green-600" />
              ) : (
                <Copy className="w-4 h-4 text-gray-600" />
              )}
            </button>
          </div>
        </div>

        {/* Value */}
        <div className="grid grid-cols-4 gap-2 text-sm">
          <div className="font-medium text-gray-700">Value:</div>
          <div className="col-span-3 flex items-center gap-2">
            <code className="flex-1 px-2 py-1 bg-white border border-gray-200 rounded font-mono text-xs break-all">
              {record.value}
            </code>
            <button
              onClick={() => handleCopy(record.value, `value-${instruction.step}`)}
              className="p-1.5 hover:bg-gray-200 rounded transition-colors flex-shrink-0"
              title="Copy value"
            >
              {copiedField === `value-${instruction.step}` ? (
                <Check className="w-4 h-4 text-green-600" />
              ) : (
                <Copy className="w-4 h-4 text-gray-600" />
              )}
            </button>
          </div>
        </div>

        {/* TTL */}
        <div className="grid grid-cols-4 gap-2 text-sm">
          <div className="font-medium text-gray-700">TTL:</div>
          <div className="col-span-3 font-mono text-gray-900">
            {record.ttl} seconds (or Automatic)
          </div>
        </div>
      </div>

      {/* Validation Status Message */}
      {record.valid === false && (
        <div className="mt-3 text-sm text-red-600 flex items-start gap-2">
          <XCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>This record has not been detected yet. Please verify it was added correctly.</span>
        </div>
      )}
      
      {record.valid === true && (
        <div className="mt-3 text-sm text-green-600 flex items-start gap-2">
          <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>This record has been verified successfully.</span>
        </div>
      )}
    </div>
  );
}
