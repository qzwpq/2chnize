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
	return _.chain(allEntities).flatten().compact().sortBy(e => e.indices[0]).value();
};

export default tweet => {
	const chars = [...tweet.text];
	let entities = getEntities(tweet);
	let textParts = [];
	let cursor = 0;
	entities.forEach(entity => {
		let [start, end] = entity.indices;
		let gapText = _.unescape(chars.slice(cursor, start).join(''));
		gapText && textParts.push(gapText);
		textParts.push(entity);
		cursor = end;
	});
	let remainingText = _.unescape(chars.slice(cursor).join(''));
	remainingText && textParts.push(remainingText);
	return textParts;
};
