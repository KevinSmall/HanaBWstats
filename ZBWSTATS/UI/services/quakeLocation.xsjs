function log10(val) {
  return Math.log(val) / Math.LN10;
}

function getQuakeLocations() {
	
	function getJsDate( timeString ) {
		
		// reference
		// http://speeves.erikin.com/2010/08/javascript-parse-ms-sql-timestamp-for.html
		
        // split the HANA timestamp, and return date in javascript
		//but not required
		// e.g. 2014-02-24 23:26:55.2500000
        var arrDateTime = timeString.split( ' ' );
        var arrDate = arrDateTime[0].split( '-', 3 );
        var arrTime = arrDateTime[1].split( ':', 3);

        var timeObject = new Object;
        timeObject.year = arrDate[0];
        timeObject.month = arrDate[1];
        timeObject.day = arrDate[2];
        timeObject.hour = arrTime[0];
        timeObject.minute = arrTime[1];
        timeObject.second = arrTime[2];
        
        var jsDate = new Date(timeObject.year, timeObject.month, timeObject.day, timeObject.hour, timeObject.minute, timeObject.second);
        return jsDate;
    }
	
	/*
	function createShapeEntry(rs) {
		
		var geometry = JSON.parse(rs.getNString(5)); // GeoJson is Object
		
		//D3 currently appears to need anti clockwise winding of Shapes
		//https://github.com/mbostock/d3/issues/1232
		//geometry.coordinates[0] = geometry.coordinates[0].reverse(); 
		var dat = new Date(rs.getTimestamp(4)).valueOf();
		return {
			"type":"Feature","properties": { "mag" : rs.getFloat(2),
											 "place" : rs.getNString(3),
											 //"timex" : new Date(rs.getTimestamp(4)),
											 //"timey" : rs.getTimestamp(4),
											 //"timez" : new Date(rs.getTimestamp(4)).toISOString(),
											 //"timez2" : getJsDate( rs.getNString(4) ),
											 //"timez3" : new Date(rs.getTimestamp(4)).UTC(),
				                             "timestamp" : null, //rs.getTimestamp(4), 
				                             "time" : 1 //dat.getTime()
				                             },
			"geometry": geometry, 
			"id" : rs.getNString(1)
		};
	}
	*/
	
	function createShapeEntry2(rs) {
		
		var geometry = JSON.parse(rs.getNString(4)); // GeoJson is Object
		$.trace.debug(geometry);
		
		//D3 currently appears to need anti clockwise winding of Shapes
		//https://github.com/mbostock/d3/issues/1232
		//geometry.coordinates[0] = geometry.coordinates[0].reverse(); 
		
		// 1 SELECT \"TCTUSERNM\",
		// 2 \"CALDAY\",
		// 3\"SESSIONCOUNT\",
		// 4 \"LATLON\".ST_AsGeoJSON()';

		var mag = rs.getInteger(3);
		mag = log10(mag) * 10;
		
		return {
			
			"type":"Feature","properties": { "mag" : mag,
											 "place" : rs.getNString(1), // username
											 //"timex" : new Date(rs.getTimestamp(4)),
											 //"timey" : rs.getTimestamp(4),
											 //"timez" : new Date(rs.getTimestamp(4)).toISOString(),
											 //"timez2" : getJsDate( rs.getNString(4) ),
											 //"timez3" : new Date(rs.getTimestamp(4)).UTC(),
				                             "timestamp" : null, //rs.getTimestamp(4),
				                             "time" : rs.getDate(2).getTime()
				                             },
			"geometry": geometry, 
			"id" : null //rs.getNString(1)
		};
		
		// does it matter if these not filled:
		// id
		// timestamp
		// time
	}
	
	//console.log("TEST"); //depth: %i, object: %O", depth, o, " has key:" + key);
	
	
	var body = '';
	var list = [];
	
	
	var iMinMagnitude = $.request.parameters.get('minmagnitude');
	
	var iStartTime    = $.request.parameters.get("starttime");

	var iEndTime      = $.request.parameters.get("endtime");
    
	//var tempobj = {"st": iStartTime , "et" : iEndTime};
	//list.push( tempobj );
	
	try {
		//var query = 'select Q.id, Q.mag, Q.place, Q.time, QG.location.ST_AsGeoJSON() as "GeoJSON"  from HADOOP.QUAKES as Q  left outer join HADOOP.QUAKES_GEO as QG ON Q.id = QG.id where QG.id is not null'; 
		//query = query + ' and Q.mag >= ' + iMinMagnitude;
		//query = query + ' and Q.time >= \'' + iStartTime + '\'';
		//query = query + ' and Q.time <= \'' + iEndTime + '\'';
		
		
			var select = 'SELECT \"TCTUSERNM\", \"CALDAY\", \"SESSIONCOUNT\", \"LATLON\".ST_AsGeoJSON()';

			var from = ' FROM \"_SYS_BIC\".\"ZBWSTATS.Models/CV_LE_STATS_PT"';
			var where = '';//' WHERE \"SCHEMA_NAME\" = ? AND \"TABLE_NAME\" = ?';
			var orderby = '';//' ORDER BY \"COLUMN_NAME\"';
			var query = select + from + where + orderby;
			$.trace.debug(query);
			$.trace.debug("query written");
			//$.response.setBody('Gote Here ' + query );
		//return;
		
		//$.trace.debug(query);
		var conn = $.db.getConnection();
		var pstmt = conn.prepareStatement(query);
		var rs = pstmt.executeQuery();

		$.trace.debug("ready to loop through rs");
		
		while (rs.next()) {
			//$.trace.debug(rs);
			
			var shapeEntry = createShapeEntry2(rs);
			list.push(shapeEntry);
			
			//$.trace.debug(shapeEntry.type.properties.mag, shapeEntry.type.properties.place, shapeEntry.geometry, shapeEntry.id);
		
		}

		rs.close();
		pstmt.close();
		$.trace.debug("rs loop finished");
		
		
	} catch (e) {
		$.response.status = $.net.http.INTERNAL_SERVER_ERROR;
		$.response.setBody(e.message);
		$.trace.debug(e.message);
		return;
	}

	body = JSON.stringify({
		"type":"FeatureCollection",
		"features": list
	});

	$.response.contentType = 'application/json; charset=UTF-8';
	$.response.setBody(body);
	$.response.status = $.net.http.OK;
}

var aCmd = $.request.parameters.get('cmd');
switch (aCmd) {
default:
	getQuakeLocations();
}
