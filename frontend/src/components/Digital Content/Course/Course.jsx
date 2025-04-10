import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { findCourseById } from "./Data";
import CourseHeader from "./CourseHeader";
import CourseSidebar from "./CourseSidebar";
import CourseContent from "./CourseContent";
import CourseFooter from "./CourseFooter";
import CourseAssessment from "./CourseAssesment";
import styles from "./Course.module.css";
import api from "../../../api";

const Course = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();

  // States
  const [courseData, setCourseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeContent, setActiveContent] = useState("lesson"); // 'lesson' or 'assessment'
  const [currentLesson, setCurrentLesson] = useState(null);
  const [courseState, setCourseState] = useState(null);
  const [assessmentCompleted, setAssessmentCompleted] = useState(false);
  const [assessmentScore, setAssessmentScore] = useState(0);
  const [assessmentPassed, setAssessmentPassed] = useState(false);

  // Fetch course data
  useEffect(() => {
    const fetchCourseData = async () => {
      setLoading(true);
      
      try {
        // First check mock data
        const mockCourse = findCourseById(courseId);
        
        if (mockCourse) {
          setCourseData(mockCourse);
        } else {
          // If no mock data exists, fetch from API
          const response = await api.get(`/content/content/${courseId}/`);
          
          // Convert API data to course format
          const apiCourse = response.data;
          
          // Create a simple course structure if it's the first time viewing
          // Normally this would be stored in the database with proper structure
          const formattedCourse = {
            id: apiCourse.id,
            title: apiCourse.title,
            category: apiCourse.category,
            description: apiCourse.description || "",
            progress: {
              completed: apiCourse.progress?.progress_percentage || 0,
              total: 100,
              percentage: apiCourse.progress?.progress_percentage || 0,
              steps: 0,
              totalSteps: 5,
            },
            instructor: apiCourse.author || "Course Instructor",
            rating: apiCourse.rating || 4.5,
            imageUrl: apiCourse.image_url,
            modules: [
              {
                id: "intro",
                title: "Introduction",
                lessons: [
                  {
                    id: "intro-1",
                    title: "Course Introduction",
                    completed: true,
                    current: true,
                    content: apiCourse.description || "Welcome to this course! This content is being loaded from the database.",
                  },
                ],
              },
              {
                id: "module-1",
                title: `Module 1 - ${apiCourse.title}`,
                lessons: [
                  {
                    id: "module-1-1",
                    title: "Getting Started",
                    completed: false,
                    content: "This is the main content of the course. In a full implementation, this would be structured course material.",
                  },
                ],
              },
            ],
            assessment: {
              questions: [
                {
                  id: "q1",
                  question: "Sample assessment question?",
                  options: [
                    { id: "q1a", text: "Option A" },
                    { id: "q1b", text: "Option B", correct: true },
                    { id: "q1c", text: "Option C" },
                    { id: "q1d", text: "Option D" },
                  ],
                },
              ],
            },
          };
          
          setCourseData(formattedCourse);
        }
        
        setError(null);
      } catch (err) {
        console.error("Error fetching course:", err);
        setError("Failed to load the course. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchCourseData();
  }, [courseId]);

  // Find current lesson
  const findCurrentLesson = () => {
    if (!courseData) return null;

    for (const module of courseData.modules) {
      for (const lesson of module.lessons) {
        if (lesson.current) {
          return {
            module,
            lesson,
            moduleIndex: courseData.modules.indexOf(module),
            lessonIndex: module.lessons.indexOf(lesson),
          };
        }
      }
    }

    // If no current lesson found, default to first lesson
    const firstModule = courseData.modules[0];
    const firstLesson = firstModule.lessons[0];
    return {
      module: firstModule,
      lesson: firstLesson,
      moduleIndex: 0,
      lessonIndex: 0,
    };
  };

  // Initialize state when course data is available
  useEffect(() => {
    if (courseData) {
      setCourseState(courseData);
      setCurrentLesson(findCurrentLesson());
    }
  }, [courseData]);

  // If course data not found or error, redirect
  useEffect(() => {
    if (!loading && !courseData && !error) {
      navigate("/digital-content");
    }
  }, [courseData, loading, navigate, error]);

  // Handle assessment submission
  const submitAssessment = (answers) => {
    // Calculate score
    const questions = courseState.assessment.questions;
    let correctCount = 0;

    questions.forEach((question, index) => {
      const selectedOption = answers[question.id];
      const correctOption = question.options.find((option) => option.correct);

      if (selectedOption === correctOption.id) {
        correctCount++;
      }
    });

    const score = Math.round((correctCount / questions.length) * 100);

    // Update state
    setAssessmentScore(score);
    setAssessmentCompleted(true);
    setAssessmentPassed(score >= 60);

    // If passed, update progress to 100%
    if (score >= 60) {
      const updatedCourseData = { ...courseState };
      updatedCourseData.progress.completed = updatedCourseData.progress.total;
      updatedCourseData.progress.steps = updatedCourseData.progress.totalSteps;
      updatedCourseData.progress.percentage = 100;
      setCourseState(updatedCourseData);
      
      // Update progress in API
      try {
        api.post('/content/progress/', {
          content_id: courseId,
          progress_percentage: 100,
          completed: true
        });
      } catch (error) {
        console.error("Error updating progress:", error);
      }
    }
  };

  // Reset assessment to try again
  const resetAssessment = () => {
    setAssessmentCompleted(false);
    setAssessmentScore(0);
    setAssessmentPassed(false);
  };

  // Go back to the course from assessment
  const goBackToCourse = () => {
    setActiveContent("lesson");
    resetAssessment();
  };

  // Handle navigation
  const navigateToLesson = (direction) => {
    if (!currentLesson) return;

    const updatedCourseData = { ...courseState };
    let newModuleIndex = currentLesson.moduleIndex;
    let newLessonIndex = currentLesson.lessonIndex;

    // Find the previous lesson's module and index
    const prevModule = updatedCourseData.modules[currentLesson.moduleIndex];
    const prevLesson = prevModule.lessons[currentLesson.lessonIndex];

    // Remove current flag from current lesson
    prevLesson.current = false;

    if (direction === "next") {
      // Mark current lesson as completed
      prevLesson.completed = true;

      // Update progress
      const completedCount = updatedCourseData.modules.reduce(
        (count, module) =>
          count + module.lessons.filter((lesson) => lesson.completed).length,
        0
      );
      const totalCount = updatedCourseData.modules.reduce(
        (count, module) => count + module.lessons.length,
        0
      );
      updatedCourseData.progress.completed = completedCount;
      updatedCourseData.progress.steps = completedCount;
      updatedCourseData.progress.percentage = Math.round(
        (completedCount / totalCount) * 100
      );
      
      // Update progress in API
      try {
        api.post('/content/progress/', {
          content_id: courseId,
          progress_percentage: updatedCourseData.progress.percentage,
          completed: updatedCourseData.progress.percentage === 100
        });
      } catch (error) {
        console.error("Error updating progress:", error);
      }

      // Find next lesson
      if (newLessonIndex < prevModule.lessons.length - 1) {
        // Next lesson in same module
        newLessonIndex++;
      } else if (newModuleIndex < updatedCourseData.modules.length - 1) {
        // First lesson in next module
        newModuleIndex++;
        newLessonIndex = 0;
      }
    } else if (direction === "prev") {
      // Find previous lesson
      if (newLessonIndex > 0) {
        // Previous lesson in same module
        newLessonIndex--;
      } else if (newModuleIndex > 0) {
        // Last lesson in previous module
        newModuleIndex--;
        newLessonIndex =
          updatedCourseData.modules[newModuleIndex].lessons.length - 1;
      }
    }

    // Set current flag on new lesson
    const nextModule = updatedCourseData.modules[newModuleIndex];
    const nextLesson = nextModule.lessons[newLessonIndex];
    nextLesson.current = true;

    // Update state
    setCourseState(updatedCourseData);
    setCurrentLesson({
      module: nextModule,
      lesson: nextLesson,
      moduleIndex: newModuleIndex,
      lessonIndex: newLessonIndex,
    });
  };

  // Handle taking assessment
  const takeAssessment = () => {
    setActiveContent("assessment");
  };

  // If loading
  if (loading) {
    return <div className={styles.loading}>Loading course...</div>;
  }
  
  // If error
  if (error) {
    return (
      <div className={styles.error}>
        <h2>Error Loading Course</h2>
        <p>{error}</p>
        <button onClick={() => navigate("/digital-content")}>
          Return to Content Library
        </button>
      </div>
    );
  }

  // If course data not loaded yet
  if (!courseState || !currentLesson) {
    return <div className={styles.loading}>Preparing course content...</div>;
  }

  return (
    <div className={styles.coursePage}>
      {/* Progress bar and header */}
      <CourseHeader courseState={courseState} />

      <div className={styles.courseContent}>
        {/* Sidebar - always visible */}
        <CourseSidebar
          modules={courseState.modules}
          currentLesson={currentLesson}
          courseTitle={courseState.title}
        />

        {/* Main content */}
        <div className={styles.mainContent}>
          {activeContent === "lesson" ? (
            <CourseContent
              currentLesson={currentLesson}
              courseTitle={courseState.title}
            />
          ) : (
            <CourseAssessment
              courseState={courseState}
              assessmentCompleted={assessmentCompleted}
              assessmentScore={assessmentScore}
              assessmentPassed={assessmentPassed}
              submitAssessment={submitAssessment}
              resetAssessment={resetAssessment}
              goBackToCourse={goBackToCourse}
            />
          )}
        </div>
      </div>

      {/* Footer navigation */}
      <CourseFooter
        currentLesson={currentLesson}
        courseModules={courseState.modules}
        navigateToLesson={navigateToLesson}
        takeAssessment={takeAssessment}
        goBackToCourse={goBackToCourse}
      />
    </div>
  );
};

export default Course;
