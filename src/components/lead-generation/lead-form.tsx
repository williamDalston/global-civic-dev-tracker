'use client';

import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface LeadFormProps {
  permitId?: number;
  workType?: string;
  citySlug?: string;
  sourceUrl?: string;
  onSuccess?: () => void;
}

interface FormErrors {
  name?: string;
  email?: string;
  phone?: string;
}

export function LeadForm({ permitId, workType, citySlug, sourceUrl, onSuccess }: LeadFormProps) {
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [serverError, setServerError] = useState('');

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors({});
    setServerError('');

    const form = new FormData(e.currentTarget);

    // Honeypot check
    if (form.get('website')) return;

    const name = (form.get('name') as string).trim();
    const email = (form.get('email') as string).trim();
    const phone = (form.get('phone') as string).trim();
    const message = (form.get('message') as string).trim();

    // Client-side validation
    const newErrors: FormErrors = {};
    if (!name) newErrors.name = 'Name is required';
    if (!email) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = 'Invalid email address';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch('/api/leads/capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          phone: phone || undefined,
          message: message || undefined,
          workType,
          permitId,
          citySlug,
          sourceUrl: sourceUrl || window.location.href,
          utmSource: new URLSearchParams(window.location.search).get('utm_source') || undefined,
          utmMedium: new URLSearchParams(window.location.search).get('utm_medium') || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to submit');
      }

      setSubmitted(true);
      onSuccess?.();
    } catch (error) {
      setServerError(error instanceof Error ? error.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="rounded-xl border border-success/30 bg-success/5 p-6 text-center">
        <h3 className="text-lg font-bold text-foreground">Thanks! We&apos;ll be in touch.</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Local contractors will reach out within 24 hours with free quotes for your project.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="lead-name" className="mb-1 block text-sm font-medium text-foreground">
          Name *
        </label>
        <Input id="lead-name" name="name" placeholder="Your full name" error={errors.name} />
      </div>

      <div>
        <label htmlFor="lead-email" className="mb-1 block text-sm font-medium text-foreground">
          Email *
        </label>
        <Input
          id="lead-email"
          name="email"
          type="email"
          placeholder="you@example.com"
          error={errors.email}
        />
      </div>

      <div>
        <label htmlFor="lead-phone" className="mb-1 block text-sm font-medium text-foreground">
          Phone
        </label>
        <Input
          id="lead-phone"
          name="phone"
          type="tel"
          placeholder="(555) 123-4567"
          error={errors.phone}
        />
      </div>

      <div>
        <label htmlFor="lead-message" className="mb-1 block text-sm font-medium text-foreground">
          Project Details
        </label>
        <Textarea
          id="lead-message"
          name="message"
          placeholder="Tell us about your project..."
          rows={3}
        />
      </div>

      {/* Honeypot */}
      <input type="text" name="website" className="hidden" tabIndex={-1} autoComplete="off" />

      {serverError && (
        <p className="text-sm text-destructive">{serverError}</p>
      )}

      <Button type="submit" className="w-full" disabled={submitting}>
        {submitting ? 'Submitting...' : 'Get Free Quotes'}
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        By submitting, you agree to be contacted by local contractors.
      </p>
    </form>
  );
}
