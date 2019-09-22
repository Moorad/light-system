const iro = require('@jaames/iro');
const SerialPort = require('serialport');
const schedule = require('node-schedule');
const fs = require('fs');
const {
	desktopCapturer
} = require('electron');

const port = new SerialPort('COM3', {
	baudRate: 9600,
	autoOpen: false
}, (err) => {
	if (err) {
		error(`Port ${port.path} cannot be opened.`);
	}
});

port.open((err) => {
	if (err) {
		error(err);
	}

});

var values;
var scheduleFunction;
var mode = 0;
var brightness = document.getElementsByClassName('brightness')[0];
var settings = document.getElementById('settings-btn');
var nightBtn = document.getElementById('night-btn');
var colorPicker = iro.ColorPicker('#color-picker-container', {
	width: 200,
	color: '#ff0000'
});

port.on('open', () => {
	setTimeout(() => {
		main();
	}, 4600);
});

getCache();

function main() {
	console.log('ready');
	document.getElementById('loading').className += ' fade';
	setTimeout(() => {
		document.getElementById('loading').style.display = 'none';
	}, 400);

}

function nightMode(toggle) {
	if (toggle) {
		var url = 'https://api.sunrise-sunset.org/json?lat=51.621441&lng=-3.943646&formatted=0';
		fetch(url, {
				method: 'GET'
			}).then(res => res.json())
			.then(json => {
				var data = json.results.sunset;
				var sunset = data.substr(data.indexOf('T') + 1, 5).split(':');
				var sunsetTime = parseInt(sunset[1]) + parseInt(sunset[0]) * 60;
				var currentTime = new Date(Date.now()).getMinutes() + new Date(Date.now()).getHours() * 60;
				if (currentTime >= sunsetTime) {
					document.getElementById('spectrum').className += ' on';
					var buf = new Buffer.from([125, 124, 255], 0, 3);
					port.write(buf);
				} else {
					console.log(`${sunset[0]}:${sunset[1]}`)
					scheduleFunction = schedule.scheduleJob(`${sunset[1]} ${sunset[0]} * * *`, function () {
						document.getElementById('spectrum').className += ' on';
						var buf = new Buffer.from([125, 124, 255], 0, 3);
						port.write(buf);
					});
				}
			});
		nightBtn.className += ' on';

	} else {
		scheduleFunction.cancel();
		nightBtn.classList.remove('on');
		console.log('cancelled')
	}
}

function onColorChange(color, changes) {
	console.log(color.rgb);
	var buf = new Buffer.from([123, color.rgb.r, color.rgb.g, color.rgb.b]);
	port.write(buf);

}

colorPicker.on('input:end', onColorChange);

function error(message) {
	document.getElementById('loading-gif').style.display = 'none';
	document.getElementById('error').style.display = 'block';
	document.getElementById('error').innerHTML = message;
}

function solid(element) {
	if (mode == 1) {
		mode = 0;
		element.classList.remove('on');
		document.getElementsByClassName('solid-div')[0].style.display = 'none';
	} else {
		mode = 1;
		for (var i of document.getElementsByClassName('option')) {
			i.classList.remove('on');
		}
		for (var e of document.getElementsByClassName('mode-setting')) {
			e.style.display = 'none';
		}
		document.getElementsByClassName('s-solid')[0].style.display = 'block';
		element.className += ' on';
	}
}

function gradient(element) {
	if (mode == 2) {
		mode = 0;
		element.classList.remove('on');
	} else {
		mode = 2;
		for (var i of document.getElementsByClassName('option')) {
			i.classList.remove('on');
		}
		element.className += ' on';
		console.log('gradient')
	}
}

function spectrum(element) {
	if (mode == 3) {
		mode = 0;
		element.classList.remove('on');
	} else {
		mode = 3;
		for (var i of document.getElementsByClassName('option')) {
			i.classList.remove('on');
		}
		element.className += ' on';
		var buf = new Buffer.from([125], 0, 1);
		port.write(buf);
		console.log('buf sent = ' + buf)
	}
}

function fan(element) {
	// var buf = new Buffer.from([126], 0, 2)
	// port.write(buf)

}

function getCache() {
	if (fs.existsSync('./config.json')) {
		values = JSON.parse(fs.readFileSync('./config.json', 'utf8'));
		setTimeout(() => {
			// Brightness
			brightness.value = values.brightness;
			fade((x) => {
				var buf = new Buffer.from([124, x], 0, 2);
				port.write(buf);
				console.log(x)
			}, values.brightness, 10);

			// Mode

			// Fan

			// Night Mode
			nightMode(values.nightMode);
		}, 4600);
	} else {
		values = {
			nightMode: true,
			fanIndex: 0,
			mode: 0,
			data: {},
			brightness: 0
		};
		fs.writeFileSync('./config.json', JSON.stringify(values));
		console.log('Cache file has been created')
	}
	console.log('Cache has been obtained')
	console.log(values);
}


// function gotDevices(mediaDevices) {
// 	mediaDevices.forEach(element => {
// 		console.log(element)
// 	})
// }
function onchange(stream) {
	console.log("here", stream);

	var context = new AudioContext();
	var src = context.createMediaStreamSource(stream);
	var analyser = context.createAnalyser();
	var music = document.getElementById('music');
	for (var e of document.getElementsByClassName('mode-setting')) {
		e.style.display = 'none';
	}
	document.getElementsByClassName('s-music')[0].style.display = 'block';
	src.connect(analyser);
	//analyser.connect(context.destination);

	analyser.fftSize = 1024;

	var bufferLength = analyser.frequencyBinCount;
	var dataArray = new Uint8Array(bufferLength);

	var buf = new Buffer.from([125], 0, 1);
	port.write(buf);
	console.log("bufferLength", bufferLength);

	function renderFrame() {
		window.requestAnimationFrame(renderFrame);
		analyser.getByteFrequencyData(dataArray);
		var average = 0;
		for (var i of dataArray) {
			average += i;
		}
		average /= dataArray.length;
		console.log(Math.ceil(dataArray[3] * 4))
		document.getElementsByClassName('progress')[0].style.width = (Math.ceil(dataArray[3] * 4) / 1200) * 200 + 'px';
		var buf = new Buffer.from([124, Math.ceil(dataArray[3] * 4)], 0, 2);
		port.write(buf)
	}
	console.log("render");
	renderFrame();
	// });
};

function start() {
	navigator.mediaDevices.getUserMedia({
			audio: true,
			video: false
		})
		.then((stream) => {
			onchange(stream);
		})
		.catch((e) => handleError(e));

	function handleError(e) {
		console.log(e);
	}
}

function fade(func, end, time) {
	var start = 0;
	var repeat = setInterval(function () {
		if (start >= end) {
			clearInterval(repeat);
		}
		func(start);
		start++;
	}, time);
}
// events

brightness.addEventListener('input', () => {
	var buf = new Buffer.from([124, parseInt(brightness.value)], 0, 2);
	port.write(buf);
	values.brightness = parseInt(brightness.value);
	fs.writeFileSync('./config.json', JSON.stringify(values));
});

settings.addEventListener('click', () => {
	document.getElementsByClassName('settings')[0].style.display = document.getElementsByClassName('settings')[0].style.display == 'none' ? 'block' : 'none';
});

nightBtn.addEventListener('click', () => {
	values.nightMode = !values.nightMode;
	nightMode(values.nightMode);
	fs.writeFileSync('./config.json', JSON.stringify(values));
});