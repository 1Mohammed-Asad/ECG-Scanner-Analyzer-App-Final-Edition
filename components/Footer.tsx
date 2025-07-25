
import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-800/30 border-t border-slate-700 mt-8">
      <div className="container mx-auto px-4 py-6 text-center text-slate-500">
        <p className="text-slate-300 font-medium mb-3">
          A project made by <span className="font-bold text-cyan-400">Aeterna EVOHealth</span>
        </p>
        <p className="text-sm">&copy; {new Date().getFullYear()} ECG Scanner Analyzer. For informational purposes only.</p>
        <p className="text-xs mt-2 max-w-2xl mx-auto">This is not a medical device. Consult a qualified healthcare professional for any medical concerns.</p>
      </div>
    </footer>
  );
};

export default Footer;