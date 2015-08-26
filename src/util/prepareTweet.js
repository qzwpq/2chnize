import createHashedId from './createHashedId';
import makeDateString from './makeDateString';

export default (tweet, timeline) => {
	tweet.hashedId = createHashedId(tweet.user.screen_name, tweet.created_at);
	tweet.tweetCount = timeline.tweetCountTable.inc(tweet.hashedId);
	tweet.dateString = makeDateString(tweet.created_at);
	return tweet;
};
