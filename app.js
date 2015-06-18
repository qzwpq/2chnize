'use strict';

var jQuery = require('jquery');

var $ = jQuery;

var bootstrap = require('bootstrap');

var Vue = require('vue');

var Twit = require('twit');

var fs = require('fs');

var NG_TEXT = __dirname + '/ng-list/text.json';

var NG_CLIENT = __dirname + '/ng-list/client.json';

var REPLACE_TEXT = __dirname + '/replace-rule/text.json';

var CONFIG_FILE = __dirname + '/config.json';

var KEY_FILE = __dirname + '/keys.json';

var config = require(CONFIG_FILE);

var KEYS = require(KEY_FILE);

var T = new Twit(KEYS.product);

var stream = T.stream('user');


// note that the last function will be executed at first
var rules = [{
	condition: function() {
		return true;
	},
	func: function(tweet) {
		var rule = JSON.parse(fs.readFileSync(REPLACE_TEXT, {
			encoding: 'utf-8'
		}));
		for (var i = rule.length - 1; i >= 0; i--) {
			var reg = new RegExp(rule[i].reg, rule[i].flag);
			tweet.text = tweet.text.replace(reg, rule[i].newSubStr);
		};
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
			var mention = tweet.entities.user_mentions[i];
			if (mention.id_str == tweet.in_reply_to_user_id_str) {
				for (var j = tweetStorage.length - 1; j >= 0; j--) {
					if (tweetStorage[j].id_str === tweet.in_reply_to_status_id_str) {
						tweet.text = tweet.text.replace('@' + mention.screen_name, '&gt;&gt;' + tweetStorage[j].count);
						break;
					}
				}
				tweet.text = tweet.text.replace('@' + mention.screen_name, 'ID:' + createHashedId(mention.id_str));
			} else {
				tweet.text = tweet.text.replace('@' + mention.screen_name, 'ID:' + createHashedId(mention.id_str));
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
		var rule = JSON.parse(fs.readFileSync(NG_TEXT, {
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
		var rule = JSON.parse(fs.readFileSync(NG_CLIENT, {
			encoding: 'utf-8'
		}));
		var d = document.createElement('div');
		d.innerHTML = tweet.source;
		var clientName = d.textContent;
		for (var i = rule.length - 1; i >= 0; i--) {
			var reg = new RegExp(rule[i].reg, rule[i].flag);
			var result = reg.test(clientName);
			if (result) {
				return true;
			}
		}
		return false;
	}
];

function createHashedId(str) {
	var hash = require('crypto').createHash('sha1');
	hash.update(str);
	return hash.digest('base64').slice(0, 9);
};

var tweets = (function() {
	var tweetStorage = [];

	var count = 0;

	var tweetCountTable = {};

	var app = new Vue({
		el: "#main",
		data: {
			tweetStorage: tweetStorage,
			tweetCountTable: tweetCountTable
		},
		filters: {
			ngTweet: function(tweetStorage) {
				return tweetStorage.filter(function(tweet) {
					for (var i = ngRules.length - 1; i >= 0; i--) {
						if (ngRules[i](tweet)) return false;
					}
					return true;
				});
			},
			text: function(text) {
				return text;
			}
		},
		methods: {
			tweet: function(event) {
				var text = event.target.value;
				console.log(text);
				if (text)
					T.post('statuses/update', {
						status: text
					}, function(err, dat) {
						if (err) console.log(err);
						console.log(dat);
					});
				event.target.value = '';
				return false;
			},
			userDetail:function(event){
				var tweet = event.targetVM;
				var user=tweet.user.screen_name;
				console.log(user);
			}
		}
	});

	var incTweetCount = function(hashed_id) {
		if (tweetCountTable[hashed_id] === void 0) {
			// app.tweetCountTable[hashed_id] = 1;
			app.tweetCountTable.$set(hashed_id, 1);
		} else {
			// app.tweetCountTable[hashed_id] = app.tweetCountTable[hashed_id] + 1;
			app.tweetCountTable.$set(hashed_id, app.tweetCountTable[hashed_id] + 1);
		}
		return app.tweetCountTable[hashed_id];
	};

	return function(tweet) {
		var date = new Date(tweet.created_at);
		tweet.hashed_id = createHashedId(tweet.user.screen_name + date.toDateString());
		for (var i = rules.length - 1; i >= 0; i--) {
			if (rules[i].condition(tweet)) {
				tweet = rules[i].func(tweet, tweetStorage);
			}
		}
		// for (var i = ngRules.length - 1; i >= 0; i--) {
		// 	if (ngRules[i](tweet)) {
		// 		return;
		// 	}
		// }
		// document.documentElement.scrollHeight - document.documentElement.clientHeight === document.scrollMaxY
		var isBottom = window.scrollY >= document.documentElement.scrollHeight - document.documentElement.clientHeight;
		var dateString = (function(d) {
			var pad = function(s) {
				s = s + '';
				return s.length === 1 ? '0' + s : s;
			};
			return [d.getFullYear(), d.getMonth(), d.getDate()].map(pad).join('/') +
				' ' + [d.getHours(), d.getMinutes(), d.getSeconds()].map(pad).join(':');
		})(date);
		// document.getElementById('main').innerHTML += (count + ': ' + config.nanashi + ' ' + dateString + ' ID:' + hash.digest('base64').slice(0, 9) + '<br>' + tweet.text + '<br>');
		tweet.screen_name = tweet.user.screen_name;
		tweet.count = ++count;
		tweet.nanashi = config.nanashi;
		tweet.dateString = dateString;
		tweet.hashed_id = createHashedId(tweet.user.screen_name + date.toDateString());
		tweet.tweetCount = incTweetCount(tweet.hashed_id);
		app.tweetStorage.push(tweet);
		if (isBottom) {
			setTimeout(function() {
				document.body.scrollTop = document.body.scrollHeight;
			}, 100);
		}
	};
})();

T.get('statuses/home_timeline', {
	count: 100
}, function(err, dat) {
	if (err) console.log(err);
	for (var i = dat.length - 1; i >= 0; i--) {
		tweets(dat[i]);
	}
	setTimeout(function() {
		document.body.scrollTop = document.body.scrollHeight;
	}, 500);
});

stream.on('tweet', function(t) {
	tweets(t);
});

stream.on('error', function(err) {
	console.log(err);
	stream.stop();
	setTimeout(function() {
		stream.start();
	}, 5000);
});
