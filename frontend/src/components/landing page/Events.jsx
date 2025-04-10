import EventCard from "./EventCard";
import styles from "./Events.module.css";

const Events = () => {
  const events = [
    {
      id: 1,
      title: "Creative Workshop",
      type: "Workshop",
      description: "Learn about sustainable practices in the creative industry",
      date: "2025-02-15 at 14:00",
      location: "Main Space",
      capacity: 30,
      imageUrl: "/images/pexels-shkrabaanthony-4348401.jpg",
      is_public: true
    },
    {
      id: 2,
      title: "Community Open Day",
      type: "Open Day",
      description: "Experience our vibrant community and creative spaces",
      date: "2025-02-20 at 10:00",
      location: "Community Hall",
      capacity: 50,
      imageUrl: "/images/pexels-bertellifotografia-3321793.jpg",
      is_public: true
    },
    {
      id: 3,
      title: "Digital Art Masterclass",
      type: "Masterclass",
      description:
        "Explore advanced techniques in digital illustration and design",
      date: "2025-03-05 at 13:00",
      location: "Design Studio",
      capacity: 25,
      imageUrl: "/images/pexels-lum3n-44775-398257.jpg",
      is_public: true
    },
  ];

  return (
    <section className={styles.container}>
      <h2 className={styles.title}>Upcoming Events</h2>
      <p className={styles.subtitle}>
        Discover workshops, meetups, and events that shape our creative
        community
      </p>
      <div className={styles.grid}>
        {events.map((event) => (
          <EventCard key={event.id} {...event} />
        ))}
      </div>
    </section>
  );
};

export default Events;
