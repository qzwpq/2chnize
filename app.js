var Twit = require('twit');

var KEYS = require('./config.json');

var T = new Twit(KEYS.product);

var stream = T.stream('user');

var rules = [{
	condition: function() {
		return true;
	},
	func: function(tweet) {
		for (var i = tweet.entities.urls.length - 1; i >= 0; i--) {
			tweet.text = tweet.text.replace(tweet.entities.urls[i].url, tweet.entities.urls[i].expanded_url);
		}
		return tweet;
	}
}, {
	condition: function(tweet) {
		return !!tweet.entities.media;
	},
	func: function(tweet) {
		for (var i = tweet.entities.media.length - 1; i >= 0; i--) {
			tweet.text = tweet.text.replace(tweet.entities.media[i].url, tweet.entities.media[i].media_url);
		}
		return tweet;
	}
}];

var tweets = (function() {
	var tweetStrage = [];
	return (function(tweet) {
		for (var i = rules.length - 1; i >= 0; i--) {
			if (rules[i].condition(tweet)) {
				tweet = rules[i].func(tweet);
			}
		};
		tweetStrage.push(tweet);
		var count = tweetStrage.length;
		document.write(count + ': ' + tweet.text + '<br>');
	});
})();

stream.on('tweet', function(t) {
	// document.write(t);
	// console.log(t.text);
	tweets(t);
});
