import _ from 'lodash';
import React from 'react';

const getEntities = tweet => {
	let paths = [
		{
			path: ['entities', 'urls'],
			type: 'url'
		},
		{
			path: ['entities', 'hashtags'],
			type: 'hashtag'
		},
		{
			path: ['entities', 'user_mentions'],
			type: 'user_mention'
		},
		{
			path: ['extended_entities', 'media'],
			type: 'media'
		}
	];
	let allEntities = paths.map(path => {
		let entities = _.get(tweet, path.path);
		return entities && entities.map(entity => _.assign(entity, _.omit(path, 'path')));
	});
	return _.chain(allEntities).flattenDeep().compact().sortBy(e => e.indices[0]).value();
};

const replaceRules = {
	url(entity) {
		return {
			oldText: entity.url,
			newText: <a href={entity.expanded_url}>{entity.display_url}</a>
		};
	},
	hashtag(entity) {
		return {
			oldText: `#${entity.text}`,
			newText: <span>{`#${entity.text}`}</span>
		};
	},
	user_mention(entity) {
		return {
			oldText: `@${entity.screen_name}`,
			newText: <span>{`@${entity.screen_name}`}</span>
		};
	},
	media(entity) {
		return {
			oldText: entity.url,
			newText: <img src={`${entity.media_url_https}:thumb`} />
		};
	}
};

export default tweet => {
	let textParts = [tweet.text];
	let entities = getEntities(tweet);
	for(let i = 0; i < textParts.length && entities.length > 0; i++) {
		let entity = entities.shift();
		let replaceRule = replaceRules[entity.type];
		let {oldText, newText} = replaceRule(entity);
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
