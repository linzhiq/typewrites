import React from 'react';
import './App.css';
import {Line} from "./components/Line";
import { useKeyboardMonitor } from "./keyboard";

const App = () => {
  useKeyboardMonitor();

  return (
    <div className="App">
      <Line docId={'0'} lineIdx={0}/>
    </div>
  );
};

export default App;
