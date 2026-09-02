import { io } from "socket.io-client";

const socket = io(
    import.meta.env.VITE_API_URL,
    {
        transports: ["polling"],
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000
    }
);

export default socket;