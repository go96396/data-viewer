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
	$('#data').show();
	app.running = false;
};

//update the update interval, converting from s to ms
app.updateInterval = function() {
	app.interval = $('#interval').val() > 0.19 ? $('#interval').val()*1000 : 200;
	app.restartInterval();
};

//empty the pre of data
app.clearData = function() {
	$('#data').html('').hide();
};

//load the data with an ajax request
app.loadData = function() {
	$.ajax({
    url : app.dataURL || 'sample-data/sample.csv',
    type: 'GET'
  })
  .done(app.processData)
  .fail(app.ajaxError);
};

//process the data once loaded
app.processData = function(data) {
	//create empty array to fill with data if needed
	var arr2d = [];
	//process data accordingly
	switch($('#data-format').val()) {
		case 'csv':
			arr2d = app.parseCSV(data);
			app.createTable(arr2d);
			break;
		case 'tsv':
			arr2d = app.parseTSV(data);
			app.createTable(arr2d);
			break;
		case 'raw':
		default: //output raw data in a <pre>
			$('#data').html('<pre>'+data+'</pre>');
			break;
	}
	//make the data visible once processed
	$('#data').show();
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
};

//
app.hideAlert = function() {
	$('#alert').hide();
};

//
app.showAlert = function(msg) {
	console.log(msg);
	if(msg.length) {
		$('#alert').html(msg);
	}
	$('#alert').show();
};

//parse CSV
app.parseCSV = function(data) {
	return $.csv.toArrays(data);
};

//parse TSV
app.parseTSV = function(data) {
	return $.tsv.parseRows(data);
};

//expects a 2-dimensional array of data
app.createTable = function(arr2d) {
	$('#data').html('<table class="table" ><thead></thead><tbody></tbody></table>');
	$('.table thead').append('<tr><tr>');
	for (i=0; i < arr2d[0].length; i++) {
		$('.table thead tr').append('<th>'+arr2d[0][i]+'</th>');
	}
	//i starts at 1 because the 0th is the table header
	for (i=1; i < arr2d.length; i++) {
		$('.table tbody').append('<tr></tr>');
		for (j=0; j < arr2d[i].length; j++) {
			$('.table tbody tr:last-of-type').append('<td>'+arr2d[i][j]+'</td>');
		}
	}
};

/*
* must go last
*/
$(document).ready(app.docReady);