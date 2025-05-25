import React from 'react';
import { Subject, Chapter } from '../types';
import Header from '../components/Header';

interface ChaptersPageProps {
  subject: Subject;
  onSelectChapter: (chapterId: string) => void;
  onBackToSubjects: () => void;
}

const ChaptersPage: React.FC<ChaptersPageProps> = ({
  subject,
  onSelectChapter,
  onBackToSubjects
}) => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header 
        onBackToSubjects={onBackToSubjects}
        currentSubject={subject.name}
      />
      
      <div className="container mx-auto p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          {subject.name} Chapters
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {subject.chapters.map((chapter) => (
            <div
              key={chapter.id}
              onClick={() => onSelectChapter(chapter.id)}
              className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-6 cursor-pointer border border-gray-200"
            >
              <div className="flex items-start gap-4">
                <span className="text-3xl">{chapter.icon}</span>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">
                    {chapter.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    {chapter.description}
                  </p>
                  <div className="flex items-center text-sm text-gray-500">
                    <span className="mr-4">
                      {chapter.topics.length} Topics
                    </span>
                    <span>
                      {chapter.duration} hours
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ChaptersPage;