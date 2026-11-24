export const IT_SUBJECTS_BY_SEMESTER = {
  1: [
    "Calculus and Vector",
    "Engineering Chemistry",
    "Lab: Engineering Chemistry",
    "Professional Communication",
    "Indian Knowledge System",
    "Engineering Mechanics",
    "Lab: Engineering Mechanics",
    "Programming for Problem Solving",
    "Lab: Programming for Problem Solving",
    "Get Set Go",
    "Liberal Learning Course (LLC1)",
    "Disaster Management and Preparedness"
  ],
  2: [
    "Differential Equations and Complex Analysis",
    "Applied Physics",
    "Lab: Applied Physics",
    "Engineering Graphics",
    "Lab: Engineering Graphics",
    "Basic Electrical and Electronics Engineering",
    "Lab: Computer Workshop",
    "Basics of Python Programming",
    "Lab: Basics of Python Programming",
    "Functional English",
    "Liberal Learning Course (LLC2)",
    "Universal Human Values"
  ],
  3: [
    "Linear Algebra",
    "Data Structure and Program Design",
    "Lab: Data Structure and Program Design",
    "Computer Architecture & Organization",
    "Object Oriented Programming",
    "Lab: Object Oriented Programming",
    "Software Lab-1",
    "Community Engagement Project",
    "Open Elective-I",
    "MD Minor Course-I"
  ],
  4: [
    "Entrepreneurship Development",
    "Discrete Mathematics and Graph Theory",
    "Digital Circuits and Microprocessor",
    "Computer Network",
    "Lab: Computer Network",
    "Software Lab-2",
    "Advanced Python Programming",
    "Cyber Laws",
    "MD Minor Course-II",
    "Open Elective-II"
  ],
  5: [
    "Theory of Computation",
    "Database and Information System",
    "Lab: Database and Information System",
    "Machine Learning",
    "Lab: Machine Learning",
    "Operating System",
    "Lab: Operating System",
    "Professional Elective-I",
    "Open Elective-III",
    "MD Minor Course-III"
  ],
  6: [
    "Design and Analysis of Algorithm",
    "Lab: Design and Analysis of Algorithm",
    "Artificial Intelligence",
    "Lab: Artificial Intelligence",
    "Design Thinking in IT & Research Methodology",
    "Professional Elective-II",
    "Professional Elective-III",
    "MD Minor Course-IV"
  ],
  7: [
    "Principles of Compiler Design",
    "Lab: Principles of Compiler Design",
    "Software Engineering",
    "Lab: Software Engineering",
    "Software Lab-3",
    "Professional Elective-IV",
    "Professional Elective-V",
    "MD Minor Course-V"
  ],
  8: [
    "MD Minor Course-VI",
    "Internship / On Job Training"
  ]
};

// Flattened list of all subjects
export const ALL_IT_SUBJECTS = Object.values(IT_SUBJECTS_BY_SEMESTER).flat();

export function getSubjectsForSemester(semester) {
  const semNum = parseInt(semester, 10);
  return IT_SUBJECTS_BY_SEMESTER[semNum] || ALL_IT_SUBJECTS;
}
