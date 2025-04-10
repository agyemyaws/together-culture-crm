export const CoursesData = [
  {
    id: "1",
    title: "Community Leadership Fundamentals",
    category: "Leadership",
    description:
      "Learn the essential skills needed to lead and grow community initiatives",
    progress: {
      completed: 7,
      total: 12,
      percentage: 65,
      steps: 7,
      totalSteps: 12,
    },
    instructor: "Sarah Johnson",
    rating: 4.8,
    imageUrl: "/assets/images/courses/leadership-fundamentals.jpg",
    modules: [
      {
        id: "intro",
        title: "Introduction",
        lessons: [
          {
            id: "intro-1",
            title: "Course Introduction",
            completed: true,
            content:
              "Welcome to the Community Leadership Fundamentals course. This course is designed to equip you with the skills and knowledge needed to effectively lead community initiatives...",
          },
        ],
      },
      {
        id: "module-1",
        title: "Module 1 - Understanding Community Leadership",
        lessons: [
          {
            id: "module-1-1",
            title: "What is Community Leadership?",
            completed: true,
            content:
              "Community leadership involves guiding a group towards a common goal while fostering collaboration, trust, and shared purpose...",
          },
          {
            id: "module-1-2",
            title: "Core Leadership Values",
            completed: true,
            content:
              "Effective community leaders embody several core values: integrity, empathy, inclusivity, vision, and accountability...",
          },
          {
            id: "module-1-3",
            title: "Leadership Styles",
            completed: false,
            current: true,
            content:
              "In community leadership, understanding different leadership styles is essential to effectively manage and grow your community. Each style has its strengths and applications depending on the situation and the needs of your community members.\n\nCommon Leadership Styles:\n\nDemocratic Leadership: Democratic leaders involve team members in decision-making processes. This style is especially effective in community settings as it builds trust among community members, increases engagement and ownership, and leverages collective wisdom and diverse perspectives.\n\nTransformational Leadership: Transformational leaders inspire and motivate their communities toward a shared vision. They create a compelling vision for the community, inspire others to exceed their own expectations, and foster innovation and positive change.\n\nServant Leadership: Servant leaders prioritize the needs of community members above their own. This approach builds strong relationships based on trust, creates a supportive community culture, and empowers members to develop their own leadership skills.\n\nReflection Point: Think about community leaders you admire. What leadership styles do they exhibit? How might you incorporate aspects of these styles into your own leadership approach?",
          },
          {
            id: "module-1-4",
            title: "Community Leadership Ethics",
            completed: false,
            content:
              "Ethical leadership is the foundation of sustainable community development. This lesson explores key ethical principles...",
          },
        ],
      },
      {
        id: "module-2",
        title: "Module 2 - Building Your Community",
        lessons: [
          {
            id: "module-2-1",
            title: "Identifying Community Needs",
            completed: false,
            content:
              "Before building a community, it's essential to identify the needs it will address. This lesson covers needs assessment methods...",
          },
          {
            id: "module-2-2",
            title: "Recruitment Strategies",
            completed: false,
            content:
              "Effective recruitment is critical for community growth. Learn strategies for attracting and retaining members...",
          },
          {
            id: "module-2-3",
            title: "Creating Safe Spaces",
            completed: false,
            content:
              "Safe spaces are environments where members feel secure, respected, and valued. This lesson explores how to establish and maintain safe spaces...",
          },
        ],
      },
      {
        id: "module-3",
        title: "Module 3 - Effective Communication",
        lessons: [
          {
            id: "module-3-1",
            title: "Active Listening",
            completed: false,
            content:
              "Active listening is a foundational skill for community leaders. This lesson covers techniques for effective listening...",
          },
          {
            id: "module-3-2",
            title: "Conflict Resolution",
            completed: false,
            content:
              "Conflicts are inevitable in any community. Learn strategies for mediating and resolving conflicts constructively...",
          },
          {
            id: "module-3-3",
            title: "Public Speaking for Leaders",
            completed: false,
            content:
              "Effective public speaking can inspire and motivate your community. This lesson provides techniques for impactful presentations...",
          },
        ],
      },
      {
        id: "assessment",
        title: "Final Assessment",
        lessons: [
          {
            id: "final-assessment",
            title: "Community Leadership Assessment",
            completed: false,
            content:
              "Complete this assessment to test your understanding of the material covered in this course.",
          },
        ],
      },
    ],
    assessment: {
      questions: [
        {
          id: "q1",
          question:
            "Which leadership style involves team members in the decision-making process?",
          options: [
            { id: "q1a", text: "Autocratic Leadership" },
            { id: "q1b", text: "Democratic Leadership", correct: true },
            { id: "q1c", text: "Laissez-faire Leadership" },
            { id: "q1d", text: "Bureaucratic Leadership" },
          ],
        },
        {
          id: "q2",
          question:
            "Which of the following is a key characteristic of servant leadership?",
          options: [
            {
              id: "q2a",
              text: "Prioritizing the leader's vision above all else",
            },
            {
              id: "q2b",
              text: "Maintaining strict control over all decisions",
            },
            {
              id: "q2c",
              text: "Putting the needs of team members first",
              correct: true,
            },
            { id: "q2d", text: "Implementing detailed rules and procedures" },
          ],
        },
        {
          id: "q3",
          question:
            "What is a key benefit of democratic leadership in community settings?",
          options: [
            { id: "q3a", text: "Faster decision-making processes" },
            {
              id: "q3b",
              text: "Increased engagement and ownership",
              correct: true,
            },
            { id: "q3c", text: "Simplified chain of command" },
            { id: "q3d", text: "Reduced need for member input" },
          ],
        },
        {
          id: "q4",
          question:
            "Which of the following is a core value for effective community leaders?",
          options: [
            { id: "q4a", text: "Competition" },
            { id: "q4b", text: "Empathy", correct: true },
            { id: "q4c", text: "Secrecy" },
            { id: "q4d", text: "Conformity" },
          ],
        },
        {
          id: "q5",
          question:
            "What is the primary goal of creating 'safe spaces' in communities?",
          options: [
            { id: "q5a", text: "To limit membership to specific demographics" },
            { id: "q5b", text: "To enforce strict rules and hierarchies" },
            {
              id: "q5c",
              text: "To encourage members to feel secure, respected, and valued",
              correct: true,
            },
            {
              id: "q5d",
              text: "To minimize conflict by avoiding challenging topics",
            },
          ],
        },
        {
          id: "q6",
          question:
            "What technique is essential for effective conflict resolution in communities?",
          options: [
            {
              id: "q6a",
              text: "Avoiding the conflict until it resolves itself",
            },
            { id: "q6b", text: "Always siding with the majority opinion" },
            {
              id: "q6c",
              text: "Active listening to understand all perspectives",
              correct: true,
            },
            { id: "q6d", text: "Imposing quick solutions without discussion" },
          ],
        },
        {
          id: "q7",
          question:
            "Transformational leaders are best known for their ability to:",
          options: [
            { id: "q7a", text: "Maintain tradition and stability" },
            {
              id: "q7b",
              text: "Inspire and motivate toward a shared vision",
              correct: true,
            },
            { id: "q7c", text: "Implement detailed procedures" },
            { id: "q7d", text: "Minimize change and disruption" },
          ],
        },
        {
          id: "q8",
          question:
            "When identifying community needs, which approach is most effective?",
          options: [
            {
              id: "q8a",
              text: "Surveying only the most active community members",
            },
            {
              id: "q8b",
              text: "Consulting with community stakeholders and gathering diverse perspectives",
              correct: true,
            },
            {
              id: "q8c",
              text: "Focusing exclusively on quantitative metrics",
            },
            {
              id: "q8d",
              text: "Implementing solutions based on the leader's personal judgment",
            },
          ],
        },
      ],
    },
  },
];

