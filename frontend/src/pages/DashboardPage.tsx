import { Button } from "@/components/ui/button";
import { useEffect } from "react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export default function DashboardPage() {
  const navigate = useNavigate();
  function handleCreateMeeting() {
    console.log("TODO Cretae meeting");
  }

  useEffect(() => {
    const sseUrl = import.meta.env.VITE_SSE_URL ; // http://localhost:8080/api/sse 
    const eventSource = new EventSource(sseUrl, {
      withCredentials: true,
    });

    eventSource.addEventListener("ping", (event) => {
      console.log("SSE heartbeat:", event.data);
    });

    eventSource.addEventListener("meeting_request", (event) => {
      console.log("Meeting request raw:", event.data);

      try {
        const data = JSON.parse(event.data);
        toast.info(`New KYC Request`, {
          description: `ID: ${data.national_id}`,
          action: {
            label: "Join",
            // onClick: () => window.open(`/kyc/${data.meeting_id}`, '_blank')
            onClick: () => navigate(`/admin/meeting/${data.meeting_id}`),
          },
        });
      } catch (e) {
        console.error("SSE parse error", e);
      }
    });

    eventSource.onerror = (err) => {
      console.error("SSE error", err);
    };

    return () => {
      eventSource.close();
    };
  }, []);

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Dashboard</h2>
      <p>Welcome! You are logged in.</p>
      <div>
        <Button variant="outline" onClick={handleCreateMeeting}>
          Create Meeting
        </Button>
      </div>
    </div>
  );
}
