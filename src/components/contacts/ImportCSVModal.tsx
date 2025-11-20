import { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Upload, Check, ArrowRight, ArrowLeft } from 'lucide-react';
import Papa from 'papaparse';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

interface ImportCSVModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  groups: Array<{ id: string; name: string }>;
}

type Step = 'upload' | 'map' | 'group' | 'review';

interface CSVRow {
  [key: string]: string;
}

const FIELD_MAPPINGS = {
  email: ['email', 'e-mail', 'mail', 'email address'],
  first_name: ['first name', 'firstname', 'first', 'fname'],
  last_name: ['last name', 'lastname', 'last', 'lname'],
  company: ['company', 'organization', 'org', 'business'],
  role: ['role', 'title', 'job title', 'position'],
  industry: ['industry', 'sector', 'field']
};

export const ImportCSVModal = ({ isOpen, onClose, onSuccess, groups }: ImportCSVModalProps) => {
  const { user } = useAuth();
  const [step, setStep] = useState<Step>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [csvData, setCSVData] = useState<CSVRow[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [newGroupName, setNewGroupName] = useState('');
  const [importing, setImporting] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);

    Papa.parse(uploadedFile, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const data = results.data as CSVRow[];
        setCSVData(data);

        if (data.length > 0) {
          const detectedHeaders = Object.keys(data[0]);
          setHeaders(detectedHeaders);

          // Auto-detect column mappings
          const autoMapping: Record<string, string> = {};
          detectedHeaders.forEach(header => {
            const lowerHeader = header.toLowerCase();
            Object.entries(FIELD_MAPPINGS).forEach(([field, variations]) => {
              if (variations.some(v => lowerHeader.includes(v))) {
                autoMapping[header] = field;
              }
            });
          });
          setColumnMapping(autoMapping);
          setStep('map');
        }
      },
      error: (error) => {
        console.error('CSV parse error:', error);
        toast.error('Failed to parse CSV file');
      }
    });
  };

  const handleImport = async () => {
    if (!user) return;

    setImporting(true);
    try {
      // Create new group if needed
      let groupId = selectedGroupId;
      if (!groupId && newGroupName) {
        const { data: newGroup, error: groupError } = await supabase
          .from('contact_groups')
          .insert({
            user_id: user.id,
            name: newGroupName
          })
          .select()
          .single();

        if (groupError) throw groupError;
        groupId = newGroup.id;
      }

      // Prepare contacts for import
      const contacts = csvData
        .map(row => {
          const mappedRow: any = { user_id: user.id, status: 'active' };
          Object.entries(columnMapping).forEach(([csvCol, dbField]) => {
            if (row[csvCol]) {
              mappedRow[dbField] = row[csvCol];
            }
          });
          return mappedRow;
        })
        .filter(contact => contact.email); // Only import rows with email

      if (contacts.length === 0) {
        toast.error('No valid contacts found in CSV');
        return;
      }

      // Insert contacts
      const { data: insertedContacts, error: contactError } = await supabase
        .from('contacts')
        .upsert(contacts, { onConflict: 'user_id,email' })
        .select();

      if (contactError) throw contactError;

      // Add to group if specified
      if (groupId && insertedContacts) {
        const groupMembers = insertedContacts.map(contact => ({
          contact_id: contact.id,
          group_id: groupId
        }));

        const { error: memberError } = await supabase
          .from('contact_group_members')
          .upsert(groupMembers, { onConflict: 'contact_id,group_id' });

        if (memberError) throw memberError;
      }

      toast.success(`Successfully imported ${insertedContacts.length} contacts!`);
      resetModal();
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Import error:', error);
      toast.error('Failed to import contacts');
    } finally {
      setImporting(false);
    }
  };

  const resetModal = () => {
    setStep('upload');
    setFile(null);
    setCSVData([]);
    setHeaders([]);
    setColumnMapping({});
    setSelectedGroupId('');
    setNewGroupName('');
  };

  const validRows = csvData.filter(row => {
    const emailColumn = Object.keys(columnMapping).find(k => columnMapping[k] === 'email');
    return emailColumn && row[emailColumn];
  }).length;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Import Contacts from CSV" maxWidth="2xl">
      <div className="p-6">
        {/* Step Indicator */}
        <div className="flex items-center justify-between mb-6">
          {(['upload', 'map', 'group', 'review'] as Step[]).map((s, idx) => (
            <div key={s} className="flex items-center flex-1">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                step === s ? 'border-gold bg-gold text-black' :
                ['upload', 'map', 'group', 'review'].indexOf(step) > idx ? 'border-green-500 bg-green-500 text-white' :
                'border-gray-300 text-gray-400'
              }`}>
                {['upload', 'map', 'group', 'review'].indexOf(step) > idx ? <Check size={16} /> : idx + 1}
              </div>
              {idx < 3 && (
                <div className={`flex-1 h-0.5 mx-2 ${
                  ['upload', 'map', 'group', 'review'].indexOf(step) > idx ? 'bg-green-500' : 'bg-gray-300'
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        {step === 'upload' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Upload CSV File</h3>
              <p className="text-sm text-gray-600 mb-4">
                Required column: <span className="font-semibold">email</span><br />
                Optional columns: first_name, last_name, company, role, industry
              </p>
            </div>

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <Upload size={48} className="mx-auto mb-4 text-gray-400" />
              <label className="cursor-pointer">
                <span className="text-gold font-semibold hover:underline">Choose a file</span>
                <span className="text-gray-600"> or drag and drop</span>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
              <p className="text-sm text-gray-500 mt-2">CSV files only</p>
            </div>

            {file && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm font-semibold text-green-800">File loaded: {file.name}</p>
                <p className="text-sm text-green-600">{csvData.length} rows detected</p>
              </div>
            )}
          </div>
        )}

        {step === 'map' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Map Columns</h3>
              <p className="text-sm text-gray-600 mb-4">
                Match your CSV columns to contact fields
              </p>
            </div>

            <div className="space-y-3">
              {headers.map(header => (
                <div key={header} className="flex items-center gap-4">
                  <div className="w-1/3 font-medium">{header}</div>
                  <ArrowRight size={16} className="text-gray-400" />
                  <select
                    value={columnMapping[header] || ''}
                    onChange={(e) => setColumnMapping({ ...columnMapping, [header]: e.target.value })}
                    className="input-base flex-1"
                  >
                    <option value="">Don't import</option>
                    <option value="email">Email *</option>
                    <option value="first_name">First Name</option>
                    <option value="last_name">Last Name</option>
                    <option value="company">Company</option>
                    <option value="role">Role</option>
                    <option value="industry">Industry</option>
                  </select>
                </div>
              ))}
            </div>

            {!Object.values(columnMapping).includes('email') && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm font-semibold text-red-800">Email column is required</p>
                <p className="text-sm text-red-600">Please map at least one column to Email</p>
              </div>
            )}
          </div>
        )}

        {step === 'group' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Choose Group</h3>
              <p className="text-sm text-gray-600 mb-4">
                Add imported contacts to a group (optional)
              </p>
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="radio"
                  name="groupOption"
                  checked={!selectedGroupId && !newGroupName}
                  onChange={() => {
                    setSelectedGroupId('');
                    setNewGroupName('');
                  }}
                  className="w-4 h-4"
                />
                <span>Don't add to any group</span>
              </label>

              {groups.length > 0 && (
                <div>
                  <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer mb-2">
                    <input
                      type="radio"
                      name="groupOption"
                      checked={!!selectedGroupId}
                      onChange={() => setNewGroupName('')}
                      className="w-4 h-4"
                    />
                    <span>Add to existing group</span>
                  </label>
                  {selectedGroupId !== '' && (
                    <select
                      value={selectedGroupId}
                      onChange={(e) => setSelectedGroupId(e.target.value)}
                      className="input-base ml-7"
                    >
                      <option value="">Select a group</option>
                      {groups.map(group => (
                        <option key={group.id} value={group.id}>{group.name}</option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              <div>
                <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer mb-2">
                  <input
                    type="radio"
                    name="groupOption"
                    checked={!!newGroupName}
                    onChange={() => setSelectedGroupId('')}
                    className="w-4 h-4"
                  />
                  <span>Create new group</span>
                </label>
                {newGroupName !== '' && (
                  <Input
                    type="text"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    placeholder="New group name"
                    className="ml-7"
                  />
                )}
              </div>
            </div>
          </div>
        )}

        {step === 'review' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Review & Import</h3>
              <p className="text-sm text-gray-600 mb-4">
                Confirm the import details below
              </p>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Total rows:</span>
                <span className="font-semibold">{csvData.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Valid contacts:</span>
                <span className="font-semibold text-green-600">{validRows}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Invalid contacts:</span>
                <span className="font-semibold text-red-600">{csvData.length - validRows}</span>
              </div>
              <div className="flex justify-between border-t pt-3">
                <span className="text-gray-600">Add to group:</span>
                <span className="font-semibold">
                  {selectedGroupId
                    ? groups.find(g => g.id === selectedGroupId)?.name
                    : newGroupName || 'No group'}
                </span>
              </div>
            </div>

            <div className="bg-gold/10 border border-gold/20 rounded-lg p-4">
              <p className="text-sm font-semibold mb-1">Ready to import {validRows} contacts</p>
              <p className="text-sm text-gray-600">Duplicate emails will be skipped automatically</p>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex gap-3 pt-6 border-t border-gray-200 mt-6">
          {step !== 'upload' && (
            <Button
              variant="secondary"
              size="md"
              icon={ArrowLeft}
              onClick={() => {
                const steps: Step[] = ['upload', 'map', 'group', 'review'];
                const currentIndex = steps.indexOf(step);
                if (currentIndex > 0) {
                  setStep(steps[currentIndex - 1]);
                }
              }}
            >
              Back
            </Button>
          )}

          <div className="flex-1" />

          {step === 'upload' && (
            <Button
              variant="secondary"
              size="md"
              onClick={() => {
                resetModal();
                onClose();
              }}
            >
              Cancel
            </Button>
          )}

          {step === 'upload' && file && (
            <Button
              variant="primary"
              size="md"
              icon={ArrowRight}
              iconPosition="end"
              onClick={() => setStep('map')}
            >
              Next
            </Button>
          )}

          {step === 'map' && (
            <Button
              variant="primary"
              size="md"
              icon={ArrowRight}
              iconPosition="end"
              onClick={() => setStep('group')}
              disabled={!Object.values(columnMapping).includes('email')}
            >
              Next
            </Button>
          )}

          {step === 'group' && (
            <Button
              variant="primary"
              size="md"
              icon={ArrowRight}
              iconPosition="end"
              onClick={() => setStep('review')}
            >
              Next
            </Button>
          )}

          {step === 'review' && (
            <Button
              variant="primary"
              size="md"
              onClick={handleImport}
              loading={importing}
              disabled={importing || validRows === 0}
            >
              Import {validRows} Contacts
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
};
