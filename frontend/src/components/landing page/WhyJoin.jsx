import WhyJoinCard from "./WhyJoinCard";
import styles from "./WhyJoin.module.css";

const WhyJoin = () => {
  const benefits = [
    {
      icon: "🤝",
      title: "Community Connection",
      description:
        "Connect with like-minded individuals who share your passion for culture, creativity, and positive change.",
    },
    {
      icon: "🎯",
      title: "Exclusive Events",
      description: "Gain access to member-only workshops, networking events, and creative sessions led by industry professionals",
    },
    {
      icon: "📚",
      title: "Skill Development",
      description: "Enhance your skills through collaborative projects, mentorship opportunities, and specialized training programs.",
    },
    {
      icon: "🌱",
      title: "Sustainable Impact",
      description: "Be part of initiatives that create positive environmental and social change in our communities.",
    },
    {
      icon: "🔃",
      title: "Resource Sharing",
      description: "Access shared spaces, equipment, and resources that support your creative and professional endeavors.",
    },
    {
      icon: "🚀",
      title: "Career Opportunities",
      description: "Discover new career paths, collaborations, and professional opportunities through our extensive network.",
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
          <WhyJoinCard key={index} {...benefit} />
        ))}
      </div>
    </section>
  );
};

export default WhyJoin; 