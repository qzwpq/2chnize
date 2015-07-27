import React from 'react';

class TweetComponent extends React.Component {
	render() {
		return (
			<div>
				{this.props.tweet.user.screen_name + ':' + this.props.tweet.text}
			</div>
		);
	}
}

export default TweetComponent;
