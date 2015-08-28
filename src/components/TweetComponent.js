import React from 'react';
import config from '../../config.json';
import createHashedId from '../util/createHashedId';

class TweetComponent extends React.Component {
	render() {
		let {tweetCountTable, tweet, handlers, tweets, idx} = this.props;
		let idString = `ID:${tweet.hashedId}[${tweet.tweetCount}/${tweetCountTable.get(tweet.hashedId)}]`;
		return (
			<div>
				<div>
					{`${idx} ${config.NONAME_NAME} ${tweet.dateString} ${idString}`}
				</div>
				<div>
					{tweet.textParts.map((textPart, idx) => {
						switch(textPart.treatAs) {
							case 'url':
								return <a key={idx} href={textPart.expanded_url}>{textPart.display_url}</a>;
							case 'hashtag':
								return <span key={idx}>{`#${textPart.text}`}</span>;
							case 'user_mention':
								let resNumber = -1;
								if(textPart.id_str === tweet.in_reply_to_user_id_str) {
									resNumber = tweets.findIndex(t => t.id_str === tweet.in_reply_to_status_id_str);
								}
								let resText = resNumber > -1 ?
									`>>${resNumber}` : `ID:${createHashedId(textPart.screen_name, tweet.created_at)}`;
								return <span key={idx}>{resText}</span>;
							case 'newLine':
								return <br key={idx} />;
							default:
								return <span key={idx}>{textPart}</span>;
						}
					})}
				</div>
				<div>
					{tweet.mediaParts.map((mediaPart, idx) => {
						let attrs = {key: idx};
						switch(mediaPart.type) {
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
			</div>
		);
	}
}

export default TweetComponent;
