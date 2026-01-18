/**
 * ============================================================================
 * CREATE CAMPAIGN MODAL - Multi-Step Campaign Creation Wizard
 * ============================================================================
 * 
 * PURPOSE:
 * Professional multi-step modal for creating email campaigns with complete
 * campaign configuration including details, template selection, recipients,
 * and scheduling.
 * 
 * FEATURES:
 * - 4-step wizard: Details → Template → Recipients → Schedule
 * - Progress indicator with step validation
 * - Real-time form validation
 * - Recipient count preview
 * - Template preview and selection
 * - 3 schedule options: Send Now, Schedule Later, Keep as Draft
 * - Smart defaults from user profile
 * 
 * PROPS:
 * - onClose: () => void - Callback when modal is closed
 * - onSuccess: (campaign: Campaign) => void - Callback when campaign is created
 * 
 * STEPS:
 * 1. Campaign Details - Name, subject, description, from/reply-to
 * 2. Template Selection - Choose from available email templates
 * 3. Recipients - Select who receives the campaign
 * 4. Schedule - Send now, schedule later, or keep as draft
 * 
 * ============================================================================
 */

import { useState, useEffect, useCallback } from 'react';
import { X, ChevronRight, ChevronLeft, Check, Mail, Users, Calendar, FileText, Loader2, Code, AlertCircle, CheckCircle, Clock, Lock, Save } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { EMAIL_TEMPLATES } from '../../data/emailTemplates';
import toast from 'react-hot-toast';
import { useNavigate, useLocation } from 'react-router-dom';

// ============================================================================
// INTERFACES
// ============================================================================

interface Campaign {
  id: string;
  name: string;
  subject: string;
  status: string;
  created_at: string;
}

interface CampaignFormData {
  // Step 1: Campaign Details
  name: string;
  description: string;
  subject: string;
  previewText: string;
  fromName: string;
  fromEmail: string;
  replyTo: string;

  // Step 2: Template
  templateId: string;
  customHtml: string | null;
  inputMode: 'custom' | 'template';

  // Step 3: Recipients
  sendToMode: 'all' | 'groups' | 'contacts';
  selectedGroups: Set<string>;
  selectedContacts: Set<string>;

  // Step 4: Schedule
  scheduleMode: 'now' | 'later' | 'draft';  // ✅ UPDATED: Added 'draft'
  scheduledDate: string;
  scheduledTime: string;
}

interface Contact {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  status: string;
}

interface ContactGroup {
  id: string;
  name: string;
  description: string | null;
  contact_count: number;
}

interface VerifiedDomain {
  id: string;
  domain: string;
  verified: boolean;
}

