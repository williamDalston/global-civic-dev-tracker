'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/cn';
import { PERMIT_CATEGORIES } from '@/lib/config/constants';

interface ServiceArea {
  id: number;
  cityId: number;
  cityName: string | null;
  isActive: boolean;
}

interface City {
  id: number;
  name: string;
  countryName: string;
}

const CITIES: City[] = [
  { id: 1, name: 'Washington DC', countryName: 'United States' },
  { id: 2, name: 'New York City', countryName: 'United States' },
  { id: 3, name: 'Chicago', countryName: 'United States' },
  { id: 4, name: 'London', countryName: 'United Kingdom' },
  { id: 5, name: 'Sydney', countryName: 'Australia' },
  { id: 6, name: 'Toronto', countryName: 'Canada' },
];

const categoryDescriptions: Record<string, string> = {
  'new-construction': 'New buildings, additions, ground-up construction',
  renovation: 'Remodeling, interior renovations, upgrades',
  demolition: 'Tear-downs, structural removal',
  electrical: 'Wiring, panels, electrical systems',
  plumbing: 'Pipes, fixtures, water systems',
  hvac: 'Heating, cooling, ventilation',
  roofing: 'Roof repairs, replacements, installations',
  mechanical: 'Elevators, escalators, mechanical systems',
  'fire-safety': 'Sprinklers, alarms, fire suppression',
  signage: 'Business signs, billboards, displays',
  general: 'General contracting, multiple trades',
};

export default function ContractorProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const [companyName, setCompanyName] = useState('');
  const [contactName, setContactName] = useState('');
  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [description, setDescription] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [yearsInBusiness, setYearsInBusiness] = useState('');
  const [employeeCount, setEmployeeCount] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedCities, setSelectedCities] = useState<number[]>([]);

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch('/api/contractors/profile');
        if (!res.ok) {
          router.push('/contractors/login');
          return;
        }
        const data = await res.json();
        const c = data.contractor;
        setCompanyName(c.companyName || '');
        setContactName(c.contactName || '');
        setPhone(c.phone || '');
        setWebsite(c.website || '');
        setDescription(c.description || '');
        setLicenseNumber(c.licenseNumber || '');
        setYearsInBusiness(c.yearsInBusiness?.toString() || '');
        setEmployeeCount(c.employeeCount || '');
        setSelectedCategories(data.categories || []);
        setSelectedCities(
          (data.serviceAreas || []).map((a: ServiceArea) => a.cityId)
        );
      } catch {
        router.push('/contractors/login');
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [router]);

  function toggleCategory(category: string) {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  }

  function toggleCity(cityId: number) {
    setSelectedCities((prev) =>
      prev.includes(cityId)
        ? prev.filter((id) => id !== cityId)
        : [...prev, cityId]
    );
  }

  async function handleSave() {
    if (selectedCategories.length === 0) {
      setError('Select at least one service category.');
      return;
    }
    if (selectedCities.length === 0) {
      setError('Select at least one service area.');
      return;
    }

    setSaving(true);
    setError('');
    setSaved(false);

    try {
      const res = await fetch('/api/contractors/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName,
          contactName,
          phone,
          website,
          description,
          licenseNumber,
          yearsInBusiness: yearsInBusiness ? parseInt(yearsInBusiness, 10) : undefined,
          employeeCount,
          categories: selectedCategories,
          cityIds: selectedCities,
        }),
      });

      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to save changes.');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Edit Profile</h1>
        <p className="mt-1 text-muted-foreground">
          Update your business information and lead preferences
        </p>
      </div>

      {/* Business Info */}
      <Card>
        <CardHeader>
          <CardTitle>Business Information</CardTitle>
          <CardDescription>How potential clients will see you</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Company Name</label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Contact Name</label>
              <input
                type="text"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Phone</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Website</label>
              <input
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">License Number</label>
              <input
                type="text"
                value={licenseNumber}
                onChange={(e) => setLicenseNumber(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Years in Business</label>
              <input
                type="number"
                value={yearsInBusiness}
                onChange={(e) => setYearsInBusiness(e.target.value)}
                min="0"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm font-medium">Employee Count</label>
              <input
                type="text"
                value={employeeCount}
                onChange={(e) => setEmployeeCount(e.target.value)}
                placeholder="e.g. 1-5, 10-25, 50+"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Tell potential clients about your business..."
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            />
          </div>
        </CardContent>
      </Card>

      {/* Service Categories */}
      <Card>
        <CardHeader>
          <CardTitle>Service Categories</CardTitle>
          <CardDescription>
            You&apos;ll receive leads matching these work types
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {Object.entries(PERMIT_CATEGORIES)
              .filter(([key]) => key !== 'other' && key !== 'elevator' && key !== 'boiler')
              .map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => toggleCategory(key)}
                  className={cn(
                    'flex flex-col items-start rounded-lg border p-3 text-left transition-colors',
                    selectedCategories.includes(key)
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50'
                  )}
                >
                  <span className="text-sm font-medium">{label}</span>
                  {categoryDescriptions[key] && (
                    <span className="mt-0.5 text-xs text-muted-foreground">
                      {categoryDescriptions[key]}
                    </span>
                  )}
                </button>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Service Areas */}
      <Card>
        <CardHeader>
          <CardTitle>Service Areas</CardTitle>
          <CardDescription>
            Cities where you want to receive leads
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {CITIES.map((city) => (
              <button
                key={city.id}
                onClick={() => toggleCity(city.id)}
                className={cn(
                  'flex flex-col items-start rounded-lg border p-3 text-left transition-colors',
                  selectedCities.includes(city.id)
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/50'
                )}
              >
                <span className="text-sm font-medium">{city.name}</span>
                <span className="text-xs text-muted-foreground">{city.countryName}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Save */}
      <div className="flex items-center gap-4">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
        {saved && (
          <span className="text-sm font-medium text-green-400">Changes saved</span>
        )}
        {error && (
          <span className="text-sm font-medium text-destructive">{error}</span>
        )}
      </div>
    </div>
  );
}
