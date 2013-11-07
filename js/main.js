var app = app || {};

//global variables
app.dataURL = 'data/double_pen.csv'; //URL of data source
app.interval = 60*1000; //update frequency in ms
app.running = false;
app.logData = false;
//colour palletter source:
//http://www.colourlovers.com/palette/3112897/colores_pasteles
app.colors = ['#73BDEF', '#A8EF73', '#F0FF84', '#A78AFC', '#F975E1'];

//called when the page has loaded
app.docReady = function() {
	//setup event listeners
	$('#startDataMonitoring').on('click', app.startDataMonitoring);
	$('#stopDataMonitoring').on('click', app.stopDataMonitoring);
	$('#loadData').on('click', app.oneOffLoad);
	$('#refreshDataFiles').on('click', app.fetchDataFiles);
	$('.data-format label').on('click', app.updateDataFormat);
	$('.beta-features input').on('change', app.updateBetaVars);
	$('#saveChanges').on('click', app.saveChanges);
	$('body').on('keydown', app.keyboardShortcuts);
	//initialisation stuff
	app.updateOptionToSelectBetaFeatures();
	$('#interval').val(app.interval/1000);
};

//update the URL of the data displayed
app.updateURL = function() {
	//app.dataURL = $('#dataURL').val() || app.dataURL;
	app.dataURL = $('#dataFiles').val();
	if(app.running) {
		app.restartInterval();
	}
};

//start monitoring the data source
app.startDataMonitoring = function() {
	$('#welcome').hide();
	app.hideAlert();
	if(!app.running) {
		app.loadData(); //run once immediately
		app.interval = setInterval(app.loadData, app.interval); //set interval
		app.running = true;
	}
};

//stop monitoring the data source
app.stopDataMonitoring = function() {
	clearInterval(app.interval);
	$('#data').show();
	app.running = false;
};

//
app.oneOffLoad = function() {
	$('#welcome').hide();
	app.loadData();
};

//
app.fetchDataFiles = function() {
	$.ajax({
		cache: false,
    url : 'data/data-files.csv',
    type: 'GET'
  })
  .done(app.updateDataFileList);
};

app.updateDataFileList = function(data) {
	var arr = app.parseCSV(data)[0];
	$('#dataFiles').html('');
	arr.forEach(function(fileName) {
		$('#dataFiles').append('<option value="'+fileName+'" >'+fileName+'</option>');
	});
};

//update the update interval, converting from s to ms
app.updateInterval = function() {
	var interval = parseFloat($('#interval').val());
	app.interval = interval > 1 ? interval*1000 : 200;
	if(app.running) {
		app.restartInterval();
	}
};

//
app.updateDataFormat = function() {
	//this requires a delay otherwise the previously selected
	//data format is saved - some lag between button click and
	//change in radio button state - wierd
	setTimeout(function() {
		app.dataFormat = $('input[name="data-format-options"]:checked').val();
		app.updateOptionToSelectBetaFeatures();
		console.log(app.dataFormat);
	}, 250);
};

//empty the pre of data
app.clearData = function() {
	$('#data').html('').hide();
};

//
app.updateOptionToSelectBetaFeatures = function() {
	var betaFeatureAllowed = ( app.dataFormat == 'csv' ) || ( app.dataFormat == 'tsv' ) ? true : false;
	if(betaFeatureAllowed) {
		$('.beta-features input').attr('disabled', false);
	} else {
		$('.beta-features input').prop('checked', false);
		$('.beta-features input').attr('disabled', true);
	}
};

//
app.updateBetaVars = function() {
	app.plotGraph = $('#plotLineGraph').prop('checked');
	app.simulatePendulum = $('#simulatePendulum').prop('checked');
};

//
app.saveChanges = function() {
	app.updateInterval();
	app.updateDataFormat();
	app.updateBetaVars();
	app.updateURL();
	$('#settingsModal').modal('hide');
};

