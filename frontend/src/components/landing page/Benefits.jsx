import BenefitCard from "./BenefitCard";
import styles from "./Benefits.module.css";

const Benefits = () => {
  const benefits = [
    {
      icon: "🎨",
      title: "Creative Workspace",
      description:
        "Access modern facilities and spaces designed for creative work",
    },
    {
      icon: "🤝",
      title: "Community Network",
      description: "Connect with like-minded creators and entrepreneurs",
    },
    {
      icon: "📚",
      title: "Skill Development",
      description: "Learn and grow through workshops and training programs",
    },
  ];

  return (
    <section className={styles.container}>
      <h2 className={styles.title}>Why Join Us?</h2>
      <p className={styles.description}>
        Be part of a community that supports growth, creativity, and sustainable
        practices
      </p>
      <div className={styles.grid}>
        {benefits.map((benefit, index) => (
          <BenefitCard key={index} {...benefit} />
        ))}
      </div>
    </section>
  );
};

export default Benefits;
