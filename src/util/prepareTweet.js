import createHashedId from './createHashedId';
import makeDateString from './makeDateString';

export default tweet => {
	tweet.hashedId = createHashedId(tweet.user.screen_name, tweet.created_at);
	tweet.dateString = makeDateString(tweet.created_at);
	return tweet;
};
