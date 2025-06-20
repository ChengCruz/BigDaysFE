
export default function CouplePage() {
  return (
    <section className="py-20 bg-background text-text">
      <div className="max-w-3xl mx-auto text-center space-y-6">
        <h2 className="text-4xl font-playfair italic text-primary">Our Story</h2>
        <p className="text-lg leading-relaxed">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus
          lacinia odio vitae vestibulum vestibulum.
        </p>
        <div className="flex flex-col md:flex-row items-center justify-center gap-8">
          <div className="text-center">
            <h3 className="text-xl font-semibold mb-2">The Bride</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              [Bride’s short bio goes here…]
            </p>
          </div>
          <img
            src="https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e"
            alt="Bride"
            className="w-48 h-48 object-cover rounded-full shadow-lg"
          />
          <div className="text-center">
            <h3 className="text-xl font-semibold mb-2">The Groom</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              [Groom’s short bio goes here…]
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
