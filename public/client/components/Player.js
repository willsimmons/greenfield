import React from 'react';
import styles from 'style';

const Player = () => (

  <div className="player">
    <h1>Player</h1>
    <div className="controls">
      <div className="round-button">
        <div className="round-button-circle">
          <a href="#" className="round-button" id="play">▶︎</a>
        </div>
      </div>
      <br></br>
      <button name="stop">Stop</button>
      <br></br>
      <br></br>
      <button name="otherAction">Other Action</button>
    </div>
    <div className="meta">
      <h2>Track Information</h2>
    </div>
  </div>
);

export default Player;
