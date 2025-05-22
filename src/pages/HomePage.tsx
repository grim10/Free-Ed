import React from 'react';
import { Subject } from '../types';
import { subjects } from '../data/mockData';
import SubjectGrid from '../components/SubjectGrid';
import Header from '../components/Header';

interface HomePageProps {
  onSelectSubject: (subject: Subject) => void;
}

const HomePage: React.FC<HomePageProps> = ({ onSelectSubject }) => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header onBackToSubjects={() => {}} />
      
      <div className="flex-1">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16 px-6">
          <div className="container mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Learn Anything, Anytime</h1>
            <p className="text-xl md:max-w-2xl mb-8">
              AI-powered learning assistant that helps you understand complex topics through 
              simple explanations, visualizations, and guided learning paths.
            </p>
            <div className="flex gap-4">
              <button className="bg-white text-blue-600 hover:bg-blue-50 px-6 py-3 rounded-lg font-medium transition-colors">
                Get Started
              </button>
              <button className="bg-transparent border border-white text-white hover:bg-white/10 px-6 py-3 rounded-lg font-medium transition-colors">
                Learn More
              </button>
            </div>
          </div>
        </div>
        
        <SubjectGrid
          subjects={subjects}
          onSelectSubject={onSelectSubject}
        />
      </div>
    </div>
  );
};

export default HomePage;