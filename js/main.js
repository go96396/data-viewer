var app = app || {};

//global variables
app.dataURL = null; //URL of data source
app.interval = 2000; //update frequency in ms
app.running = false;
app.logData = false;

//setup event listeners
app.docReady = function() {
	$('#updateURL').on('click', app.updateURL);
	$('#startDataMonitoring').on('click', app.startDataMonitoring);
	$('#stopDataMonitoring').on('click', app.stopDataMonitoring);
	$('#updateInterval').on('click', app.updateInterval);
	$('#clearData').on('click', app.clearData);
};

//update the URL of the data displayed
app.updateURL = function() {
	app.dataURL = $('#dataURL').val();
	console.log(app.dataURL);
	if(app.running) {
		app.restartInterval();
	}
};

//start monitoring the data source
app.startDataMonitoring = function() {
	$('#welcome').hide();
	app.hideAlert();
	app.interval = setInterval(app.loadData, app.interval);
	app.running = true;
};

//stop monitoring the data source
app.stopDataMonitoring = function() {
	clearInterval(app.interval);
	$('pre#data').show();
	app.running = false;
};

//update the update interval, converting from s to ms
app.updateInterval = function() {
	app.interval = $('#interval').val() > 0.19 ? $('#interval').val()*1000 : 200;
	app.restartInterval();
};

//empty the pre of data
app.clearData = function() {
	$('pre#data').html('').hide();
};

//load the data with an ajax request
app.loadData = function() {
	$.ajax({
    url : app.dataURL || 'sample-data/outbound.csv',
    type: 'GET',
  })
  .done(app.processData)
  .fail(app.ajaxError);
};

//process the data once loaded
app.processData = function(data) {
	//output data to the <pre>
	$('pre#data').html(data);
	$('pre#data').show();
	//log data if we want to
	if(app.logData) {
		console.log(data);
	}
};

//
app.ajaxError = function(err) {
	console.log(err);
	app.stopDataMonitoring();
	app.clearData();
	app.showAlert(
		'<h1>Oops!</h1>'+
		'<p>We were unable to load data source <code id="data-source">'+app.dataURL+'</code> you specified. Please update the data source and try again.</p>'
	);
};

//
app.restartInterval = function() {
	app.stopDataMonitoring();
	app.startDataMonitoring();
}

//
app.hideAlert = function() {
	$('#alert').hide()
};

//
app.showAlert = function(msg) {
	console.log(msg);
	if(msg.length) {
		$('#alert').html(msg);
	}
	$('#alert').show();
};

/*
* must go last
*/
$(document).ready(app.docReady);