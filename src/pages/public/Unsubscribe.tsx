/**
 * UNSUBSCRIBE PAGE
 *
 * Reads the token from the URL and calls the Supabase Edge Function
 * to process the unsubscribe. Previously this component was faking
 * success with a setTimeout — it never contacted the database.
 *
 * Flow:
 *   User clicks link in email
 *   → Netlify serves this React page at /unsubscribe?token=...
 *   → useEffect fires, calls /functions/v1/unsubscribe?token=...
 *   → Edge Function validates token, updates contacts table
 *   → This page shows success or error based on the response
 */

import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;

type Status = 'loading' | 'success' | 'error';

interface PageState {
  status: Status;
  heading: string;
  message: string;
}

export default function Unsubscribe() {
  const [searchParams] = useSearchParams();
  const [state, setState] = useState<PageState>({
    status: 'loading',
    heading: 'Processing...',
    message: 'Please wait while we process your unsubscribe request.'
  });

  useEffect(() => {
    const token = searchParams.get('token');

    if (!token) {
      setState({
        status: 'error',
        heading: 'Invalid Link',
        message: 'This unsubscribe link is missing a token. Please use the link directly from your email.'
      });
      return;
    }

    if (!SUPABASE_URL) {
      setState({
        status: 'error',
        heading: 'Configuration Error',
        message: 'VITE_SUPABASE_URL is not set. Please contact support.'
      });
      return;
    }

    // -------------------------------------------------------------------------
    // CRITICAL: This is the actual call that updates the database.
    // The Edge Function at /functions/v1/unsubscribe validates the token
    // and sets contact.status = 'unsubscribed' in Supabase.
    // -------------------------------------------------------------------------
    const edgeFunctionUrl = `${SUPABASE_URL}/functions/v1/unsubscribe?token=${encodeURIComponent(token)}`;

    console.log('📤 Calling unsubscribe Edge Function...');

    fetch(edgeFunctionUrl, { method: 'GET' })
      .then(async (res) => {
        console.log('📥 Edge Function response:', res.status);

        if (res.ok) {
          setState({
            status: 'success',
            heading: "You've Been Unsubscribed",
            message: 'You will no longer receive marketing emails from us. This change is effective immediately.'
          });
        } else {
          let errorMessage = 'Failed to process your unsubscribe request. Please try again.';
          if (res.status === 400) errorMessage = 'This unsubscribe link is invalid or has expired.';
          if (res.status === 404) errorMessage = 'We could not find your account. Please contact support.';
          if (res.status === 500) errorMessage = 'A server error occurred. Please try again later.';

          console.error('❌ Edge Function returned error:', res.status);
          setState({ status: 'error', heading: 'Unsubscribe Failed', message: errorMessage });
        }
      })
      .catch((err) => {
        console.error('❌ Network error:', err);
        setState({
          status: 'error',
          heading: 'Network Error',
          message: 'Could not reach the server. Please check your connection and try again.'
        });
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center">

        {/* Status icon */}
        <div className="mb-6">
          {state.status === 'loading' && (
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
              <Loader2 size={40} className="animate-spin text-purple-600" />
            </div>
          )}
          {state.status === 'success' && (
            <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto" style={{ backgroundColor: '#f3ba42' }}>
              <CheckCircle2 size={40} className="text-white" />
            </div>
          )}
          {state.status === 'error' && (
            <div className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center mx-auto">
              <XCircle size={40} className="text-white" />
            </div>
          )}
        </div>

        {/* Heading */}
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          {state.heading}
        </h1>

        {/* Message */}
        <p className="text-gray-600 leading-relaxed">
          {state.message}
        </p>

        {/* Success: re-subscribe option */}
        {state.status === 'success' && (
          <div className="mt-8 space-y-3">
            <p className="text-sm text-gray-500">Changed your mind?</p>
            <Link
              to="/resubscribe"
              className="inline-block px-8 py-3 rounded-lg font-semibold text-white transition-all hover:opacity-90 hover:scale-105"
              style={{ backgroundColor: '#f3ba42' }}
            >
              Re-subscribe
            </Link>
          </div>
        )}

        {/* Error: go home */}
        {state.status === 'error' && (
          <div className="mt-8">
            <Link
              to="/"
              className="inline-block bg-purple-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-purple-700 transition-all"
            >
              Go Home
            </Link>
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-gray-100">
          <p className="text-xs text-gray-400">
            If you believe this was done in error, please contact our support team.
          </p>
        </div>
      </div>
    </div>
  );
}