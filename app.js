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

var prepareTweetRules = [function(tweet) {
		var replaceRule = require(REPLACE_TEXT);
		for (var i = replaceRule.length - 1; i >= 0; i--) {
			var rule = replaceRule[i];
			var reg = new RegExp(rule.reg, rule.flag);
			tweet.text = tweet.text.replace(reg, rule.newSubStr);
		}
		return tweet;
	}, function(tweet) {
		tweet.text = tweet.text.replace(/\n/g, '<br>');
		return tweet;
	}, function(tweet) {
		for (var i = tweet.entities.urls.length - 1; i >= 0; i--) {
			var url = tweet.entities.urls[i];
			var a = '<a href="' + url.expanded_url + '">' + url.display_url + '</a>';
			tweet.text = tweet.text.replace(url.url, a);
		}
		return tweet;
	}, function(tweet) {
		if (tweet.entities.media) {
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
		}
		return tweet;
	}, function(tweet, tweetStorage) {
		for (var i = tweet.entities.user_mentions.length - 1; i >= 0; i--) {
			var mention = tweet.entities.user_mentions[i];
			if (mention.id_str == tweet.in_reply_to_user_id_str) {
				for (var j = tweetStorage.length - 1; j >= 0; j--) {
					if (tweetStorage[j].id_str === tweet.in_reply_to_status_id_str) {
						tweet.text = tweet.text.replace('@' + mention.screen_name, '&gt;&gt;' + (j + 1));
						break;
					}
				}
				tweet.text = tweet.text.replace('@' + mention.screen_name, 'ID:' + createHashedId(mention.screen_name, tweet.created_at));
			} else {
				tweet.text = tweet.text.replace('@' + mention.screen_name, 'ID:' + createHashedId(mention.screen_name, tweet.created_at));
			}
		}
		return tweet;
	},
	function(tweet) {
		var date = new Date(tweet.created_at);
		var hashedId = createHashedId(tweet.user.screen_name, tweet.created_at);
		var dateString = (function(d) {
			var pad = function(s) {
				s = s + '';
				return s.length === 1 ? '0' + s : s;
			};
			return [d.getFullYear(), d.getMonth(), d.getDate()].map(pad).join('/') +
				' ' + [d.getHours(), d.getMinutes(), d.getSeconds()].map(pad).join(':');
		})(date);
		tweet.dateString = dateString;
		tweet.hashedId = hashedId;
		tweet.nanashi = config.nanashi;
		return tweet;
	},
	function(tweet) {
		if (tweet.retweeted_status) {
			tweet = tweet.retweeted_status;
		}
		return tweet;
	}
];

