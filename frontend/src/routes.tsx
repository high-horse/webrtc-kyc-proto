import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import HomeRedirect from "./pages/HomeRedirect";

import PublicLayout from "./layouts/PublicLayout";
import ProtectedLayout from "./layouts/ProtectedLayout";
import KycFormPage from "./pages/KycFormPage";
import SchedulePage from "./pages/SchedulePage";
import MeetingRoomPage from "./pages/MeetingRoomPage";
import AdminMeetingPage from "./pages/AdminMeetingPage";
import VideoCallPage from "./pages/VideoCallPage";

export const routes = [
  // Public routes
  {
    path: "/login",
    element: <LoginPage />,
    layout: PublicLayout,
  },
  {
    path: "/register",
    element: <RegisterPage />,
    layout: PublicLayout,
  },
  {
    path: "/kyc",
    element: <KycFormPage />,
    layout: PublicLayout, // ← public, no auth
  },
  {
    path: "/admin/meeting/:meetingId",
    element: <AdminMeetingPage />,
    layout: ProtectedLayout,
  },

  {
    path: "/schedule",
    element: <SchedulePage />,
    layout: PublicLayout,
  },
  {
    path: "/kyc/:meetingId",
    element: <MeetingRoomPage />,
    layout: PublicLayout,
  },
  {
    path: "/kyc-call/:meetingId",
    element: <VideoCallPage />, // ← shared WebRTC room (next step)
    layout: PublicLayout, // or Protected? Customer needs access
  },

  // Protected routes
  {
    path: "/dashboard",
    element: <DashboardPage />,
    layout: ProtectedLayout,
  },
  {
    path: "/",
    element: <HomeRedirect />,
    layout: PublicLayout,
  },
] as const;
