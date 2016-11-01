import styles from 'style';
import React from 'react';
import $ from 'jquery';
import HomeListItem from 'HomeListItem';

class Home extends React.Component {

  constructor(props, context) {
    super(props);
    context.router;
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
    this.init();
  }

  init() {
    var fakeData = [
    {username: 'AllTheSingleLadies', pic: 'client/img/user1.jpg', description: 'Real Relationship Talk', id: 1},
    {username: 'JumpinJoe', pic: 'client/img/user2.jpg', description: 'Hollywoods portrayal of the African American', id: 2},
    {username: 'First2Break', pic: 'client/img/user3.jpg', description: 'Basketball Highlights', id: 3},
    {username: 'BooksForKids', pic: 'client/img/user4.jpg', description: 'Reading books to kids made fun!', id: 4},
    {username: 'TheHeatbeatPodcast', pic: 'client/img/user5.jpg', description: 'Fans get hot talking about Miami Heat', id: 5},
    {username: 'StocktonHeat92', pic: 'client/img/user6.jpg', description: 'Not quite as hot as Miami, but still pretty warm', id: 6},
    {username: 'BlueFishRadio', pic: 'client/img/user7.jpg', description: 'For all your fishing needs', id: 7},
    {username: 'LeoLaporte', pic: 'client/img/user8.jpg', description: 'Lets fix your computer!', id: 8}]

    console.log('home init');
    //remove once data works
    context.setState({ users: fakeData });

    $.get('/api/users', data => {
      // console.log('homeList received', data);
      // context.setState({ users: data });
    });
  }

  Home.contextTypes = {
    router: React.PropTypes.func.isRequired
  }

  handleClick(user) {
    const path = `/recorder/${user.username}`;
    console.log('click', path);
  }

  render() {
    return (
      <div className="player">
        <h1>Welcome</h1>

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
export default Home;
