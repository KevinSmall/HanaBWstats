var oneDay = 24*60*60*1000; 
var oneQuarter = oneDay * 14; // 91 or LIVE can be 7

function addQueryUsageJSON(svg, projection,path){
    
    // Get JSON data and add circles
	var currentDate = new Date().valueOf();
    var dateDiff = 1000 * 60 * 60 * 24 * 30; // 30 days
    var newDate = new Date(currentDate - dateDiff).toISOString();
    var minSig = 550;
  
    // HANA VERSION
    var earthQuakesJSON =  ("../services/quakeLocation.xsjs?" +
                            "&eventtype=earthquake" +
                            "&minmagnitude=" + oDropdownBoxMag.getValue() +
                            "&starttime=" + startDate.toISOString() +
                            "&endtime=" + endDate.toISOString()  ); 
                            
     jQuery.ajax({
		      url: earthQuakesJSON,
		      method: 'GET',
		      dataType: 'json',
		      async: false, // Switch of ASync for userid need it for Home page
		      success: processUsageEvents ,
		      error: function(xhr, textStatus, errorThrown) {return;} });
                    
    var quakeData = "";
	
    function processUsageEvents(collection) {	
    	
        //svg.selectAll("circle").remove(); // KMS EXPT
        svg.selectAll(".quake").remove();  // KMS EXPT
    	
        quakes = svg.selectAll(".quake")  // KMS EXPT added . here
              .data(collection.features)
              .enter()
              .append("svg:circle")
              .attr("class", "quake")
              .attr("stroke", "#aaa")
              .attr("stroke-width", 1)
              .attr("fill", function(d) {
                  //return richterColors(d.properties.mag);
                  return "#d4734f";
              })
              .attr("cx", function(d) {
                  return projection(d.geometry.coordinates)[0];
              })
              .attr("cy", function(d) {
                  return projection(d.geometry.coordinates)[1];
              })
              .attr("r", function(d) {
                  return 0;  
              })
              .attr("id", function(d) {
                  return "transitionOFF";  
              })
              .attr("recent", function(d) {
                  return 0;  
              })
		      .on("mouseover", function(d) {
		            element = d3.select(this);
		            element.attr("fill", "#46422C");
		            oQuakeView.setText("Mag: " + d.properties.mag + "\n" + 
		                               "Place: " + d.properties.place + "\n" + 
		                               "Time: " + d.properties.timestamp);
		      })
		      .on("mouseout", function() {
		            element = d3.select(this);
		            element.attr("fill", "#d4734f");
		            oQuakeView.setText("Choose Another");
              });    

    }
	return quakeData; // earthQuakesJSON;
	
}

function spin() {
    t0 = Date.now();
    d3.timer(function() {
    	  var dt = Date.now() - time;
    	  if (rotateEarth){
	    	  projection.rotate([rotate[0] + velocity[0] * dt, rotate[1] + velocity[1] * dt]);
	    	  refreshEarth();
    	  }
    	});
}

function refreshEarth() {
	
	// Refresh Time Slider Date
    var playDate = startDate.valueOf() + (otSlider.getValue() -  1) * oneDay;
    var slDate = new Date(playDate);
    var monthNames = [ "January", "February", "March", "April", "May", "June",
                       "July", "August", "September", "October", "November", "December" ];
    oLabelSlDate.setText(slDate.getFullYear() + ' ' +  monthNames[slDate.getMonth()] + ' ' +  slDate.getDate());
	
	// Refresh Globe
	svg.selectAll("path").attr("d", path);
    
	// Refresh circles
    svg.selectAll(".quake")	        // KMS EXPT
    //svg.selectAll("circle")	        // KMS EXPT
         .style("fill-opacity", 0.5 )   
		 //.style("stroke-opacity", 1) 
		 .attr({
                "cx": function(d) {
                     return projection(d.geometry.coordinates)[0];
                	},
                "cy": function(d) {
                    return projection(d.geometry.coordinates)[1];
                    },
                "r": function(d) { return (getCircleRadius(d) * getCircleTransitionValue(d)); }
              })
         .style("visibility", function(d) {
        	  if (getCircleTransitionValue(d) > 0.01) {
        	     return "visible";
        	  } else {
        		  return "hidden";
        	  }
        	  }); 
}

