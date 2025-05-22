import React from 'react';
import { Subject } from '../types';

interface SubjectCardProps {
  subject: Subject;
  onClick: (subject: Subject) => void;
}

const SubjectCard: React.FC<SubjectCardProps> = ({ subject, onClick }) => {
  return (
    <div
      className="relative h-48 rounded-xl overflow-hidden transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg cursor-pointer group"
      onClick={() => onClick(subject)}
    >
      <img
        src={subject.imageUrl}
        alt={subject.name}
        className="w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-black/20 transition-opacity group-hover:opacity-90" />
      <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
        <h3 className="text-xl font-bold mb-1">{subject.name}</h3>
        <p className="text-sm text-white/80">{subject.description}</p>
      </div>
    </div>
  );
};

export default SubjectCard;