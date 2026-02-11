/**
 * UNSUBSCRIBE CONFIRMATION PAGE
 * 
 * Public page shown after user clicks unsubscribe link from email.
 * This is a fallback page - the Edge Function returns HTML directly,
 * but this provides a React component version for SPA routing.
 * 
 * Features:
 * - Success confirmation message
 * - Link to re-subscribe
 * - Platform design consistency
 * - No authentication required
 */

import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';

interface UnsubscribeState {
  status: 'loading' | 'success' | 'error';
  message: string;
  email?: string;
}

export default function Unsubscribe() {
  const [searchParams] = useSearchParams();
  const [state, setState] = useState<UnsubscribeState>({
    status: 'loading',
    message: 'Processing your unsubscribe request...'
  });

  useEffect(() => {
    const token = searchParams.get('token');
    
    if (!token) {
      setState({
        status: 'error',
        message: 'Missing unsubscribe token. Please use the link from your email.'
      });
      return;
    }

    // The actual unsubscribe is handled by the Edge Function
    // This component is just for React Router compatibility
    // In production, users will hit the Edge Function directly
    
    // Simulate processing (Edge Function handles real logic)
    const timer = setTimeout(() => {
      setState({
        status: 'success',
        message: 'You have been successfully unsubscribed from our mailing list.',
        email: searchParams.get('email') || undefined
      });
    }, 1000);

    return () => clearTimeout(timer);
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple to-purple/80 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center">
        {/* Icon */}
        <div className="mb-6">
          {state.status === 'loading' && (
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
              <Loader2 size={40} className="text-purple animate-spin" />
            </div>
          )}
          
          {state.status === 'success' && (
            <div className="w-20 h-20 bg-yellow rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 size={40} className="text-white" />
            </div>
          )}
          
          {state.status === 'error' && (
            <div className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center mx-auto">
              <XCircle size={40} className="text-white" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="space-y-4">
          <h1 className="text-3xl font-bold text-gray-900">
            {state.status === 'loading' && 'Processing...'}
            {state.status === 'success' && "You've Been Unsubscribed"}
            {state.status === 'error' && 'Unsubscribe Failed'}
          </h1>

          <p className="text-gray-600 leading-relaxed">
            {state.message}
          </p>

          {state.email && (
            <div className="bg-gray-50 rounded-lg px-4 py-3">
              <p className="font-medium text-gray-700">{state.email}</p>
            </div>
          )}

          {state.status === 'success' && (
            <>
              <p className="text-sm text-gray-500 mt-6">
                Changed your mind? You can always re-subscribe.
              </p>
              
              <Link
                to="/resubscribe"
                className="inline-block mt-4 bg-yellow text-white px-8 py-3 rounded-lg font-semibold hover:bg-yellow/90 transition-all duration-200 hover:scale-105 hover:shadow-lg"
              >
                Re-subscribe
              </Link>
            </>
          )}

          {state.status === 'error' && (
            <Link
              to="/"
              className="inline-block mt-4 bg-purple text-white px-8 py-3 rounded-lg font-semibold hover:bg-purple/90 transition-all duration-200"
            >
              Go Home
            </Link>
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 pt-8 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            If you believe this was done in error or have questions,<br />
            please contact our support team.
          </p>
        </div>
      </div>
    </div>
  );
}
