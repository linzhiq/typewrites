import React from "react";
import ReactDOM from "react-dom";
import { App } from "./App";
import io from "socket.io-client";

const socketUrl =
  window.location.hostname === "localhost"
    ? "http://localhost:8080"
    : "https://api.typewriter.ooo";
const socket = io(socketUrl);

ReactDOM.render(
  <React.StrictMode>
    <App socket={socket} />
  </React.StrictMode>,
  document.getElementById("root")
);
