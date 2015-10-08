import Twit from 'twit';
import React from 'react';
import ReactDOM from 'react-dom';
import keys from '../keys.json';
import timelineConfig from '../timeline.json';
import MainComponent from './components/MainComponent';
import prepareTweet from './util/prepareTweet';
import TweetCountTable from './util/TweetCountTable';

let Twits = keys.map(key => new Twit(key));

let timelines = timelineConfig.map(timeline => {
	timeline.Twit = Twits[timeline.key];
	timeline.contents = [];
	timeline.tweetCountTable = new TweetCountTable();
	return timeline;
});

let timeline = timelines[0];

const render = tweet => {
	tweet = prepareTweet(tweet, timeline);
	timeline.contents.push(tweet);
	ReactDOM.render(<MainComponent timelines={timelines} />, document.getElementById('app'));
};

timeline.Twit.get('statuses/home_timeline', {count: 100}, (err, dat) => {
	dat.reverse().forEach(render);
});

const stream = timeline.Twit.stream('user');
stream.on('tweet', render);
