import React from "react";
import "./App.css";

import { Socket } from "socket.io-client";

type AppProps = { socket: Socket };

export const App: React.FC<AppProps> = ({ socket }) => {
  return <div>Hello</div>;
};
