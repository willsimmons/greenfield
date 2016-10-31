import styles from 'style';
import React from 'react';
import $ from 'jquery';
import PlaylistItem from 'PlaylistItem';
import audioPlayer from '../player/AudioPlayer2';

let myDebug = require('debug');
myDebug.enable('Player:*');
const log = myDebug('Player:log');
const info = myDebug('Player:info');
const error = myDebug('Player:error');

class Player extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      playId: null,
      playBtn: '▶',
      className: 'round-button-play',
      status: null,
      playlist: [],
      currentTrack: {username: '', title: '', description: ''},
      ws: props.route.ws
    };
  }

  componentDidMount() {
    this.init();
  }

  init() {
    var query = {"username": ".*"};
    var context = this;

    console.log('init');

    audioPlayer.init(this.statusUpdate.bind(this));

    $.post('http://localhost:8000/api/recordings', query, data => {
      console.log('playlist received');

      var results = [];

      for (var i = 0; i < data.length; i++) {
        $.get('http://localhost:8000/api/recording/' + data[i], item => {
          results.push(item);
          context.setState({playlist: results, currentTrack: results[0]});
        });
      }

      context.setState({ playlist: results });
    });
  }

  statusUpdate(status) {
    this.setState({ status: status });
    this.updatePlayer(status);
  }

  updatePlayer(status) {
    if (status === 'IDLE') {
      this.setState({ playBtn: '▶', className: 'round-button-play' });
    } else {
      this.setState({ playBtn: '■', className: 'round-button-stop' });
    }
  }

  handleClick(item) {
    console.log('click', item)
    var node = document.getElementsByClassName('audioOutput')[0];
    var context = this;

    if (this.state.status === 'IDLE') {
      start = true;
    } else {
      audioPlayer.stop();
      if (item !== this.state.currentTrack) {
        start = true;
      }
    }

    if (start) {
      this.setState({ currentTrack: item });

      let testingLive = false;
      if (testingLive) {
        // to test live streaming
        audioPlayer.start('recorder_user', this.state.node, 'gilles');
      } else {
        $.get('/api/recording/' + item.id, data => {
          if (!data.status) {
            audioPlayer.start(data.url, this.state.node, 'gilles');
          }
        });
      }
    }
  }

  render() {
    return (
      <div className="player">
        <h1>Player</h1>
        <div className="controls">
          <div className="round-button">
            <div className="round-button-circle">
              <div onClick={() => {this.handleClick(this.state.currentTrack)}} className={this.state.className}>{this.state.playBtn}</div>
            </div>
          </div>
          <div className="trackInfo">
            <h2>Track Information</h2>
            <p>
              <span><strong>{this.state.currentTrack.username}</strong></span>
              <span>{this.state.currentTrack.title}</span>
              <span>{this.state.currentTrack.description}</span>
            </p>
          </div>
        </div>
        <audio controls autoPlay className="audioOutput"></audio>


        <div className="meta">

          <div className="playlistOverlay">
            <h2>Playlist</h2>
            <div className="playlistContainer">
              <table className="playlistTable">
                <tbody>
                  {this.state.playlist.map(item =>
                    <PlaylistItem handleClick={this.handleClick.bind(this)} key={item.id} item={item} />
                  )}
                </tbody>
              </table>
            </div>
          </div>
          <div className="opacityBG2">
          </div>
          <div className="opacityBG1">
          </div>
        </div>
      </div>
    );
  }
}

export default Player;
