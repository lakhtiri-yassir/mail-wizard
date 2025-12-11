/**
 * ============================================================================
 * Logo Component - Mail Wizard
 * ============================================================================
 * 
 * PURPOSE:
 * Displays Mail Wizard logo with different variants and sizes
 * 
 * VARIANTS:
 * - icon: Just the wizard icon (for small spaces, collapsed sidebar)
 * - text: Just the text logo (for wide headers without icon)
 * - full: Icon + Text side by side (default, for most contexts)
 * 
 * SIZES:
 * - sm: 32px height (compact spaces, collapsed sidebar)
 * - md: 40px height (standard sidebar, navigation)
 * - lg: 56px height (page headers, prominent sections)
 * - xl: 72px height (hero sections, landing page)
 * 
 * USAGE EXAMPLES:
 * 
 * // Sidebar (expanded)
 * <Logo variant="full" size="md" />
 * 
 * // Sidebar (collapsed)
 * <Logo variant="icon" size="sm" />
 * 
 * // Landing page hero
 * <Logo variant="icon" size="xl" />
 * 
 * // Login page header
 * <Logo variant="full" size="lg" onClick={() => navigate('/')} />
 * 
 * ============================================================================
 */

import React from 'react';

// Import logo images
// Note: Adjust paths if your project structure differs
import wizardIcon from '../../assets/logos/wizard-icon.png';
import textLogo from '../../assets/logos/mail-wizard-text.png';

interface LogoProps {
  /** Logo display variant */
  variant?: 'icon' | 'text' | 'full';
  /** Size preset */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Additional CSS classes */
  className?: string;
  /** Click handler (makes logo clickable) */
  onClick?: () => void;
}

/**
 * Size mapping for different contexts
 * icon: Height of the wizard icon
 * text: Height of the text logo (proportional to icon)
 */
const sizeMap = {
  sm: { icon: 32, text: 20 },  // Compact: collapsed sidebar, mobile
  md: { icon: 40, text: 24 },  // Standard: expanded sidebar, navigation
  lg: { icon: 56, text: 34 },  // Large: page headers, login
  xl: { icon: 72, text: 44 }   // Extra large: hero sections, landing page
};

export const Logo: React.FC<LogoProps> = ({
  variant = 'full',
  size = 'md',
  className = '',
  onClick
}) => {
  const dimensions = sizeMap[size];
  const isClickable = !!onClick;

  // Base classes for all variants
  const baseClasses = `
    ${isClickable ? 'cursor-pointer hover:opacity-90 transition-opacity' : ''}
    ${className}
  `.trim();

  /**
   * VARIANT: Icon Only
   * Best for: Collapsed sidebar, favicons, app icons, mobile navigation
   */
  if (variant === 'icon') {
    return (
      <img
        src={wizardIcon}
        alt="Mail Wizard"
        className={`object-contain ${baseClasses}`}
        style={{ 
          height: `${dimensions.icon}px`, 
          width: 'auto'
        }}
        onClick={onClick}
      />
    );
  }

  /**
   * VARIANT: Text Only
   * Best for: Wide headers where icon isn't needed
   */
  if (variant === 'text') {
    return (
      <img
        src={textLogo}
        alt="Mail Wizard"
        className={`object-contain ${baseClasses}`}
        style={{ 
          height: `${dimensions.text}px`, 
          width: 'auto'
        }}
        onClick={onClick}
      />
    );
  }

  /**
   * VARIANT: Full (Icon + Text)
   * Best for: Most contexts - sidebar, headers, login pages
   * Layout: Icon on left, text on right with proper spacing
   */
  return (
    <div 
      className={`flex items-center gap-3 ${baseClasses}`}
      onClick={onClick}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={isClickable ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      } : undefined}
    >
      {/* Wizard Icon */}
      <img
        src={wizardIcon}
        alt="Mail Wizard Icon"
        className="object-contain flex-shrink-0"
        style={{ 
          height: `${dimensions.icon}px`, 
          width: 'auto'
        }}
      />
      
      {/* Text Logo */}
      <img
        src={textLogo}
        alt="Mail Wizard"
        className="object-contain"
        style={{ 
          height: `${dimensions.text}px`, 
          width: 'auto'
        }}
      />
    </div>
  );
};

/**
 * ============================================================================
 * RESPONSIVE USAGE PATTERNS
 * ============================================================================
 * 
 * Mobile-First Approach:
 * 
 * {/* Show icon on mobile, full logo on desktop *\/}
 * <div className="lg:hidden">
 *   <Logo variant="icon" size="sm" />
 * </div>
 * <div className="hidden lg:flex">
 *   <Logo variant="full" size="md" />
 * </div>
 * 
 * Dynamic Sizing:
 * 
 * {/* Responsive size using Tailwind *\/}
 * <Logo 
 *   variant="full" 
 *   size="md"
 *   className="h-8 md:h-10 lg:h-12"
 * />
 * 
 * ============================================================================
 */