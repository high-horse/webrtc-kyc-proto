// pages/AdminMeetingPage.tsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import api from "@/lib/api";

export default function AdminMeetingPage() {
  const { meetingId } = useParams<{ meetingId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [customerInfo, setCustomerInfo] = useState<{
    name: string;
    nationalID: string;
    email: string;
  } | null>(null);

  useEffect(() => {
    const fetchMeeting = async () => {
      if (!meetingId) {
        setError("Invalid meeting link");
        setLoading(false);
        return;
      }

      try {
        const res = await api.get(`/kyc/meeting/${meetingId}`);
        setCustomerInfo({
          name: res.data.customer_name,
          nationalID: res.data.national_id,
          email: res.data.customer_email || "N/A",
        });
        setLoading(false);
      } catch (err: any) {
        setError(err.response?.data?.error || "Failed to load meeting");
        setLoading(false);
      }
    };

    fetchMeeting();
  }, [meetingId]);


  const handleStartMeeting = async () => {
    try {
      // 1. Tell backend to mark session as ongoing
      await api.post(`/kyc/session/${meetingId}/start`);

      // 2. Connect to WebSocket and signal customer
      const wsUrl = import.meta.env.VITE_WS_URL ; //"ws://localhost:8080/ws"
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        ws.send(
          JSON.stringify({
            event: "join-room",
            room: meetingId,
            id: "agent-" + Date.now(),
            role: "agent",
          })
        );

        // Send start signal
        setTimeout(() => {
          ws.send(
            JSON.stringify({
              event: "start_meeting",
            })
          );
          ws.close();

          // 3. Redirect self to call room
          navigate(`/kyc-call/${meetingId}`);
        }, 500);
      };
    } catch (err) {
      alert("Failed to start meeting");
    }
  };

  if (loading) {
    return (
      <div className="container flex items-center justify-center min-h-screen">
        <p>Loading meeting...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container flex items-center justify-center min-h-screen">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-red-600">{error}</p>
            <Button onClick={() => navigate("/dashboard")} className="mt-4">
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container flex items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Start KYC Verification</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <div>
              <p className="text-sm text-muted-foreground">Customer Name</p>
              <p className="font-medium">{customerInfo?.name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">National ID</p>
              <p className="font-mono bg-gray-100 p-2 rounded">
                {customerInfo?.nationalID}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p>{customerInfo?.email}</p>
            </div>
          </div>

          <Button onClick={handleStartMeeting} className="w-full mt-6">
            Start Meeting
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
