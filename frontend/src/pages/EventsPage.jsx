import React from "react";
import Navbar from "../components/landing page/Navbar";
import EventsListing from "../components/events/EventsListing";
import Footer from "../components/landing page/Footer";

const EventsPage = () => {
  return (
    <div>
      <Navbar />
      <div className="events-page-container">
        <EventsListing />
      </div>
      <Footer />
    </div>
  );
};

export default EventsPage;