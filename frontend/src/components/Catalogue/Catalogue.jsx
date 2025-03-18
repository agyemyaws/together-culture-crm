

const catalogueData = [
  {
    id: 1,
    type: "Workshop",
    title: "Sustainable Practices in Creative Industry",
    description: "Learn eco-friendly techniques for creative work.",
    date: "2025-02-15T14:00:00",
    location: "Main Space",
    capacity: 30,
    status: "Open",
  },
  {
    id: 2,
    type: "Workspace",
    title: "Studio A - Creative Workspace",
    description: "Modern studio with tools for design and prototyping.",
    availability: "Available daily, 9 AM - 5 PM",
    location: "Studio Wing",
    capacity: 5,
    status: "Available",
  },
  {
    id: 3,
    type: "Workshop",
    title: "Community Storytelling Session",
    description: "Share and develop narratives with fellow creators.",
    date: "2025-03-10T18:00:00",
    location: "Community Room",
    capacity: 20,
    status: "Open",
  },
  {
    id: 4,
    type: "Resource",
    title: "Eco-Materials Library",
    description: "Access sustainable materials for your projects.",
    availability: "Open access during community hours",
    location: "Resource Hub",
    capacity: null,
    status: "Available",
  },
  {
    id: 5,
    type: "Workshop",
    title: "Upcycling Art Techniques",
    description: "Transform waste into art with expert guidance.",
    date: "2025-04-05T10:00:00",
    location: "Workshop Space B",
    capacity: 25,
    status: "Open",
  },
];

export default function Catalogue() {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {catalogueData.map((item) => (
        <div
          key={item.id}
          className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow"
        >
          <h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>
          <p className="mt-2 text-sm text-gray-600">{item.description}</p>
          <div className="mt-4 space-y-1 text-sm text-gray-700">
            {item.date && (
              <p>
                <strong>Date:</strong>{" "}
                {new Date(item.date).toLocaleString("en-US", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </p>
            )}
            {item.availability && (
              <p>
                <strong>Availability:</strong> {item.availability}
              </p>
            )}
            <p>
              <strong>Location:</strong> {item.location}
            </p>
            {item.capacity && (
              <p>
                <strong>Capacity:</strong> {item.capacity}
              </p>
            )}
            <p>
              <strong>Status:</strong>{" "}
              <span
                className={
                  item.status === "Open" || item.status === "Available"
                    ? "text-green-600"
                    : "text-red-600"
                }
              >
                {item.status}
              </span>
            </p>
          </div>
          <button
            className="mt-4 w-full bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            {item.type === "Workshop" ? "Register" : "Book Now"}
          </button>
        </div>
      ))}
    </div>
  );
}