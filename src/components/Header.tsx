import React from 'react';
import { BookOpen } from 'lucide-react';

interface HeaderProps {
  onBackToSubjects: () => void;
  currentSubject?: string;
  currentTopic?: string;
}

const Header: React.FC<HeaderProps> = ({ 
  onBackToSubjects, 
  currentSubject,
  currentTopic 
}) => {
  return (
    <header className="bg-white border-b border-gray-200 py-4 px-6 sticky top-0 z-10">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <BookOpen className="h-6 w-6 text-blue-600" />
          <h1 className="text-xl font-bold text-gray-800">AiLearn</h1>
          {currentSubject && (
            <div className="flex items-center text-sm text-gray-500">
              <span className="mx-2">/</span>
              <button 
                onClick={onBackToSubjects}
                className="hover:text-blue-600 transition-colors"
              >
                {currentSubject}
              </button>
              {currentTopic && (
                <>
                  <span className="mx-2">/</span>
                  <span className="text-gray-500">{currentTopic}</span>
                </>
              )}
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-4">
          <button className="text-sm text-gray-500 hover:text-blue-600 transition-colors">
            History
          </button>
          <button className="text-sm text-gray-500 hover:text-blue-600 transition-colors">
            Save Session
          </button>
          <button className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-4 py-1.5 text-sm transition-colors">
            Sign In
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;