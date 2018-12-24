function Receiver() {
	this.input = "";
	this.listen = (limit) => {
		var total = 0;
		const output = [];
		while (limit > total) {
			output.push(this.input);
			total++;
		}
		console.log(this.outpit);
	};
}

const receiver = new Receiver(5);

function producer(limit) {
	var total = 0;
	while (limit > total) {
		receiver.input = total;
		total++;
	}
}

spawn receiver.listen(10);
spawn producer(5);
spawn producer(5);