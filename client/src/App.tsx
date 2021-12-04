import React from 'react';
import './App.css';
import {Line} from "./components/Line";

const App = () => {
  return (
    <div className="App">
      <Line docId={'0'} lineIdx={0}/>
    </div>
  );
};

export default App;
