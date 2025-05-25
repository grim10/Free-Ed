import { Subject, Topic, Content, FollowUpQuestion, Chapter } from '../types';

// Mock subjects with chapters
export const subjects: Subject[] = [
  {
    id: 'physics',
    name: 'Physics',
    description: 'Study of matter, energy, and the interaction between them',
    imageUrl: 'https://images.pexels.com/photos/714699/pexels-photo-714699.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
    chapters: [
      {
        id: 'mechanics',
        title: 'Mechanics',
        description: 'Study of motion, forces, and energy',
        icon: '🎯',
        topics: ['kinematics', 'dynamics', 'work-energy', 'momentum', 'rotational-motion'],
        duration: 20,
        subjectId: 'physics'
      },
      {
        id: 'electromagnetism',
        title: 'Electromagnetism',
        description: 'Study of electrical and magnetic phenomena',
        icon: '⚡',
        topics: [
          'electric-fields',
          'magnetic-fields',
          'electromagnetic-induction',
          'ac-circuits',
          'maxwell-equations',
          'electromagnetic-waves',
          'capacitance',
          'inductance'
        ],
        duration: 25,
        subjectId: 'physics'
      },
      {
        id: 'thermodynamics',
        title: 'Thermodynamics',
        description: 'Study of heat, energy, and thermal processes',
        icon: '🌡️',
        topics: ['temperature', 'heat', 'laws-thermodynamics', 'entropy', 'thermal-properties'],
        duration: 15,
        subjectId: 'physics'
      }
    ]
  }
];

// Extended topics for Electromagnetism
export const topics: Topic[] = [
  {
    id: 'electric-fields',
    title: 'Electric Fields and Forces',
    description: 'Study of electric fields, Coulomb\'s law, and electric forces',
    keywords: ['Coulomb\'s law', 'field lines', 'potential difference', 'Gauss\'s law'],
    difficulty: 'Intermediate',
    chapterId: 'electromagnetism',
    relatedTopics: ['magnetic-fields', 'capacitance']
  },
  {
    id: 'magnetic-fields',
    title: 'Magnetic Fields and Forces',
    description: 'Understanding magnetic fields, forces, and their interactions',
    keywords: ['magnetic flux', 'Biot-Savart law', 'Ampere\'s law', 'magnetic materials'],
    difficulty: 'Intermediate',
    chapterId: 'electromagnetism',
    relatedTopics: ['electric-fields', 'electromagnetic-induction']
  },
  {
    id: 'electromagnetic-induction',
    title: 'Electromagnetic Induction',
    description: 'Study of induced EMF and Faraday\'s law',
    keywords: ['Faraday\'s law', 'Lenz\'s law', 'induced EMF', 'mutual inductance'],
    difficulty: 'Advanced',
    chapterId: 'electromagnetism',
    relatedTopics: ['magnetic-fields', 'ac-circuits']
  },
  {
    id: 'ac-circuits',
    title: 'AC Circuits',
    description: 'Analysis of alternating current circuits',
    keywords: ['impedance', 'resonance', 'power factor', 'RLC circuits'],
    difficulty: 'Advanced',
    chapterId: 'electromagnetism',
    relatedTopics: ['electromagnetic-induction', 'capacitance']
  },
  {
    id: 'maxwell-equations',
    title: 'Maxwell\'s Equations',
    description: 'Fundamental equations of electromagnetism',
    keywords: ['Gauss\'s law', 'Faraday\'s law', 'Ampere\'s law', 'displacement current'],
    difficulty: 'Advanced',
    chapterId: 'electromagnetism',
    relatedTopics: ['electromagnetic-waves', 'electric-fields']
  },
  {
    id: 'electromagnetic-waves',
    title: 'Electromagnetic Waves',
    description: 'Properties and behavior of EM waves',
    keywords: ['wave equation', 'polarization', 'radiation', 'energy transport'],
    difficulty: 'Advanced',
    chapterId: 'electromagnetism',
    relatedTopics: ['maxwell-equations', 'optics']
  },
  {
    id: 'capacitance',
    title: 'Capacitance and Capacitors',
    description: 'Study of charge storage and capacitive circuits',
    keywords: ['parallel plate', 'dielectrics', 'energy storage', 'RC circuits'],
    difficulty: 'Intermediate',
    chapterId: 'electromagnetism',
    relatedTopics: ['electric-fields', 'ac-circuits']
  },
  {
    id: 'inductance',
    title: 'Inductance and Inductors',
    description: 'Study of magnetic energy storage and inductive circuits',
    keywords: ['self-inductance', 'mutual inductance', 'RL circuits', 'magnetic energy'],
    difficulty: 'Intermediate',
    chapterId: 'electromagnetism',
    relatedTopics: ['magnetic-fields', 'ac-circuits']
  }
];

// Helper functions
export const getChaptersBySubject = (subjectId: string): Chapter[] => {
  const subject = subjects.find(s => s.id === subjectId);
  return subject?.chapters || [];
};

export const getTopicsByChapter = (chapterId: string): Topic[] => {
  return topics.filter(topic => topic.chapterId === chapterId);
};

export const getTopicById = (topicId: string): Topic | undefined => {
  return topics.find(topic => topic.id === topicId);
};

export const getRelatedTopics = (topicId: string): Topic[] => {
  const topic = getTopicById(topicId);
  if (!topic || !topic.relatedTopics) return [];
  return topics.filter(t => topic.relatedTopics?.includes(t.id));
};