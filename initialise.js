// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

function reinitialising() {
	document.getElementById('loading-indicator').style.display = 'block';
	document.getElementById('error').style.display = 'none';
	document.getElementById('error-reload').style.display = 'none';
	
	var body = document.getElementsByTagName('body')[0];
	var scriptTag = document.getElementById('main-script');
	var newScriptTag = document.createElement('script'); 
	newScriptTag.id = 'main-script';
	newScriptTag.src = scriptTag.src;
	
	body.removeChild(scriptTag);
	setTimeout(function() {

		body.appendChild(newScriptTag);
	},1000);

}