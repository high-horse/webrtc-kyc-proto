package sseHandlers

import (
	"fmt"
	// "log"
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
)

// Global map: meetingID -> channel of notifications
var (
	adminNotifiers = make(map[string]chan string)
	notifierMutex  = &sync.RWMutex{}
)

// SSEHandler streams events to connected admins
func SSEHandler(c *gin.Context) {
	// Optional: authenticate as admin (skip for prototype)
	// c.Writer.Header().Set("Content-Type", "text/event-stream")
	// c.Writer.Header().Set("Cache-Control", "no-cache")
	// c.Writer.Header().Set("Connection", "keep-alive")
	// c.Writer.Header().Set("Access-Control-Allow-Origin", "http://localhost:5173")

	c.Writer.Header().Set("Access-Control-Allow-Origin", "http://localhost:5173")
	c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
	c.Writer.Header().Set("Content-Type", "text/event-stream")
	c.Writer.Header().Set("Cache-Control", "no-cache")
	c.Writer.Header().Set("Connection", "keep-alive")
	c.Writer.Header().Set("Access-Control-Allow-Headers", "Origin, Content-Type, Accept")

	// Handle preflight (though SSE doesn't use it, some browsers check)
	if c.Request.Method == "OPTIONS" {
		c.AbortWithStatus(204)
		return
	}

	flusher, ok := c.Writer.(http.Flusher)
	if !ok {
		c.AbortWithStatus(http.StatusInternalServerError)
		return
	}

	// Create a channel for this connection
	notificationChan := make(chan string, 10)
	notifierMutex.Lock()
	adminNotifiers["admin"] = notificationChan // or use multiple channels per agent later
	notifierMutex.Unlock()

	defer func() {
		notifierMutex.Lock()
		delete(adminNotifiers, "admin")
		close(notificationChan)
		notifierMutex.Unlock()
	}()

	// Send heartbeat to keep connection alive
	ticker := time.NewTicker(30 * time.Second)
	defer ticker.Stop()

	// Initial ping
	c.SSEvent("ping", "connected")
	flusher.Flush()

	for {
		select {
		case msg := <-notificationChan:
			c.SSEvent("meeting_request", msg)
			flusher.Flush()
		case <-ticker.C:
			c.SSEvent("ping", "keep-alive")
			flusher.Flush()
		case <-c.Request.Context().Done():
			return
		}
	}
}

// NotifyAdmins sends a message to all connected admin SSE clients
func NotifyAdmins(meetingID, nationalID string) {
	msg := fmt.Sprintf(`{"meeting_id":"%s","national_id":"%s"}`, meetingID, nationalID)
	notifierMutex.RLock()
	defer notifierMutex.RUnlock()

	for _, ch := range adminNotifiers {
		select {
		case ch <- msg:
		default:
			// Skip if channel is full
		}
	}
}