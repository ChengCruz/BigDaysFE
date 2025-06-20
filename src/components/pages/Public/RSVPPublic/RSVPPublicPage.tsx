import React, { useState } from "react";
import { FormField } from "../../../molecules/FormField";
import { Button } from "../../../atoms/Button";

export default function RSVPPublicPage() {
  const [name, setName]   = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"Yes"|"No"|"Maybe">("Yes");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: call public RSVP API
    alert(`RSVP submitted for ${name}: ${status}`);
  };

  return (
    <section className="py-20 bg-background text-text">
      <div className="max-w-md mx-auto space-y-6">
        <h2 className="text-3xl font-semibold text-primary text-center">
          RSVP
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField
            label="Name"
            value={name}
            onChange={e => setName(e.target.value)}
          />
          <FormField
            label="Email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
          <div>
            <label className="block mb-1">Will you attend?</label>
            <select
              value={status}
              onChange={e => setStatus(e.target.value as any)}
              className="w-full border rounded p-2 focus:ring-2 focus:ring-primary"
            >
              {["Yes", "No", "Maybe"].map(opt => (
                <option key={opt}>{opt}</option>
              ))}
            </select>
          </div>
          <Button type="submit" variant="primary" className="w-full">
            Submit RSVP
          </Button>
        </form>
      </div>
    </section>
  );
}
