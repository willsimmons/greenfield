import styles from 'style';
import React from 'react';
import $ from 'jquery';
import audioRecorder from '../recorder/AudioRecorder2';
import visualizer from '../visualizer/visualizer';

let myDebug = require('debug');
myDebug.enable('Recorder:*');
const log = myDebug('Recorder:log');
const info = myDebug('Recorder:info');
const error = myDebug('Recorder:error');

class Recorder extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      recordingState: false,
      recordId: null,
      recordBtn: '●',
      className: 'round-button-record',
      status: null,
      node: null,
      ws: props.route.ws
    };
  }

  componentDidMount() {
    let node = document.getElementsByClassName('audioInput')[0];
    this.setState({ node: node });
    this.init();
    visualizer.initAudio();
  }

  init() {
    // FIXME? do we need to add processMessage?
    audioRecorder.init(this.statusUpdate.bind(this), this.state.ws);
    log('init');
  }

  handleClick(event) {
    let url = '/api/recording';
    let context = this;

    if (!this.state.recordingState) {
      // FIXME
      let metadata = { username: 'gilles', title: 'recording test', description: 'party time' };
      let node = this.state.node;

      // ask for a new item url for recording
      $.post(url, metadata, data => {
        log('success', data);
        audioRecorder.start(data.url, node, 'recorder_user');
        context.setState({ recordId: data.id });
        log('setting recordingState true');
        context.setState({
          recordingState: true,
          recordBtn: '■',
          className: 'round-button-stop',
          status: 'recording'
        });
      });

    } else {
      var id = this.state.recordId; // '58100808e4b0e6f55757ce46';

      audioRecorder.stop();
      log('setting recordingState false ');
      this.setState({
        recordingState: false,
        recordBtn: '●',
        className: 'round-button-record',
        status: 'stopped'
      });

      // fetch the item to make sure it got written correctly
      let count = 0;
      let checkRecording = () =>
        $.get(`${url}/${id}`, data => {
          // it takes time for the recording to be available, so retry up to 10 times
          if (data.status === 404 && count < 10) {
            count++;
            setTimeout(checkRecording, 1000);
          } else if (!data.status) {
            log('success', data);
          } else {
            error('error', data);
          }
        });
      checkRecording();
    }

  }

  statusUpdate(status) {
    this.setState({ status: status });
  }

  render() {
    return (

    <div className="recorder">
      <h1>Recorder</h1>
      <div id="viz">
        <canvas id="analyser" width="1024" height="200"></canvas>
      </div>
      <audio controls autoPlay className="audioInput"></audio>
      <div className="controls">
        <div className="round-button">
          <div className="round-button-circle">
            <div onClick={this.handleClick.bind(this)} className={this.state.className}>{this.state.recordBtn}</div>
          </div>
        </div>
        <br></br>
        <button name="stop">Stop</button>
        <br></br>
        <br></br>
        <button name="otherAction">Other Action</button>
        <div>TEST ID: {this.state.recordId}</div>
        <div>STATUS: {this.state.status}</div>
      </div>
      <audio controls autoPlay className="audioInput"></audio>

      <div className="meta">
        <label htmlFor="title">Title</label>
        <input type="text" id="title"></input>
        <label htmlFor="title">Subject</label>
        <input type="text" id="subject"></input>
        <label htmlFor="title">Tags</label>
        <input type="text" id="tags"></input>
        <label htmlFor="desc">Description</label>
        <input type="text" id="desc"></input>
        <div className="opacityBG2">
        </div>
        <div className="opacityBG1">
        </div>
      </div>

    </div>

    );
  }
}

export default Recorder;
