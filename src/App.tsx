import React, { useState } from 'react';
import { Subject } from './types';
import HomePage from './pages/HomePage';
import ChaptersPage from './pages/ChaptersPage';
import SubjectPage from './pages/SubjectPage';

function App() {
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null);

  const handleSelectSubject = (subject: Subject) => {
    setSelectedSubject(subject);
    setSelectedChapterId(null);
  };

  const handleSelectChapter = (chapterId: string) => {
    setSelectedChapterId(chapterId);
  };

  const handleBackToSubjects = () => {
    setSelectedSubject(null);
    setSelectedChapterId(null);
  };

  const handleBackToChapters = () => {
    setSelectedChapterId(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {selectedChapterId ? (
        <SubjectPage 
          subject={selectedSubject!}
          chapterId={selectedChapterId}
          onBackToSubjects={handleBackToSubjects}
          onBackToChapters={handleBackToChapters}
        />
      ) : selectedSubject ? (
        <ChaptersPage
          subject={selectedSubject}
          onSelectChapter={handleSelectChapter}
          onBackToSubjects={handleBackToSubjects}
        />
      ) : (
        <HomePage onSelectSubject={handleSelectSubject} />
      )}
    </div>
  );
}

export default App;