//
app.keyboardShortcuts = function(e) {
	console.log(e.which);
	//only act on shortcut if settings modal is hidden
	if($('#settingsModal').attr('aria-hidden') == "true") {
		switch(e.which) {
			case 76: //'l' key
				app.oneOffLoad();
				break;
		}
	}
};

//load the data with an ajax request
app.loadData = function() {
	app.showLoadingGif();
	$.ajax({
		cache: false,
    url : app.dataURL || 'data/single_pen.csv',
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
	switch(app.dataFormat) {
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
	//add data to the global namespace so it can be accessed anywhere
	app.arr2d = arr2d;
	//plot graph or draw table if arr2d has been populated with data
	if(app.plotGraph && arr2d.length) {
		app.plotLineGraph(arr2d);
	} else if(app.simulatePendulum && arr2d.length) {
		app.simulate(arr2d);
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
	if(msg.length) {
		$('#alertText').html(msg);
	}
	$('#alertModal').modal('show');
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
app.plotLineGraph = function() {
	//show loading gif before everything is ready to display
	app.showLoadingGif();
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

	//app.arr2d[0].length gives us the number of series of data to be plot as it is
	//one less than the number of columns ie the number of 'y' columns
	var numberOfCols = app.arr2d[0].length-1;
	var numberOfRows = app.arr2d.length-1;
	for(var c=0; c < numberOfCols; c++) {
		graph.series.push({
			"name" : app.arr2d[0][c+1],
			"data" : crunchData(app.arr2d, c)
		});
	}

	//
	graph.titleText = app.dataURL;
	graph.xAxisText = app.arr2d[0][0];
	graph.yAxisText = app.arr2d[0][1];

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
                  radius: 1,
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
		app.showLoadingGif();
		var data = [];
		for(var i=0; i < numberOfRows; i++) {
			coord = [ parseFloat( arr2d[i+1][0] ), parseFloat( arr2d[i+1][c+1] ) ];
			data.push(coord);
		}
		return data;
	}
};

//
app.showLoadingGif = function() {
	$('#data').html("<img src='img/loader.gif'>");
};

//
app.simulate = function() {
	var sim = sim || {};

	sim.width = 500;
	sim.height = 400;
	sim.topMargin = sim.height/2;
	sim.p1 = [];
	sim.p2 = [];
	//pendulum properties (appearance only)
	sim.pendulumLength = 150;
	sim.massrad = 10;

	sim.dataLength = app.arr2d.length - 1;
	sim.mode = $('#simMode').val();
	sim.numberOfPendulums = $('#numberOfPendulums').val();
	sim.doublePen = true;

	$('#data').html('<canvas id="simulator" width="'+ sim.width +'" height="'+ sim.height +'"></canvas>');

	sim.canvas = document.getElementById("simulator");
  sim.ctx = sim.canvas.getContext("2d");

  sim.i = 0;
  sim.timeStep = app.arr2d[2][0]/1000;

  console.log(sim.timeStep);

  sim.interval = setInterval(function() {
		app.redrawFrame(sim, app.arr2d);
  }, sim.timeStep);
};

app.redrawFrame = function(sim) {
	//clear the canvas ready to draw
	app.clearCanvas(sim.ctx, sim.canvas);
	//draw horzontal
	sim.ctx.moveTo(0, sim.topMargin);
	sim.ctx.lineTo(sim.width, sim.topMargin);
	//draw vertical reference
	sim.ctx.moveTo(sim.width/2, 0);
	sim.ctx.lineTo(sim.width/2, sim.height);
	//draw the background in a grey
	sim.ctx.strokeStyle = "#ddd";
	sim.ctx.stroke();

	if(sim.mode == "double-pen") {
		//calculate 1st pendulum coordinates
		sim.theta = app.arr2d[sim.i][1];
		sim.p1[0] = (sim.width/2) + ( sim.pendulumLength * Math.sin(sim.theta) );
		sim.p1[1] = sim.topMargin + ( sim.pendulumLength * Math.cos(sim.theta) );
		//calculate 2nd pendulum coordinates
		sim.psi = app.arr2d[sim.i][2];
		sim.p2[0] = sim.p1[0] + ( sim.pendulumLength * Math.sin(sim.psi) );
		sim.p2[1] = sim.p1[1] + ( sim.pendulumLength * Math.cos(sim.psi) );
		//draw pendulum
		app.drawDoublePendulum(sim, c);
	}
	if(sim.mode == "single-pen") {
		for(var c=0; c < sim.numberOfPendulums; c++) {
			//calculate pendulum coordinates
			sim.theta = app.arr2d[sim.i][(2*c)+1];
			sim.p1[0] = (sim.width/2) + ( sim.pendulumLength * Math.sin(sim.theta) );
			sim.p1[1] = sim.topMargin + ( sim.pendulumLength * Math.cos(sim.theta) );
			//draw pendulum
			app.drawSinglePendulum(sim, c);
		}
	}

  //write the current simulated time to screen
  sim.ctx.font = "bold 12px sans-serif";
  sim.ctx.textAlign = "right";
	sim.ctx.textBaseline = "bottom";
	sim.ctx.fillStyle = "#000";
	sim.ctx.fillText("Simulated Time: "+ (sim.timeStep*sim.i*1000).toFixed(3) +"s", 500, (sim.height - 40));
	sim.ctx.fillText("Progress: "+ ((sim.i/sim.dataLength)*100).toFixed(0) +"%", 500, (sim.height - 20));

	//increment counter
	sim.i++;

	//check to see if complete ie run out of data
	if(sim.i > sim.dataLength) {
		clearTimeout(sim.interval);
	}
};

app.drawDoublePendulum = function(sim, index) {

	//draw 1st pendulum
	sim.ctx.moveTo(sim.width/2, sim.topMargin);
	sim.ctx.lineTo(sim.p1[0], sim.p1[1]);
	//draw 2nd pendulum
	sim.ctx.moveTo(sim.p1[0], sim.p1[1]);
	sim.ctx.lineTo(sim.p2[0], sim.p2[1]);
	sim.ctx.lineWidth = 1;
	sim.ctx.strokeStyle = '#000';
	sim.ctx.stroke();

	//draw mass at end of 1st pendulum
	sim.ctx.beginPath();
  sim.ctx.arc(sim.p1[0], sim.p1[1], sim.massrad, 0, 2 * Math.PI, false);
  sim.ctx.fillStyle = app.colors[0];
  sim.ctx.stroke();
  sim.ctx.fill();

  //draw mass at end of 2nd pendulum
	sim.ctx.beginPath();
  sim.ctx.arc(sim.p2[0], sim.p2[1], sim.massrad, 0, 2 * Math.PI, false);
  sim.ctx.fillStyle = app.colors[1];
  sim.ctx.stroke();
  sim.ctx.fill();
};

app.drawSinglePendulum = function(sim, index) {
  //draw pendulum
  sim.ctx.moveTo(sim.width/2, sim.topMargin);
  sim.ctx.lineTo(sim.p1[0], sim.p1[1]);
  sim.ctx.strokeStyle = '#000';
  sim.ctx.stroke();

  //draw mass at end of pendulum
  sim.ctx.beginPath();
  sim.ctx.arc(sim.p1[0], sim.p1[1], sim.massrad, 0, 2 * Math.PI, false);
  sim.ctx.fillStyle = app.colors[index];
  sim.ctx.fill();
  sim.ctx.lineWidth = 1;

	//draw the pendulum darker
  sim.ctx.strokeStyle = '#000';
  sim.ctx.stroke();
};

//a handy function to clear the canvas (X-browser friendly)
//http://stackoverflow.com/questions/2142535/how-to-clear-the-canvas-for-redrawing
app.clearCanvas = function(context, canvas) {
  context.clearRect(0, 0, canvas.width, canvas.height);
  var w = canvas.width;
  canvas.width = 1;
  canvas.width = w;
};

/*
* must go last
*/
$(document).ready(app.docReady);