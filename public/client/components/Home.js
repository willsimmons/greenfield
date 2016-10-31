import styles from 'style';
import React from 'react';

class Home extends React.Component {

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

	render() {
		return (
			<div className="player">
			  <h1>Welcome</h1>

			  <div className="stationList">

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


		)
	}
}
export default Home;
