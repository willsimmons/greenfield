import styles from 'style';
import React from 'react';

class Player extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      playingState: false,
      playId: null,
      playBtn: '▶',
      className: 'round-button-play',
      status: null
    };
  }

  play() {
    if (!this.state.playingState) {
      this.setState({playBtn: '■', playingState: true, className: 'round-button-stop'})
    } else {
      this.setState({playBtn: '▶', playingState: false, className: 'round-button-play'})
    }
  }

  render() {
    return (
      <div className="player">
        <h1>Player</h1>
        <div className="controls">
          <div className="round-button">
            <div className="round-button-circle">
              <div onClick={this.play.bind(this)} className={this.state.className} id="play">{this.state.playBtn}</div>
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
    )
  }
}

export default Player;