var ngTweetRules = [
	function(tweet) {
		// var rule = JSON.parse(fs.readFileSync(NG_TEXT, {
		// 	encoding: 'utf-8'
		// }));
		var rule = require(NG_TEXT);
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
		// var rule = JSON.parse(fs.readFileSync(NG_CLIENT, {
		// 	encoding: 'utf-8'
		// }));
		var rule = require(NG_CLIENT);
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

var app = new Vue({
	el: '#main',
	data: {
		home_timeline: {
			tweetStorage: [],
			tweetCountTable: {}
		},
		user_timeline: {
			apiPath: '',
			tweets: [],
			isFirst: true
		},
		user_detail: {
			screen_name: '',
			id_str: '',
			tweet: {}
		},
		ngTweetRules: ngTweetRules
	},
	filters: {
		ngTweet: function(tweetStorage) {
			return tweetStorage.filter(function(tweet) {
				for (var i = this.ngTweetRules.length - 1; i >= 0; i--) {
					if (this.ngTweetRules[i](tweet)) return false;
				}
				return true;
			}.bind(this));
		}
	},
	methods: {
		tweet: function(event) {
			var text = event.target.value;
			var param = {
				status: text
			};
			if (text) {
				T.post('statuses/update', param, function(err, dat) {
					if (err) console.log(err)
				});
			}
			event.target.value = '';
			return false;
		},
		userDetail: function(event) {
			var tweet = event.targetVM;
			var screen_name = tweet.user.screen_name;
			var id_str = tweet.user.id_str;
			this.user_detail.screen_name = screen_name;
			this.user_detail.id_str = id_str;
			this.user_detail.$set('tweet', tweet);
			this.user_timeline.isFirst = true;
			$('#user-detail').modal();
		},
		showTweets: function(apiPath, event) {
			var param = {};
			if (this.user_timeline.isFirst) {
				this.user_timeline.$set('tweets', []);
				this.user_timeline.apiPath = apiPath;
			} else {
				var oldestTweetIndex = this.user_timeline.tweets.length - 1;
				var oldestTweetId = this.user_timeline.tweets[oldestTweetIndex].id_str;
				param.max_id = oldestTweetId;
			}
			var id_str = this.user_detail.id_str;
			param.user_id = id_str;
			param.count = 30;
			var setTweets = function(err, dat) {
				if (err) console.log(err);
				var tweets = this.user_timeline.tweets;
				dat=dat.slice(1).map(prepareTweet);
				this.user_timeline.$set('tweets', tweets.concat(dat));
			}.bind(this);
			T.get(apiPath, param, setTweets);
			if (this.user_timeline.isFirst) {
				$('#user-timeline').modal();
				this.user_timeline.isFirst = false;
			}
		}
	}
});

var createHashedId = function(screen_name, created_at) {
	var date = new Date(created_at);
	var hash = require('crypto').createHash('sha1');
	hash.update(screen_name + date.toDateString());
	return hash.digest('base64').slice(0, 9);
};

var incTweetCount = function(hashedId) {
	var oldCount = app.home_timeline.tweetCountTable[hashedId];
	oldCount = oldCount ? oldCount : 0;
	app.home_timeline.tweetCountTable[hashedId] = oldCount + 1;
	return oldCount + 1;
};

var prepareTweet = function(tweet, tweetStorage) {
	tweetStorage = tweetStorage || [];
	for (var i = prepareTweetRules.length - 1; i >= 0; i--) {
		var rule = prepareTweetRules[i];
		tweet = rule(tweet, tweetStorage);
	}
	return tweet;
};

var newTweet = function(tweet, app) {
	tweet = prepareTweet(tweet, app.home_timeline.tweetStorage);
	tweet.tweetCount = incTweetCount(tweet.hashedId);
	app.home_timeline.tweetStorage.push(tweet);
};

T.get('statuses/home_timeline', {
	count: 100
}, function(err, dat) {
	if (err) console.log(err);
	for (var i = dat.length - 1; i >= 0; i--) {
		var tweet = dat[i];
		newTweet(tweet, app);
	}
	setTimeout(function() {
		document.body.scrollTop = document.body.scrollHeight;
	}, 500);
});

stream.on('tweet', function(tweet) {
	var isBottom = window.scrollY + 40 > document.documentElement.scrollHeight - document.documentElement.clientHeight;
	newTweet(tweet, app);
	if (isBottom) {
		setTimeout(function() {
			document.body.scrollTop = document.body.scrollHeight
		}, 80);
	}
});

stream.on('error', function(err) {
	console.log(err);
	stream.stop();
	setTimeout(function() {
		stream.start();
	}, 5000);
});

// http://miles-by-motorcycle.com/fv-b-8-670/stacking-bootstrap-dialogs-using-event-callbacks
$(document).ready(function() {
	$('.modal').on('hidden.bs.modal', function(event) {
		$(this).removeClass('fv-modal-stack');
		$('body').data('fv_open_odals', $('body').data('fv_open_modals') - 1);
		app.user_timeline.isFirst = true;
	});
	$('.modal').on('shown.bs.modal', function(event) {
		if (typeof($('body').data('fv_open_modals')) == 'undefined') {
			$('body').data('fv_open_modals', 0);
		}
		if ($(this).hasClass('fv-modal-stack')) {
			return;
		}
		$(this).addClass('fv-modal-stack');
		$('body').data('fv_open_modals', $('body').data('fv_open_modals') + 1);
		$(this).css('z-index', 1040 + (10 * $('body').data('fv_open_modals')));
		$('.modal-backdrop').not('.fv-modal-stack')
			.css('z-index', 1039 + (10 * $('body').data('fv_open_modals')));
		$('.modal-backdrop').not('fv-modal-stack')
			.addClass('fv-modal-stack');
	});
});
