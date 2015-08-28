import _ from 'lodash';

const photoRegExps = {
	gyazo: [
		/^https?:\/\/(?:(?:embed|i)\.)?gyazo\.com\/([\da-z]{32}).*/,
		'https://gyazo.com/$1/raw'
	],
	yabumi: [
		/^https?:\/\/yabumi\.cc\/([\da-z]{24}\.(?:png|jpe?g|gif|svg)).*/,
		'https://yabumi.cc/$1'
	]
};

const videoRegExps = {};

const photoRegExpsList = _.values(photoRegExps);

const videoRegExpsList = _.values(videoRegExps);

const getMediaUrl = urlEntity => {
	for(let i = photoRegExpsList.length - 1; i >= 0; i--) {
		let [regExp, newSubStr] = photoRegExpsList[i];
		if(regExp.test(urlEntity.expanded_url)) {
			return {
				type: 'photo',
				src: urlEntity.expanded_url.replace(regExp, newSubStr)
			};
		}
	}
	for(let i = videoRegExpsList.length - 1; i >= 0; i--) {
		let [regExp, newSubStr] = videoRegExpsList[i];
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
	let mediaParts = [];
	tweet.entities.urls.forEach(url => {
		let mediaPart = getMediaUrl(url);
		mediaPart && mediaParts.push(mediaPart);
	});
	if(_.get(tweet, ['extended_entities', 'media'])) {
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
