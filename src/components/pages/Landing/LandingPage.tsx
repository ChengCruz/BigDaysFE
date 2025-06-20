export default function LandingPage() {
  return (
    <section className="bg-background text-center text-text py-20 space-y-20">
        
      {/* Save the Date Section */}
      <div className="space-y-6">
        <h2 className="text-4xl font-playfair italic text-primary">Save The Date</h2>
        <p className="text-lg font-semibold">14 Feb 2020</p>

        <div className="flex justify-center gap-6 mt-8 flex-wrap">
          {["Days", "Hours", "Mins", "Secs"].map((label) => (
            <div
              key={label}
              className="w-28 h-28 rounded-full border-2 border-secondary flex flex-col justify-center items-center"
            >
              <span className="text-3xl text-gray-400">00</span>
              <span className="text-sm text-gray-500">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Bride & Groom Section */}
      <div className="bg-[#fffaf0] py-16 px-4">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
          <div>
            <h3 className="text-lg font-semibold mb-2">THE BRIDE</h3>
            <p className="text-sm text-gray-700 leading-relaxed">
              A bridecollection of textile samples lay spread out on the table Samsa was a travelling
              salesman and above it there hung a picture that he had recently cut out of an illustrated magazine.
            </p>
          </div>

          <div className="mx-auto">
            <img
              src="https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e"
              alt="Bride and Groom"
              className="w-64 h-64 object-cover rounded-md shadow-lg"
            />
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">THE GROOM</h3>
            <p className="text-sm text-gray-700 leading-relaxed">
              A bridecollection of textile samples lay spread out on the table Samsa was a travelling
              salesman and above it there hung a picture that he had recently cut out of an illustrated magazine.
            </p>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div>
        <h2 className="text-2xl font-semibold">Plan. Invite. Celebrate.</h2>
        <p className="max-w-xl mx-auto mt-2 text-gray-600">
          Streamline your wedding with real-time RSVP analytics, seating charts, and more.
        </p>
        <button className="mt-6 px-6 py-3 rounded-2xl bg-accent text-white shadow-lg">
          Get Started
        </button>
      </div>
    </section>
  );
}
