import _ from 'lodash';

const getEntities = tweet => {
	let paths = [
		{
			path: ['entities', 'urls'],
			treatAs: 'url'
		},
		{
			path: ['entities', 'hashtags'],
			treatAs: 'hashtag'
		},
		{
			path: ['entities', 'user_mentions'],
			treatAs: 'user_mention'
		},
		{
			path: ['entities', 'media'],
			treatAs: 'url'
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

const getTextOfEntity = entity => {
	switch(entity.treatAs) {
		case 'url':
			return entity.url;
		case 'hashtag':
			return `#${entity.text}`;
		case 'user_mention':
			return `@${entity.screen_name}`;
		case 'newLine':
			return '\n';
	}
};


export default tweet => {
	let textParts = [tweet.text];
	let entities = getEntities(tweet);
	for (let i = 0; i < textParts.length && entities.length > 0; i++) {
		let entity = entities.shift();
		let entityText = getTextOfEntity(entity);
		let textPart = textParts[i];
		let splited = textPart.split(entityText); // split once from left
		splited = [splited.shift(), splited.join(entityText)];
		let inc = 0;
		if(splited[0] === '' && splited[1] === '') {
			splited = [entity];
		} else if(splited[0] === '') {
			splited[0] = entity;
		} else if(splited[1] === '') {
			splited[1] = entity;
			inc = 1;
		} else {
			splited.splice(1, 0, entity);
			inc = 1;
		}
		textParts.splice(i, 1, ...splited);
		i += inc;
	}
	return textParts;
};
