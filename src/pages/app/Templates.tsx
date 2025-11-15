import { FileText } from 'lucide-react';
import { AppLayout } from '../../components/app/AppLayout';

export const Templates = () => {
  return (
    <AppLayout currentPath="/app/templates">
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-serif font-bold mb-2">Templates</h1>
          <p className="text-gray-600">Browse and manage email templates.</p>
        </div>
        <div className="text-center py-20">
          <FileText size={48} className="text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600">Template library coming soon.</p>
        </div>
      </div>
    </AppLayout>
  );
};
