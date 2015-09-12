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

export default tweet => {
	const {text} = tweet;
	let entities = getEntities(tweet);
	let textParts = [];
	let cursor = 0;
	entities.forEach(entity => {
		let [start, end] = entity.indices;
		let gapText = text.substring(cursor, start);
		gapText && textParts.push(gapText);
		textParts.push(entity);
		cursor = end;
	});
	let remainingText = text.substring(cursor);
	remainingText && textParts.push(remainingText);
	return textParts;
};
