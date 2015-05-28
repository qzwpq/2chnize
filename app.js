'use strict';

var Vue = require('vue');

var Twit = require('twit');

var fs = require('fs');

var KEYS = require('./keys.json');

var config = require('./config.json');

var T = new Twit(KEYS.product);

var stream = T.stream('user');
// note that the last function will be executed at first
var rules = [{
	condition: function() {
		return true;
	},
	func: function(tweet) {
		var rule = JSON.parse(fs.readFileSync('./replaceRules.json', {
			encoding: 'utf-8'
		}));
		for (var i = rule.length - 1; i >= 0; i--) {
			var reg = new RegExp(rule[i].reg, rule[i].flag);
			tweet.text = tweet.text.replace(reg, rule[i].newSubStr);
		}
		return tweet;
	}
}, {
	condition: function() {
		return true;
	},
	func: function(tweet) {
		tweet.text = tweet.text.replace(/\n/g, '<br>');
		return tweet;
	}
}, {
	condition: function() {
		return true;
	},
	func: function(tweet) {
		for (var i = tweet.entities.urls.length - 1; i >= 0; i--) {
			tweet.text = tweet.text.replace(tweet.entities.urls[i].url, '<a href="tweet.entities.urls[i].expanded_url">' + tweet.entities.urls[i].display_url + '</a>');
		}
		return tweet;
	}
}, {
	condition: function(tweet) {
		return typeof tweet.entities.media !== 'undefined';
	},
	func: function(tweet) {
		tweet.text += '<br>';
		for (var i = tweet.extended_entities.media.length - 1; i >= 0; i--) {
			var media = tweet.extended_entities.media[i];
			tweet.text = tweet.text.replace(media.url, '');
			if (media.type === 'animated_gif') {
				tweet.text += '<video height="128" loop><source src="' + media.video_info.variants[0].url + '" type="' + media.video_info.variants[0].content_type + '"></video>';
			} else {
				tweet.text += '<img src="' + media.media_url + '" height="128" >';
			}
		}
		return tweet;
	}
}, {
	condition: function() {
		return true;
	},
	func: function(tweet, tweetStorage) {
		for (var i = tweet.entities.user_mentions.length - 1; i >= 0; i--) {
			if (tweet.id_str === tweet.in_reply_to_status_id_str) {
				for (var j = tweetStorage.length - 1; j >= 0; j--) {
					if (tweetStorage[j].id_str === tweet.in_reply_to_status_id_str) {
						tweet.text = tweet.text.replace('@' + tweet.entities.user_mentions[i].screen_name, '&gt;&gt;' + tweetStorage[j].count)
						break;
					}
				}
				tweet.text = tweet.text.replace('@' + tweet.entities.user_mentions[i].screen_name, '');
			} else {
				tweet.text = tweet.text.replace('@' + tweet.entities.user_mentions[i].screen_name, '');
			}
		}
		return tweet;
	}
}, {
	condition: function(tweet) {
		return typeof tweet.retweeted_status !== 'undefined';
	},
	func: function(tweet) {
		tweet = tweet.retweeted_status;
		return tweet;
	}
}];

var ngRules = [
	function(tweet) {
		var rule = JSON.parse(fs.readFileSync('./ngRules.json', {
			encoding: 'utf-8'
		}));
		for (var i = rule.length - 1; i >= 0; i--) {
			var reg = new RegExp(rule[i].reg, rule[i].flag);
			var result = reg.test(tweet.text);
			if (result) {
				return true;
			}
		}
		return false;
	},
	function(tweet) {
		var rule = JSON.parse(fs.readFileSync('./ngClients.json', {
			encoding: 'utf-8'
		}));
		var clientName = (function(tweet) {
			var d = document.createElement('div').innerHTML = tweet.source;
			return d.textContent;
		})(tweet);
		for (var i = rule.length - 1; i >= 0; i--) {
			var reg = new RegExp(rule[i].reg, rule[i].flag);
			var result = reg.test(clientName);
			if (result) {
				return true;
			}
		}
		return false;
	}
]

var tweets = (function() {
	var tweetStorage = [];
	var count = 0;
	return function(tweet) {
		var hash = require('crypto').createHash('sha1');
		tweet.count = ++count;
		tweetStorage.push(tweet);
		for (var i = rules.length - 1; i >= 0; i--) {
			if (rules[i].condition(tweet)) {
				tweet = rules[i].func(tweet, tweetStorage);
			}
		}
		for (var i = ngRules.length - 1; i >= 0; i--) {
			if (ngRules[i](tweet)) {
				return;
			}
		}
		var date = new Date(tweet.created_at);
		hash.update(tweet.user.screen_name + date.toDateString());
		// document.documentElement.scrollHeight - document.documentElement.clientHeight === document.scrollMaxY
		var isBottom = (window.scrollY >= (document.documentElement.scrollHeight - document.documentElement.clientHeight));
		var dateString = (function(d) {
			var pad = function(s) {
				s = s + '';
				return s.length === 1 ? '0' + s : s;
			};
			return [d.getFullYear(), d.getMonth(), d.getDate()].map(pad).join('/') +
				' ' + [d.getHours(), d.getMinutes(), d.getSeconds()].map(pad).join(':');
		})(date);
		document.getElementById('main').innerHTML += (count + ': ' + config.nanashi + ' ' + dateString + ' ID:' + hash.digest('base64').slice(0, 9) + '<br>' + tweet.text + '<br>');
		if (isBottom) {
			document.body.scrollTop = document.body.scrollHeight;
		}
	};
})();

stream.on('tweet', function(t) {
	tweets(t);
});

stream.on('error', function(err) {
	console.log(err);
});
