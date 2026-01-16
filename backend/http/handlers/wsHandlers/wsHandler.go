package wsHandlers

import (
	// "context"
	"encoding/json"
	"log"
	"net/http"

	// "github.com/coder/websocket/wsjson"
	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
)

// Client represents a connected WebSocket client
type Client struct {
	Conn       *websocket.Conn
	Room       string
	ID         string
	Role       string
	RemoteAddr string
}

// Global rooms map: roomID -> set of clients
var rooms = make(map[string]map[*Client]bool)

// Configure the upgrader
var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		// Allow requests from your frontend origin
		origin := r.Header.Get("Origin")
		return true
		return origin == "http://localhost:5173"
	},
}

// WebSocketHandler upgrades the HTTP connection to WebSocket
func WebSocketHandler(c *gin.Context) {
	// Upgrade the connection immediately — before Gin writes anything
	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		log.Printf("WebSocket upgrade failed: %v", err)
		return // Do NOT use c.JSON or c.Abort — just return
	}
	defer conn.Close()

	client := &Client{
		Conn:       conn,
		RemoteAddr: c.ClientIP(),
	}

	log.Println("New WebSocket client connected:", client.RemoteAddr)

	// Main message loop
	for {
		// Read a message (as raw bytes)
		_, message, err := conn.ReadMessage()
		if err != nil {
			// Handle disconnect
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("WebSocket read error: %v", err)
			}
			break
		}

		// Parse JSON
		var msg map[string]interface{}
		if err := json.Unmarshal(message, &msg); err != nil {
			log.Printf("Invalid JSON from client %s: %v", client.RemoteAddr, err)
			continue
		}

		// Ensure 'event' field exists
		event, ok := msg["event"].(string)
		if !ok {
			log.Printf("Missing 'event' field from client %s", client.RemoteAddr)
			continue
		}

		switch event {
		case "join-room":
			roomID, ok1 := msg["room"].(string)
			clientID, ok2 := msg["id"].(string)
			role := msg["role"].(string)
			if !ok1 || !ok2 {
				log.Printf("Missing 'room' or 'id' in join-room from %s", client.RemoteAddr)
				continue
			}

			client.Room = roomID
			client.ID = clientID
			client.Role = role

			// Initialize room if needed
			if rooms[roomID] == nil {
				rooms[roomID] = make(map[*Client]bool)
			}
			rooms[roomID][client] = true

			// Notify others in the room
			for otherClient := range rooms[roomID] {
				if otherClient != client {
					notification := map[string]interface{}{
						"event": "user-joined",
						"id":    client.ID,
					}
					if err := sendJSON(otherClient.Conn, notification); err != nil {
						log.Printf("Failed to notify client: %v", err)
					}
				}
			}
		case "start_meeting":
			// Forward to customer in the same room
			room := rooms[client.Room]
			for otherClient := range room {
				if otherClient.Role == "customer" {
					sendJSON(otherClient.Conn, map[string]interface{}{
						"event":      "start_meeting",
						"meeting_id": client.Room,
					})
					// wsjson.Write(context.Background(), otherClient.Conn, map[string]interface{}{
					// 	"event":      "start_meeting",
					// 	"meeting_id": client.Room,
					// })
				}
			}

		case "signal":
			// Forward signal to others in the same room
			if client.Room == "" {
				log.Printf("Signal received from client not in a room: %s", client.RemoteAddr)
				continue
			}

			room := rooms[client.Room]
			for otherClient := range room {
				if otherClient != client {
					if err := sendJSON(otherClient.Conn, msg); err != nil {
						log.Printf("Failed to forward signal: %v", err)
					}
				}
			}

		case "offer", "answer", "ice-candidate":
			if room, exists := rooms[client.Room]; exists {
				for otherClient := range room {
					if otherClient != client {
						sendJSON(otherClient.Conn, msg)
					}
				}
			}

		default:
			log.Printf("Unknown event '%s' from client %s", event, client.RemoteAddr)
		}
	}

	// Clean up on disconnect
	cleanupClient(client)
	log.Println("Client disconnected:", client.RemoteAddr)
}

// sendJSON sends a JSON message over the WebSocket
func sendJSON(conn *websocket.Conn, data interface{}) error {
	return conn.WriteJSON(data)
}

// cleanupClient removes the client from its room
func cleanupClient(client *Client) {
	if client.Room == "" {
		return
	}

	room := rooms[client.Room]
	if room == nil {
		return
	}

	delete(room, client)

	// Optionally notify others that user left
	for otherClient := range room {
		notification := map[string]interface{}{
			"event": "user-left",
			"id":    client.ID,
		}
		sendJSON(otherClient.Conn, notification)
	}

	// Clean up empty rooms
	if len(room) == 0 {
		delete(rooms, client.Room)
	}
}
