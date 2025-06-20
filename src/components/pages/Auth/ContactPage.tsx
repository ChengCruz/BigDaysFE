// src/components/pages/Auth/ContactPage.tsx
import React, { useState } from "react";
import { FormField } from "../../molecules/FormField";
import { Button }    from "../../atoms/Button";

export default function ContactPage() {
  const [name, setName]     = useState("");
  const [email, setEmail]   = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: wire up your contact API
    alert("Message sent!");
  };

  return (
    <section className="max-w-md mx-auto p-6 bg-background text-text space-y-6">
      <h2 className="text-2xl font-semibold text-primary text-center">Contact Us</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Name"    value={name}    onChange={e => setName(e.target.value)} />
        <FormField label="Email"   type="email"    value={email}   onChange={e => setEmail(e.target.value)} />
        <FormField label="Message" type="textarea"  value={message} onChange={e => setMessage(e.target.value)} />
        <Button type="submit" variant="primary" className="w-full">Send Message</Button>
      </form>
    </section>
  );
}
