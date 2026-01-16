// pages/KycFormPage.tsx
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

import { kycFormSchema, type KycFormData } from '@/lib/schemas/kycSchema';
import api  from '@/lib/api';

export default function KycFormPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<KycFormData>({
    resolver: zodResolver(kycFormSchema),
    defaultValues: {
      fullName: '',
      email: '',
      phone: '',
      nationalID: '',
    },
  });

  const dateOfBirth = watch('dateOfBirth');

  const onSubmit = async (data: KycFormData) => {
    setLoading(true);
    setError(null);

    try {
      // Format date to YYYY-MM-DD for backend
      const formattedData = {
        ...data,
        dateOfBirth: format(data.dateOfBirth, 'yyyy-MM-dd'),
      };

      const res = await api.post('/kyc/submit', formattedData);
      const customerId = res.data.customer_id;

      // Redirect to scheduling page with customer ID
      navigate(`/schedule?customerId=${customerId}`);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to submit KYC form');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container flex items-center justify-center min-h-screen py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>KYC Verification</CardTitle>
          <p className="text-sm text-muted-foreground">
            Please fill your details to start identity verification.
          </p>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-3 text-sm text-red-600 bg-red-50 rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                placeholder="John Doe"
                {...register('fullName')}
              />
              {errors.fullName && (
                <p className="text-sm text-red-500">{errors.fullName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="john@example.com"
                {...register('email')}
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone (Optional)</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+1234567890"
                {...register('phone')}
              />
            </div>

            <div className="space-y-2">
              <Label>Date of Birth</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={`w-full justify-start text-left font-normal ${
                      !dateOfBirth && 'text-muted-foreground'
                    }`}
                  >
                    {dateOfBirth ? (
                      format(dateOfBirth, 'PPP')
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dateOfBirth ? new Date(dateOfBirth) : undefined} 
                    onSelect={(date) => setValue('dateOfBirth',  date ? date.toISOString() : '')}
                    initialFocus
                    captionLayout="dropdown"
                    fromYear={1900}
                    toYear={new Date().getFullYear() - 18}
                  />
                </PopoverContent>
              </Popover>
              {errors.dateOfBirth && (
                <p className="text-sm text-red-500">{errors.dateOfBirth.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="nationalID">National ID</Label>
              <Input
                id="nationalID"
                placeholder="e.g., AB1234567"
                {...register('nationalID')}
              />
              {errors.nationalID && (
                <p className="text-sm text-red-500">{errors.nationalID.message}</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Submitting...' : 'Continue to Schedule'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}