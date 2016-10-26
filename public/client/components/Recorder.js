import styles from 'style';
import React from 'react';
import audioRecorder from '../recorder/audioRecorder';
import $ from 'jquery';

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
    this.init();
  }

  init() {
    // audioRecorder.init(statusUpdate.bind(this));
    console.log('init');
  }

  handleClick(event) {
    var url = 'http://localhost:8000/api/recording';
    var context = this;

    if (!this.state.recordingState) {
      console.log('setting recordingState true');
      this.setState({recordingState: true,
                     recordBtn: '■',
                     className: 'round-button-stop',
                     status: 'recording'});
      var fakeData = {username: 'anon', title: 'first record', description: 'party time', tags: ['party', 'first']};
      var node = document.getElementsByClassName('audioInput');

      $.post(url, fakeData, (data) => {
        console.log('success', data);
        // audioRecorder.start(data.url, node);
        context.setState({recordId: data.id});
      });
    } else {
      // var id = this.state.recordId
      var id = '58100808e4b0e6f55757ce46';

      this.setState({recordingState: false,
                     recordBtn: '●',
                     className: 'round-button-record',
                     status: 'stopped'});
      console.log('setting recordingState false ');
      $.get(url + '/' + id, (data) => {
        console.log('success', data);
        // audioRecorder.stop();
      });
    }

  }

  statusUpdate(status) {
    this.setState({status: status});
  }

  render() {
    return (

    <div className="recorder">
      <h1>Recorder</h1>
      <audio className="audioInput"></audio>
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
