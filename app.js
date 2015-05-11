'use strict';

var Twit = require('twit');

var KEYS = require('./config.json');

var T = new Twit(KEYS.product);

var stream = T.stream('user');

var rules = [{
	condition: function(tweet) {
		return !!tweet.retweeted_status;
	},
	func: function(tweet) {
		tweet.text = tweet.retweeted_status.text;
		return tweet;
	}
}, {
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
		for (var i = tweet.extended_entities.media.length - 1; i >= 0; i--) {
			tweet.text = tweet.text.replace(tweet.extended_entities.media[i].url, '');
			tweet.text += ' ' + tweet.extended_entities.media[i].media_url
		}
		return tweet;
	}
}, {
	condition: function() {
		return true;
	},
	func: function(tweet, tweetStorage) {
		var flag = true;
		for (var i = tweet.entities.user_mentions.length - 1; i >= 0; i--) {
			if ((!!tweet.in_reply_to_status_id_str) && flag) {
				for (var j = tweetStorage.length - 1; j >= 0; j--) {
					if (tweetStorage[j].id_str === tweet.in_reply_to_status_id_str) {
						tweet.text = tweet.text.replace('@' + tweet.entities.user_mentions[i].screen_name, '&gt;&gt;' + tweetStorage[j].count)
						flag = false;
						break;
					}
				}
				tweet.text = tweet.text.replace('@' + tweet.entities.user_mentions[i].screen_name, '');
			} else {
				tweet.text = tweet.text.replace('@' + tweet.entities.user_mentions[i].screen_name, '');
			}
		};
		return tweet;
	}
}];

var tweets = (function() {
	var tweetStorage = [];
	var count = 0;
	return (function(tweet) {
		var hash = require('crypto').createHash('sha1');
		tweet.count = ++count;
		tweetStorage.push(tweet);
		for (var i = rules.length - 1; i >= 0; i--) {
			if (rules[i].condition(tweet)) {
				tweet = rules[i].func(tweet, tweetStorage);
			}
		};
		hash.update(tweet.user.screen_name + (new Date()).toDateString());
		var isBottom = (window.scrollY === (document.documentElement.getBoundingClientRect().height - window.innerHeight));
		document.write(count + ': Anonymous ' + Date() + ' ID: ' + hash.digest('base64').slice(0, 9) + '<br>' + tweet.text + '<br>');
		if (isBottom) {
			document.body.scrollTop = document.body.scrollHeight;
		}
	});
})();

stream.on('tweet', function(t) {
	tweets(t);
});
