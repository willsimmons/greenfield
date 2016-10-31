import styles from 'style';
import React from 'react';

class HomeListItem extends React.Component {
  constructor(props) {
    super(props);

    this.state = {

    }
  };

  render() {

    return(
	      <div className="userBox" onClick={()=>{this.props.handleClick(this.props.user)}}>
					<div> <strong>{this.props.user.username}</strong> </div>
					<img src={this.props.user.pic} />
					<div> {this.props.user.description} </div>
				</div>
    )

  }


};

export default HomeListItem;