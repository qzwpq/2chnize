import _ from 'lodash';
import React from 'react';
import createHashedId from './createHashedId';

const getEntities = (tweet, handlers = {}) => {
	let paths = [
		{
			path: ['entities', 'urls'],
			treatAs: 'url',
			handler: handlers.url
		},
		{
			path: ['entities', 'hashtags'],
			treatAs: 'hashtag',
			handler: handlers.hashtag
		},
		{
			path: ['entities', 'user_mentions'],
			treatAs: 'user_mention',
			handler: handlers.user_mention
		},
		{
			path: ['entities', 'media'],
			treatAs: 'url',
			handler: handlers.url
		}
	];
	let allEntities = paths.map(path => {
		let entities = _.get(tweet, path.path);
		return entities && entities.map(entity => _.assign(entity, _.omit(path, 'path')));
	});
	let newLines = (() => {
		let {text} = tweet;
		let indicesList = [];
		for(let i = text.length - 1; i >= 0; i--) {
			text[i] === '\n' && indicesList.unshift([i, i + 1]);
		}
		return indicesList.map(indices => ({treatAs: 'newLine', indices}));
	})();
	return _.chain(allEntities.concat(newLines)).flattenDeep().compact().sortBy(e => e.indices[0]).value();
};

const replaceRule = (entity, tweet, tweets = []) => {
	switch(entity.treatAs) {
		case 'url':
			return {
				oldText: entity.url,
				newText: <a href={entity.expanded_url} onClick={entity.handler}>{entity.display_url}</a>
			};
		case 'hashtag':
			return {
				oldText: `#${entity.text}`,
				newText: <span onClick={entity.handler}>{`#${entity.text}`}</span>
			};
		case 'user_mention':
			let resNumber = -1;
			if(entity.id_str === tweet.in_reply_to_user_id_str) {
				resNumber = tweets.findIndex(t => t.id_str === tweet.in_reply_to_status_id_str);
			}
			let resText = resNumber > -1 ?
				`>>${resNumber}` : `ID:${createHashedId(entity.screen_name, tweet.created_at)}`;
			return {
				oldText: `@${entity.screen_name}`,
				newText: <span onClick={entity.handler}>{resText}</span>
			};
		case 'newLine':
			return {
				oldText: '\n',
				newText: <br />
			};
	}
};

const getMediaElements = tweet => {
	let {media} = tweet.extended_entities;
	let attrs = {};
	return media.map(medium => {
		switch(medium.type) {
			case 'photo':
				return <img src={`${medium.media_url_https}:thumb`} />;
			case 'animated_gif':
				attrs.loop = true;
			case 'video':
				attrs.controls = true;
				return (
					<video {...attrs}>
						{medium.video_info.variants.map(variant =>
							<source type={variant.content_type} src={variant.url} key={variant.url} />
						)}
					</video>
				);
		}
	});
};

export default (tweet, {handlers = {}, tweets = []} = {}) => {
	let textParts = [tweet.text];
	let entities = getEntities(tweet, handlers);
	for(let i = 0; i < textParts.length && entities.length > 0; i++) {
		let entity = entities.shift();
		let {oldText, newText} = replaceRule(entity, tweet, tweets);
		let textPart = textParts[i];
		let splited = textPart.split(oldText); // split once from left
		splited = [splited.shift(), splited.join(oldText)];
		let inc = 0;
		if(splited[0] === '' && splited[1] === '') {
			splited = [newText];
		} else if(splited[0] === '') {
			splited[0] = newText;
		} else if(splited[1] === '') {
			splited[1] = newText;
			inc = 1;
		} else {
			splited.splice(1, 0, newText);
			inc = 1;
		}
		textParts.splice(i, 1, ...splited);
		i += inc;
	}
	if(_.get(tweet, ['extended_entities', 'media'])) {
		let mediaElements = getMediaElements(tweet);
		textParts.push(<br />, ...mediaElements);
	}
	return textParts;
};
