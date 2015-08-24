import React from 'react';

class TweetComponent extends React.Component {
	render() {
		return (
			<div>
				{this.props.tweet.dateString + ' ID:' + this.props.tweet.hashedId}
				<br />
				{this.props.tweet.textParts}
			</div>
		);
	}
}

export default TweetComponent;
