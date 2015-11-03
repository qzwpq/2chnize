import _ from 'lodash';
import React from 'react';
import config from '../../config.json';
import createHashedId from '../util/createHashedId';

class TweetComponent extends React.Component {
	async handleFuck() {
		let {id_str} = this.props.tweet;
		try {
			let dat = await this.props.handlers.fuck({id: id_str, fucked: this.isFucked()});
			this.setState({fucked: dat.favorited});
		} catch (e) {
			console.warn(e);
		}
	}
	isFucked() {
		return _.get(this.state, 'fucked', this.props.tweet.favorited);
	}
	render() {
		let {tweetCountTable, tweet, handlers, tweets, idx} = this.props;
		let idString = `ID:${tweet.hashedId}[${tweet.tweetCount}/${tweetCountTable.get(tweet.hashedId)}]`;
		return (
			<div className={`tweet${this.isFucked() ? ' fucked' : ''}`}>
				<div className='user' onClick={() => this.handleFuck()}>
					<span className='index'>{idx}</span>
					<span className='name'>{config.NONAME_NAME}</span>
					<span className='datetime'>
						<span className='date'>{tweet.date}</span>
						<span className='time'>{tweet.time}</span>
					</span>
					<span className='id'>{idString}</span>
				</div>
				<div className='text'>
					{tweet.textParts.map((textPart, idx) => {
						switch (textPart.treatAs) {
							case 'url':
								return <a key={idx} href={textPart.expanded_url}>{textPart.display_url}</a>;
							case 'hashtag':
								return <span key={idx}>{`#${textPart.text}`}</span>;
							case 'user_mention':
								let resNumber = -1;
								if (textPart.id_str === tweet.in_reply_to_user_id_str) {
									resNumber = tweets.findIndex(t => t.id_str === tweet.in_reply_to_status_id_str);
								}
								let resText = resNumber > -1 ?
									`>>${resNumber}` : `ID:${createHashedId(textPart.screen_name, tweet.created_at)}`;
								return <span key={idx}>{resText}</span>;
							default:
								return <span key={idx}>{textPart}</span>;
						}
					})}
				</div>
				{!!tweet.mediaParts.length && (
					<div className='media'>
						{tweet.mediaParts.map((mediaPart, idx) => {
							let attrs = {key: idx};
							switch (mediaPart.type) {
								case 'photo':
									attrs.src = mediaPart.src;
									return <img {...attrs} />;
								case 'animated_gif':
									attrs.loop = true;
								case 'video':
									attrs.controls = true;
									return (
										<video {...attrs}>
											{mediaPart.video_info.variants.map((variant, idx) =>
												<source type={variant.content_type} src={variant.url} key={idx} />
											)}
										</video>
									);
							}
						})}
					</div>
				)}
			</div>
		);
	}
}

export default TweetComponent;
