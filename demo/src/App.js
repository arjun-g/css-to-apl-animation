import React, { useState, useEffect } from "react";
import "./App.css";
import { convert } from "./convert";

const DEFAULT_STYLE = `
@keyframes bounce {
  from,
  20%,
  53%,
  to {
    animation-timing-function: cubic-bezier(0.215, 0.61, 0.355, 1);
    transform: translate3d(0, 0, 0);
  }

  40%,
  43% {
    animation-timing-function: cubic-bezier(0.755, 0.05, 0.855, 0.06);
    transform: translate3d(0, -30px, 0) scaleY(1.1);
  }

  70% {
    animation-timing-function: cubic-bezier(0.755, 0.05, 0.855, 0.06);
    transform: translate3d(0, -15px, 0) scaleY(1.05);
  }

  80% {
    transition-timing-function: cubic-bezier(0.215, 0.61, 0.355, 1);
    transform: translate3d(0, 0, 0) scaleY(0.95);
  }

  90% {
    transform: translate3d(0, -4px, 0) scaleY(1.02);
  }
}
@keyframes rubberBand {
  from {
    transform: scale3d(1, 1, 1);
  }

  30% {
    transform: scale3d(1.25, 0.75, 1);
  }

  40% {
    transform: scale3d(0.75, 1.25, 1);
  }

  50% {
    transform: scale3d(1.15, 0.85, 1);
  }

  65% {
    transform: scale3d(0.95, 1.05, 1);
  }

  75% {
    transform: scale3d(1.05, 0.95, 1);
  }

  to {
    transform: scale3d(1, 1, 1);
  }
}
`

function App() {
  const [keyframe, setKeyframe] = useState(DEFAULT_STYLE);
  const [apl, setAPL] = useState(null);
  useEffect(() => {
    convert({ css: DEFAULT_STYLE })
    .then(apl => {
      setAPL(JSON.stringify(apl, null, 4));
    })
  }, []);
  return (
    <div className="App">
      <div>
        <h1>CSS to APL</h1>
        <h2>Convert css keyframes to apl animation</h2>
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
