// Main page controls
var oPanel = new sap.ui.commons.Panel().setText('BW Query Usage');

//Global
var rotateEarth = false;
var playTime = false;
var startDate = Date.now();
var endDate = Date.now();

// Define origin and get ready to roll
var rotate = [10, -15],
    velocity = [.007, -.000],
    time = Date.now();

var projection = d3.geo.orthographic()
    .scale(248)
    .clipAngle(90);

var path = d3.geo.path()
    .projection(projection);
var svg;

//  TOP ROW
tLayout = new sap.ui.commons.layout.MatrixLayout({
    id: "matrix1",
    layoutFixed: true,
    columns: 4,
    width: '960px',
    //width : '100%',
    //widths : ['6%', '17%', '30%', '17%', '20%',  '10%'  ]	
    widths: ['6%', '17%', '60%', '17%']
});

jQuery.sap.require("sap.ui.core.IconPool");
var aNames = sap.ui.core.IconPool.getIconNames();

var bPlayIcon = new sap.ui.core.Icon({
    src: "sap-icon://play",
    size: "32px",
    color: "black", //"#333333",  
    activeColor: "white",
    activeBackgroundColor: "#333333",
    hoverColor: "#eeeeee",
    hoverBackgroundColor: "#666666",
    width: "40px",
    press: function () {
        //alert('Alert from ' + bPlayIcon.getSrc());
        if (bPlayIcon.getSrc() === "sap-icon://play") {
            bPlayIcon.setSrc("sap-icon://pause");
            playTime = true;
            playTimeline();
        } else {
            bPlayIcon.setSrc("sap-icon://play");
            playTime = false;
        }
    }
});

var oRotateEarthCB = new sap.ui.commons.CheckBox({
    tooltip: 'Auto Rotate Earth',
    checked: false,
    change: function () {
        if (oRotateEarthCB.getChecked()) {
            rotateEarth = true;
            spin();
        } else {
            rotateEarth = false;
        }
    }
});

// create a DatePicker Start
var oDatePickerStart = new sap.ui.commons.DatePicker('dateStart');
oDatePickerStart.setYyyymmdd("20140101");
oDatePickerStart.setLocale("en-UK"); // Try with "de" or "fr" instead!
oDatePickerStart.attachChange(
    function (oEvent) {
        if (oEvent.getParameter("invalidValue")) {
            oEvent.oSource.setValueState(sap.ui.core.ValueState.Error);
        } else {
            if (oDatePickerStart.getYyyymmdd() >= oDatePickerEnd.getYyyymmdd()) {
                alert('Start Date must be less than End Date');
                oEvent.oSource.setValueState(sap.ui.core.ValueState.Error);
            } else {
                oEvent.oSource.setValueState(sap.ui.core.ValueState.None);
                initSlider();
                addQueryUsageJSON(svg, projection, path);
                //oEvent.oSource.setValueState(sap.ui.core.ValueState.None);
            }
        }
    }
);
oPanel.addContent(oDatePickerStart);

// create a DatePicker End
var oDatePickerEnd = new sap.ui.commons.DatePicker('dateEnd');
oDatePickerEnd.setYyyymmdd("20131231");
oDatePickerEnd.setYyyymmdd(new Date().toISOString().slice(0, 10).replace(/-/g, "")); // Current Date
oDatePickerEnd.setLocale("en-UK"); // Try with "de" or "fr" instead!
oDatePickerEnd.attachChange(
    function (oEvent) {
        if (oEvent.getParameter("invalidValue")) {
            oEvent.oSource.setValueState(sap.ui.core.ValueState.Error);
        } else {
            if (oDatePickerStart.getYyyymmdd() >= oDatePickerEnd.getYyyymmdd()) {
                alert('Start Date must be less than End Date');
                oEvent.oSource.setValueState(sap.ui.core.ValueState.Error);
            } else {
                oEvent.oSource.setValueState(sap.ui.core.ValueState.None);
                initSlider();
                addQueryUsageJSON(svg, projection, path);
            }
        }
    }
);

// Time Slider
var otSlider = new sap.ui.commons.Slider({
    id: 'tSlider',
    tooltip: 'tSlider',
    //width: '80%',
    min: 1,
    max: 100,
    smallStepWidth: 1,
    //totalUnits: 10
    //change : function(){refreshEarth();}
    liveChange: function () {
        refreshEarth();
    }
});

initSlider();

//oPanel.addContent(otSlider);	

