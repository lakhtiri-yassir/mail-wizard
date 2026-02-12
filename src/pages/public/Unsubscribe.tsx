/**
 * UNSUBSCRIBE PAGE
 *
 * Calls the Supabase Edge Function to process the unsubscribe.
 *
 * CRITICAL FIX:
 * Supabase Edge Functions reject requests without an Authorization header
 * (returns 401 before the function code even runs — no logs appear).
 * The fix is to pass the public anon key as the apikey header, which
 * satisfies Supabase's gateway without requiring a user session.
 *
 * The unsubscribe function must also be deployed with --no-verify-jwt
 * (set in Supabase Dashboard → Edge Functions → unsubscribe → Settings →
 *  toggle off "Enforce JWT Verification").
 */

import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';

// Both env vars are required — set in Netlify environment variables
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

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

    // Guard: missing token
    if (!token) {
      setState({
        status: 'error',
        heading: 'Invalid Link',
        message: 'This unsubscribe link is missing a token. Please use the link directly from your email.'
      });
      return;
    }

    // Guard: missing env vars (misconfigured Netlify deployment)
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      console.error('❌ Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY');
      setState({
        status: 'error',
        heading: 'Configuration Error',
        message: 'The application is not configured correctly. Please contact support.'
      });
      return;
    }

    // -------------------------------------------------------------------------
    // Call the Edge Function.
    //
    // The Authorization header with the anon key is REQUIRED — without it,
    // Supabase's API gateway returns 401 and the function never executes
    // (which is why no logs appear in the Supabase dashboard).
    // -------------------------------------------------------------------------
    const url = `${SUPABASE_URL}/functions/v1/unsubscribe?token=${encodeURIComponent(token)}`;

    console.log('📤 Calling unsubscribe Edge Function...');

    fetch(url, {
      method: 'GET',
      headers: {
        // Required by Supabase gateway — identifies the project
        'apikey': SUPABASE_ANON_KEY,
        // Also send as Authorization so both auth patterns are covered
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      }
    })
      .then(async (res) => {
        console.log('📥 Edge Function response status:', res.status);

        if (res.status === 401) {
          // Still getting 401 — JWT verification is still enabled in Supabase dashboard
          console.error('❌ 401: JWT verification is still enabled on the unsubscribe function.');
          console.error('   Fix: Supabase Dashboard → Edge Functions → unsubscribe → Settings → disable "Enforce JWT Verification"');
          setState({
            status: 'error',
            heading: 'Unsubscribe Failed',
            message: 'Authentication error. Please contact support.'
          });
          return;
        }

        if (res.ok) {
          setState({
            status: 'success',
            heading: "You've Been Unsubscribed",
            message: 'You will no longer receive marketing emails from us. This change is effective immediately.'
          });
        } else {
          let message = 'Failed to process your unsubscribe request. Please try again.';
          if (res.status === 400) message = 'This unsubscribe link is invalid or has expired.';
          if (res.status === 404) message = 'We could not find your account. Please contact support.';
          if (res.status === 500) message = 'A server error occurred. Please try again later.';

          console.error('❌ Edge Function error:', res.status);
          setState({ status: 'error', heading: 'Unsubscribe Failed', message });
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
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center">

        {/* Status icon */}
        <div className="mb-6">
          {state.status === 'loading' && (
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
              <Loader2 size={40} className="animate-spin text-purple-600" />
            </div>
          )}
          {state.status === 'success' && (
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center mx-auto"
              style={{ backgroundColor: '#f3ba42' }}
            >
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

        {/* Success: re-subscribe */}
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