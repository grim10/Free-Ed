import React, { useState } from 'react';
import { Subject } from './types';
import HomePage from './pages/HomePage';
import SubjectPage from './pages/SubjectPage';

function App() {
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);

  const handleSelectSubject = (subject: Subject) => {
    setSelectedSubject(subject);
  };

  const handleBackToSubjects = () => {
    setSelectedSubject(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {selectedSubject ? (
        <SubjectPage 
          subject={selectedSubject} 
          onBackToSubjects={handleBackToSubjects} 
        />
      ) : (
        <HomePage onSelectSubject={handleSelectSubject} />
      )}
    </div>
  );
}

export default App;