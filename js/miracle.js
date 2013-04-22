  var velocity = [.008, -.002],
    t0 = Date.now(),
    projection,
    cities,
    svg,
    path,
    φ,
    λ,
    down,
    scale,
    scales,  
    stepInterval = null;
  
  function init() { 
    var width = $(window).width(),
      height = $(window).height();
   
   scales = {
     0: 0,
     1: 0,
     2: 0,
     3: 0,
     4: 0,
     5: 0
   }
   scale = d3.scale.linear()
    .domain([1,15])
    .range([1, 40]);
   
   projection = d3.geo.mercator()
    .rotate([90, 1])
    .center([-133,37 ])
    .scale(4000);
    
    path = d3.geo.path()
      .projection(projection);
    
    svg = d3.select("#map").append("svg")
      .attr("width", width)
      .attr("height", height)
      .call(d3.behavior.zoom()
        .translate(projection.translate())
        .scale(projection.scale())
        .on("zoom", redraw));
      
    // mousewheel scroll ZOOM!
    $('#map').mousewheel(function (event, delta, deltaX, deltaY) {
      var s = projection.scale();
      if (delta > 0) {
        projection.scale(s * 1.1);
      }
      else {
        projection.scale(s * 0.9);
      }
      d3.selectAll('.locations')
        .attr("transform", function(d) { return "translate(" + projection([d.geometry.coordinates[0],d.geometry.coordinates[1]]) + ")";});
          
      svg.selectAll("path").attr("d", path);
    });
    
    addJapan();
  }
  
  /*
   * Add countries and state boundaries
   * TODO: add counties? 
   * 
  function addCountries() {
    d3.json("world-110m.json", function(error, world) {
      svg.append("path")
        .datum(topojson.object(world, world.objects.land))
        .attr("class", "land")
        .attr("d", path);
      addJapan();
    });
  }
  */
  function addJapan() {
    d3.json("data/japan.json", function(data) {
      svg.selectAll("path").data(data.features)
      .enter().append("path")
      .attr("d", path)
      .style("fill", function() { return "#777" });
      //.style("fill", function() { return "#44aaee" });
      //.on("mouseover", function(e){d3.select(this).style("fill", "#5522aa")})
      //.on("mouseout", function(e){d3.select(this).style("fill", "#44aaee")});
      
      getLocations();
    });
  }
  
  function redraw() {
    if (d3.event) {
      projection
          .translate(d3.event.translate)
          .scale(d3.event.scale);
    }
    
    var t = projection.translate();
    
    d3.selectAll('.locations')
      .attr("transform", function(d) { return "translate(" + projection([d.geometry.coordinates[0],d.geometry.coordinates[1]]) + ")";});
    d3.selectAll('.scales')
      .attr("transform", function(d) { return "translate(" + projection([d.endLon,d.endLat]) + ")";});
    d3.selectAll('.lines')
      .attr("x1", function(d) {return projection([d.startLon,d.startLat])[0] })
      .attr("y1", function(d) {return projection([d.startLon,d.startLat])[1] })
      .attr("x2", function(d) {return projection([d.endLon,d.endLat])[0] })
      .attr("y2", function(d) {return projection([d.endLon,d.endLat])[1] });
        
    svg.selectAll("path").attr("d", path);
  }
  
  /*
   * Add tornado STARTS to map
   * 
   */
  function getLocations() {
    var group = svg.append('g');
    
    $.ajax({
      dataType: "json",
      url: "data/locations.json",
      success: function(collection) {
        var data = collection.features;
        
        svg.append("g")
          .attr("class", "circles")
        .selectAll("circle")
          .data( data )
        .enter().append("circle")
          .attr('class', 'locations')
          .attr("transform", function(d) {console.log(d.geometry.coordinates); return "translate(" + projection([d.geometry.coordinates[0],d.geometry.coordinates[1]]) + ")";})
          .attr("fill", styler)
          .attr('r', 5)
          .on('mouseover', function( d ) {
            d3.select(this)
              .transition()
                .duration(300)
                .attr('r', 12)
                .attr('d', hover);
          })
          .on("mouseout", function( d ) {
            d3.select(this)
              .transition()
                .duration(300)
                .attr('r', 5)
                .attr('d', exit);
          });
      }
    });
  }
  
  /*
   * 
   * Interactions - on hover / on exit
   * 
   */
  function hover( d ) {
    $('#intro').hide();
    $('#info-window-inner').html("");
    
    var group = d.properties.info.group;
    var lat = d.geometry.coordinates[1];
    var lon = d.geometry.coordinates[0];
    var story = ( d.properties.info.story ) ? d.properties.info.story : "";
    var images = d.properties.images;
    
    $('#info-window-inner').html( "<div class='info-window-story'>" + story + "</div>" );
    
    if ( images.length ) {
      for (i in images) {
        var img = "<img src='"+images[ i ].url+"' style='width:390px;'></img>";
        $('#info-window-inner').append(img);
      }
    }
    
    //lines
    var locs = [];
    d3.selectAll('.locations')
      .attr("attr", function(d) { 
        if (d.properties.info.group == group) locs.push( {lat : d.geometry.coordinates[1], lon: d.geometry.coordinates[0] }) 
      });
    
    for (var i=0;i<locs.length;i++) {
      if ( locs[ i ].lat !== lat ) {
        var lat1 = locs[ i ].lat;
        var lon1 = locs[ i ].lon;
      
        var lines = svg.append('g');
          
        lines.selectAll("line")
          .data([d])
        .enter().append('line')
          .style("stroke", styler)
          .attr('class', 'lines')
          .attr("x1", projection([lon,lat])[0])
          .attr("y1", projection([lon,lat])[1])
          .attr("x2", projection([lon,lat])[0])
          .attr("y2", projection([lon,lat])[1])
          .transition()
            .duration(900)
            .attr("x2", projection([lon1,lat1])[0])
            .attr("y2", projection([lon1,lat1])[1]);
       }
    }  
  }
  
  function exit() {
    d3.selectAll(".lines").remove(); 
        
    svg.selectAll("path").attr("d", path);
  };
  
  /*
   * 
   * Styler 
   * 
   */
  function styler( data ) {
    var group = data.properties.info.group;
    //var colors = [ "rgb(253,219,199)", "rgb(247,247,247)", "rgb(209,229,240)", "rgb(146,197,222)", "rgb(67,147,195)", "rgb(33,102,172)", "rgb(5,48,97)"]
    var colors = ["rgb(215,48,39)", "rgb(244,109,67)", "rgb(253,174,97)", "rgb(254,224,144)", "rgb(255,255,191)", "rgb(224,243,248)", "rgb(171,217,233)", "rgb(116,173,209)", "rgb(69,117,180)"] 
    var color;
    
    switch ( true ) {
      case ( group == "branches" ) :
        color = colors[0];
        break;
      case ( group == "cloning" ) :
        color = colors[1];
        break;
      case ( group == "coins" ) :
        color = colors[2];
        break;
      case ( group == "trunks" ) :
        color = colors[3];
        break;
      case ( group == "cutting" ) :
        color = colors[4];
        break;
    }
    return color;
  }
  
  function createLegend() {
    /*
    var colors = [ "rgb(253,219,199)", "rgb(247,247,247)", "rgb(209,229,240)", "rgb(146,197,222)", "rgb(67,147,195)", "rgb(33,102,172)", "rgb(5,48,97)"]
    colors = colors.reverse();
    
    $.each(colors, function(i, color) {
      var div = '<div class="color" style="background:'+color+'"></div>';
      $('#legend').append(div);
    });
    */
  }