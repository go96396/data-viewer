var app = app || {};

//global variables
app.dataURL = null; //URL of data source
app.interval = 60*1000; //update frequency in ms
app.running = false;
app.logData = false;

//setup event listeners
app.docReady = function() {
	$('#updateURL').on('click', app.updateURL);
	$('#startDataMonitoring').on('click', app.startDataMonitoring);
	$('#stopDataMonitoring').on('click', app.stopDataMonitoring);
	$('#updateInterval').on('click', app.updateInterval);
	$('#clearData').on('click', app.clearData);
	$('#plotLineGraph').on('change', app.updatePlotGraphStatus)
	$('#interval').val(app.interval/1000);
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
	app.loadData(); //run once
	app.interval = setInterval(app.loadData, app.interval); //set interval
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

//
app.updatePlotGraphStatus = function() {
	app.plotGraph = $('#plotLineGraph').prop('checked');
};

//load the data with an ajax request
app.loadData = function() {
	$.ajax({
		cache: false,
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
			break;
		case 'tsv':
			arr2d = app.parseTSV(data);
			break;
		case 'raw':
		default: //output raw data in a <pre>
			$('#data').html('<pre>'+data+'</pre>');
			break;
	}
	//plot graph or draw table if arr2d has been populated with data
	if(app.plotGraph && arr2d.length) {
		app.plotLineGraph(arr2d);
	} else if(arr2d.length) {
		app.createTable(arr2d);
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
	$('.table thead').append('<tr></tr>');
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

//this generates a table from the 2D array
//NOTE: it assumes the first column to be the x values
//			all other columns are plotted as y versus x
app.plotLineGraph = function(arr2d) {
	//namespace for this function
	var graph = graph || {};

	graph.title = app.dataURL || '';

	graph.series = [];
	//format data for highchart
	//required format:
	/*
	series = [
	{
		"name" : string1,
		"data" : arr[ [x1,y1], [x2,y2], [x3,y3], [x4,y4] ]
	},
	{
		"name" : string2,
		"data" : arr[ [x5,y5], [x6,y6], [x7,y7], [x8,y8] ]
	}]
	*/

	//arr2d[0].length gives us the number of series of data to be plot as it is
	//one less than the number of columns ie the number of 'y' columns
	var numberOfCols = arr2d[0].length-1;
	var numberOfRows = arr2d.length-1;
	for(var c=0; c < numberOfCols; c++) {
		graph.series.push({
			"name" : arr2d[0][c+1],
			"data" : crunchData(arr2d, c)
		});
	}

	//
	graph.titleText = app.dataURL;
	graph.xAxisText = arr2d[0][0];
	graph.xAxisText = 'y axis';

	//create the graph
  $('#data').highcharts({
      chart: {
          type: 'scatter',
          zoomType: 'xy'
      },
      title: {
          text: graph.titleText
      },
      subtitle: {},
      xAxis: {
          title: {
              enabled: true,
              text: graph.xAxisText
          },
          startOnTick: true,
          endOnTick: true,
          showLastLabel: true
      },
      yAxis: {
          title: {
              text: graph.yAxisText
          }
      },
      legend: {
          layout: 'vertical',
          align: 'left',
          verticalAlign: 'top',
          x: 100,
          y: 70,
          floating: true,
          backgroundColor: '#FFFFFF',
          borderWidth: 1
      },
      plotOptions: {
          scatter: {
              marker: {
                  radius: 5,
                  states: {
                      hover: {
                          enabled: true,
                          lineColor: 'rgb(100,100,100)'
                      }
                  }
              },
              states: {
                  hover: {
                      marker: {
                          enabled: false
                      }
                  }
              },
              tooltip: {
                  headerFormat: '<b>{series.name}</b><br>',
                  pointFormat: '{point.x}, {point.y}'
              }
          }
      },
      series: graph.series
  });
	//
	function crunchData(arr2d, c) {
		var data = [];
		for(var i=0; i < numberOfRows; i++) {
			console.log(arr2d);
			coord = [ parseFloat( arr2d[i+1][0] ), parseFloat( arr2d[i+1][c+1] ) ];
			data.push(coord)
		}
		return data;
	}
};

/*
* must go last
*/
$(document).ready(app.docReady);