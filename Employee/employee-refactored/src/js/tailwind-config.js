/**
 * Global Tailwind Configuration
 * Centralizes theme extensions for Corporate EMS using design tokens (CSS variables)
 */
if (typeof tailwind !== 'undefined') {
  tailwind.config = {
    theme: {
      extend: {
        colors: {
          primary: 'var(--ems-primary)',
          'primary-container': 'var(--ems-primary-lighter)',
        }
      }
    }
  };
}