import React from 'react';
import { Subject } from '../types';
import SubjectCard from './SubjectCard';

interface SubjectGridProps {
  subjects: Subject[];
  onSelectSubject: (subject: Subject) => void;
}

const SubjectGrid: React.FC<SubjectGridProps> = ({ subjects, onSelectSubject }) => {
  return (
    <div className="container mx-auto p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Choose a Subject</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {subjects.map((subject) => (
          <SubjectCard
            key={subject.id}
            subject={subject}
            onClick={onSelectSubject}
          />
        ))}
      </div>
    </div>
  );
};

export default SubjectGrid;