import _ from 'lodash';

const flatMap = _.flow(_.map, _.flatten, _.compact);

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
	let allEntities = flatMap(paths, path => {
		let entities = _.get(tweet, path.path);
		return entities && entities.map(entity => _.assign(entity, _.omit(path, 'path')));
	});
	return _.sortBy(allEntities, ['indices', '0']);
};

export default tweet => {
	const chars = [...tweet.text];
	let entities = getEntities(tweet);
	let cursor = 0;
	let textParts = flatMap(entities, entity => {
		let [start, end] = entity.indices;
		let gapText = _.unescape(chars.slice(cursor, start).join(''));
		cursor = end;
		return [gapText, entity];
	})
	let remainingText = _.unescape(chars.slice(cursor).join(''));
	remainingText && textParts.push(remainingText);
	return textParts;
};
