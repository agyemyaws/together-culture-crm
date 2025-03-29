import { useState } from "react";
import CourseCertificate from "./CourseCertificate";
import styles from "./CourseAssesment.module.css";

const CourseAssessment = ({
  courseState,
  assessmentCompleted,
  assessmentScore,
  assessmentPassed,
  submitAssessment,
  resetAssessment,
  goBackToCourse,
}) => {
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const questions = courseState.assessment.questions;

  const handleOptionSelect = (questionId, optionId) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: optionId,
    }));
  };

  const handleSubmit = () => {
    // Check if all questions have answers
    const answeredCount = Object.keys(selectedAnswers).length;

    if (answeredCount < questions.length) {
      alert(
        `Please answer all questions. (${answeredCount}/${questions.length} answered)`
      );
      return;
    }

    submitAssessment(selectedAnswers);
  };

  return (
    <div className={styles.assessmentWrapper}>
      <div className={styles.breadcrumbs}>
        <span>My courses</span>
        <span className={styles.breadcrumbSeparator}>›</span>
        <span>{courseState.title}</span>
        <span className={styles.breadcrumbSeparator}>›</span>
        <span>Final Assessment</span>
      </div>

      <h1 className={styles.assessmentTitle}>
        Community Leadership Assessment
      </h1>

      {!assessmentCompleted ? (
        <div className={styles.assessmentContainer}>
          <p className={styles.assessmentDescription}>
            Complete this assessment to test your understanding of community
            leadership principles covered in this course. You need to score at
            least 60% to pass and receive your certificate.
          </p>

          <div className={styles.questionList}>
            {questions.map((question, index) => (
              <div key={question.id} className={styles.questionCard}>
                <h3 className={styles.questionHeader}>
                  Question {index + 1} of {questions.length}
                </h3>
                <p className={styles.questionText}>{question.question}</p>

                <div className={styles.optionList}>
                  {question.options.map((option) => (
                    <div key={option.id} className={styles.optionItem}>
                      <input
                        type="radio"
                        id={option.id}
                        name={question.id}
                        className={styles.optionInput}
                        onChange={() =>
                          handleOptionSelect(question.id, option.id)
                        }
                        checked={selectedAnswers[question.id] === option.id}
                      />
                      <label htmlFor={option.id} className={styles.optionLabel}>
                        {option.text}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className={styles.assessmentActions}>
            <button onClick={goBackToCourse} className={styles.backButton}>
              <svg
                className={styles.buttonIcon}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15 19l-7-7 7-7"
                ></path>
              </svg>
              Back to Course
            </button>

            <button onClick={handleSubmit} className={styles.submitButton}>
              Submit Assessment
            </button>
          </div>
        </div>
      ) : (
        <CourseCertificate
          assessmentScore={assessmentScore}
          assessmentPassed={assessmentPassed}
          resetAssessment={resetAssessment}
          goBackToCourse={goBackToCourse}
          courseTitle={courseState.title}
        />
      )}
    </div>
  );
};

export default CourseAssessment;
