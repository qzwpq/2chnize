import _ from 'lodash';

export default tweet => {
	let mediaParts = [];
	if(_.get(tweet, ['extended_entities', 'media'])) {
		mediaParts.push(...tweet.extended_entities.media);
	}
	return mediaParts;
}
