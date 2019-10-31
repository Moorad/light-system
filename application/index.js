const iro = require('@jaames/iro');
const SerialPort = require('serialport');
const schedule = require('node-schedule');
const fs = require('fs');
const {MDCSlider} = require('@material/slider/dist/mdc.slider');
// var {
// 	desktopCapturer
// } = require('electron');
var port = new SerialPort('COM3', {
	baudRate: 9600,
	autoOpen: false
}, (err) => {
	if (err) {
		error(`Port ${port.path} cannot be opened.`);
	}
});

port.open((err) => {
	console.log(err)
	if (err) {
		error(err);
	}

});

var values = {
	nightMode: true,
	fanIndex: 0,
	mode: 0,
	data: {},
	brightness: 0
};
var scheduleFunction;
var brightness = document.getElementsByClassName('brightness')[0];
var settings = document.getElementById('settings-btn');
var nightBtn = document.getElementById('night-btn');
var colorPickerSolid = iro.ColorPicker('#color-picker-container-solid', {
	width: 200,
	color: '#ff0000'
});

var colorPickerGradient1 = iro.ColorPicker('#color-picker-container-gradient-1', {
	width: 200,
	color: '#ff0000'
});

var colorPickerGradient2 = iro.ColorPicker('#color-picker-container-gradient-2', {
	width: 200,
	color: '#ff0000'
});

console.log(port);
port.on('open', () => {
	setTimeout(() => {
		main();
	}, 4600);
});

getConfig();


function main() {
	console.log('ready');
	document.getElementById('loading-indicator').className += ' fade';
	setTimeout(() => {
		document.getElementById('loading-indicator').style.display = 'none';
	}, 400);

}

fade([0,0,0],[255,255,255],124,100,() => {});

// function nightMode(toggle) {
// 	if (toggle) {
// 		var url = 'https://api.sunrise-sunset.org/json?lat=51.621441&lng=-3.943646&formatted=0';
// 		fetch(url, {
// 				method: 'GET'
// 			}).then(res => res.json())
// 			.then(json => {
// 				var data = json.results.sunset;
// 				var sunset = data.substr(data.indexOf('T') + 1, 5).split(':');
// 				var sunsetTime = parseInt(sunset[1]) + parseInt(sunset[0]) * 60;
// 				var currentTime = new Date(Date.now()).getMinutes() + new Date(Date.now()).getHours() * 60;
// 				if (currentTime >= sunsetTime) {
// 					document.getElementById('spectrum').className += ' on';
// 					var buf = new Buffer.from([125, 124, 255], 0, 3);
// 					port.write(buf);
// 				} else {
// 					console.log(`${sunset[0]}:${sunset[1]}`)
// 					scheduleFunction = schedule.scheduleJob(`${sunset[1]} ${sunset[0]} * * *`, function () {
// 						document.getElementById('spectrum').className += ' on';
// 						var buf = new Buffer.from([125, 124, 255], 0, 3);
// 						port.write(buf);
// 					});
// 				}
// 			});
// 		nightBtn.className += ' on';

// 	} else {
// 		scheduleFunction.cancel();
// 		nightBtn.classList.remove('on');
// 		console.log('cancelled')
// 	}
// }

function onColorChange(color, changes) {
	console.error([color.rgb.r,color.rgb.g,color.rgb.b])
	console.error(values.data.color)
	document.getElementById('select-colour-solid').style.background = `rgb(${color.rgb.r},${color.rgb.g},${color.rgb.b})`;
	if (values.data.color[0] == color.rgb.r && values.data.color[1] == color.rgb.g && values.data.color[2] == color.rgb.b) {
		var buf = new Buffer.from([123, color.rgb.r,color.rgb.g,color.rgb.b]);
		port.write(buf);
	} else {
		fade(values.data.color,[color.rgb.r,color.rgb.g,color.rgb.b],48,20,(value) => {
			console.error(value)
			value = [Math.floor(value[0]),Math.floor(value[1]),Math.floor(value[2])];
			console.warn(value)
			var buf = new Buffer.from([123, value[0],value[1],value[2]]);
			port.write(buf);
		});
		values.data.color = [color.rgb.r, color.rgb.g, color.rgb.b]
		setConfig();
	}
}

function onColorChangeG1(color, changes) {
	console.log(color.rgb);
	document.getElementById('select-colour-gradient-1').style.background = `rgb(${color.rgb.r},${color.rgb.g},${color.rgb.b})`;
	var buf = new Buffer.from([123, color.rgb.r, color.rgb.g, color.rgb.b]);
	port.write(buf);

}

function onColorChangeG2(color, changes) {
	console.log(color.rgb);
	document.getElementById('select-colour-gradient-2').style.background = `rgb(${color.rgb.r},${color.rgb.g},${color.rgb.b})`;
	var buf = new Buffer.from([123, color.rgb.r, color.rgb.g, color.rgb.b]);
	port.write(buf);

}

colorPickerSolid.on('input:end', onColorChange);
colorPickerGradient1.on('input:end', onColorChangeG1);
colorPickerGradient2.on('input:end', onColorChangeG2);