import api from "../../../api";

export const findCourseById = (id) => {
  // First try to find the course in mock data
  const mockCourse = CoursesData.find((course) => course.id === id);
  
  // If we have a mock course, return it
  if (mockCourse) {
    return mockCourse;
  }
  
  // Otherwise, we'll try to fetch from the API
  // This is a synchronous function, so we need to return the mock data immediately
  // and initiate an API call that will be handled in the Course component
  
  // The real implementation would be in the Course component with useEffect
  return null;
};

// For disabled courses that require upgrade
export const disabledCourses = [
  {
    id: "dmc",
    title: "Digital Marketing for Communities",
    category: "Marketing",
    description:
      "Complete guide to promoting your community through digital channels",
    instructor: "Michael Chen",
    rating: 4.9,
    imageUrl: "/assets/images/courses/digital-marketing.jpg",
    disabled: true,
    reasonDisabled: "premium",
  },
  {
    id: "cwf",
    title: "Community Workshop Facilitation",
    category: "Leadership",
    description: "Learn how to plan and run effective community workshops",
    instructor: "Workshop Team",
    rating: 4.9,
    imageUrl: "/assets/images/courses/workshop-facilitation.jpg",
    disabled: true,
    reasonDisabled: "premium",
  },
];

export default CoursesData;
