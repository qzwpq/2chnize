import React from 'react';
import config from '../../config.json';
import getTextParts from '../util/getTextParts';

class TweetComponent extends React.Component {
	render() {
		let {tweet, handlers, tweets, idx} = this.props;
		return (
			<div>
				{`${idx} ${config.NONAME_NAME} ${tweet.dateString} ID:${tweet.hashedId}`}
				<br />
				{getTextParts(tweet, {handlers, tweets})}
			</div>
		);
	}
}

export default TweetComponent;
