import Navbar from "../components/landing page/Navbar";
import Hero from "../components/landing page/Hero";
import Events from "../components/landing page/Events";
import Benefits from "../components/landing page/Benefits";
import Cta from "../components/landing page/Cta";
import Footer from "../components/landing page/Footer";

const landingPage = () => {
  return (
    <div>
      <Navbar />
      <Hero />
      <Events />
      <Benefits />
      <Cta />
      <Footer />
    </div>
  );
};

export default landingPage;
