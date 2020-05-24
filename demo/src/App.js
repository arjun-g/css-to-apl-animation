import React, { useState } from "react";
import "./App.css";
import { convert } from "./convert";

function App() {
  const [keyframe, setKeyframe] = useState(null);
  const [apl, setAPL] = useState(null);
  return (
    <div className="App">
      <div>
        <h1>CSS to APL</h1>
        <h2>Convert cass keyframes to apl animation</h2>
      </div>
      <div className="container">
        <div className="edit">
          <textarea value={keyframe} onChange={e => {
            setKeyframe(e.target.value);
          }} />
        </div>
        <div className="action">
          <button onClick={e => {
            convert({ css: keyframe })
            .then(apl => {
              setAPL(JSON.stringify(apl, null, 4));
            })
          }}>Convert</button>
        </div>
        <div className="edit">
          <textarea value={apl} />
        </div>
      </div>
    </div>
  );
}

export default App;
