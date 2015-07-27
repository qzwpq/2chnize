import React from 'react';
import TimelineComponent from './TimelineComponent';

class MainComponent extends React.Component {
	render() {
		return (
			<div id='MainComponent'>
				{this.props.timelines.map(timeline =>
					<TimelineComponent timeline={timeline} />
				)}
			</div>
		);
	}
}

export default MainComponent;
