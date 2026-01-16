// pages/SchedulePage.tsx
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format, isAfter, set } from 'date-fns';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Input } from '@/components/ui/input';

import { scheduleSchema, type ScheduleData } from '@/lib/schemas/scheduleSchema';
import  api  from '@/lib/api';

export default function SchedulePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [meetingLink, setMeetingLink] = useState<string | null>(null);

  const customerId = parseInt(searchParams.get('customerId') || '', 10);
  if (!customerId || isNaN(customerId)) {
    useEffect(() => {
      navigate('/kyc', { replace: true });
    }, [navigate]);
    return null;
  }

  const {
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ScheduleData>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: {
      customerId,
      scheduledAt: undefined,
    },
  });

  const selectedDate = watch('scheduledAt');

  // Handle date + time selection
  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    // Preserve time if already set, otherwise default to 9 AM
    const newDate = selectedDate
      ? set(date, {
          hours: selectedDate.getHours(),
          minutes: selectedDate.getMinutes(),
        })
      : set(date, { hours: 9, minutes: 0 });
    setValue('scheduledAt', newDate);
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedDate) return;
    const [hours, minutes] = e.target.value.split(':').map(Number);
    const newDate = set(selectedDate, { hours, minutes });
    setValue('scheduledAt', newDate);
  };

  const onSubmit = async (data: ScheduleData) => {
    if (!isAfter(data.scheduledAt, new Date())) {
      setError("Please select a future date and time");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formattedData = {
        customer_id: data.customerId,
        scheduled_at: data.scheduledAt.toISOString(), // RFC3339
      };

      const res = await api.post('/kyc/schedule', formattedData);
      setMeetingLink(res.data.meeting_link);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to schedule meeting');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container flex items-center justify-center min-h-screen py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Schedule Your KYC Meeting</CardTitle>
          <p className="text-sm text-muted-foreground">
            Select a date and time for your video verification.
          </p>
        </CardHeader>
        <CardContent>
          {meetingLink ? (
            <div className="space-y-4 text-center">
              <div className="p-4 bg-green-50 rounded-lg">
                <h3 className="font-semibold text-green-800">✅ Scheduled!</h3>
                <p className="text-sm text-green-700 mt-2">
                  Your meeting link is ready.
                </p>
              </div>
              <a
                href={meetingLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline block"
              >
                {meetingLink}
              </a>
              <p className="text-sm text-muted-foreground">
                Save this link — you'll need it to join the call.
              </p>
              <Button
                onClick={() => navigator.clipboard.writeText(meetingLink)}
                variant="outline"
                className="w-full"
              >
                Copy Link
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {error && (
                <div className="p-3 text-sm text-red-600 bg-red-50 rounded">
                  {error}
                </div>
              )}

              {/* Date Picker */}
              <div className="space-y-2">
                <Label>Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={`w-full justify-start text-left font-normal ${
                        !selectedDate && 'text-muted-foreground'
                      }`}
                    >
                      {selectedDate ? (
                        format(selectedDate, 'PPP')
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={handleDateSelect}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                {errors.scheduledAt && (
                  <p className="text-sm text-red-500">{errors.scheduledAt.message}</p>
                )}
              </div>

              {/* Time Picker */}
              <div className="space-y-2">
                <Label>Time</Label>
                <Input
                  type="time"
                  onChange={handleTimeChange}
                  value={
                    selectedDate
                      ? format(selectedDate, 'HH:mm')
                      : '09:00'
                  }
                  className="w-full"
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Scheduling...' : 'Get Meeting Link'}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}