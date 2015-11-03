import React from 'react';
import TweetComponent from './TweetComponent';

class TimelineComponent extends React.Component {
	fuck({id, fucked}) {
		let {Twit} = this.props.timeline;
		let endpoint = `favorites/${fucked ? 'destroy' : 'create'}`;
		return new Promise((resolve, reject) => {
			Twit.post(endpoint, {id}, (err, dat) => {
				if (err) {
					reject(err);
				} else {
					resolve(dat);
				}
			});
		});
	}
	render() {
		return (
			<div className='timeline'>
				{/*<TimelineHeaderComponent type={this.props.timeline.type} />*/}
				{this.props.timeline.contents.map((content, idx, contents) => {
					switch (this.props.timeline.type) {
						case 'favorite':
						case 'search':
						case 'tweet':
						case 'list':
							let props = {
								tweetCountTable: this.props.timeline.tweetCountTable,
								handlers: {
									fuck: this.fuck.bind(this)
								},
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
