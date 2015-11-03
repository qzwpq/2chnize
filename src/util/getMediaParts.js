import _ from 'lodash';

const compactMap = _.flow(_.map, _.compact);

const photoRegExps = new Set([
	[ // gyazo
		/^https?:\/\/(?:(?:embed|i)\.)?gyazo\.com\/([\da-z]{32}).*/,
		'https://gyazo.com/$1/raw'
	],
	[ // yabumi
		/^https?:\/\/yabumi\.cc\/([\da-z]{24}\.(?:png|jpe?g|gif|svg)).*/,
		'https://yabumi.cc/$1'
	]
]);

const videoRegExps = new Set();

const getMediaUrl = urlEntity => {
	for(let [regExp, newSubStr] of photoRegExps) {
		if(regExp.test(urlEntity.expanded_url)) {
			return {
				type: 'photo',
				src: urlEntity.expanded_url.replace(regExp, newSubStr)
			};
		}
	}
	for(let [regExp, newSubStr] of videoRegExps) {
		if(regExp.test(urlEntity.expanded_url)) {
			return {
				type: 'video',
				video_info: {
					variants: [
						{
							src: urlEntity.expanded_url.replace(regExp, newSubStr)
						}
					]
				}
			};
		}
	}
	return null;
};

export default tweet => {
	let mediaParts = compactMap(tweet.entities.urls, getMediaUrl);
	if(_.has(tweet, ['extended_entities', 'media'])) {
		let mediaEntities = tweet.extended_entities.media.map(medium => {
			if(medium.type === 'photo') {
				medium.src = `${medium.media_url_https}:thumb`;
			}
			return medium;
		});
		mediaParts.push(...mediaEntities);
	}
	return mediaParts;
}