var oListBoxMag = new sap.ui.commons.ListBox("Magnitude", {
    items: [
                        new sap.ui.core.ListItem("mag9", {
            text: "9.0",
            additionalText: "Mag. >= 9.0"
        }),
                        new sap.ui.core.ListItem("mag8", {
            text: "8.0",
            additionalText: "Mag. >= 8.0"
        }),
                        new sap.ui.core.ListItem("mag7", {
            text: "7.0",
            additionalText: "Mag. >= 7.0"
        }),
                        new sap.ui.core.ListItem("mag6", {
            text: "6.0",
            additionalText: "Mag. >= 6.0"
        }),
                        new sap.ui.core.ListItem("mag5", {
            text: "5.0",
            additionalText: "Mag. >= 5.0"
        }),
                        new sap.ui.core.ListItem("mag4", {
            text: "4.0",
            additionalText: "Mag. >= 4.0"
        }),
                        new sap.ui.core.ListItem("mag3", {
            text: "3.0",
            additionalText: "Mag. >= 3.0"
        })]
});
var oDropdownBoxMag = new sap.ui.commons.DropdownBox("DropdownBoxMag", {
    tooltip: "City",
    displaySecondaryValues: true,
    "association:listBox": oListBoxMag,
    value: "6.0"
});
oDropdownBoxMag.attachChange(function () {
    addQueryUsageJSON(svg, projection, path);
});

var orSlider = new sap.ui.commons.Slider({
    id: 'rSlider',
    tooltip: 'Radius of Quakes',
    height: '150px',
    min: 1,
    max: 100,
    value: 5,
    //totalUnits: 5,
    //smallStepWidth: 5,
    stepLabels: true,
    vertical: true,
    liveChange: function () {
        refreshEarth();
    }
});


var oQuakeView = new sap.ui.commons.TextView({
    //id : 'qView',
    text: 'Move cursor over a Quake to find out more details',
    tooltip: 'Move cursor over a Quake to find out more details',
    wrapping: true,
    width: '185px',
    //semanticColor: sap.ui.commons.TextViewColor.Positive,
    design: sap.ui.commons.TextViewDesign.H4
});

var oLabelBlank = new sap.ui.commons.Label("lblBlank").setText("");;
var oLabelStart = new sap.ui.commons.Label("lblStart").setText("Start Date").setDesign(sap.ui.commons.LabelDesign.Bold);
var oLabelSlDate = new sap.ui.commons.Label("lblSlDate").setText("2014 January 1");
//oLabelSlDate.setTextAlign(sap.ui.commons.layout.HAlign.Center);
var oCellSlDate = new sap.ui.commons.layout.MatrixLayoutCell({
    hAlign: sap.ui.commons.layout.HAlign.Center
});
oCellSlDate.addContent(oLabelSlDate)
var oLabelEnd = new sap.ui.commons.Label("lblEnd").setText("End Date").setDesign(sap.ui.commons.LabelDesign.Bold);
var oLabelLbM = new sap.ui.commons.Label("lblLbM").setText("Min Magnitude:").setDesign(sap.ui.commons.LabelDesign.Bold);
var oLabelRcb = new sap.ui.commons.Label("lblRcb").setText("Auto Rotation:").setDesign(sap.ui.commons.LabelDesign.Bold);
var oLabelRsl = new sap.ui.commons.Label("lblRsl").setText("Radius Size:").setDesign(sap.ui.commons.LabelDesign.Bold);
var oLabelQuake = new sap.ui.commons.Label("lblQuake").setText("Quake:").setDesign(sap.ui.commons.LabelDesign.Bold);
//tLayout.createRow(oLabelBlank,oLabelStart,oLabelBlank,oLabelEnd,oLabelLbM, oLabelRcb);
tLayout.createRow(oLabelBlank, oLabelStart, oCellSlDate, oLabelEnd);

var oCellPB = new sap.ui.commons.layout.MatrixLayoutCell({
    hAlign: sap.ui.commons.layout.HAlign.Center
});
oCellPB.addContent(bPlayIcon);
var oCellSl = new sap.ui.commons.layout.MatrixLayoutCell({
    hAlign: sap.ui.commons.layout.HAlign.Center
});
oCellSl.addContent(otSlider);
//tLayout.createRow(oCellPB,oDatePickerStart,oCellSl,oDatePickerEnd, oDropdownBoxMag,oRotateEarthCB);
tLayout.createRow(oCellPB, oDatePickerStart, oCellSl, oDatePickerEnd);
oPanel.addContent(tLayout);

