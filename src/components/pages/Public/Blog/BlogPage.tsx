import { Button } from "../../../atoms/Button";

export default function BlogPage() {
  return (
    <section className="py-20 bg-background text-text">
      <div className="max-w-4xl mx-auto space-y-8">
        <h2 className="text-4xl font-playfair italic text-primary text-center">
          Wedding Blog
        </h2>
        <article className="space-y-4">
          <h3 className="text-2xl font-semibold">Our Engagement Story</h3>
          <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit.
          </p>
          <Button variant="secondary">Read More</Button>
        </article>
        {/* more posts… */}
      </div>
    </section>
  );
}
