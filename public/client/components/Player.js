import React from 'react';
import styles from 'style';

const Player = () => (
  <div className="player">
    <div className="controls">
      <div className="round-button">
        <div className="round-button-circle">
          <a href="#" className="round-button">●</a>
        </div>
      </div>
      <br></br>
      <button name="stop">Stop</button>
      <br></br>
      <br></br>
      <button name="record">Other Action</button>
    </div>
    <div className="meta">
      <label for="title">Title</label><br></br>
      <input type="text" id="title"></input><br></br>
      <label for="title">Subject</label><br></br>
      <input type="text" id="subject"></input><br></br>
      <label for="title">Tags</label><br></br>
      <input type="text" id="tags"></input>
    </div>
  </div>
);

export default Player;
