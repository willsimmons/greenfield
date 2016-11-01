import styles from 'style';
import React from 'react';
import $ from 'jquery';
import HomeListItem from 'HomeListItem';
import Global from 'react-global';
class Home extends React.Component {

  constructor(props, context) {
    super(props, context);
    context.router;
    console.log('props', props);
    this.state = {
      recordingState: false,
      recordId: null,
      recordBtn: '●',
      className: 'round-button-record',
      status: null,
      users: []
    };
  }

  componentDidMount() {
    console.log('Mounted');
    this.init();
  }

  init() {
    var fakeData = [
      {username: 'gilles', pic: 'client/img/user1.jpg', description: 'Real Relationship Talk', id: 1},
      {username: 'ERIC', pic: 'client/img/user2.jpg', description: 'Hollywoods portrayal of the African American', id: 2},
      {username: 'First2Break', pic: 'client/img/user3.jpg', description: 'Basketball Highlights', id: 3},
      {username: 'BooksForKids', pic: 'client/img/user4.jpg', description: 'Reading books to kids made fun!', id: 4},
      {username: 'TheHeatbeatPodcast', pic: 'client/img/user5.jpg', description: 'Fans get hot talking about Miami Heat', id: 5},
      {username: 'StocktonHeat92', pic: 'client/img/user6.jpg', description: 'Not quite as hot as Miami, but still pretty warm', id: 6},
      {username: 'BlueFishRadio', pic: 'client/img/user7.jpg', description: 'For all your fishing needs', id: 7},
      {username: 'LeoLaporte', pic: 'client/img/user8.jpg', description: 'Lets fix your computer!', id: 8}
    ];

    console.log('home init');
    //remove once data works
    this.setState({ users: fakeData });

    $.get('/api/users', data => {
      // console.log('homeList received', data);
      // context.setState({ users: data });
    });
  }

  handleClick(user) {
    const path = `/player/${user.username}`;
    console.log('ROute', this.context);
    this.context.router.push(path);
  }

  render() {
    return (
      <div className="player">
        <h1>Welcome</h1>
        <Global values={{
          ws: this.props.route.ws
        }}/>
        <div className="homeList">
          <div className="homeListOverlay">
            <h2>Available Stations:</h2>
            <div className="homeListContainer">
              {this.state.users.map(user =>
                <HomeListItem handleClick={this.handleClick.bind(this)} key={user.id} user={user} />
              )}
            </div>
          </div>
          <div className="opacityBG4">
          </div>
          <div className="opacityBG3">
          </div>
        </div>
      </div>
    )
  }
}
Home.contextTypes = {
  router: React.PropTypes.object.isRequired
}
export default Home;
