
import React from 'react';

export const IdIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
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
    {...props}>
    <path d="M12 12a4 4 0 1 0-4.24-4.95A4 4 0 0 0 12 12Z"/>
    <path d="M19.5 12c0-2.3-1.12-4.4-2.88-5.78"/>
    <path d="M19.5 12c0 .6.07 1.18.2 1.74"/>
    <path d="M4.5 12c0 2.3 1.12 4.4 2.88 5.78"/>
    <path d="M4.5 12c0-.6-.07-1.18-.2-1.74"/>
    <path d="M12 4.5c2.3 0 4.4 1.12 5.78 2.88"/>
    <path d="M12 4.5c.6 0 1.18.07 1.74.2"/>
    <path d="m12 19.5-2.22-2.22"/>
    <path d="M12 19.5c-.6 0-1.18-.07-1.74-.2"/>
  </svg>
);