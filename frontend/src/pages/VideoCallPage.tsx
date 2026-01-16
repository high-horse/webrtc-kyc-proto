// src/pages/VideoCallPage.tsx
import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuthStore } from "@/stores/useAuthStore";

export default function VideoCallPage() {
  const { meetingId } = useParams<{ meetingId: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const isCustomer = !user;

  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCalling, setIsCalling] = useState(true);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!meetingId) {
      navigate("/kyc");
      return;
    }

    const setupWebRTC = async () => {
      try {
        // Get camera/mic
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        localStreamRef.current = stream;

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
          localVideoRef.current.muted = true;
        }

        // Create peer connection
        const pc = new RTCPeerConnection({
          iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
        });
        peerConnectionRef.current = pc;

        // Add local tracks
        stream.getTracks().forEach((track) => {
          pc.addTrack(track, stream);
        });

        // Handle remote stream
        pc.ontrack = (event) => {
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = event.streams[0];
          }
        };

        // Handle ICE candidates
        pc.onicecandidate = (event) => {
          if (event.candidate && wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(
              JSON.stringify({
                event: "ice-candidate",
                candidate: event.candidate,
                room: meetingId,
              })
            );
          }
        };

        // Connect to WebSocket
        const ws = new WebSocket("ws://localhost:8080/ws");
        wsRef.current = ws;

        ws.onopen = () => {
          ws.send(
            JSON.stringify({
              event: "join-room",
              room: meetingId,
              id: `${isCustomer ? "customer" : "agent"}-${Date.now()}`,
              role: isCustomer ? "customer" : "agent",
            })
          );
        };

        // ICE CANDIDATE QUEUE
        const iceCandidateQueue: RTCIceCandidate[] = [];

        const processIceQueue = () => {
          while (iceCandidateQueue.length > 0) {
            const candidate = iceCandidateQueue.shift();
            if (candidate) {
              pc.addIceCandidate(candidate).catch((e) =>
                console.warn("Failed to add queued ICE candidate", e)
              );
            }
          }
        };

        ws.onmessage = async (event) => {
          try {
            const msg = JSON.parse(event.data);
            let answer;
            switch (msg.event) {
              case "offer":
                if (!isCustomer) return;
                const offer = new RTCSessionDescription(msg.sdp);
                await pc.setRemoteDescription(offer);
                processIceQueue(); // Process queued candidates AFTER setting remote description

                answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);
                ws.send(
                  JSON.stringify({
                    event: "answer",
                    sdp: answer,
                    room: meetingId,
                  })
                );
                break;

              case "answer":
                if (isCustomer) return;
                answer = new RTCSessionDescription(msg.sdp);
                await pc.setRemoteDescription(answer);
                processIceQueue(); // Process queued candidates AFTER setting remote description
                break;

              case "ice-candidate":
                if (msg.candidate) {
                  const candidate = new RTCIceCandidate(msg.candidate);
                  if (!pc.remoteDescription) {
                    iceCandidateQueue.push(candidate); // Queue if no remote description
                  } else {
                    pc.addIceCandidate(candidate).catch((e) =>
                      console.warn("Failed to add ICE candidate", e)
                    );
                  }
                }
                break;

              case "user-left":
                setError("The other participant left the call.");
                hangUp();
                break;
            }
          } catch (e) {
            console.error("Signaling error:", e);
            setError("Call failed. Please try again.");
          }
        };

        ws.onclose = () => {
          if (isCalling) {
            setError("Connection lost.");
            hangUp();
          }
        };

        // Agent creates offer
        if (!isCustomer) {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          ws.send(
            JSON.stringify({
              event: "offer",
              sdp: offer,
              room: meetingId,
            })
          );
        }
      } catch (err: any) {
        console.error("WebRTC setup failed:", err);
        setError(
          err.name === "NotAllowedError"
            ? "Camera/microphone access denied. Please allow permissions."
            : "Failed to start video call. Please check your camera and mic."
        );
        hangUp();
      }
    };

    setupWebRTC();

    function hangUp() {
      setIsCalling(false);
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    }

    return () => {
      hangUp();
    };
  }, [meetingId, navigate, user]);

  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !isMuted;
        setIsMuted(!isMuted);
      }
    }
  };

  const toggleCamera = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !isCameraOff;
        setIsCameraOff(!isCameraOff);
      }
    }
  };

  const endCall = () => {
    navigate("/kyc");
  };

  if (!isCalling) {
    return (
      <div className="container flex items-center justify-center min-h-screen">
        <Card className="p-6 text-center">
          <p className="mb-4">{error || "Call ended."}</p>
          <Button onClick={() => navigate("/kyc")}>Back to KYC</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black p-4">
      {/* Remote Video */}
      <div className="relative w-full h-[70vh] mb-4">
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="w-full h-full object-contain rounded-lg bg-gray-900"
        />
        {!error && (
          <div className="absolute bottom-4 left-4 text-white bg-black/50 px-2 py-1 rounded">
            Remote Participant
          </div>
        )}
      </div>

      {/* Local Video */}
      <div className="flex justify-center mb-4">
        <div className="relative w-64 h-48">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover rounded-lg border-2 border-white"
          />
          <div className="absolute top-2 right-2 flex gap-2">
            <Button
              size="sm"
              variant={isMuted ? "destructive" : "secondary"}
              onClick={toggleMute}
              className="h-8 w-8 p-0"
            >
              {isMuted ? "🔇" : "🔊"}
            </Button>
            <Button
              size="sm"
              variant={isCameraOff ? "destructive" : "secondary"}
              onClick={toggleCamera}
              className="h-8 w-8 p-0"
            >
              {isCameraOff ? "📹" : "🎥"}
            </Button>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex justify-center gap-4">
        <Button variant="destructive" onClick={endCall}>
          End Call
        </Button>
      </div>

      {error && <div className="mt-4 text-center text-red-400">{error}</div>}
    </div>
  );
}