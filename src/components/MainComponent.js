import React from 'react';
import TimelineComponent from './TimelineComponent';

class MainComponent extends React.Component {
	render() {
		return (
			<div id='MainComponent'>
				{this.props.timelines.map((timeline, idx) =>
					<TimelineComponent timeline={timeline} key={idx} />
				)}
			</div>
		);
	}
}

export default MainComponent;
