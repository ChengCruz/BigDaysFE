
export default function GalleryPage() {
  return (
    <section className="py-20 bg-background text-text">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-4xl font-playfair italic text-primary text-center mb-8">
          Photo Gallery
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <img
              key={i}
              src={`https://picsum.photos/seed/${i}/400/300`}
              alt={`Gallery ${i}`}
              className="w-full h-60 object-cover rounded-lg shadow"
            />
          ))}
        </div>
      </div>
    </section>
  );
}
