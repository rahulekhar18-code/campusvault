import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();

const DEFAULT_BRANCHES = [
  { name: 'Information Technology', code: 'IT' },
  { name: 'Computer Science & Engineering', code: 'CSE' },
  { name: 'Artificial Intelligence & Data Science', code: 'AIDS' },
  { name: 'Electronics & Telecommunication', code: 'ECE' },
  { name: 'Mechanical Engineering', code: 'MECH' },
  { name: 'Civil Engineering', code: 'CIVIL' },
  { name: 'Electrical Engineering', code: 'EE' }
];

const DEFAULT_SEMESTERS = [
  { name: 'Semester 1', number: '1' },
  { name: 'Semester 2', number: '2' },
  { name: 'Semester 3', number: '3' },
  { name: 'Semester 4', number: '4' },
  { name: 'Semester 5', number: '5' },
  { name: 'Semester 6', number: '6' },
  { name: 'Semester 7', number: '7' },
  { name: 'Semester 8', number: '8' }
];

const DEFAULT_CATEGORIES = [
  { name: 'Notes' },
  { name: 'PYQ' },
  { name: 'Practicals' },
  { name: 'Assignments' }
];

const IT_SUBJECTS_BY_SEMESTER = {
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

// Seed default AppSettings and Academic Data if not present
export async function initDatabase() {
  try {
    // 1. AppSettings
    const existingSettings = await prisma.appSettings.findUnique({
      where: { id: 'global' }
    });

    if (!existingSettings) {
      await prisma.appSettings.create({
        data: {
          id: 'global',
          appName: 'CampusVault',
          logoUrl: '',
          themeColor: '#2563eb', // Default Blue
          storageRoot: 'vault',
          folderFormat: '{branch}/{semester}/{subject}/{category}'
        }
      });
      console.log('✓ Initialized default AppSettings in database');
    }

    // 2. Academic Branches
    const branchCount = await prisma.academicBranch.count();
    if (branchCount === 0) {
      for (const b of DEFAULT_BRANCHES) {
        await prisma.academicBranch.upsert({
          where: { code: b.code },
          update: {},
          create: { name: b.name, code: b.code }
        });
      }
      console.log('✓ Seeded default Academic Branches');
    }

    // 3. Academic Semesters
    const semesterCount = await prisma.academicSemester.count();
    if (semesterCount === 0) {
      for (const s of DEFAULT_SEMESTERS) {
        await prisma.academicSemester.upsert({
          where: { number: s.number },
          update: {},
          create: { name: s.name, number: s.number }
        });
      }
      console.log('✓ Seeded default Academic Semesters');
    }

    // 4. Academic Categories
    const categoryCount = await prisma.academicCategory.count();
    if (categoryCount === 0) {
      for (const c of DEFAULT_CATEGORIES) {
        await prisma.academicCategory.upsert({
          where: { name: c.name },
          update: {},
          create: { name: c.name }
        });
      }
      console.log('✓ Seeded default Academic Categories');
    }

    // 5. Academic Subjects (IT Semesters 1-8)
    const subjectCount = await prisma.academicSubject.count();
    if (subjectCount === 0) {
      for (const [sem, subs] of Object.entries(IT_SUBJECTS_BY_SEMESTER)) {
        for (const subName of subs) {
          await prisma.academicSubject.upsert({
            where: {
              name_branch_semester: {
                name: subName,
                branch: 'IT',
                semester: String(sem)
              }
            },
            update: {},
            create: {
              name: subName,
              branch: 'IT',
              semester: String(sem)
            }
          });
        }
      }
      console.log('✓ Seeded default Academic Subjects for IT');
    }
  } catch (error) {
    console.error('Error initializing database settings or academic metadata:', error);
  }
}
