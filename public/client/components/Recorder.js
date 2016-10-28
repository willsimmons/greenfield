import styles from 'style';
import React from 'react';
import $ from 'jquery';
import audioRecorder from '../recorder/AudioRecorder2';

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
      status: null
    };
  }

  componentDidMount() {
    this.init();
  }

  init() {
    audioRecorder.init(this.statusUpdate.bind(this));
    log('init');
  }

  handleClick(event) {
    var url = '/api/recording';
    var context = this;

    if (!this.state.recordingState) {
      // FIXME
      var metadata = { username: 'anon', title: 'first record', description: 'party time' };
      var node = document.getElementsByClassName('audioInput')[0];

      // ask for a new item url for recording
      $.post(url, metadata, data => {
        log('success', data);
        audioRecorder.start(data.url, node, 'gilles');
        context.setState({ recordId: data.id });
        log('setting recordingState true');
        this.setState({
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
    this.setState({status: status});
  }

  render() {
    return (

    <div className="recorder">
      <h1>Recorder</h1>
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

      <div className="meta">
        <label htmlFor="title">Title</label>
        <input type="text" id="title"></input>
        <label htmlFor="title">Subject</label>
        <input type="text" id="subject"></input>
        <label htmlFor="title">Tags</label>
        <input type="text" id="tags"></input>
        <label htmlFor="desc">Description</label>
        <input type="text" id="desc"></input>
      </div>
    </div>

    );
  }
}

export default Recorder;