function getCircleTransitionValue(d) {
    // returns 0..1 which is visiblity of circle at time t according to slider position, allowing for transitions
    //
    // Slider:
    //    <----------- slider window --------->  
    // --------------------------------------------------------- TIME ->
    //    ^                     ^             ^
    //  sliderDateLessQuarter   |             |
    //                        eventTime       |          
    //                                      sliderDateCurrent
    // Transitions are applied as the eventTime nears and passes the slider "window"
    var eventTime = d.properties.time;
    var sliderDateCurrent = startDate.valueOf() + (otSlider.getValue() -  1) * oneDay;
    var sliderDateLessQuarter = sliderDateCurrent - oneQuarter;
    var transitionInterval = 4 * oneDay;
    var dist = 0; 
    var distprop = 0;
    if (eventTime <= sliderDateCurrent && eventTime >= sliderDateLessQuarter ) {
        // we're visible, how visible depends on transition
        if (eventTime > (sliderDateCurrent - transitionInterval)) {
            dist = (sliderDateCurrent - eventTime) + 1;
            distprop = dist / transitionInterval;
            return Math.pow(distprop, 2);
        } else if (eventTime < (sliderDateLessQuarter + transitionInterval)) {
            dist = (eventTime - sliderDateLessQuarter) + 1;
            distprop = dist / transitionInterval;
            return Math.pow(distprop, 2);
        } else {
            return 1;
        }
     } else {
        return 0;
     }	
}

function getCircleRadius(d) {
    // This fn returns desired normal circle radius eg perhaps some log value of the underlying data
    // No transitions are done here
    if (typeof(path(d)) !== "undefined" ) { 
            return (d.properties.mag);
	} else {
        return 0;
    }
}

function initSlider() {
	
	var startDateString = sap.ui.getCore().byId("dateStart").getYyyymmdd();
	var endDateString = sap.ui.getCore().byId("dateEnd").getYyyymmdd();
	//startDate = new Date(startDateString.substring(0,4),startDateString.substring(4,6),startDateString.substring(6,8));
	//endDate = new Date(endDateString.substring(0,4),endDateString.substring(4,6),endDateString.substring(6,8));
	//Fix potential Bug?  For Month it seems  0 is January not 1
	startDate = new Date(startDateString.substring(0,4),startDateString.substring(4,6)-1,startDateString.substring(6,8));
	endDate = new Date(endDateString.substring(0,4),endDateString.substring(4,6)-1,endDateString.substring(6,8));
	var diffDays = Math.round(Math.abs((startDate.getTime() - endDate.getTime())/(oneDay)));
	
	sap.ui.getCore().byId("tSlider").setMax(diffDays + 1);
	sap.ui.getCore().byId("tSlider").setValue(1);
}

function playTimeline() {
    
	d3.timer(function() {
		var curDay = sap.ui.getCore().byId("tSlider").getValue();
		var maxDay = sap.ui.getCore().byId("tSlider").getMax();
		if ( curDay < maxDay && playTime ) {
			sap.ui.getCore().byId("tSlider").setValue(curDay + 1);
 			otSlider.setValue(curDay + 1);
			
            var playDate = startDate.valueOf() + curDay * oneDay;
            var slDate = new Date(playDate);
            var monthNames = [ "January", "February", "March", "April", "May", "June",
                               "July", "August", "September", "October", "November", "December" ];
            oLabelSlDate.setText(slDate.getFullYear() + ' ' +  monthNames[slDate.getMonth()] + ' ' +  slDate.getDate());
			
			if (rotateEarth === false ) {
		      refreshEarth();
			}
		}		
	});
}