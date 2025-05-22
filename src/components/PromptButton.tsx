import React from 'react';

interface PromptButtonProps {
  icon: string;
  label: string;
  onClick: () => void;
  isActive?: boolean;
}

const PromptButton: React.FC<PromptButtonProps> = ({ 
  icon, 
  label, 
  onClick, 
  isActive = false 
}) => {
  return (
    <button
      onClick={onClick}
      className={`flex items-center px-4 py-2 rounded-full text-sm transition-all duration-300
        ${isActive 
          ? 'bg-blue-500 text-white shadow-md hover:bg-blue-600' 
          : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:border-gray-400'}`}
    >
      <span className="mr-2">{icon}</span>
      {label}
    </button>
  );
};

export default PromptButton;