import styles from 'style';
import React from 'react';
import $ from 'jquery';
import PlaylistItem from 'PlaylistItem';
import audioPlayer from '../player/AudioPlayer2';

let myDebug = require('debug');
//myDebug.enable('Player:*');
const log = myDebug('Player:log');
const info = myDebug('Player:info');
const error = myDebug('Player:error');

let stateAccessible = false;
let getRecordingRequests = [];
let deleteRequest, getRecordingMetadataRequest, getAllRecordingsRequest;

class Player extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      playId: null,
      playBtn: '▶',
      className: 'round-button-play',
      status: 'IDLE',
      playlist: [],
      broadcasts: [],
      currentTrack: { username: '', title: '', description: '' },
      node: null,
      ws: props.route.ws
    };
  }

  componentDidMount() {
    let node = document.getElementsByClassName('audioOutput')[0];
    stateAccessible = true;
    this.setState({ node: node });
    this.init();
  }

  componentWillUnmount() {
    stateAccessible = false;
    getRecordingRequests.map(item => item.abort());
    if (getAllRecordingsRequest) { getAllRecordingsRequest.abort(); }
    if (getRecordingMetadataRequest) { getRecordingMetadataRequest.abort(); }
    if (deleteRequest) { deleteRequest.abort(); }
  }

  init() {
    log('init');

    audioPlayer.init(this.statusUpdate.bind(this), this.state.ws, this.processMessage.bind(this));

    let context = this;
    let query = { 'username': '.*' };
    getAllRecordingsRequest = $.post('/api/recordings', query, data => {
      log('playlist received');
      let index = 0;
      // get live broadcast IDs
      let live = {};
      this.state.broadcasts.map(item => { live[item.id] = true; });
      // remove live items from the list
      let newData = [];
      data.map(item => { if (!live[item.id]) { newData.push(item); } });
      // get recording info
      data.map((datum, index) => {
        if (!stateAccessible) { return; }
        getRecordingRequests[index] = $.get('/api/recording/' + datum, item => {
          if (!stateAccessible) { return; }
          if (!item.status) { // make sure item exists
            let playlist = this.state.playlist;
            playlist[index] = item;
            context.setState({ playlist: playlist });
            if (index === 0) {
              context.setState({ currentTrack: playlist[0] });
            }
            index++;
          }
        });
      }
    );
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

  deleteItem(item, index) {
    let context = this;
    let answer = confirm(`Are you sure you want to delete '${item.title}'?`);
    if (answer) {
      if (this.state.status !== 'IDLE') {
        audioPlayer.stop();
      }
      deleteRequest = $.ajax({
        type: 'DELETE',
        url: `/api/recording/${item.id}`,
        success: () => {
          if (!stateAccessible) { return; }
          log(`Item ${item.id} deleted from repository`);
          // remove item from playlist
          let playlist = context.state.playlist;
          playlist.splice(index, 1);
          context.setState({ playlist: playlist });
          if (index === 0) {
            context.setState({ currentTrack: playlist[0] });
          }
        },
        error: (req, err) => error(err)
      });
    }
  }

  handleClick(item) {
    log('click', item);

    let start = false;
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

      if (item.broadcaster) {
        audioPlayer.start(item.username, this.state.node, 'gilles'); // FIXME
      } else {
        getRecordingMetadataRequest = $.get('/api/recording/' + item.id, data => {
          if (!stateAccessible) { return; }
          if (!data.status) {
            audioPlayer.start(data.url, this.state.node, 'gilles');
          }
        });
      }
    }
  }

  processMessage(msg) {
    if (msg.id === 'livenow') {
      let broadcasts = msg.broadcasts.map(item => {
        return {
          broadcaster: true,
          username: item.user,
          title: item.metadata.title,
          subject: item.metadata.subject,
          description: item.metadata.description,
          id: item.metadata.id
        };
      });
      this.setState({ broadcasts: broadcasts });
    }
  }

  render() {
    return (
      <div className="player">
        <h1>Player</h1>
        <div className="controls">
          <div className="round-button">
            <div className="round-button-circle">
              <div onClick={ () => this.handleClick(this.state.currentTrack) } className={this.state.className}>{this.state.playBtn}</div>
            </div>
          </div>
          <div className="control-text trackInfo">
            <div><strong>{this.state.currentTrack.username}</strong></div>
            <div>{this.state.currentTrack.title}</div>
            <div>{this.state.currentTrack.subject}</div>
          </div>
        </div>
        <audio controls autoPlay className="audioOutput"></audio>


        <div className="meta">

          <div className="playlistOverlay">
            <h2>Playlist</h2>
            <div className="playlistContainer">
              <table className="playlistTable">
                <tbody>
                  {this.state.broadcasts.map((item, index) =>
                    <PlaylistItem handleClick={this.handleClick.bind(this)} key={index} item={item}/>
                  )}
                  {this.state.playlist.map((item, index) =>
                    <PlaylistItem handleClick={this.handleClick.bind(this)} deleteItem={this.deleteItem.bind(this)} index={index} key={item.id} item={item} />
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
