import React from 'react';
import config from '../../config.json';
import getTextParts from '../util/getTextParts';

class TweetComponent extends React.Component {
	render() {
		let {tweetCountTable, tweet, handlers, tweets, idx} = this.props;
		let idString = `ID:${tweet.hashedId}[${tweet.tweetCount}/${tweetCountTable.get(tweet.hashedId)}]`;
		return (
			<div>
				{`${idx} ${config.NONAME_NAME} ${tweet.dateString} ${idString}`}
				<br />
				{getTextParts(tweet, {handlers, tweets})}
			</div>
		);
	}
}

export default TweetComponent;
