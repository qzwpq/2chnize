import React from 'react';
import TweetComponent from './TweetComponent';

class TimelineComponent extends React.Component {
	render() {
		return (
			<div>
				{/*<TimelineHeaderComponent type={this.props.timeline.type} />*/}
				{this.props.timeline.contents.map((content, idx, contents) => {
					switch(this.props.timeline.type) {
						case 'favorite':
						case 'search':
						case 'tweet':
						case 'list':
							let props = {
								tweetCountTable: this.props.timeline.tweetCountTable,
								tweets: contents,
								tweet: content,
								idx
							};
							return <TweetComponent key={content.id_str} {...props} />;
						/*
						case 'following':
						case 'follower':
							return <AccountComponent account={account} />;
						*/
					}
				})}
			</div>
		);
	}
}

export default TimelineComponent;
