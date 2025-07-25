
import React from 'react';

const Spinner: React.FC = () => {
  return (
    <div
      className="animate-spin rounded-full h-16 w-16 border-b-2 border-t-2 border-cyan-400"
      role="status"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
};

export default Spinner;