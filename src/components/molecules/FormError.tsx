// src/components/molecules/FormError.tsx

export const FormError: React.FC<{ message: string }> = ({ message }) => (
  <div className="p-2 bg-red-100 text-red-800 rounded text-sm mb-4">
    {message}
  </div>
);
