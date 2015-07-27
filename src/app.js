import Twit from 'twit';
import React from 'react';
import keys from '../keys.json';
import timelineConfig from '../timeline.json';
import MainComponent from './components/MainComponent';

let Twits = keys.map(key => new Twit(key));

let timelines = timelineConfig.map(timeline => {
	timeline.Twit = Twits[timeline.key];
	timeline.contents = [];
	return timeline;
});

React.render(<MainComponent timelines={timelines} />, document.body);

let timeline = timelines[0];

let stream = timeline.Twit.stream('user');
stream.on('tweet', tweet => {
	timeline.contents.push(tweet);
	React.render(<MainComponent timelines={timelines} />, document.body);
});