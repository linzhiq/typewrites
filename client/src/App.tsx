import React from "react";
import "./App.css";
import { Line } from "./components/Line";
import { useKeyboardManager } from "./managers/keyboard";
import { useCursorManager } from "./managers/cursors";
import { useDocument } from "./managers/documents";

const App = () => {
  const { setUserCursorPosition } = useCursorManager();
  useKeyboardManager({ setUserCursorPosition });
  const { lineCount } = useDocument();

  return (
    <div className="App">
      {[...Array(lineCount).keys()].map((line) => (
        <Line lineIdx={line} />
      ))}
    </div>
  );
};

export default App;
