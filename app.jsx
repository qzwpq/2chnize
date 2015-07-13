var React = require('react');

var Twit = require('twit');

var NG_TEXT = __dirname + '/ng-list/text.json';

var NG_CLIENT = __dirname + '/ng-list/client.json';

var NG_SCREEN_NAME = __dirname + '/ng-list/screen_name.json';

var REPLACE_TEXT = __dirname + '/replace-rule/text.json';

var CONFIG_FILE = __dirname + '/config.json';

var KEY_FILE = __dirname + '/keys.json';

var config = require(CONFIG_FILE);

var KEYS = require(KEY_FILE);

var T = new Twit(KEYS[0]);

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
	}, function(tweet, tweets) {
		for (var i = tweet.entities.user_mentions.length - 1; i >= 0; i--) {
			var mention = tweet.entities.user_mentions[i];
			if (mention.id_str == tweet.in_reply_to_user_id_str) {
				for (var j = tweets.length - 1; j >= 0; j--) {
					if (tweets[j].id_str === tweet.in_reply_to_status_id_str) {
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
		tweet.NAME = config.NONAME_NAME;
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
	},
	function(tweet) {
		var rule = require(NG_SCREEN_NAME);
		var screen_name = tweet.user.screen_name;
		for (var i = rule.length - 1; i >= 0; i--) {
			var reg = new RegExp(rule[i].reg, rule[i].flag);
			var result = reg.test(screen_name);
			if (result) {
				return true;
			}
			var includeMention = rule[i].includeMention;
			includeMention = includeMention === void 0 ? true : includeMention;
			if(includeMention){
				for (var j = tweet.entities.user_mentions.length - 1; j >= 0; j--) {
					var mention  = tweet.entities.user_mentions[j];
					result = reg.test(mention.screen_name);
					if(result){
						return true;
					}
				}
			}
		}
		return false;
	}
];

var createHashedId = function(screen_name, created_at) {
	var date = new Date(created_at);
	var hash = require('crypto').createHash('sha1');
	hash.update(screen_name + date.toDateString());
	return hash.digest('base64').slice(0, 9);
};

var incTweetCount = function(hashedId, tweetCountTable) {
	var oldCount = tweetCountTable[hashedId] || 0;
	tweetCountTable[hashedId] = oldCount + 1;
	return oldCount + 1;
};

var prepareTweet = function(tweet, tweets) {
	tweets = tweets || [];
	for (var i = prepareTweetRules.length - 1; i >= 0; i--) {
		var rule = prepareTweetRules[i];
		tweet = rule(tweet, tweets);
	}
	return tweet;
};

var newTweet = function(tweet, timeline) {
	var tweets = timeline.tweets;
	var tweetCountTable = timeline.tweetCountTable;
	var view = timeline.view;
	tweet = prepareTweet(tweet, tweets);
	tweet.tweetCount = incTweetCount(tweet.hashedId, tweetCountTable);
	tweet.index = tweets.length + 1;
	tweets.push(tweet);
	if (view !== null) {
		view.replaceProps({
			timeline
		});
	}
};

var TweetComponent = React.createClass({
	userDetail() {
		alert('WIP! sorry\nscreen_name:' + this.props.tweet.user.screen_name);
	},
	render() {
		var tweet = this.props.tweet;
		var tweetCountTable = this.props.timeline.tweetCountTable;
		var idStr = ' ID:' + tweet.hashedId + '[' + tweet.tweetCount + '/' + tweetCountTable[tweet.hashedId] + ']';
		var textObj = {
			__html: tweet.text
		};
		var idx = tweet.index;
		var NAME = tweet.NAME;
		var dateString = tweet.dateString;
		return (
			<div>{idx}: {NAME} {dateString}
				<span onClick={this.userDetail}>{idStr}</span>
				<br />
				<span dangerouslySetInnerHTML={textObj}></span>
			</div>
		);
	}
});

var TimelineComponent = React.createClass({
	render() {
		return (
			<div>
				{this.props.timeline.tweets.filter(tweet=>{
					for (var i = ngTweetRules.length - 1; i >= 0; i--) {
						if (ngTweetRules[i](tweet)) return false;
					}
					return true;
				}).map(tweet=>
					<TweetComponent key={tweet.id_str} timeline={this.props.timeline} tweet={tweet} />
				)}
			</div>
		);
	}
});

var timelines = [{
	tweets: [],
	tweetCountTable: {},
	view: null
}];

var timeline = timelines[0];

T.get('statuses/home_timeline', {
	count: 100
}, (err, dat) => {
	if (err) console.log(err);
	for (var i = dat.length - 1; i >= 0; i--) {
		var tweet = dat[i];
		newTweet(tweet, timeline);
	}
	timeline.view = React.render(<TimelineComponent timeline={timeline} />, document.body);
});

stream.on('tweet', (tweet) => {
	newTweet(tweet, timeline);
});
