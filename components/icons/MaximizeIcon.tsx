
import React from 'react';

export const MaximizeIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
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
    <path d="M3 8V4m0 0h4M3 4l4 4"/>
    <path d="M21 8V4m0 0h-4m4 0l-4 4"/>
    <path d="M3 16v4m0 0h4m-4 0l4-4"/>
    <path d="M21 16v4m0 0h-4m4 0l-4-4"/>
  </svg>
);