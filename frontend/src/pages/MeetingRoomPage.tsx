// pages/MeetingRoomPage.tsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import api from "@/lib/api"; // Make sure you're using named export

export default function MeetingRoomPage() {
  const { meetingId } = useParams<{ meetingId: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nationalID, setNationalID] = useState<string | null>(null);
  const [waitingForAdmin, setWaitingForAdmin] = useState(false);
  const [ws, setWs] = useState<WebSocket | null>(null);

  useEffect(() => {
    if (!meetingId) {
      setError("Invalid meeting link");
      setLoading(false);
      return;
    }

    const init = async () => {
      try {
        // 1. Validate meeting and get National ID
        const res = await api.get(`/kyc/meeting/${meetingId}`);
        setNationalID(res.data.national_id);

        // 2. Notify admin (triggers SSE)
        await api.post(`/kyc/notify-admin`, { meeting_id: meetingId });
        setWaitingForAdmin(true);

        // 3. Connect to WebSocket
        const wsUrl = import.meta.env.VITE_WS_URL ; // ws://localhost:8080/ws 
        const socket = new WebSocket(wsUrl);
        setWs(socket);

        socket.onopen = () => {
          socket.send(
            JSON.stringify({
              event: "join-room",
              room: meetingId,
              id: "customer-" + Date.now(),
              role: "customer",
            })
          );
        };

        socket.onmessage = (event) => {
          try {
            const msg = JSON.parse(event.data);
            if (msg.event === "start_meeting") {
              // Redirect to shared call room
              window.location.href = `/kyc-call/${meetingId}`;
            }
          } catch (e) {
            console.error("WebSocket message parse error", e);
          }
        };

        socket.onerror = (err) => {
          console.error("WebSocket error:", err);
          setError("Connection failed. Please refresh.");
        };

        socket.onclose = () => {
          console.log("WebSocket disconnected");
        };

        setLoading(false);
      } catch (err: any) {
        console.error("Meeting validation failed", err);
        setError(
          err.response?.data?.error || "Invalid or expired meeting link"
        );
        setLoading(false);
      }
    };

    init();

    // Cleanup
    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, [meetingId]);

  if (loading) {
    return (
      <div className="container flex items-center justify-center min-h-screen">
        <p>Validating meeting...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container flex items-center justify-center min-h-screen">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-red-600">{error}</p>
            <Button
              onClick={() => (window.location.href = "/kyc")}
              className="mt-4"
            >
              Start New KYC
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
          <CardTitle>KYC Verification</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground">National ID</p>
            <p className="font-mono bg-gray-100 p-2 rounded">{nationalID}</p>
          </div>

          {waitingForAdmin ? (
            <div className="text-center py-4">
              <p className="text-muted-foreground">
                Waiting for agent to join...
              </p>
              <div className="flex justify-center mt-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse mx-1"></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse mx-1 delay-75"></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse mx-1 delay-150"></div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-red-500">Failed to notify agent</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
