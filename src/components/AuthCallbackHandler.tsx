/**
 * AuthCallbackHandler Component
 * 
 * Handles Supabase authentication callbacks with hash parameters.
 * This component should be added to your App.tsx to intercept
 * email verification and password reset callbacks.
 */

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

export default function AuthCallbackHandler() {
  const navigate = useNavigate();

  useEffect(() => {
    // Only run if there are hash parameters
    if (!window.location.hash) return;

    const handleAuthCallback = async () => {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');
      const type = hashParams.get('type');

      // Handle email verification (signup confirmation)
      if (type === 'signup' && accessToken && refreshToken) {
        try {
          // Set the session
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) throw error;

          // Email verified successfully
          toast.success('Email verified successfully! You can now sign in.', {
            duration: 4000,
          });

          // Sign out so user signs in properly
          await supabase.auth.signOut();

          // Clear hash and redirect to login
          window.history.replaceState(null, '', '/login');
          navigate('/login', { replace: true });
        } catch (error) {
          console.error('Email verification error:', error);
          toast.error('Error verifying email. Please try again.');
          window.history.replaceState(null, '', '/login');
          navigate('/login', { replace: true });
        }
      }
      
      // Handle password reset
      else if (type === 'recovery' && accessToken && refreshToken) {
        try {
          // Set the session for password reset
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) throw error;

          // Redirect to reset password page
          window.history.replaceState(null, '', '/reset-password');
          navigate('/reset-password', { replace: true });
        } catch (error) {
          console.error('Password reset error:', error);
          toast.error('Error processing password reset. Please try again.');
          window.history.replaceState(null, '', '/login');
          navigate('/login', { replace: true });
        }
      }
    };

    handleAuthCallback();
  }, [navigate]);

  // This component doesn't render anything
  return null;
}