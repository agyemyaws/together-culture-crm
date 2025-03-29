import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { findCourseById } from "./Data";
import CourseHeader from "./CourseHeader";
import CourseSidebar from "./CourseSidebar";
import CourseContent from "./CourseContent";
import CourseFooter from "./CourseFooter";
import CourseAssessment from "./CourseAssesment";
import styles from "./Course.module.css";

const Course = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();

  // Get course data
  const courseData = findCourseById(courseId);

  // If course not found, redirect
  useEffect(() => {
    if (!courseData) {
      navigate("/digital-content");
    }
  }, [courseData, navigate]);

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

  // States
  const [activeContent, setActiveContent] = useState("lesson"); // 'lesson' or 'assessment'
  const [currentLesson, setCurrentLesson] = useState(null);
  const [courseState, setCourseState] = useState(null);
  const [assessmentCompleted, setAssessmentCompleted] = useState(false);
  const [assessmentScore, setAssessmentScore] = useState(0);
  const [assessmentPassed, setAssessmentPassed] = useState(false);

  // Initialize state when course data is available
  useEffect(() => {
    if (courseData) {
      setCourseState(courseData);
      setCurrentLesson(findCurrentLesson());
    }
  }, [courseData]);

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

  // If course data not loaded yet
  if (!courseState || !currentLesson) {
    return <div className={styles.loading}>Loading course...</div>;
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
