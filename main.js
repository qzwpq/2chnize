var app = require('app');
var BrowserWindow = require('browser-window');
var mainWindow = null;
app.on('window-all-closed', function() {
	if (process.platform !== 'darwin')
		app.quit();
});
app.on('ready', function() {
	mainWindow = new BrowserWindow({
		width: 800,
		height: 600,
		x: 0,
		y: 0
	});
	mainWindow.loadUrl('file://' + __dirname + '/index.html');
	mainWindow.on('closed', function() {
		mainWindow = null;
	});
});
