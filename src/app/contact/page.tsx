'use client';

import { useState } from 'react';
import { Mail, MapPin, Phone, Clock } from 'lucide-react';

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-neutral-dark mb-4">Contact Us</h1>
        <p className="text-neutral max-w-xl mx-auto">
          Have a question, feedback, or need help with an order? We&apos;d love to hear from you.
        </p>
      </div>

      <div className="grid lg:grid-cols-5 gap-10">
        <div className="lg:col-span-2 space-y-6">
          {[
            { icon: Mail, label: 'Email', value: 'support@shopnova.com' },
            { icon: Phone, label: 'Phone', value: '+1 (555) 123-4567' },
            { icon: MapPin, label: 'Address', value: '742 Evergreen Terrace, Springfield, IL 62701' },
            { icon: Clock, label: 'Hours', value: 'Mon–Fri: 9am–6pm CST\nSat: 10am–4pm CST' },
          ].map((item) => (
            <div key={item.label} className="flex gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <item.icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-neutral-dark text-sm">{item.label}</p>
                <p className="text-neutral text-sm whitespace-pre-line">{item.value}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="lg:col-span-3">
          {submitted ? (
            <div className="card p-8 text-center">
              <h2 className="text-xl font-bold text-neutral-dark mb-2">Message Sent!</h2>
              <p className="text-neutral">Thank you for reaching out. Our team will get back to you within 24 hours.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="card p-6 space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Name</label>
                  <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field" required />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Email</label>
                  <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input-field" required />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Subject</label>
                <input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className="input-field" required />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Message</label>
                <textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} className="input-field min-h-[120px]" required />
              </div>
              <button type="submit" className="btn-primary w-full">Send Message</button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
