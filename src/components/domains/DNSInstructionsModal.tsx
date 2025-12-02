/**
 * ============================================================================
 * DNS Instructions Modal Component
 * ============================================================================
 * 
 * Purpose: Show step-by-step DNS configuration instructions
 * 
 * Features:
 * - Fetch DNS instructions for domain
 * - Display records in easy-to-copy format
 * - Copy to clipboard functionality
 * - Verification trigger
 * - Provider-specific help (future: Phase 4)
 * 
 * Props:
 * - isOpen: Modal visibility
 * - onClose: Close handler
 * - domainId: Domain ID to show instructions for
 * - onVerify: Verification handler
 * 
 * ============================================================================
 */

import { useState, useEffect } from 'react';
import { X, Copy, CheckCircle, AlertCircle, RefreshCw, Eye } from 'lucide-react';
import domainService, { DNSInstructions } from '../../lib/services/domainService';
import Button from '../ui/Button';
import DNSRecordRow from './DNSRecordRow';

interface DNSInstructionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  domainId: string | null;
  onVerify: (domainId: string) => Promise<any>;
}

/**
 * DNS Instructions Modal Component
 */
export default function DNSInstructionsModal({
  isOpen,
  onClose,
  domainId,
  onVerify
}: DNSInstructionsModalProps) {
  // State
  const [instructions, setInstructions] = useState<DNSInstructions | null>(null);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Load DNS instructions when modal opens or domainId changes
   */
  useEffect(() => {
    if (isOpen && domainId) {
      loadInstructions();
    }
  }, [isOpen, domainId]);

  /**
   * Loads DNS instructions for the domain
   */
  async function loadInstructions() {
    if (!domainId) return;

    setLoading(true);
    setError(null);

    try {
      const data = await domainService.getDNSInstructions(domainId);
      if (data) {
        setInstructions(data);
      } else {
        setError('Failed to load DNS instructions');
      }
    } catch (err: any) {
      console.error('Failed to load DNS instructions:', err);
      setError(err.message || 'Failed to load DNS instructions');
    } finally {
      setLoading(false);
    }
  }

  /**
   * Handles domain verification
   */
  async function handleVerify() {
    if (!domainId) return;

    setVerifying(true);
    const result = await onVerify(domainId);
    setVerifying(false);

    // Reload instructions to show updated validation status
    if (result.success) {
      await loadInstructions();
    }
  }

  // Don't render if not open
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div 
          className="card max-w-4xl w-full p-6 max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-serif font-bold mb-1">DNS Configuration</h2>
              {instructions && (
                <p className="text-sm text-gray-600">
                  Configure DNS records for <span className="font-semibold">{instructions.domain}</span>
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="text-center py-12">
              <RefreshCw className="w-8 h-8 text-gray-400 animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Loading DNS instructions...</p>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-red-900 mb-1">Error Loading Instructions</h4>
                  <p className="text-sm text-red-700">{error}</p>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={loadInstructions}
                    className="mt-3"
                  >
                    Try Again
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Instructions Content */}
          {instructions && !loading && (
            <div className="space-y-6">
              {/* Status Banner */}
              {instructions.status === 'verified' ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <div>
                      <h4 className="font-medium text-green-900">Domain Verified!</h4>
                      <p className="text-sm text-green-700">
                        Your domain is ready to use for sending emails.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">
                    Add these DNS records to your domain provider
                  </h4>
                  <p className="text-sm text-blue-700">
                    Log into your domain registrar or DNS provider (like Cloudflare, GoDaddy, Namecheap) 
                    and add the following DNS records.
                  </p>
                </div>
              )}

              {/* DNS Records */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">DNS Records to Add:</h3>
                {instructions.records.map((record, index) => (
                  <DNSRecordRow key={index} instruction={record} />
                ))}
              </div>

              {/* Important Notes */}
              {instructions.notes && instructions.notes.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h4 className="font-medium text-yellow-900 mb-2">Important Notes:</h4>
                  <ul className="text-sm text-yellow-700 space-y-1">
                    {instructions.notes.map((note, index) => (
                      <li key={index}>• {note}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Verification Section */}
              {instructions.status !== 'verified' && (
                <div className="border-t border-gray-200 pt-6">
                  <h4 className="font-semibold text-gray-900 mb-3">After Adding DNS Records:</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    DNS changes typically take 5-30 minutes to propagate. Once you've added all the records, 
                    click the button below to verify your domain.
                  </p>
                  <Button
                    variant="primary"
                    size="md"
                    icon={RefreshCw}
                    onClick={handleVerify}
                    loading={verifying}
                    disabled={verifying}
                  >
                    Verify Domain Now
                  </Button>
                </div>
              )}

              {/* Troubleshooting */}
              <details className="border border-gray-200 rounded-lg">
                <summary className="px-4 py-3 cursor-pointer font-medium text-gray-900 hover:bg-gray-50">
                  Troubleshooting Tips
                </summary>
                <div className="px-4 pb-4 text-sm text-gray-600 space-y-2">
                  <p><strong>Records not verifying?</strong></p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Wait at least 30 minutes after adding records</li>
                    <li>Check that you copied the exact values (no extra spaces)</li>
                    <li>Some providers use "@" instead of the root domain name</li>
                    <li>Make sure the record type (CNAME or TXT) is correct</li>
                    <li>Try using a TTL of 300 or "Automatic"</li>
                  </ul>
                  <p className="mt-3"><strong>Still having issues?</strong></p>
                  <p>Contact our support team with your domain name for assistance.</p>
                </div>
              </details>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
            <Button
              variant="secondary"
              size="md"
              onClick={onClose}
            >
              Close
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