interface CreateCampaignModalProps {
  onClose: () => void;
  onSuccess: (campaign: Campaign) => void;
  shouldLoadTemplate?: boolean;
  editingCampaign?: Campaign | null;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function CreateCampaignModal({ 
  onClose, 
  onSuccess, 
  shouldLoadTemplate = false,
  editingCampaign = null 
}: CreateCampaignModalProps) {
  const { user, profile } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [groups, setGroups] = useState<ContactGroup[]>([]);
  const [verifiedDomains, setVerifiedDomains] = useState<VerifiedDomain[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [contactsLoading, setContactsLoading] = useState(false);
  const [contactsError, setContactsError] = useState<string | null>(null);
  const [contactSearchQuery, setContactSearchQuery] = useState('');


  const navigate = useNavigate();
  const location = useLocation();
  const isEditMode = !!editingCampaign;

  const username = user?.email?.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '') || 'user';
  const defaultDomain = 'mail.mailwizard.io';

  // Form data state
  // ✅ MODIFIED: Function to get initial form data
const getInitialFormData = (): CampaignFormData => {
  if (editingCampaign) {
    // Pre-populate from existing campaign
    const recipients = editingCampaign.content?.recipients || {};
    
    return {
      // Step 1
      name: editingCampaign.name || '',
      description: editingCampaign.content?.description || '',
      subject: editingCampaign.subject || '',
      previewText: editingCampaign.preview_text || '',
      fromName: editingCampaign.from_name || profile?.full_name || '',
      fromEmail: editingCampaign.from_email || `${username}@mail.mailwizard.io`,
      replyTo: editingCampaign.reply_to || user?.email || '',

      // Step 2
      templateId: editingCampaign.content?.templateId || '',
      customHtml: editingCampaign.custom_html || editingCampaign.content?.html || null,
      inputMode: (editingCampaign.custom_html || editingCampaign.content?.html) ? 'custom' : 'template',

      // Step 3
      sendToMode: recipients.sendToMode || 'all',
      selectedGroups: new Set(recipients.selectedGroups || []),
      selectedContacts: new Set(recipients.selectedContacts || []),

      // Step 4
      scheduleMode: 'draft',
      scheduledDate: new Date().toISOString().split('T')[0],
      scheduledTime: '09:00',
    };
  }

  // Default form data for new campaigns
  return {
    name: '',
    description: '',
    subject: '',
    previewText: '',
    fromName: profile?.full_name || '',
    fromEmail: `${username}@mail.mailwizard.io`,
    replyTo: user?.email || '',
    templateId: '',
    customHtml: null,
    inputMode: 'template',
    sendToMode: 'all',
    selectedGroups: new Set<string>(),
    selectedContacts: new Set<string>(),
    scheduleMode: 'draft',
    scheduledDate: new Date().toISOString().split('T')[0],
    scheduledTime: '09:00',
  };
};

const [formData, setFormData] = useState<CampaignFormData>(getInitialFormData());

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Template fetching state
  const [allTemplates, setAllTemplates] = useState<any[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);

  // ============================================================================
  // DRAFT SAVING - DATABASE ONLY (NO AUTO-SAVE)
  // ============================================================================

  /**
   * Save draft to database - NO VALIDATION REQUIRED
   * Can be called from any step with partial data
   */
  const handleSaveDraft = async () => {
    if (!user) {
      toast.error('You must be logged in to save drafts');
      return;
    }

    try {
      setIsSubmitting(true);

      // Prepare campaign data - use current values, allow empty/incomplete
      const campaignData: any = {
        user_id: user.id,
        name: formData.name?.trim() || 'Untitled Campaign',
        subject: formData.subject?.trim() || '',
        preview_text: formData.previewText?.trim() || null,
        from_name: formData.fromName?.trim() || '',
        from_email: formData.fromEmail?.trim() || '',
        reply_to: formData.replyTo?.trim() || '',
        custom_html: formData.customHtml?.trim() || null,
        content: {
          templateId: formData.templateId || '',
          description: formData.description?.trim() || '',
          html: formData.customHtml?.trim() || null,
          recipients: {
            sendToMode: formData.sendToMode,
            selectedGroups: Array.from(formData.selectedGroups),
            selectedContacts: Array.from(formData.selectedContacts),
          },
          currentStep: currentStep, // Save which step user is on
        },
        status: 'draft',
        recipients_count: calculateRecipientCount(),
        updated_at: new Date().toISOString(),
      };

      let campaign;

      if (isEditMode) {
        // UPDATE existing draft
        console.log('📝 Updating draft:', editingCampaign.id);
        
        const { data, error } = await supabase
          .from('campaigns')
          .update(campaignData)
          .eq('id', editingCampaign.id)
          .select()
          .single();

        if (error) throw error;
        campaign = data;
        
        toast.success('✅ Draft updated successfully!');
      } else {
        // INSERT new draft
        console.log('💾 Saving new draft...');
        
        const { data, error } = await supabase
          .from('campaigns')
          .insert(campaignData)
          .select()
          .single();

        if (error) throw error;
        campaign = data;
        
        toast.success('✅ Draft saved successfully!');
      }

      // After saving, call onSuccess to refresh campaign list
      onSuccess(campaign);
      onClose();

    } catch (error: any) {
      console.error('❌ Failed to save draft:', error);
      toast.error(error.message || 'Failed to save draft');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ============================================================================
  // SESSION STORAGE CLEANUP
  // ============================================================================

  /**
   * Clear draft data from sessionStorage
   * Called after successfully creating a new campaign to clean up
   * any template editor session data
   */
  const clearDraft = () => {
    console.log('🧹 Clearing draft data from sessionStorage');
    sessionStorage.removeItem('campaignDraft');
    sessionStorage.removeItem('editedTemplate');
  };



  // ============================================================================
  // DATA LOADING
  // ============================================================================

  useEffect(() => {
    loadContactsAndGroups();
  }, []);
  // Add this near the top of the CreateCampaignModal function
// In CreateCampaignModal.tsx - Replace the entire restoration useEffect

useEffect(() => {
  if (shouldLoadTemplate) {
    console.log('🔄 shouldLoadTemplate flag detected');
    
    const campaignDraft = sessionStorage.getItem('campaignDraft');
    const editedTemplate = sessionStorage.getItem('editedTemplate');

    console.log('📦 campaignDraft:', campaignDraft ? 'Found' : 'Not found');
    console.log('📦 editedTemplate:', editedTemplate ? 'Found' : 'Not found');

    if (campaignDraft && editedTemplate) {
      try {
        const draft = JSON.parse(campaignDraft);
        const template = JSON.parse(editedTemplate);

        console.log('✅ Parsed draft:', draft);
        console.log('✅ Parsed template:', template);

        // Restore ALL form data with edited template
        const restoredFormData = {
  ...draft.formData,
  customHtml: template.html || template.content?.html || '',
  templateId: template.templateId || draft.formData.templateId,
  inputMode: 'custom' as const,
  // ✅ FIX: Convert Arrays back to Sets
  selectedGroups: new Set(draft.formData.selectedGroups || []),
  selectedContacts: new Set(draft.formData.selectedContacts || [])
};

        console.log('🔄 Restoring form data:', restoredFormData);
        
        setFormData(restoredFormData);

        // Move to step 3 (Recipients) after a small delay
        setTimeout(() => {
          console.log('➡️ Advancing to Step 3');
          setCurrentStep(3);
          toast.success('✅ Template loaded! Now select recipients.');
        }, 100);

        // Clean up sessionStorage
        sessionStorage.removeItem('campaignDraft');
        sessionStorage.removeItem('editedTemplate');
        
        console.log('🧹 SessionStorage cleaned up');

      } catch (error) {
        console.error('❌ Error restoring campaign draft:', error);
        toast.error('Failed to restore campaign. Please start over.');
      }
    } else {
      console.warn('⚠️ Missing data in sessionStorage');
      if (!campaignDraft) console.warn('  - campaignDraft is missing');
      if (!editedTemplate) console.warn('  - editedTemplate is missing');
    }
  }
}, [shouldLoadTemplate]);
  // Handle return from template editor
  useEffect(() => {
    if (shouldLoadTemplate && location.state?.completedTemplate) {
      const { html, campaignName, campaignSubject } = location.state.completedTemplate;

      console.log('✅ Loading template data - shouldLoadTemplate=true');

      // Update form data with template HTML
      setFormData(prev => ({
        ...prev,
        customHtml: html,
        name: campaignName,
        subject: campaignSubject
      }));

      // Set to step 3 (recipients)
      setCurrentStep(3);

      // Clear navigation state
      window.history.replaceState({}, document.title);

      toast.success('Template customization complete! Now select your recipients.');
    }
  }, [shouldLoadTemplate, location.state]);

  // Fetch all templates (system + user)
  useEffect(() => {
    fetchAllTemplates();
  }, [user]);

  async function fetchAllTemplates() {
    try {
      setLoadingTemplates(true);
      
      // Fetch user templates
      const { data: userTemplates, error } = await supabase
        .from('templates')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Combine system templates + user templates
      const combined = [
        ...EMAIL_TEMPLATES.map(t => ({
          ...t,
          is_locked: true,
          user_id: null,
        })),
        ...(userTemplates || []),
      ];

      setAllTemplates(combined);
    } catch (error: any) {
      console.error('Failed to load templates:', error);
      toast.error('Failed to load templates');
    } finally {
      setLoadingTemplates(false);
    }
  }

  async function loadContactsAndGroups() {
    if (!user) return;

    setContactsLoading(true);
    setContactsError(null);

    try {
      // Load contacts
      const { data: contactsData, error: contactsError } = await supabase
        .from('contacts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (contactsError) throw contactsError;
      setContacts(contactsData || []);

      // Load groups
      const { data: groupsData, error: groupsError } = await supabase
        .from('contact_groups')
        .select('*')
        .eq('user_id', user.id)
        .order('name', { ascending: true });

      if (groupsError) throw groupsError;
      setGroups(groupsData || []);

      // Load verified domains
      const { data: domainsData, error: domainsError } = await supabase
        .from('sending_domains')
        .select('id, domain, verification_status')
        .eq('user_id', user.id)
        .eq('verification_status', 'verified')
        .order('is_default', { ascending: false });

      if (domainsError) throw domainsError;
      setVerifiedDomains(domainsData || []);

    } catch (error: any) {
      console.error('Error loading data:', error);
      setContactsError('Failed to load contacts and groups');
      toast.error('Failed to load contacts and groups');
    } finally {
      setContactsLoading(false);
      setLoadingData(false);
    }
  }

  // ============================================================================
  // FORM HANDLERS
  // ============================================================================

  function updateField(field: keyof CampaignFormData, value: any) {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  }

  function toggleGroup(groupId: string) {
    setFormData(prev => {
      const next = new Set(prev.selectedGroups);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return { ...prev, selectedGroups: next };
    });
  }

  function toggleContact(contactId: string) {
    setFormData(prev => {
      const next = new Set(prev.selectedContacts);
      if (next.has(contactId)) {
        next.delete(contactId);
      } else {
        next.add(contactId);
      }
      return { ...prev, selectedContacts: next };
    });
  }

  function toggleAllContacts() {
    setFormData(prev => {
      if (prev.selectedContacts.size === contacts.length) {
        return { ...prev, selectedContacts: new Set() };
      } else {
        return { ...prev, selectedContacts: new Set(contacts.map(c => c.id)) };
      }
    });
  }

  function calculateRecipientCount(): number {
    if (formData.sendToMode === 'all') {
      return contacts.filter(c => c.status === 'active').length;
    } else if (formData.sendToMode === 'contacts') {
      return Array.from(formData.selectedContacts).filter(id => 
        contacts.find(c => c.id === id && c.status === 'active')
      ).length;
    } else if (formData.sendToMode === 'groups') {
      // This is an approximation - actual count would require joining tables
      return groups
        .filter(g => formData.selectedGroups.has(g.id))
        .reduce((sum, g) => sum + (g.contact_count || 0), 0);
    }
    return 0;
  }

  // ============================================================================
  // VALIDATION
  // ============================================================================

  function validateStep(step: number): boolean {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      // Campaign details validation
      if (!formData.name.trim()) {
        newErrors.name = 'Campaign name is required';
      }
      if (!formData.subject.trim()) {
        newErrors.subject = 'Subject line is required';
      }
      if (!formData.fromName.trim()) {
        newErrors.fromName = 'From name is required';
      }
      if (!formData.fromEmail.trim()) {
        newErrors.fromEmail = 'From email is required';
      }
      if (!formData.replyTo.trim()) {
        newErrors.replyTo = 'Reply-to email is required';
      }
    } else if (step === 2) {
      // Template validation
      if (formData.inputMode === 'custom') {
        if (!formData.customHtml || formData.customHtml.trim().length === 0) {
          newErrors.customHtml = 'HTML code is required';
        }
      } else if (formData.inputMode === 'template') {
        if (!formData.templateId) {
          newErrors.templateId = 'Please select a template';
        }
      }
    } else if (step === 3) {
      // Recipients validation
      if (formData.sendToMode === 'groups' && formData.selectedGroups.size === 0) {
        newErrors.recipients = 'Please select at least one group';
      } else if (formData.sendToMode === 'contacts' && formData.selectedContacts.size === 0) {
        newErrors.recipients = 'Please select at least one contact';
      }
    } else if (step === 4) {
      // Schedule validation
      if (formData.scheduleMode === 'later') {
        if (!formData.scheduledDate) {
          newErrors.scheduledDate = 'Please select a date';
        } else {
          const scheduledDateTime = new Date(`${formData.scheduledDate}T${formData.scheduledTime}`);
          if (scheduledDateTime <= new Date()) {
            newErrors.scheduledDate = 'Scheduled time must be in the future';
          }
        }

        if (!formData.scheduledTime) {
          newErrors.scheduledTime = 'Please select a time';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  // ============================================================================
  // NAVIGATION
  // ============================================================================

  /**
   * Go to next step
   */
  function handleNext() {
    const newErrors: Record<string, string> = {};

    if (currentStep === 1) {
      // Step 1 validation
      if (!validateStep(1)) {
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      // Step 2 validation - handle dual paths
      if (formData.inputMode === 'custom') {
        if (!formData.customHtml || formData.customHtml.trim().length === 0) {
          setErrors({ customHtml: 'HTML code is required' });
          return;
        }
        updateField('templateId', '');
        setCurrentStep(3);
      } else if (formData.inputMode === 'template') {
  if (!formData.templateId) {
    setErrors({ templateId: 'Please select a template' });
    return;
  }
  
  // ✅ FIX: Save campaign data to sessionStorage BEFORE navigating
 // When saving to sessionStorage, convert Sets to Arrays
const campaignDraft = {
  step: 2,
  formData: {
    ...formData,
    // ✅ Convert Sets to Arrays for JSON serialization
    selectedGroups: Array.from(formData.selectedGroups),
    selectedContacts: Array.from(formData.selectedContacts)
  },
  timestamp: Date.now()
};

console.log('💾 Saving campaignDraft to sessionStorage:', campaignDraft);
sessionStorage.setItem('campaignDraft', JSON.stringify(campaignDraft));
  
  console.log('💾 Saving campaignDraft to sessionStorage:', campaignDraft);
  sessionStorage.setItem('campaignDraft', JSON.stringify(campaignDraft));
  
  // Verify it was saved
  const saved = sessionStorage.getItem('campaignDraft');
  console.log('✅ CampaignDraft saved, verification:', saved ? 'Success' : 'Failed');
  
  // Navigate to template editor with template ID
  console.log('🔀 Navigating to template editor with ID:', formData.templateId);
  navigate(`/app/template-editor?templateId=${formData.templateId}&returnToCampaign=true`);
  return;
}
    } else if (currentStep === 3) {
      // Step 3 validation
      if (!validateStep(3)) {
        return;
      }
      setCurrentStep(4);
    }
  }

  /**
   * Go to previous step
   */
  function handleBack() {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  }

  // ============================================================================
  // CAMPAIGN CREATION
  // ============================================================================

  /**
   * Create campaign with full validation
   */
  async function handleCreateCampaign() {
    if (!user) {
      toast.error('You must be logged in to create campaigns');
      return;
    }

    // Validate current step before proceeding
    if (!validateStep(currentStep)) {
      return;
    }

    try {
      setIsSubmitting(true);

      // Build campaign data
      const campaignData: any = {
        user_id: user.id,
        name: formData.name.trim(),
        subject: formData.subject.trim(),
        preview_text: formData.previewText?.trim() || null,
        from_name: formData.fromName.trim(),
        from_email: formData.fromEmail.trim(),
        reply_to: formData.replyTo.trim(),
        custom_html: formData.customHtml?.trim() || null,
        content: {
          templateId: formData.templateId || '',
          description: formData.description?.trim() || '',
          html: formData.customHtml?.trim() || null,
          recipients: {
            sendToMode: formData.sendToMode,
            selectedGroups: Array.from(formData.selectedGroups),
            selectedContacts: Array.from(formData.selectedContacts),
          },
        },
        status: formData.scheduleMode === 'now' 
            ? 'sending' 
            : formData.scheduleMode === 'later' ? 'scheduled' 
            : 'draft',
      recipients_count: calculateRecipientCount(),
      updated_at: new Date().toISOString(),
    };

    // Add scheduling if selected
    if (formData.scheduleMode === 'later') {
      campaignData.scheduled_at = new Date(`${formData.scheduledDate}T${formData.scheduledTime}`).toISOString();
    }

    let campaign;

    if (isEditMode) {
      // ✅ UPDATE existing campaign
      console.log('📝 Updating campaign:', editingCampaign.id);
      
      const { data, error } = await supabase
        .from('campaigns')
        .update(campaignData)
        .eq('id', editingCampaign.id)
        .select()
        .single();

      if (error) throw error;
      campaign = data;
      
      toast.success('✅ Campaign updated successfully!');
    } else {
      // ✅ INSERT new campaign
      console.log('✨ Creating new campaign');
      
      const { data, error } = await supabase
        .from('campaigns')
        .insert(campaignData)
        .select()
        .single();

      if (error) throw error;
      campaign = data;
      
      toast.success('✅ Campaign created successfully!');
      clearDraft(); // Only clear draft for new campaigns
    }

      // ✅ FIX: Actually send emails when "Send Now" is selected
if (formData.scheduleMode === 'now') {
  console.log('📧 Send Now selected - starting email sending...');
  
  // Show loading toast
  const sendToastId = toast.loading('Campaign created! Sending emails...');
  
  try {
    // Build recipient list
    let recipientList: Contact[] = [];
    
    if (formData.sendToMode === 'all') {
      recipientList = contacts.filter((c) => c.status === "active");
    } else if (formData.sendToMode === 'contacts') {
      const selectedIds = Array.from(formData.selectedContacts);
      recipientList = contacts.filter(
        (c) => selectedIds.includes(c.id) && c.status === "active"
      );
    } else if (formData.sendToMode === 'groups') {
      const groupIds = Array.from(formData.selectedGroups);
      const { data: groupMembers } = await supabase
        .from("contact_group_members")
        .select("contact_id")
        .in("group_id", groupIds);

      if (groupMembers) {
        const contactIds = groupMembers.map((gm) => gm.contact_id);
        recipientList = contacts.filter(
          (c) => contactIds.includes(c.id) && c.status === "active"
        );
      }
    }
    

    console.log(`📊 Sending to ${recipientList.length} recipients`);
    

    let successCount = 0;
    let failCount = 0;

    // Extract sending domain ID
    const sendingDomainId = campaignData.content?.sending_domain_id || null;

    // Send to each recipient
    for (let i = 0; i < recipientList.length; i++) {
      const recipient = recipientList[i];
      
      try {
        // Personalize HTML
        const campaignHtml = formData.customHtml || '';
        let personalizedHtml = campaignHtml
          .replace(/\{\{MERGE:first_name\}\}/g, recipient.first_name || '')
          .replace(/\{\{MERGE:last_name\}\}/g, recipient.last_name || '')
          .replace(/\{\{MERGE:email\}\}/g, recipient.email || '')
          .replace(/\{\{firstname\}\}/gi, recipient.first_name || '')
          .replace(/\{\{lastname\}\}/gi, recipient.last_name || '')
          .replace(/\{\{email\}\}/gi, recipient.email || '');

        // Send email via edge function
        const { error: sendError } = await supabase.functions.invoke(
          "send-email",
          {
            body: {
              to: recipient.email.trim(),
              subject: formData.subject.trim(),
              html: personalizedHtml.trim(),
              from_name: formData.fromName.trim(),
              reply_to: formData.replyTo.trim(),
              sending_domain_id: sendingDomainId,
              campaign_id: campaign.id,
              contact_id: recipient.id,
              personalization: {
                first_name: recipient.first_name || "",
                last_name: recipient.last_name || "",
                email: recipient.email || "",
              },
            },
          }
        );

        if (sendError) {
          console.error(`❌ Failed to send to ${recipient.email}:`, sendError);
          failCount++;
        } else {
          console.log(`✅ Sent to ${recipient.email}`);
          successCount++;
        }
      } catch (error) {
        console.error(`❌ Error sending to ${recipient.email}:`, error);
        failCount++;
      }

      // Update progress toast every 10 emails
      if ((i + 1) % 10 === 0 || i === recipientList.length - 1) {
        toast.loading(
          `Sending emails... ${i + 1}/${recipientList.length}`,
          { id: sendToastId }
        );
      }
    }

    // Update campaign status to sent
    await supabase
      .from("campaigns")
      .update({
        status: "sent",
        sent_at: new Date().toISOString(),
      })
      .eq("id", campaign.id);

    console.log(`✅ Campaign sending complete: ${successCount} sent, ${failCount} failed`);
    toast.success(
      `Campaign sent! ${successCount} emails delivered${failCount > 0 ? `, ${failCount} failed` : ''}`,
      { id: sendToastId }
    );
  } catch (error: any) {
    console.error('❌ Error during sending:', error);
    toast.error('Failed to send emails', { id: sendToastId });
  }
}

toast.success(
  formData.scheduleMode === 'now' 
    ? 'Campaign created and queued for sending!' 
    : formData.scheduleMode === 'later' 
      ? 'Campaign scheduled successfully!'
      : 'Campaign saved as draft!'
  );
}

onSuccess(campaign);
onClose();
    } catch (error: any) {
      console.error('Failed to create campaign:', error);
      toast.error(error.message || 'Failed to create campaign');
    } finally {
      setIsSubmitting(false);
    }
  }

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="border-b-2 border-black p-6">
  <div className="flex items-center justify-between">
    <div>
      <h2 className="text-3xl font-serif font-bold">
        {isEditMode ? 'Edit Campaign' : 'Create Campaign'}
      </h2>
      {isEditMode && (
        <p className="text-sm text-gray-600 mt-1">
          Editing: {editingCampaign.name}
        </p>
      )}
    </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center gap-2 mt-6">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className="flex items-center flex-1">
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all ${
                    step < currentStep
                      ? 'bg-green-500 border-green-500 text-white'
                      : step === currentStep
                      ? 'bg-purple border-purple text-white'
                      : 'bg-white border-gray-300 text-gray-400'
                  }`}
                >
                  {step < currentStep ? (
                    <Check size={16} />
                  ) : (
                    <span className="text-sm font-semibold">{step}</span>
                  )}
                </div>
                {step < 4 && (
                  <div
                    className={`flex-1 h-0.5 ${
                      step < currentStep ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Step Labels */}
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs font-medium text-gray-600 flex-1 text-center">
              Details
            </span>
            <span className="text-xs font-medium text-gray-600 flex-1 text-center">
              Template
            </span>
            <span className="text-xs font-medium text-gray-600 flex-1 text-center">
              Recipients
            </span>
            <span className="text-xs font-medium text-gray-600 flex-1 text-center">
              Schedule
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {currentStep === 1 && (
            <Step1CampaignDetails
              formData={formData}
              errors={errors}
              updateField={updateField}
              verifiedDomains={verifiedDomains}
              defaultDomain={defaultDomain}
              username={username}
              onSaveDraft={handleSaveDraft}
              isSubmitting={isSubmitting}
            />
          )}

          {currentStep === 2 && (
            <Step2Template
              formData={formData}
              errors={errors}
              updateField={updateField}
              allTemplates={allTemplates}
              loadingTemplates={loadingTemplates}
              onSaveDraft={handleSaveDraft}
              isSubmitting={isSubmitting}
            />
          )}

          {currentStep === 3 && (
            <Step3Recipients
              formData={formData}
              contacts={contacts}
              groups={groups}
              errors={errors}
              updateField={updateField}
              toggleGroup={toggleGroup}
              toggleContact={toggleContact}
              toggleAllContacts={toggleAllContacts}
              recipientCount={calculateRecipientCount()}
              contactsLoading={contactsLoading}
              contactsError={contactsError}
              contactSearchQuery={contactSearchQuery}
              setContactSearchQuery={setContactSearchQuery}
              onSaveDraft={handleSaveDraft}
              isSubmitting={isSubmitting}
            />
          )}

          {currentStep === 4 && (
            <Step4Schedule
              formData={formData}
              errors={errors}
              updateField={updateField}
              onSaveDraft={handleSaveDraft}
              isSubmitting={isSubmitting}
            />
          )}
        </div>

        {/* Footer */}
        <div className="border-t-2 border-black p-6">
          <div className="flex items-center justify-between">
            <div>
              <Button
                variant="secondary"
                onClick={currentStep === 1 ? onClose : handleBack}
                disabled={isSubmitting}
                icon={currentStep === 1 ? X : ChevronLeft}
              >
                {currentStep === 1 ? 'Cancel' : 'Back'}
              </Button>

            </div>

            <div className="flex gap-3">
              {currentStep < 4 ? (
                <Button
                  variant="primary"
                  onClick={handleNext}
                  icon={ChevronRight}
                  iconPosition="right"
                >
                  Next
                </Button>
              ) : (
                <Button
                  variant="primary"
                  onClick={handleCreateCampaign}
                  loading={isSubmitting}
                  disabled={isSubmitting}
                  icon={Mail}
                >
                  {isEditMode 
                    ? 'Update Campaign'
                    : formData.scheduleMode === 'now' ? 'Create & Prepare to Send' 
                    : formData.scheduleMode === 'later' ? 'Schedule Campaign'
                    : 'Save as Draft'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// STEP COMPONENTS
// ============================================================================

function Step1CampaignDetails({
  formData,
  errors,
  updateField,
  verifiedDomains,
  defaultDomain,
  username,
  onSaveDraft,
  isSubmitting,
}: {
  formData: CampaignFormData;
  errors: Record<string, string>;
  updateField: (field: keyof CampaignFormData, value: any) => void;
  verifiedDomains: VerifiedDomain[];
  defaultDomain: string;
  username: string;
  onSaveDraft: () => void;
  isSubmitting: boolean;
}) {
  const [selectedDomain, setSelectedDomain] = useState(defaultDomain);
  const [localPart, setLocalPart] = useState(username);

  const handleDomainChange = (domain: string) => {
    setSelectedDomain(domain);
    updateField('fromEmail', `${localPart}@${domain}`);
  };

  const handleLocalPartChange = (value: string) => {
    const sanitized = value.toLowerCase().replace(/[^a-z0-9._-]/g, '');
    setLocalPart(sanitized);
    updateField('fromEmail', `${sanitized}@${selectedDomain}`);
  };

  return (
    <div className="space-y-6">
      {/* Step Header with Save Draft Button */}
      <div className="flex items-start justify-between pb-4 border-b border-gray-200">
        <div>
          <h3 className="text-lg font-semibold mb-2">Campaign Information</h3>
          <p className="text-gray-600 text-sm">
            Provide basic information about your email campaign.
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={onSaveDraft}
          disabled={isSubmitting}
          icon={Save}
        >
          Save Draft
        </Button>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          Campaign Name <span className="text-red-500">*</span>
        </label>
        <Input
          type="text"
          placeholder="e.g., Summer Newsletter 2024"
          value={formData.name}
          onChange={(e) => updateField('name', e.target.value)}
          error={errors.name}
        />
        <p className="text-xs text-gray-500 mt-1">
          {formData.name.length}/100 characters
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          Description <span className="text-gray-400">(Optional)</span>
        </label>
        <textarea
          placeholder="Brief description of this campaign..."
          value={formData.description}
          onChange={(e) => updateField('description', e.target.value)}
          className="w-full px-4 py-3 border-2 border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-purple resize-none"
          rows={3}
        />
        <p className="text-xs text-gray-500 mt-1">
          {formData.description.length}/500 characters
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          Subject Line <span className="text-red-500">*</span>
        </label>
        <Input
          type="text"
          placeholder="e.g., Check out our summer deals!"
          value={formData.subject}
          onChange={(e) => updateField('subject', e.target.value)}
          error={errors.subject}
        />
        <p className="text-xs text-gray-500 mt-1">
          {formData.subject.length}/200 characters
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          Preview Text <span className="text-gray-400">(Optional)</span>
        </label>
        <Input
          type="text"
          placeholder="This appears below the subject line in inboxes..."
          value={formData.previewText}
          onChange={(e) => updateField('previewText', e.target.value)}
          error={errors.previewText}
        />
        <p className="text-xs text-gray-500 mt-1">
          Appears in email previews. {formData.previewText.length}/150 characters
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            From Name <span className="text-red-500">*</span>
          </label>
          <Input
            type="text"
            placeholder="Your Name or Company"
            value={formData.fromName}
            onChange={(e) => updateField('fromName', e.target.value)}
            error={errors.fromName}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            From Email <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="username"
              value={localPart}
              onChange={(e) => handleLocalPartChange(e.target.value)}
              className="flex-1"
              error={errors.fromEmail}
            />
            <select
              value={selectedDomain}
              onChange={(e) => handleDomainChange(e.target.value)}
              className="px-3 py-2 border-2 border-black rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-purple"
            >
              <option value={defaultDomain}>@{defaultDomain}</option>
              {verifiedDomains.map((domain) => (
                <option key={domain.id} value={domain.domain}>
                  @{domain.domain}
                </option>
              ))}
            </select>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            This will appear as the sender in recipient inboxes
          </p>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          Reply-To Email <span className="text-red-500">*</span>
        </label>
        <Input
          type="email"
          placeholder="replies@yourdomain.com"
          value={formData.replyTo}
          onChange={(e) => updateField('replyTo', e.target.value)}
          error={errors.replyTo}
        />
        <p className="text-xs text-gray-500 mt-1">
          Where replies to this campaign will be sent
        </p>
      </div>
    </div>
  );
}

/**
 * Step 2: Template Selection
 */
function Step2Template({
  formData,
  errors,
  updateField,
  allTemplates,
  loadingTemplates,
  onSaveDraft,
  isSubmitting,
}: {
  formData: CampaignFormData;
  errors: Record<string, string>;
  updateField: (field: keyof CampaignFormData, value: any) => void;
  allTemplates: any[];
  loadingTemplates: boolean;
  onSaveDraft: () => void;
  isSubmitting: boolean;
}) {
  return (
    <div className="space-y-6">
      {/* Step Header with Save Draft Button */}
      <div className="flex items-start justify-between pb-4 border-b border-gray-200">
        <div>
          <h3 className="text-lg font-semibold mb-2">Choose Email Template</h3>
          <p className="text-gray-600 text-sm">
            Select a template or provide your own HTML code.
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={onSaveDraft}
          disabled={isSubmitting}
          icon={Save}
        >
          Save Draft
        </Button>
      </div>

      {/* Input Mode Toggle */}
      <div className="flex gap-3 p-1 bg-gray-100 rounded-lg">
        <button
          onClick={() => updateField('inputMode', 'template')}
          className={`flex-1 px-4 py-2 rounded-md font-medium transition-all ${
            formData.inputMode === 'template'
              ? 'bg-white text-purple shadow-sm'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <FileText size={18} />
            Use Template
          </div>
        </button>
        <button
          onClick={() => updateField('inputMode', 'custom')}
          className={`flex-1 px-4 py-2 rounded-md font-medium transition-all ${
            formData.inputMode === 'custom'
              ? 'bg-white text-purple shadow-sm'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <Code size={18} />
            Custom HTML
          </div>
        </button>
      </div>

      {/* Template Selection */}
      {formData.inputMode === 'template' && (
        <div>
          <label className="block text-sm font-medium mb-3">
            Select Template <span className="text-red-500">*</span>
          </label>
          
          {loadingTemplates ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="animate-spin text-purple" size={32} />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {allTemplates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => updateField('templateId', template.id)}
                  className={`relative p-4 border-2 rounded-lg text-left transition-all ${
                    formData.templateId === template.id
                      ? 'border-purple bg-purple/5 ring-2 ring-purple/20'
                      : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                  }`}
                >
                  {template.is_locked && (
                    <div className="absolute top-2 right-2">
                      <Lock size={16} className="text-gray-400" />
                    </div>
                  )}
                  
                  <div className="font-semibold mb-1">{template.name}</div>
                  <div className="text-xs text-gray-500 mb-2">
                    {template.category || 'General'}
                  </div>
                  
                  {template.description && (
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {template.description}
                    </p>
                  )}
                  
                  {formData.templateId === template.id && (
                    <div className="absolute top-2 left-2">
                      <CheckCircle size={20} className="text-purple" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
          
          {errors.templateId && (
            <p className="mt-2 text-sm text-red-600">{errors.templateId}</p>
          )}
        </div>
      )}

      {/* Custom HTML Input */}
      {formData.inputMode === 'custom' && (
        <div>
          <label className="block text-sm font-medium mb-2">
            HTML Code <span className="text-red-500">*</span>
          </label>
          <textarea
            placeholder="Paste your HTML email code here..."
            value={formData.customHtml || ''}
            onChange={(e) => updateField('customHtml', e.target.value)}
            className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple resize-none font-mono text-sm ${
              errors.customHtml ? 'border-red-500' : 'border-black'
            }`}
            rows={12}
          />
          {errors.customHtml && (
            <p className="mt-2 text-sm text-red-600">{errors.customHtml}</p>
          )}
          <p className="text-xs text-gray-500 mt-2">
            Paste your complete HTML email template including all styling.
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * Step 3: Recipients
 */
function Step3Recipients({
  formData,
  contacts,
  groups,
  errors,
  updateField,
  toggleGroup,
  toggleContact,
  toggleAllContacts,
  recipientCount,
  contactsLoading,
  contactsError,
  contactSearchQuery,
  setContactSearchQuery,
  onSaveDraft,
  isSubmitting,
}: {
  formData: CampaignFormData;
  contacts: Contact[];
  groups: ContactGroup[];
  errors: Record<string, string>;
  updateField: (field: keyof CampaignFormData, value: any) => void;
  toggleGroup: (groupId: string) => void;
  toggleContact: (contactId: string) => void;
  toggleAllContacts: () => void;
  recipientCount: number;
  contactsLoading: boolean;
  contactsError: string | null;
  contactSearchQuery: string;
  setContactSearchQuery: (query: string) => void;
  onSaveDraft: () => void;
  isSubmitting: boolean;
}) {
  // ✅ FIX 4: Filter contacts based on search query
  const filteredContacts = contacts.filter(contact => {
    if (!contactSearchQuery) return true;
    const searchLower = contactSearchQuery.toLowerCase();
    const fullName = `${contact.first_name || ''} ${contact.last_name || ''}`.toLowerCase();
    const email = (contact.email || '').toLowerCase();
    return fullName.includes(searchLower) || email.includes(searchLower);
  });

  return (
    <div className="space-y-6">
      {/* Step Header with Save Draft Button */}
      <div className="flex items-start justify-between pb-4 border-b border-gray-200">
        <div>
          <h3 className="text-lg font-semibold mb-2">Select Recipients</h3>
          <p className="text-gray-600 text-sm">
            Choose who will receive this campaign.
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={onSaveDraft}
          disabled={isSubmitting}
          icon={Save}
        >
          Save Draft
        </Button>
      </div>

      {/* Send To Mode Selection */}
      <div>
        <label className="block text-sm font-medium mb-3">
          Send To <span className="text-red-500">*</span>
        </label>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => updateField('sendToMode', 'all')}
            className={`px-4 py-2 rounded-full font-medium transition-colors ${
              formData.sendToMode === 'all'
                ? 'bg-purple text-white'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            All Contacts ({contacts.filter(c => c.status === 'active').length})
          </button>
          <button
            onClick={() => updateField('sendToMode', 'groups')}
            className={`px-4 py-2 rounded-full font-medium transition-colors ${
              formData.sendToMode === 'groups'
                ? 'bg-purple text-white'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            Select Groups
          </button>
          <button
            onClick={() => updateField('sendToMode', 'contacts')}
            className={`px-4 py-2 rounded-full font-medium transition-colors ${
              formData.sendToMode === 'contacts'
                ? 'bg-purple text-white'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            Select Contacts
          </button>
        </div>
        {errors.recipients && (
          <p className="mt-2 text-sm text-red-600">{errors.recipients}</p>
        )}
      </div>

      {/* Group Selection */}
      {formData.sendToMode === 'groups' && (
        <div>
          <label className="block text-sm font-medium mb-3">
            Select Groups
          </label>
          {contactsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="animate-spin text-purple" size={24} />
            </div>
          ) : contactsError ? (
            <div className="text-center py-8 text-red-600">{contactsError}</div>
          ) : groups.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No groups found. Create groups to organize your contacts.
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto border border-gray-200 rounded-lg p-4">
              {groups.map((group) => (
                <label
                  key={group.id}
                  className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={formData.selectedGroups.has(group.id)}
                    onChange={() => toggleGroup(group.id)}
                    className="w-4 h-4 text-purple focus:ring-purple rounded"
                  />
                  <div className="flex-1">
                    <div className="font-medium">{group.name}</div>
                    {group.description && (
                      <div className="text-sm text-gray-500">{group.description}</div>
                    )}
                    <div className="text-xs text-gray-400 mt-1">
                      {group.contact_count || 0} contact{group.contact_count !== 1 ? 's' : ''}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Contact Selection */}
      {formData.sendToMode === 'contacts' && (
        <>
          <div>
            <label className="block text-sm font-medium mb-3">
              Select Contacts
            </label>
            
            {/* ✅ FIX 1: Added Search Input */}
            <div className="mb-3">
              <Input
                type="text"
                placeholder="Search contacts by name or email..."
                value={contactSearchQuery}
                onChange={(e) => setContactSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>

            {contactsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="animate-spin text-purple" size={24} />
              </div>
            ) : contactsError ? (
              <div className="text-center py-8 text-red-600">{contactsError}</div>
            ) : contacts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No contacts found. Add contacts to send campaigns.
              </div>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto border border-gray-200 rounded-lg p-4">
                {/* ✅ FIX 2: Select All Checkbox */}
                <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer font-medium border-b border-gray-200">
                  <input
                    type="checkbox"
                    checked={formData.selectedContacts.size === contacts.length && contacts.length > 0}
                    onChange={toggleAllContacts}
                    className="w-4 h-4 text-purple focus:ring-purple rounded"
                  />
                  <span>Select All ({contacts.length})</span>
                </label>

                {/* ✅ FIX 3: Render filtered contacts */}
                {filteredContacts.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No contacts match your search.
                  </div>
                ) : (
                  filteredContacts.map((contact) => (
                    <label
                      key={contact.id}
                      className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={formData.selectedContacts.has(contact.id)}
                        onChange={() => toggleContact(contact.id)}
                        className="w-4 h-4 text-purple focus:ring-purple rounded"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">
                          {contact.first_name || contact.last_name
                            ? `${contact.first_name || ''} ${contact.last_name || ''}`.trim()
                            : 'No Name'}
                        </div>
                        <div className="text-sm text-gray-500 truncate">{contact.email}</div>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        contact.status === 'active'
                          ? 'bg-green-100 text-green-700'
                          : contact.status === 'subscribed'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {contact.status}
                      </span>
                    </label>
                  ))
                )}
              </div>

              {/* ✅ Results Count */}
              {contactSearchQuery && (
                <div className="mt-3 text-xs text-gray-600 text-center">
                  Showing {filteredContacts.length} of {contacts.length} contacts
                </div>
              )}
            </div>
          )}

          {/* Recipient Count Display */}
          <div className="bg-purple/5 border border-purple/20 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <Users size={20} className="text-purple" />
              <div>
                <div className="font-semibold">
                  {recipientCount} {recipientCount === 1 ? 'Recipient' : 'Recipients'}
                </div>
                <div className="text-sm text-gray-600">
                  This campaign will be sent to {recipientCount} contact{recipientCount !== 1 ? 's' : ''}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/**
 * Step 4: Schedule
 */
function Step4Schedule({
  formData,
  errors,
  updateField,
  onSaveDraft,
  isSubmitting,
}: {
  formData: CampaignFormData;
  errors: Record<string, string>;
  updateField: (field: keyof CampaignFormData, value: any) => void;
  onSaveDraft: () => void;
  isSubmitting: boolean;
}) {
  return (
    <div className="space-y-6">
      {/* Header with visual indicator */}
      <div>
        <h3 className="text-lg font-semibold mb-2">When would you like to send?</h3>
        <p className="text-gray-600 text-sm mb-4">
          Choose when this campaign should be sent.
        </p>
        
        {/* ✅ NEW: Info banner */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-6">
          <div className="flex items-start gap-3">
            <AlertCircle size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Campaign Delivery Options</p>
              <p className="text-blue-700">
                Send immediately, schedule for a specific time, or save as draft to send later.
                Your recipient selection will be saved in all cases.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Schedule Options with enhanced styling */}
      <div className="space-y-4">
        {/* Send Now - Enhanced with icon and better description */}
        <label className={`cursor-pointer block ${
          formData.scheduleMode === 'now'
            ? 'bg-purple/10 border-purple ring-2 ring-purple/20'
            : 'bg-white border-gray-300 hover:border-gray-400 hover:shadow-sm'
        } border-2 rounded-lg p-5 transition-all duration-200`}>
          <div className="flex items-start gap-4">
            <input
              type="radio"
              name="scheduleMode"
              value="now"
              checked={formData.scheduleMode === 'now'}
              onChange={(e) => updateField('scheduleMode', e.target.value as 'now' | 'later' | 'draft')}
              className="mt-1.5 w-4 h-4 text-purple focus:ring-purple"
            />
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className={`p-2 rounded-lg ${
                  formData.scheduleMode === 'now' ? 'bg-purple text-white' : 'bg-gray-100 text-gray-600'
                }`}>
                  <Mail size={20} />
                </div>
                <span className="font-semibold text-lg">Send Now</span>
                <span className="ml-auto px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                  Immediate
                </span>
              </div>
              <p className="text-sm text-gray-600 ml-12">
                Campaign will be queued for immediate delivery after creation. 
                Sending typically begins within seconds.
              </p>
            </div>
          </div>
        </label>

        {/* Schedule for Later - Enhanced */}
        <label className={`cursor-pointer block ${
          formData.scheduleMode === 'later'
            ? 'bg-purple/10 border-purple ring-2 ring-purple/20'
            : 'bg-white border-gray-300 hover:border-gray-400 hover:shadow-sm'
        } border-2 rounded-lg p-5 transition-all duration-200`}>
          <div className="flex items-start gap-4">
            <input
              type="radio"
              name="scheduleMode"
              value="later"
              checked={formData.scheduleMode === 'later'}
              onChange={(e) => updateField('scheduleMode', e.target.value as 'now' | 'later' | 'draft')}
              className="mt-1.5 w-4 h-4 text-purple focus:ring-purple"
            />
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className={`p-2 rounded-lg ${
                  formData.scheduleMode === 'later' ? 'bg-purple text-white' : 'bg-gray-100 text-gray-600'
                }`}>
                  <Clock size={20} />
                </div>
                <span className="font-semibold text-lg">Schedule for Later</span>
                <span className="ml-auto px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
                  Scheduled
                </span>
              </div>
              <p className="text-sm text-gray-600 ml-12 mb-4">
                Choose a specific date and time to automatically send this campaign.
                Perfect for time-sensitive announcements.
              </p>

              {formData.scheduleMode === 'later' && (
                <div className="ml-12 grid grid-cols-2 gap-4 p-4 bg-purple/5 border border-purple/20 rounded-lg">
                  <div>
                    <label className="block text-xs font-medium mb-2 text-gray-700">
                      Date
                    </label>
                    <Input
                      type="date"
                      value={formData.scheduledDate}
                      onChange={(e) => updateField('scheduledDate', e.target.value)}
                      error={errors.scheduledDate}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-2 text-gray-700">
                      Time
                    </label>
                    <Input
                      type="time"
                      value={formData.scheduledTime}
                      onChange={(e) => updateField('scheduledTime', e.target.value)}
                      error={errors.scheduledTime}
                      className="w-full"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </label>

        {/* Keep as Draft - Enhanced */}
        <label className={`cursor-pointer block ${
          formData.scheduleMode === 'draft'
            ? 'bg-purple/10 border-purple ring-2 ring-purple/20'
            : 'bg-white border-gray-300 hover:border-gray-400 hover:shadow-sm'
        } border-2 rounded-lg p-5 transition-all duration-200`}>
          <div className="flex items-start gap-4">
            <input
              type="radio"
              name="scheduleMode"
              value="draft"
              checked={formData.scheduleMode === 'draft'}
              onChange={(e) => updateField('scheduleMode', e.target.value as 'now' | 'later' | 'draft')}
              className="mt-1.5 w-4 h-4 text-purple focus:ring-purple"
            />
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className={`p-2 rounded-lg ${
                  formData.scheduleMode === 'draft' ? 'bg-purple text-white' : 'bg-gray-100 text-gray-600'
                }`}>
                  <FileText size={20} />
                </div>
                <span className="font-semibold text-lg">Keep as Draft</span>
                <span className="ml-auto px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full">
                  Not Sent
                </span>
              </div>
              <p className="text-sm text-gray-600 ml-12">
                Save campaign for later review. You can edit, schedule, or send 
                it anytime from the campaigns page. Recipients will be saved.
              </p>
            </div>
          </div>
        </label>
      </div>
    </div>
  );
}