class TweetCountTable {
	constructor(initialTable = {}) {
		this._table = initialTable;
	}
	inc(id) {
		let count = this.get(id);
		this._set(id, ++count);
		return count;
	}
	get(id) {
		let count = this._table[id] || 0;
		return count;
	}
	_set(id, count = 0) {
		this._table[id] = count;
	}
}

export default TweetCountTable;
