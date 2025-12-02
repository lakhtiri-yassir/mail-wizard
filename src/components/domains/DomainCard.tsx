/**
 * ============================================================================
 * Domain Card Component
 * ============================================================================
 * 
 * Purpose: Display individual domain with status, actions, and information
 * 
 * Features:
 * - Status badge with color coding
 * - Default domain indicator
 * - Verification status and timestamp
 * - Action buttons (verify, set default, delete, view DNS)
 * - Loading states for async actions
 * 
 * Props:
 * - domain: Domain object
 * - onVerify: Verification handler
 * - onSetDefault: Set default handler
 * - onDelete: Delete handler
 * - onViewDNS: View DNS instructions handler
 * 
 * ============================================================================
 */

import { useState } from 'react';
import { 
  CheckCircle, 
  Clock, 
  XCircle, 
  Star, 
  Trash2, 
  Eye, 
  RefreshCw,
  Globe
} from 'lucide-react';
import { Domain } from '../../lib/services/domainService';
import domainService from '../../lib/services/domainService';
import Button from '../ui/Button';
import VerificationStatus from './VerificationStatus';

interface DomainCardProps {
  domain: Domain;
  onVerify: (domainId: string) => Promise<any>;
  onSetDefault: (domainId: string) => Promise<any>;
  onDelete: (domainId: string) => Promise<any>;
  onViewDNS: (domainId: string) => void;
}

/**
 * Domain Card Component
 */
export default function DomainCard({
  domain,
  onVerify,
  onSetDefault,
  onDelete,
  onViewDNS
}: DomainCardProps) {
  // Loading states for async actions
  const [verifying, setVerifying] = useState(false);
  const [settingDefault, setSettingDefault] = useState(false);
  const [deleting, setDeleting] = useState(false);

  /**
   * Handles domain verification
   */
  async function handleVerify() {
    setVerifying(true);
    const result = await onVerify(domain.id);
    setVerifying(false);

    // Show toast notification (you can implement toast service)
    if (result.success) {
      if (result.domain?.verification_status === 'verified') {
        console.log('✅ Domain verified successfully!');
      } else {
        console.log('⚠️ Verification pending. Check DNS records.');
      }
    } else {
      console.error('❌ Verification failed:', result.error);
    }
  }

  /**
   * Handles setting domain as default
   */
  async function handleSetDefault() {
    setSettingDefault(true);
    const result = await onSetDefault(domain.id);
    setSettingDefault(false);

    if (result.success) {
      console.log('✅ Default domain updated');
    } else {
      console.error('❌ Failed to set default:', result.error);
    }
  }

  /**
   * Handles domain deletion
   */
  async function handleDelete() {
    setDeleting(true);
    const result = await onDelete(domain.id);
    setDeleting(false);

    if (result.success) {
      console.log('✅ Domain deleted');
    } else if (result.error) {
      console.error('❌ Failed to delete:', result.error);
    }
  }

  // Get status details
  const isVerified = domain.verification_status === 'verified';
  const isPending = domain.verification_status === 'pending';
  const isFailed = domain.verification_status === 'failed';
  const canRetry = domainService.canRetryVerification(
    domain.verification_status,
    domain.created_at
  );

  return (
    <div className="card p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between gap-4">
        {/* Domain Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <Globe className="w-5 h-5 text-gray-400 flex-shrink-0" />
            <h3 className="text-lg font-semibold truncate">{domain.domain}</h3>
            
            {/* Default Badge */}
            {domain.is_default && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-gold/10 text-gold rounded-full text-xs font-medium">
                <Star className="w-3 h-3 fill-current" />
                Default
              </span>
            )}
          </div>

          {/* Status */}
          <div className="mb-4">
            <VerificationStatus
              status={domain.verification_status}
              lastVerified={domain.last_verified_at}
            />
          </div>

          {/* Metadata */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm text-gray-600">
            <div>
              <span className="font-medium">Added:</span>{' '}
              {new Date(domain.created_at).toLocaleDateString()}
            </div>
            {domain.verified_at && (
              <div>
                <span className="font-medium">Verified:</span>{' '}
                {new Date(domain.verified_at).toLocaleDateString()}
              </div>
            )}
            {domain.last_verified_at && (
              <div>
                <span className="font-medium">Last Check:</span>{' '}
                {domainService.getTimeSince(domain.last_verified_at)}
              </div>
            )}
          </div>

          {/* Status Message */}
          <p className="text-sm text-gray-600 mt-3">
            {domainService.getStatusMessage(
              domain.verification_status,
              domain.last_verified_at
            )}
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 flex-shrink-0">
          {/* View DNS Button */}
          <Button
            variant="secondary"
            size="sm"
            icon={Eye}
            onClick={() => onViewDNS(domain.id)}
          >
            View DNS
          </Button>

          {/* Verify Button */}
          {!isVerified && canRetry && (
            <Button
              variant={isPending ? 'secondary' : 'primary'}
              size="sm"
              icon={RefreshCw}
              onClick={handleVerify}
              loading={verifying}
              disabled={verifying}
            >
              {isPending ? 'Check Status' : 'Retry Verify'}
            </Button>
          )}

          {/* Set Default Button */}
          {isVerified && !domain.is_default && (
            <Button
              variant="secondary"
              size="sm"
              icon={Star}
              onClick={handleSetDefault}
              loading={settingDefault}
              disabled={settingDefault}
            >
              Set Default
            </Button>
          )}

          {/* Delete Button */}
          <Button
            variant="danger"
            size="sm"
            icon={Trash2}
            onClick={handleDelete}
            loading={deleting}
            disabled={deleting || domain.is_default}
            title={domain.is_default ? 'Cannot delete default domain' : 'Delete domain'}
          >
            Delete
          </Button>
        </div>
      </div>

      {/* DNS Records Summary (for pending/failed) */}
      {!isVerified && domain.dns_records && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            DNS Records Status:
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {domain.dns_records.mail_cname && (
              <div className="flex items-center gap-2 text-sm">
                {domain.dns_records.mail_cname.valid ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-600" />
                )}
                <span>Mail CNAME</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm">
              {domain.dns_records.dkim1.valid ? (
                <CheckCircle className="w-4 h-4 text-green-600" />
              ) : (
                <XCircle className="w-4 h-4 text-red-600" />
              )}
              <span>DKIM 1</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              {domain.dns_records.dkim2.valid ? (
                <CheckCircle className="w-4 h-4 text-green-600" />
              ) : (
                <XCircle className="w-4 h-4 text-red-600" />
              )}
              <span>DKIM 2</span>
            </div>
            {domain.dns_records.spf && (
              <div className="flex items-center gap-2 text-sm">
                {domain.dns_records.spf.valid ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <Clock className="w-4 h-4 text-gray-400" />
                )}
                <span>SPF (Optional)</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
