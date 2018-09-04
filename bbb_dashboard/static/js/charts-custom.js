
	function updateMetaData(data) {
		var PANEL = document.getElementById("sample-metadata");
		PANEL.innerHTML = '';
		for(var key in data) {
			h6tag = document.createElement("h6");
			h6Text = document.createTextNode(`${key}: ${data[key]}`);
			h6tag.append(h6Text);
			PANEL.appendChild(h6tag);
		}
	}

	function buildCharts(sampleData, otuData) {
		var labels = sampleData[0]['otu_ids'].map(function(item) {
			return otuData[item]
		});
		var bubbleLayout = {
			margin: { t: 30 },
			title: '<b>OTU IDs vs. Sample Data</b>',			
			hovermode: 'closest',
			xaxis: { title: 'OTU ID' }
		};
		var bubbleData = [{
			x: sampleData[0]['otu_ids'],
			y: sampleData[0]['sample_values'],
			text: labels,
			mode: 'markers',
			marker: {
				size: sampleData[0]['sample_values'],
				color: sampleData[0]['otu_ids'],
				colorscale: "Earth",
			}
		}];
		var BUBBLE = document.getElementById('bubble');
		Plotly.plot(BUBBLE, bubbleData, bubbleLayout, {displayModeBar: false});
		var pieData = [{
			values: sampleData[0]['sample_values'].slice(0, 10),
			labels: sampleData[0]['otu_ids'].slice(0, 10),
			hovertext: labels.slice(0, 10),
			hoverinfo: 'hovertext',
			type: 'pie'
		}];
		var pieLayout = {
			margin: { t: 30, l: 0 },
			title: '<b>Top Ten OTUs</b>',
		};
		var PIE = document.getElementById('pie');
		Plotly.plot(PIE, pieData, pieLayout,{displayModeBar: false});
	}
	
	function updateCharts(sampleData, otuData) {
		var sampleValues = sampleData[0]['sample_values'];
		var otuIDs = sampleData[0]['otu_ids'];

		var labels = otuIDs.map(function(item) {
			return otuData[item]
		});

		var BUBBLE = document.getElementById('bubble');
		Plotly.restyle(BUBBLE, 'x', [otuIDs]);
		Plotly.restyle(BUBBLE, 'y', [sampleValues]);
		Plotly.restyle(BUBBLE, 'text', [labels]);
		Plotly.restyle(BUBBLE, 'marker.size', [sampleValues]);
		Plotly.restyle(BUBBLE, 'marker.color', [otuIDs]);

		var PIE = document.getElementById('pie');
		var pieUpdate = {
			values: [sampleValues.slice(0, 10)],
			labels: [otuIDs.slice(0, 10)],
			hovertext: [labels.slice(0, 10)],
			hoverinfo: 'hovertext',
			type: 'pie'
		};
		Plotly.restyle(PIE, pieUpdate);
		
		
	}

	function getData(sample, callback) {
		Plotly.d3.json(`/samples/${sample}`, function(error, sampleData) {
			if (error) return console.warn(error);
			Plotly.d3.json('/otu', function(error, otuData) {
				if (error) return console.warn(error);
				callback(sampleData, otuData);
			});
		});
		Plotly.d3.json(`/metadata/${sample}`, function(error, metaData) {
			if (error) return console.warn(error);
			updateMetaData(metaData);
		})
		Plotly.d3.json(`/wfreq/${sample}`, function(error, wfreq) {
			if (error) return console.warn(error);
			buildGauge(wfreq[0]);
		})	
	}
	
	function getOptions() {
		var selector = document.getElementById('selDataset');
		Plotly.d3.json('/names', function(error, sampleNames) {
			for (var i = 0; i < sampleNames.length;  i++) {
				var currentOption = document.createElement('option');
				currentOption.text = sampleNames[i];
				currentOption.value = sampleNames[i]
				selector.appendChild(currentOption);
			}
			getData(sampleNames[0], buildCharts);
		})
	}
	
	function optionChanged(newSample) {
		getData(newSample, updateCharts);
	}
	
	function init() {
		getOptions();
	}

	init();
	
	function buildGauge(freq) {		
		// Enter the washing frequency between 0 and 180
		var level = freq*20;

		// Trig to calc meter point
		var degrees = 180 - level,
			radius = .5;
		var radians = degrees * Math.PI / 180;
		var x = radius * Math.cos(radians);
		var y = radius * Math.sin(radians);

		// Path: may have to change to create a better triangle
		var mainPath = 'M -.0 -0.025 L .0 0.025 L ',
			pathX = String(x),
			space = ' ',
			pathY = String(y),
			pathEnd = ' Z';
		var path = mainPath.concat(pathX,space,pathY,pathEnd);			

		var data = [{ type: 'scatter',
		x: [0], y:[0],
			marker: {size: 12, color:'850000'},
			showlegend: false,
			name: 'Freq',
			text: level,
			hoverinfo: 'text+name'},
		{ values: [50/9, 50/9, 50/9, 50/9, 50/9, 50/9, 50/9, 50/9, 50/9, 50],
		rotation: 90,
		text: ['8-9', '7-8', '6-7', '5-6', '4-5', '3-4', '2-3', '1-2', '0-1', ''],
		textinfo: 'text',
		textposition:'inside',
		marker: {
			colors:[
				'rgba(0, 105, 11, .5)', 'rgba(10, 120, 22, .5)',
				'rgba(14, 127, 0, .5)', 'rgba(110, 154, 22, .5)',
				'rgba(170, 202, 42, .5)', 'rgba(202, 209, 95, .5)',
				'rgba(210, 206, 145, .5)', 'rgba(232, 226, 202, .5)',
				'rgba(240, 230, 215, .5)', 'rgba(255, 255, 255, 0)']},
		labels: ['8-9', '7-8', '6-7', '5-6', '4-5', '3-4', '2-3', '1-2', '0-1', ''],
		hoverinfo: 'label',
		hole: .5,
		type: 'pie',
		showlegend: false
		}];

		var layout = {
		shapes:[{
			type: 'path',
			path: path,
			fillcolor: '850000',
			line: {
				color: '850000'
			}
			}],
		title: '<b>Washing Frequency - Scrubs Per Week</b>',
		autosize: true,
	    margin: {
			l: 50,
			r: 10,
			b: 0,
			t: 30,
			pad: 4
		  },
		xaxis: {zeroline:false, showticklabels:false,
					showgrid: false, range: [-1, 1]},
		yaxis: {zeroline:false, showticklabels:false,
					showgrid: false, range: [-1, 1]}
		};

		var GAUGE = document.getElementById('gauge');
		Plotly.newPlot(GAUGE, data, layout, {displayModeBar: false});
	}