function solid() {
	var element = document.getElementById('solid-option');

	for (var i of document.getElementsByClassName('option')) {
		i.classList.remove('on');
	}
	for (var e of document.getElementsByClassName('setting-section')) {
		e.style.display = 'none';
	}
	document.getElementById('solid-settings').style.display = 'block';
	element.className += ' on';
	values.mode = 1;
	setConfig();
}

function gradient() {
	var element = document.getElementById('gradient-option');

	for (var i of document.getElementsByClassName('option')) {
		i.classList.remove('on');
	}
	for (var e of document.getElementsByClassName('setting-section')) {
		e.style.display = 'none';
	}
	document.getElementById('gradient-settings').style.display = 'block';
	element.className += ' on';
	values.mode = 2;
	setConfig();
	console.log('gradient')

}

function spectrum() {
	var element = document.getElementById('spectrum-option');

	for (var i of document.getElementsByClassName('option')) {
		i.classList.remove('on');
	}
	for (var e of document.getElementsByClassName('setting-section')) {
		e.style.display = 'none';
	}
	document.getElementById('gradient-settings').style.display = 'block';
	element.className += ' on';
	values.mode = 3;
	setConfig();
	var buf = new Buffer.from([125], 0, 1);
	port.write(buf);
	console.log('buf sent = ' + buf)
}


function sound() {
	var element = document.getElementById('sound-option');

	for (var i of document.getElementsByClassName('option')) {
		i.classList.remove('on');
	}
	for (var e of document.getElementsByClassName('setting-section')) {
		e.style.display = 'none';
	}
	document.getElementById('sound-settings').style.display = 'block';
	element.className += ' on';
	values.mode = 4;
	setConfig();
	console.log('Mode: 4')
}

function fan(element) {
	// var buf = new Buffer.from([126], 0, 2)
	// port.write(buf)

}

function getConfig() {
	if (fs.existsSync('./config.json')) {
		values = JSON.parse(fs.readFileSync('./config.json', 'utf8'));
		console.log(values)
		setTimeout(() => {
			// Brightness
			brightness.value = values.brightness;
			// fade((x) => {
			// 	var buf = new Buffer.from([124, x], 0, 2);
			// 	port.write(buf);
			// }, values.brightness, 10);
			fade([0],[255],255,10,(value) => {
				console.log(value)
				var buf = new Buffer.from([124, value[0]], 0, 2);
				port.write(buf);
			});

			// Mode
			if (values.mode == 1) {
				let temp = {rgb:{r:values.data.color[0],g:values.data.color[1],b:values.data.color[2]}};
				solid();
				onColorChange(temp);
			} else if (values.mode == 2) {
				gradient();
			} else if (values.mode == 3) {
				spectrum();
			}
			// Fan

			// Night Mode
			// nightMode(values.nightMode);
		}, 4600);
	} else {
		setConfig();
	}
	console.log('Cache has been obtained')
	console.log(values);
}


function setConfig() {
	fs.writeFileSync('./config.json', JSON.stringify(values));
	console.log('Config has been set')
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

function fade(inital,end,step,time,func) {
	let difference = [];
	for (let i = 0;i < inital.length;i++) {
		difference.push((end[i]-inital[i])/step);
	}
	console.log(difference);
	
	var counter = 0;
	var repeat = setInterval(function () {
		for(let i = 0;i< difference.length;i++) {
			inital[i] += difference[i]
			if (inital[i] < 0) {
				inital[i] = 0; 
			}
		}
		func(inital);
		counter++;
		if (step == counter) {
			clearInterval(repeat);
		}
	}, time);
}

function error(message) {
	console.log(message);
	document.getElementById('loading-indicator').style.display = 'none';
	document.getElementById('error').style.display = 'block';
	document.getElementById('error').innerHTML = message;
	document.getElementById('error-reload').style.display = 'block';
}


// events

// brightness.addEventListener('input', () => {
// 	var buf = new Buffer.from([124, parseInt(brightness.value)], 0, 2);
// 	port.write(buf);
// 	values.brightness = parseInt(brightness.value);
// 	fs.writeFileSync('./config.json', JSON.stringify(values));
// });



// settings.addEventListener('click', () => {
// 	document.getElementsByClassName('settings')[0].style.display = document.getElementsByClassName('settings')[0].style.display == 'none' ? 'block' : 'none';
// });

// nightBtn.addEventListener('click', () => {
// 	values.nightMode = !values.nightMode;
// 	nightMode(values.nightMode);
// 	fs.writeFileSync('./config.json', JSON.stringify(values));
// });


function rgbToHex(value) { 
	var hex = Number(value).toString(16);
	if (hex.length < 2) {
		 hex = '0' + hex;
	}
	return hex;
  };


// event listener
const slider = new MDCSlider(document.querySelector('#brightness'));
slider.listen('MDCSlider:change', () => {
	console.log(Math.floor(slider.value*(2.55)))	

		var buf = new Buffer.from([124, parseInt(slider.value)], 0, 2);
		port.write(buf);
		values.brightness = parseInt(slider.value);
		fs.writeFileSync('./config.json', JSON.stringify(values));
});