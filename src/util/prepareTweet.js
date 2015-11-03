import _ from 'lodash';
import getTextParts from './getTextParts';
import getMediaParts from './getMediaParts';
import createHashedId from './createHashedId';
import makeDateTime from './makeDateTime';

export default (tweet, timeline) => {
	tweet.textParts = getTextParts(tweet);
	tweet.mediaParts = getMediaParts(tweet);
	tweet.hashedId = createHashedId(tweet.user.screen_name, tweet.created_at);
	tweet.tweetCount = timeline.tweetCountTable.inc(tweet.hashedId);
	return _.assign(tweet, makeDateTime(tweet.created_at));
};
