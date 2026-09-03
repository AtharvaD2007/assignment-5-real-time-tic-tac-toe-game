import { io } from "socket.io-client";

// In production, VITE_API_URL should be set to the backend URL.
// In development, it defaults to the same host but on port 4000.
// This allows local network play on different devices using the local IP.
const getBackendUrl = () => {
    if (import.meta.env.VITE_API_URL) {
        return import.meta.env.VITE_API_URL;
    }
    
    // If not set, assume backend is running on port 4000 of the same host (ideal for LAN development)
    if (typeof window !== "undefined") {
        return `${window.location.protocol}//${window.location.hostname}:4000`;
    }
    
    return "http://localhost:4000";
};

const socket = io(
    getBackendUrl(),
    {
        transports: ["websocket", "polling"],
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000
    }
);

export default socket;