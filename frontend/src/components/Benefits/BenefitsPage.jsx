import React from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../landing page/Navbar";
import Footer from "../landing page/Footer";
import styles from "./BenefitsPage.module.css";

const BenefitsPage = () => {
  const navigate = useNavigate();

  const handleJoinNow = () => {
    navigate("/join");
  };
  
  const handleRequestUpgrade = () => {
    // In a real app, this might navigate to a different page or show a modal
    navigate("/join");
  };

  return (
    <div>
      <Navbar />
      <div className={styles.benefitsContainer}>
        <div className={styles.heroSection}>
          <h1 className={styles.mainTitle}>Why Join Together Culture?</h1>
          <p className={styles.subtitle}>
            Discover the benefits of becoming part of our vibrant community
          </p>
        </div>

        <div className={styles.benefitsGrid}>
          <div className={styles.benefitCard}>
            <div className={styles.iconContainer}>
              <span className={styles.icon}>🤝</span>
            </div>
            <h3 className={styles.benefitTitle}>Community Connection</h3>
            <p className={styles.benefitDescription}>
              Connect with like-minded individuals who share your passion for
              culture, creativity, and positive change.
            </p>
          </div>

          <div className={styles.benefitCard}>
            <div className={styles.iconContainer}>
              <span className={styles.icon}>🎯</span>
            </div>
            <h3 className={styles.benefitTitle}>Exclusive Events</h3>
            <p className={styles.benefitDescription}>
              Gain access to member-only workshops, networking events, and
              creative sessions led by industry professionals.
            </p>
          </div>

          <div className={styles.benefitCard}>
            <div className={styles.iconContainer}>
              <span className={styles.icon}>💡</span>
            </div>
            <h3 className={styles.benefitTitle}>Skill Development</h3>
            <p className={styles.benefitDescription}>
              Enhance your skills through collaborative projects, mentorship
              opportunities, and specialized training programs.
            </p>
          </div>

          <div className={styles.benefitCard}>
            <div className={styles.iconContainer}>
              <span className={styles.icon}>🌱</span>
            </div>
            <h3 className={styles.benefitTitle}>Sustainable Impact</h3>
            <p className={styles.benefitDescription}>
              Be part of initiatives that create positive environmental and
              social change in our communities.
            </p>
          </div>

          <div className={styles.benefitCard}>
            <div className={styles.iconContainer}>
              <span className={styles.icon}>🔄</span>
            </div>
            <h3 className={styles.benefitTitle}>Resource Sharing</h3>
            <p className={styles.benefitDescription}>
              Access shared spaces, equipment, and resources that support
              your creative and professional endeavors.
            </p>
          </div>

          <div className={styles.benefitCard}>
            <div className={styles.iconContainer}>
              <span className={styles.icon}>🚀</span>
            </div>
            <h3 className={styles.benefitTitle}>Career Opportunities</h3>
            <p className={styles.benefitDescription}>
              Discover new career paths, collaborations, and professional
              opportunities through our extensive network.
            </p>
          </div>
        </div>

        <div className={styles.testimonialSection}>
          <h2 className={styles.sectionTitle}>What Our Members Say</h2>
          <div className={styles.testimonials}>
            <div className={styles.testimonialCard}>
              <p className={styles.testimonialText}>
                "Joining Together Culture has been transformative for my creative
                practice. The connections I've made and the skills I've developed
                have opened up so many new opportunities."
              </p>
              <div className={styles.testimonialAuthor}>
                <div className={styles.authorInitial}>S</div>
                <div className={styles.authorInfo}>
                  <p className={styles.authorName}>Sarah M.</p>
                  <p className={styles.authorRole}>Digital Artist</p>
                </div>
              </div>
            </div>

            <div className={styles.testimonialCard}>
              <p className={styles.testimonialText}>
                "The community aspect is incredible. I've found collaborators,
                mentors, and friends who challenge and inspire me every day."
              </p>
              <div className={styles.testimonialAuthor}>
                <div className={styles.authorInitial}>J</div>
                <div className={styles.authorInfo}>
                  <p className={styles.authorName}>James T.</p>
                  <p className={styles.authorRole}>Community Organizer</p>
                </div>
              </div>
            </div>

            <div className={styles.testimonialCard}>
              <p className={styles.testimonialText}>
                "The events and workshops have helped me develop skills I never
                thought I'd have. Together Culture has been a game-changer for
                my personal and professional growth."
              </p>
              <div className={styles.testimonialAuthor}>
                <div className={styles.authorInitial}>L</div>
                <div className={styles.authorInfo}>
                  <p className={styles.authorName}>Leila K.</p>
                  <p className={styles.authorRole}>Entrepreneur</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.membershipSection}>
          <h2 className={styles.sectionTitle}>Membership Plans</h2>
          <p className={styles.membershipSubtitle}>Choose the membership that best fits your needs</p>
          
          <div className={styles.membershipCards}>
            <div className={styles.membershipCard}>
              <div className={styles.membershipHeader}>
                <h3 className={styles.membershipTitle}>Community Member</h3>
                <p className={styles.membershipPrice}>Free</p>
              </div>
              <p className={styles.membershipDescription}>
                Perfect for getting started and connecting with the community
              </p>
              
              <div className={styles.includedFeatures}>
                <h4 className={styles.includedTitle}>What's included:</h4>
                <ul className={styles.featuresList}>
                  <li className={styles.featureItem}>
                    <span className={styles.checkIcon}>✓</span>
                    Community Events
                  </li>
                  <li className={styles.featureItem}>
                    <span className={styles.checkIcon}>✓</span>
                    Digital Content
                  </li>
                  <li className={styles.featureItem}>
                    <span className={styles.checkIcon}>✓</span>
                    Discussion Forums
                  </li>
                </ul>
              </div>
              
              <div className={styles.currentPlanBadge}>Current Plan</div>
            </div>

            <div className={styles.membershipCard}>
              <div className={styles.membershipHeader}>
                <h3 className={styles.membershipTitle}>Creative Workspace Member</h3>
                <p className={styles.membershipPrice}>
                  $29/month
                  <span className={styles.perMonth}>/month</span>
                </p>
              </div>
              <p className={styles.membershipDescription}>
                Ideal for creators who need dedicated workspace
              </p>
              
              <div className={styles.includedFeatures}>
                <h4 className={styles.includedTitle}>What's included:</h4>
                <ul className={styles.featuresList}>
                  <li className={styles.featureItem}>
                    <span className={styles.checkIcon}>✓</span>
                    Workspace Access
                  </li>
                  <li className={styles.featureItem}>
                    <span className={styles.checkIcon}>✓</span>
                    Creative Tools
                  </li>
                  <li className={styles.featureItem}>
                    <span className={styles.checkIcon}>✓</span>
                    Mentoring Sessions
                  </li>
                  <li className={styles.featureItem}>
                    <span className={styles.checkIcon}>✓</span>
                    All Community Benefits
                  </li>
                  <li className={styles.approvalItem}>
                    <span className={styles.infoIcon}>ⓘ</span>
                    Requires approval from administrators
                  </li>
                </ul>
              </div>
              
              <button 
                className={styles.upgradeButton}
                onClick={handleRequestUpgrade}
              >
                Request Upgrade
              </button>
            </div>

            <div className={styles.membershipCard}>
              <div className={styles.membershipHeader}>
                <h3 className={styles.membershipTitle}>Key Access Member</h3>
                <p className={styles.membershipPrice}>
                  $49/month
                  <span className={styles.perMonth}>/month</span>
                </p>
              </div>
              <p className={styles.membershipDescription}>
                For professionals needing 24/7 access and premium features
              </p>
              
              <div className={styles.includedFeatures}>
                <h4 className={styles.includedTitle}>What's included:</h4>
                <ul className={styles.featuresList}>
                  <li className={styles.featureItem}>
                    <span className={styles.checkIcon}>✓</span>
                    24/7 Building Access
                  </li>
                  <li className={styles.featureItem}>
                    <span className={styles.checkIcon}>✓</span>
                    Private Storage
                  </li>
                  <li className={styles.featureItem}>
                    <span className={styles.checkIcon}>✓</span>
                    Premium Support
                  </li>
                  <li className={styles.featureItem}>
                    <span className={styles.checkIcon}>✓</span>
                    All Workspace Benefits
                  </li>
                  <li className={styles.approvalItem}>
                    <span className={styles.infoIcon}>ⓘ</span>
                    Requires approval from administrators
                  </li>
                </ul>
              </div>
              
              <button 
                className={styles.upgradeButton}
                onClick={handleRequestUpgrade}
              >
                Request Upgrade
              </button>
            </div>
          </div>
        </div>

        <div className={styles.ctaSection}>
          <h2 className={styles.ctaTitle}>Ready to Experience the Benefits?</h2>
          <p className={styles.ctaDescription}>
            Join our community today and start your journey towards connection,
            creativity, and positive impact.
          </p>
          <button className={styles.ctaButton} onClick={handleJoinNow}>
            Become a Member <span className={styles.arrow}>→</span>
          </button>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default BenefitsPage;