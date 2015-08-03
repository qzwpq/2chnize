import crypto from 'crypto';

export default (screen_name, created_at) => {
	const date = new Date(created_at);
	const hash = crypto.createHash('sha1');
	hash.update(screen_name + date.toDateString());
	return hash.digest('base64').slice(0, 9);
};
