const pad = n => (n < 10 ? '0' : '') + n;

export default created_at => {
	const d = new Date(created_at);
	const date = [d.getFullYear(), d.getMonth(), d.getDate()].map(pad).join('/');
	const time = [d.getHours(), d.getMinutes(), d.getSeconds()].map(pad).join(':');
	return {date, time};
};