var html1 = new sap.ui.core.HTML("html1", {
    // the static content as a long string literal
    content: "<div class='WorldChart'>" +
        "</div>",
    preferDOM: false,

    // use the afterRendering event for 2 purposes
    afterRendering: function (e) {

        // WORLD CHART
        var width = 960,
            height = 580;
        var loader = d3.dispatch("world"),
            id = -1;
        var color = d3.scale.category10();
        var graticule = d3.geo.graticule();
        svg = d3.select(".WorldChart").append("svg")
            .attr("width", width)
            .attr("height", height);

        loader.on("world.svg", function () {
            svg.selectAll("path").attr("d", path);
        });

        d3.json("resources/world-110m.json", function (error, world) {
            var countries = topojson.feature(world, world.objects.countries).features,
                neighbors = topojson.neighbors(world.objects.countries.geometries);


            var ocean_fill = svg.append("defs").append("radialGradient")
                .attr("id", "ocean_fill")
                .attr("cx", "75%")
                .attr("cy", "25%");
            ocean_fill.append("stop").attr("offset", "5%").attr("stop-color", "#ddf");
            ocean_fill.append("stop").attr("offset", "100%").attr("stop-color", "#9ab");

            var globe_highlight = svg.append("defs").append("radialGradient")
                .attr("id", "globe_highlight")
                .attr("cx", "75%")
                .attr("cy", "25%");
            globe_highlight.append("stop")
                .attr("offset", "5%").attr("stop-color", "#ffd")
                .attr("stop-opacity", "0.6");
            globe_highlight.append("stop")
                .attr("offset", "100%").attr("stop-color", "#ba9")
                .attr("stop-opacity", "0.2");

            var globe_shading = svg.append("defs").append("radialGradient")
                .attr("id", "globe_shading")
                .attr("cx", "50%")
                .attr("cy", "40%");
            globe_shading.append("stop")
                .attr("offset", "50%").attr("stop-color", "#9ab")
                .attr("stop-opacity", "0")
            globe_shading.append("stop")
                .attr("offset", "100%").attr("stop-color", "#3e6184")
                .attr("stop-opacity", "0.3")

            var drop_shadow = svg.append("defs").append("radialGradient")
                .attr("id", "drop_shadow")
                .attr("cx", "50%")
                .attr("cy", "50%");
            drop_shadow.append("stop")
                .attr("offset", "20%").attr("stop-color", "#000")
                .attr("stop-opacity", ".5")
            drop_shadow.append("stop")
                .attr("offset", "100%").attr("stop-color", "#000")
                .attr("stop-opacity", "0")

            svg.append("ellipse")
                .attr("cx", 440).attr("cy", 450)
                .attr("rx", projection.scale() * .90)
                .attr("ry", projection.scale() * .25)
                .attr("class", "noclicks") //noclicks
            .style("fill", "url(#drop_shadow)");

            var correctOffsetY = -40;

            svg.append("circle")
                .attr("cx", width / 2).attr("cy", (height / 2) + correctOffsetY)
                .attr("r", projection.scale())
                .attr("class", "noclicks") //noclicks
            .style("fill", "url(#ocean_fill)");

            // this is land, unshaded
            svg.append("path")
            //.datum(topojson.object(world, world.objects.land))
            .datum(topojson.feature(world, world.objects.land))
                .attr("class", "land")
                .attr("d", path);

            // this is graticule
            svg.append("path")
                .datum(graticule)
                .attr("class", "graticule noclicks") //space noclicks
            .attr("d", path);

            // this is land shading
            svg.append("circle")
                .attr("cx", width / 2).attr("cy", (height / 2) + correctOffsetY)
                .attr("r", projection.scale())
                .attr("class", "noclicks") //noclicks
            .style("fill", "url(#globe_highlight)");

            svg.append("circle")
                .attr("cx", width / 2).attr("cy", (height / 2) + correctOffsetY)
                .attr("r", projection.scale())
                .attr("class", "noclicks") //noclicks
            .style("fill", "url(#globe_shading)");

            addQueryUsageJSON(svg, projection, path);
            loader.world();
        });

        d3.select(self.frameElement).style("height", height + "px");
    }
});

tLayoutMap = new sap.ui.commons.layout.MatrixLayout({
    id: "matrixMap",
    layoutFixed: true,
    columns: 3,
    width: '960px',
    //width : '100%',
    widths: ['20%', '80%']
});

// Left Hand Controls
oLayoutControls = new sap.ui.layout.VerticalLayout("LayoutControls", {
    content: [
                new sap.ui.commons.HorizontalDivider(),
                oLabelRcb, oRotateEarthCB,
                new sap.ui.commons.HorizontalDivider(),
                oLabelRsl, orSlider,
  ]
});

oControlsCell = new sap.ui.commons.layout.MatrixLayoutCell({
    vAlign: sap.ui.commons.layout.VAlign.Top
});
oControlsCell.addContent(oLayoutControls);
tLayoutMap.createRow(oControlsCell, html1);
oPanel.addContent(tLayoutMap);
oPanel.placeAt('content');