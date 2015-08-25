import _ from 'lodash';
import React from 'react';
import createHashedId from './createHashedId';

const getEntities = (tweet, handlers = {}) => {
	let paths = [
		{
			path: ['entities', 'urls'],
			type: 'url',
			handler: handlers.url
		},
		{
			path: ['entities', 'hashtags'],
			type: 'hashtag',
			handler: handlers.hashtag
		},
		{
			path: ['entities', 'user_mentions'],
			type: 'user_mention',
			handler: handlers.user_mention
		},
		{
			path: ['extended_entities', 'media'],
			type: 'media',
			handler: handlers.media
		}
	];
	let allEntities = paths.map(path => {
		let entities = _.get(tweet, path.path);
		return entities && entities.map(entity => _.assign(entity, _.omit(path, 'path')));
	});
	return _.chain(allEntities).flattenDeep().compact().sortBy(e => e.indices[0]).value();
};

const replaceRule = (entity, tweet, tweets = []) => {
	switch(entity.type) {
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
		case 'media':
			return {
				oldText: entity.url,
				newText: <img src={`${entity.media_url_https}:thumb`} onClick={entity.handler} />
			};
	}
};

export default (tweet, {handlers = {}, tweets = []} = {}) => {
	let textParts = [tweet.text];
	let entities = getEntities(tweet, handlers);
	for(let i = 0; i < textParts.length && entities.length > 0; i++) {
		let entity = entities.shift();
		let {oldText, newText} = replaceRule(entity, tweet, tweets);
		let textPart = textParts[i];
		let splited = textPart.split(oldText);
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
	return textParts;
};
