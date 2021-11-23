import React, { useEffect, useState } from "react";
import "./App.css";

import { Socket } from "socket.io-client";

type AppProps = { socket: Socket };

export const App: React.FC<AppProps> = ({ socket }) => {
  const [lines, setLines] = useState();

  useEffect(() => {
    socket.on("lines", (data) => {
      console.log(data);
      setLines(data);
    });
  }, [socket]);

  return <div>{lines}</div>;
};
