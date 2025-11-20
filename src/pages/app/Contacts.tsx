import { useState, useEffect } from 'react';
import {
  UserPlus,
  Search,
  Upload,
  FolderPlus,
  Users,
  MoreVertical,
  Edit,
  Trash2,
  Mail
} from 'lucide-react';
import { AppLayout } from '../../components/app/AppLayout';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

interface Contact {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  company: string | null;
  role: string | null;
  industry: string | null;
  status: string;
  created_at: string;
}

interface ContactGroup {
  id: string;
  name: string;
  description: string | null;
  contact_count: number;
  created_at: string;
}

export const Contacts = () => {
  const { user } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [groups, setGroups] = useState<ContactGroup[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set());
  const [showAddContactModal, setShowAddContactModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showAddGroupModal, setShowAddGroupModal] = useState(false);

  useEffect(() => {
    if (user) {
      fetchGroups();
      fetchContacts();
    }
  }, [user]);

  useEffect(() => {
    if (selectedGroup) {
      fetchGroupContacts(selectedGroup);
    } else {
      fetchContacts();
    }
  }, [selectedGroup]);

  const fetchGroups = async () => {
    try {
      const { data, error } = await supabase
        .from('contact_groups')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setGroups(data || []);
    } catch (error) {
      console.error('Error fetching groups:', error);
    }
  };

  const fetchContacts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setContacts(data || []);
    } catch (error) {
      console.error('Error fetching contacts:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchGroupContacts = async (groupId: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('contact_group_members')
        .select(`
          contact_id,
          contacts (*)
        `)
        .eq('group_id', groupId);

      if (error) throw error;
      const contactsData = data?.map((item: any) => item.contacts).filter(Boolean) || [];
      setContacts(contactsData);
    } catch (error) {
      console.error('Error fetching group contacts:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredContacts = contacts.filter(
    (contact) =>
      contact.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.last_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.company?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectContact = (contactId: string) => {
    const newSelected = new Set(selectedContacts);
    if (newSelected.has(contactId)) {
      newSelected.delete(contactId);
    } else {
      newSelected.add(contactId);
    }
    setSelectedContacts(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedContacts.size === filteredContacts.length) {
      setSelectedContacts(new Set());
    } else {
      setSelectedContacts(new Set(filteredContacts.map(c => c.id)));
    }
  };

  const totalContacts = contacts.length;
  const activeGroup = groups.find(g => g.id === selectedGroup);

  return (
    <AppLayout currentPath="/app/contacts">
      <div className="flex h-full">
        {/* Groups Sidebar */}
        <div className="w-64 border-r border-gray-200 bg-white p-4 overflow-y-auto">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Groups</h3>
          </div>

          <button
            onClick={() => setSelectedGroup(null)}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg mb-2 transition-colors ${
              selectedGroup === null
                ? 'bg-gold text-black font-semibold'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Users size={18} />
            <span className="flex-1 text-left">All Contacts</span>
            <span className="text-sm bg-gray-200 px-2 py-0.5 rounded-full">
              {totalContacts}
            </span>
          </button>

          <div className="space-y-1 mb-4">
            {groups.map((group) => (
              <button
                key={group.id}
                onClick={() => setSelectedGroup(group.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                  selectedGroup === group.id
                    ? 'bg-gold text-black font-semibold'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <div className="w-3 h-3 rounded-full bg-purple" />
                <span className="flex-1 text-left truncate">{group.name}</span>
                <span className="text-sm bg-gray-200 px-2 py-0.5 rounded-full">
                  {group.contact_count}
                </span>
              </button>
            ))}
          </div>

          <Button
            variant="secondary"
            size="sm"
            fullWidth
            icon={FolderPlus}
            onClick={() => setShowAddGroupModal(true)}
          >
            New Group
          </Button>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          <div className="p-6 border-b border-gray-200 bg-white">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-serif font-bold">
                  {activeGroup ? activeGroup.name : 'All Contacts'}
                </h1>
                <p className="text-gray-600">
                  {activeGroup
                    ? activeGroup.description || `${activeGroup.contact_count} contacts in this group`
                    : `Manage your ${totalContacts} contacts and groups`
                  }
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="md"
                  icon={Upload}
                  onClick={() => setShowImportModal(true)}
                >
                  Import CSV
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  icon={UserPlus}
                  onClick={() => setShowAddContactModal(true)}
                >
                  Add Contact
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Input
                  type="text"
                  placeholder="Search contacts by email, name, or company..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  icon={Search}
                />
              </div>
              {selectedContacts.size > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">
                    {selectedContacts.size} selected
                  </span>
                  <Button variant="secondary" size="sm">
                    Add to Group
                  </Button>
                  <Button variant="destructive" size="sm" icon={Trash2}>
                    Delete
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Contacts Table */}
          <div className="flex-1 overflow-auto p-6">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin w-12 h-12 border-4 border-gold border-t-transparent rounded-full mx-auto mb-4" />
                <p className="text-gray-600">Loading contacts...</p>
              </div>
            ) : filteredContacts.length === 0 ? (
              <div className="text-center py-12">
                <Users size={48} className="text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No contacts found</h3>
                <p className="text-gray-600 mb-4">
                  {searchQuery
                    ? 'Try adjusting your search terms'
                    : 'Get started by adding your first contact or importing a CSV'}
                </p>
                {!searchQuery && (
                  <div className="flex gap-2 justify-center">
                    <Button variant="primary" size="md" onClick={() => setShowAddContactModal(true)}>
                      Add Contact
                    </Button>
                    <Button variant="secondary" size="md" onClick={() => setShowImportModal(true)}>
                      Import CSV
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="card">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 w-12">
                        <input
                          type="checkbox"
                          checked={selectedContacts.size === filteredContacts.length}
                          onChange={handleSelectAll}
                          className="w-4 h-4 rounded border-black"
                        />
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold">Name</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold">Email</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold">Company</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold">Role</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold">Industry</th>
                      <th className="text-center py-3 px-4 text-sm font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredContacts.map((contact) => (
                      <tr
                        key={contact.id}
                        className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                      >
                        <td className="py-4 px-4">
                          <input
                            type="checkbox"
                            checked={selectedContacts.has(contact.id)}
                            onChange={() => handleSelectContact(contact.id)}
                            className="w-4 h-4 rounded border-black"
                          />
                        </td>
                        <td className="py-4 px-4">
                          <div className="font-medium">
                            {contact.first_name || contact.last_name
                              ? `${contact.first_name || ''} ${contact.last_name || ''}`.trim()
                              : '-'}
                          </div>
                        </td>
                        <td className="py-4 px-4 text-gray-600">{contact.email}</td>
                        <td className="py-4 px-4 text-gray-600">{contact.company || '-'}</td>
                        <td className="py-4 px-4 text-gray-600">{contact.role || '-'}</td>
                        <td className="py-4 px-4 text-gray-600">{contact.industry || '-'}</td>
                        <td className="py-4 px-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                              title="Edit Contact"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-colors"
                              title="Delete Contact"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals will be added here */}
    </AppLayout>
  );
};
