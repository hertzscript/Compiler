//FIXME: Channels aren't syncing properly

const Channel = require("./Channel.js");
const performance = require("perf_hooks").performance;

function player(table, name) {
	const reader = new Channel.Reader(table);
	for (var hits = 0; hits < 10; hits++) {
		console.log(name);
		var ball = reader.read();
		ball++;
		const start = performance.now();
		const end = start + 100;
		while (performance.now() < end);
		table.write(ball);
	}
}

var ball = 0;
const table = new Channel("number");
table.write(ball);
spawn player(table, "Ping!");
spawn player(table, "Pong!");

// Sleep for 1 Second
const start = performance.now();
const end = start + 1000;
while (performance.now() < end);

const reader = new Channel.Reader(table);
console.log("Ball was hit " + reader.read() + " times.");

