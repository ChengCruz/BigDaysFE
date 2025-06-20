
export function Footer() {
  return (
    <footer className="bg-background text-text py-8 px-6 mt-20">
      <div className="max-w-4xl mx-auto text-center space-y-2 text-sm text-gray-600">
        <p>© {new Date().getFullYear()} My Big Day. All rights reserved.</p>
        <p>
          Built with ❤️ using React, Vite & Tailwind CSS.
        </p>
      </div>
    </footer>
  );
}
