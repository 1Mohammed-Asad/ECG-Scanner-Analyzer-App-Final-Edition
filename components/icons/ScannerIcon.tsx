
import React from 'react';

export const ScannerIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    {...props}
  >
    <path d="M7 2H4v3" />
    <path d="M20 2h-3" />
    <path d="M20 9V7" />
    <path d="M4 15v-3" />
    <path d="M17 22h3v-3" />
    <path d="M4 22h3" />
    <path d="M4 12H2" />
    <path d="M22 12h-2" />
    <path d="M12 2v2" />
    <path d="M12 20v2" />
    <path d="M12 8v8" />
  </svg>
);