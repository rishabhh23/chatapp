"use client";
import { useState } from "react";
import { useSocket } from "../context/SocketProvider";
import classes from "./page.module.css";

export default function Page() {
  const { sendMessage, messages } = useSocket();
  const [message, setMessage] = useState("");

  return (
    <div>
      <h1 className={classes["chat-heading"]}>Messages: </h1>
      <div>
        <input
          onChange={(e) => setMessage(e.target.value)}
          className={classes["chat-input"]}
          placeholder="Message..."
        />
        <button
          onClick={(e) => sendMessage(message)}
          className={classes["chat-button"]}
        >
          Send
        </button>
      </div>
      <div>
        {messages.map((message, index) => (
          <li key={index}>{message}</li>
        ))}
      </div>
    </div>
  );
}
