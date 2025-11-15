import { BarChart3 } from 'lucide-react';
import { AppLayout } from '../../components/app/AppLayout';

export const Analytics = () => {
  return (
    <AppLayout currentPath="/app/analytics">
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-serif font-bold mb-2">Analytics</h1>
          <p className="text-gray-600">Track and analyze your campaign performance.</p>
        </div>
        <div className="text-center py-20">
          <BarChart3 size={48} className="text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600">Advanced analytics coming soon.</p>
        </div>
      </div>
    </AppLayout>
  );
};
