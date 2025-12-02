/**
 * ============================================================================
 * Domains Management Page
 * ============================================================================
 * 
 * Purpose: Main page for managing custom sending domains
 * 
 * Features:
 * - List all user domains with status
 * - Add new domain
 * - Verify domains
 * - View DNS instructions
 * - Delete domains
 * - Set default domain
 * 
 * Dependencies:
 * - domainService for API calls
 * - DomainCard for individual domain display
 * - AddDomainModal for adding new domains
 * - DNSInstructionsModal for DNS setup guide
 * 
 * ============================================================================
 */

import { useState, useEffect } from 'react';
import { Globe, Plus, AlertCircle, RefreshCw } from 'lucide-react';
import domainService, { Domain } from '../../../lib/services/domainService';
import AppLayout from '../../../components/layout/AppLayout';
import Button from '../../../components/ui/Button';
import DomainCard from '../../../components/domains/DomainCard';
import AddDomainModal from '../../../components/domains/AddDomainModal';
import DNSInstructionsModal from '../../../components/domains/DNSInstructionsModal';

/**
 * Main Domains Management Page Component
 */
export default function Domains() {
  // State management
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDNSModal, setShowDNSModal] = useState(false);
  const [selectedDomainId, setSelectedDomainId] = useState<string | null>(null);

  /**
   * Load domains on component mount
   */
  useEffect(() => {
    loadDomains();
  }, []);

  /**
   * Loads all domains for the current user
   */
  async function loadDomains() {
    try {
      setError(null);
      const data = await domainService.listDomains();
      setDomains(data);
    } catch (err: any) {
      console.error('Failed to load domains:', err);
      setError(err.message || 'Failed to load domains. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  /**
   * Refreshes the domain list
   */
  async function handleRefresh() {
    setRefreshing(true);
    await loadDomains();
    setRefreshing(false);
  }

  /**
   * Handles successful domain addition
   */
  function handleDomainAdded(domain: Domain) {
    setDomains(prev => [domain, ...prev]);
    setShowAddModal(false);
    
    // Automatically show DNS instructions for new domain
    setSelectedDomainId(domain.id);
    setShowDNSModal(true);
  }

  /**
   * Handles domain verification
   */
  async function handleVerify(domainId: string) {
    try {
      const result = await domainService.verifyDomain(domainId);
      
      if (result.success && result.domain) {
        // Update domain in state
        setDomains(prev => prev.map(d => 
          d.id === domainId ? result.domain! : d
        ));
      }
      
      return result;
    } catch (err: any) {
      console.error('Verification failed:', err);
      return { success: false, error: err.message };
    }
  }

  /**
   * Handles setting a domain as default
   */
  async function handleSetDefault(domainId: string) {
    try {
      const result = await domainService.setDefaultDomain(domainId);
      
      if (result.success) {
        // Update all domains in state
        setDomains(prev => prev.map(d => ({
          ...d,
          is_default: d.id === domainId
        })));
      }
      
      return result;
    } catch (err: any) {
      console.error('Failed to set default:', err);
      return { success: false, error: err.message };
    }
  }

  /**
   * Handles domain deletion
   */
  async function handleDelete(domainId: string) {
    // Confirm deletion
    if (!confirm('Are you sure you want to delete this domain? This action cannot be undone.')) {
      return { success: false };
    }

    try {
      const result = await domainService.deleteDomain(domainId);
      
      if (result.success) {
        // Remove from state
        setDomains(prev => prev.filter(d => d.id !== domainId));
      }
      
      return result;
    } catch (err: any) {
      console.error('Failed to delete domain:', err);
      return { success: false, error: err.message };
    }
  }

  /**
   * Opens DNS instructions modal for a domain
   */
  function handleViewDNS(domainId: string) {
    setSelectedDomainId(domainId);
    setShowDNSModal(true);
  }

  /**
   * Closes DNS instructions modal
   */
  function handleCloseDNSModal() {
    setShowDNSModal(false);
    setSelectedDomainId(null);
  }

  // Get counts for display
  const verifiedCount = domains.filter(d => d.verification_status === 'verified').length;
  const pendingCount = domains.filter(d => d.verification_status === 'pending').length;
  const defaultDomain = domains.find(d => d.is_default);

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-serif font-bold mb-2">Custom Domains</h1>
              <p className="text-gray-600">
                Manage your custom sending domains for professional email delivery
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="secondary"
                size="md"
                icon={RefreshCw}
                onClick={handleRefresh}
                loading={refreshing}
                disabled={loading}
              >
                Refresh
              </Button>
              <Button
                variant="primary"
                size="md"
                icon={Plus}
                onClick={() => setShowAddModal(true)}
                disabled={loading}
              >
                Add Domain
              </Button>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="card p-4">
              <div className="text-sm text-gray-600 mb-1">Total Domains</div>
              <div className="text-2xl font-bold">{domains.length}</div>
            </div>
            <div className="card p-4">
              <div className="text-sm text-gray-600 mb-1">Verified</div>
              <div className="text-2xl font-bold text-green-600">{verifiedCount}</div>
            </div>
            <div className="card p-4">
              <div className="text-sm text-gray-600 mb-1">Pending</div>
              <div className="text-2xl font-bold text-yellow-600">{pendingCount}</div>
            </div>
            <div className="card p-4">
              <div className="text-sm text-gray-600 mb-1">Default Domain</div>
              <div className="text-sm font-semibold truncate">
                {defaultDomain?.domain || 'None'}
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="card bg-red-50 border-red-200 p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-red-900 mb-1">Error Loading Domains</h3>
                <p className="text-sm text-red-700">{error}</p>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={loadDomains}
                  className="mt-3"
                >
                  Try Again
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <RefreshCw className="w-8 h-8 text-gray-400 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading domains...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && domains.length === 0 && (
          <div className="card text-center py-12">
            <Globe className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Custom Domains Yet</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Add a custom domain to send emails from your own domain name and improve deliverability.
            </p>
            <Button
              variant="primary"
              size="lg"
              icon={Plus}
              onClick={() => setShowAddModal(true)}
            >
              Add Your First Domain
            </Button>
          </div>
        )}

        {/* Domain List */}
        {!loading && !error && domains.length > 0 && (
          <div className="space-y-4">
            {domains.map(domain => (
              <DomainCard
                key={domain.id}
                domain={domain}
                onVerify={handleVerify}
                onSetDefault={handleSetDefault}
                onDelete={handleDelete}
                onViewDNS={handleViewDNS}
              />
            ))}
          </div>
        )}

        {/* Help Section */}
        {!loading && domains.length > 0 && (
          <div className="card bg-blue-50 border-blue-200 p-6 mt-8">
            <h3 className="font-semibold text-blue-900 mb-2">Need Help?</h3>
            <ul className="text-sm text-blue-700 space-y-2">
              <li>• DNS changes typically take 5-30 minutes to propagate</li>
              <li>• Verified domains will be automatically used for your campaigns</li>
              <li>• The default domain is used when no specific domain is selected</li>
              <li>• Contact support if you're having trouble verifying your domain</li>
            </ul>
          </div>
        )}
      </div>

      {/* Modals */}
      <AddDomainModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onDomainAdded={handleDomainAdded}
      />

      <DNSInstructionsModal
        isOpen={showDNSModal}
        onClose={handleCloseDNSModal}
        domainId={selectedDomainId}
        onVerify={handleVerify}
      />
    </AppLayout>
  );
}
