import React from "react";
import "./App.css";
import { Line } from "./components/Line";
import { useKeyboardManager } from "./managers/keyboard";
import { useCursorManager } from "./managers/cursors";

const App = () => {
  const { setUserCursorPosition } = useCursorManager();
  useKeyboardManager({ setUserCursorPosition });

  return (
    <div className="App">
      <Line
        docId={"0"}
        lineIdx={0}
        setUserCursorPosition={setUserCursorPosition}
      />
    </div>
  );
};

export default App;
