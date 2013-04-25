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
    .center([-132,37 ])
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
      
      d3.selectAll('.tree-icon')
        .attr("transform", function(d) { 
            if (d.geometry.coordinates[ 0 ] === 141.625499) {
              return "translate(" + projection([d.geometry.coordinates[0],d.geometry.coordinates[1]]) + ")";
            }
          })
          
      svg.selectAll("path").attr("d", path);
    });
    
    addJapan();
  }
  
  
  function addJapan() {
    d3.json("data/japan.json", function(data) {
      svg.selectAll("path").data(data.features)
      .enter().append("path")
      .attr("d", path)
      .style("fill", function() { return "#333" });
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
    d3.selectAll('.tree-icon')
        .attr("transform", function(d) { 
            if (d.geometry.coordinates[ 0 ] === 141.625499) {
              return "translate(" + projection([d.geometry.coordinates[0],d.geometry.coordinates[1]]) + ")";
            }
        });
          
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
          .attr("class", "icon")
        .selectAll('image')
          .data( data )
        .enter().append('svg:image')
          .attr("class", "tree-icon")  
          .attr("xlink:href", "img/miracle-tree.png")
          .attr("transform", function(d) { 
            if (d.geometry.coordinates[ 0 ] === 141.625499) {
              return "translate(" + projection([d.geometry.coordinates[0],d.geometry.coordinates[1]]) + ")";
            }
          })
          .attr('x', '-35px')
          .attr('y', '-60px')
          .attr("width", "70px")
          .attr("height", "60px")
          .on('mouseover', function( d ) {
            d3.select(this)
              .transition()
                .duration(300)
                .attr('r', 12)
                .attr('d', hoverTree);
          })
          .on("mouseout", function( d ) {
            d3.select(this)
              .transition()
                .duration(300)
                .attr('r', 5)
                .attr('d', exit);
          });
        
        svg.append("g")
          .attr("class", "circles")
        .selectAll("circle")
          .data( data )
        .enter().append("circle")
          .attr('class', 'locations')
          .attr("transform", function(d) { return "translate(" + projection([d.geometry.coordinates[0],d.geometry.coordinates[1]]) + ")";})
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
    var location = d.properties.info.location;
    var lat = d.geometry.coordinates[1];
    var lon = d.geometry.coordinates[0];
    var story = ( d.properties.info.story ) ? d.properties.info.story : "";
    var images = d.properties.images;
    
    $('#info-window-inner').html( "<div class='info-window-group'>" + group + "</div><div class='info-window-location'>" + location + "</div><div class='info-window-about'>"+ story +"</div>" );
    
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
    
    for (var i=0;i<=locs.length;i++) {
      
      if ( i !== locs.length ) {
        var lat1 = locs[ i ].lat;
        var lon1 = locs[ i ].lon;
      } else {
        var lat1 = 39.003225;
        var lon1 = 141.625499;
      }
      
      var  lines = svg.append('g'),
        start;
      
      if ( i === 0 ) {
        start = [ 141.625499,39.003225 ];
      } else {
        start = [ locs[ i - 1 ].lon, locs[ i - 1].lat ]; 
      }
        
      lines.selectAll("line")
        .data([ d ])
      .enter().append('line')
        .style("stroke", styler)
        .attr('class', 'lines')
        .attr("x1", projection( start )[ 0 ])
        .attr("y1", projection( start )[ 1 ])
        .attr("x2", projection( start )[ 0 ])
        .attr("y2", projection( start )[ 1 ])
        .transition()
          .duration(700)
          .attr("x2", projection([lon1,lat1])[0])
          .attr("y2", projection([lon1,lat1])[1]);
       }
    //}  
  }
  
  /*
   * Hover over tree - draw all lines
   * 
   */
  function hoverTree ( d ) {
    $('#intro').hide();
    $('#info-window-inner').html("");
    
    var location = d.properties.info.location;
    var lat = d.geometry.coordinates[1];
    var lon = d.geometry.coordinates[0];
    
    //lines
    var locs = [];
    d3.selectAll('.locations')
      .attr("attr", function(d) { 
        locs.push( {lat : d.geometry.coordinates[1], lon: d.geometry.coordinates[0] }) 
      });
    
    for (var i=0;i<locs.length;i++) {
      var lat1 = locs[ i ].lat;
      var lon1 = locs[ i ].lon;
      var  lines = svg.append('g'),
        start;
      
      if ( i === 0 ) {
        start = [ 141.625499,39.003225 ];
      } else {
        start = [ locs[ i - 1 ].lon, locs[ i - 1].lat ]; 
      }
        
      lines.selectAll("line")
        .data([ d ])
      .enter().append('line')
        .style("stroke", "#FEFEFE")
        .attr('class', 'lines')
        .attr("x1", projection( start )[ 0 ])
        .attr("y1", projection( start )[ 1 ])
        .attr("x2", projection( start )[ 0 ])
        .attr("y2", projection( start )[ 1 ])
        .transition()
          .duration(700)
          .attr("x2", projection([lon1,lat1])[0])
          .attr("y2", projection([lon1,lat1])[1]);
       }
    //}  
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
    //var colors = ["rgb(247,251,255)", "rgb(222,235,247)", "rgb(198,219,239)", "rgb(158,202,225)", "rgb(107,174,214)", 
    var colors = [
      "#0066FF", "#00CCFF", "#33FFFF", "#99FFFF", "#99FFCC", "#66CCCC","#33FFCC", "#00FFCC", "#0066CC",
      "#00CC99", "#99FF99", "#00CC66", "#CCC","#3300FF"
    ] 
    var color;
    
    switch ( true ) {
      case ( group == "Miracle Tree Stamps" ) :
        color = colors[0];
        break;
      case ( group == "Miracle Tree Cloning" ) :
        color = colors[1];
        break;
      case ( group == "Miracle Tree Coins" ) :
        color = colors[2];
        break;
      case ( group == "Miracle Tree Trunks" ) :
        color = colors[3];
        break;
      case ( group == "Miracle Tree Cutting" ) :
        color = colors[4];
        console.log('color?')
        break;
      case ( group == "Miracle Tree Shipping" ) :
        color = colors[5];
        break;
      case ( group == "Tohoku University" ) :
        color = colors[6];
        break;
      case ( group == "Preservation Team" ) :
        color = colors[7];
        break;
      case ( group == "Miracle Tree Planning" ) :
        color = colors[8];
        break;
      case ( group == "Miracle Tree Uprooted" ) :
        color = colors[9];
        break;
      case ( group == "Miracle Tree Branches" ) :
        color = colors[10];
        break;
      case ( group == "Miracle Tree Rings" ) :
        color = colors[11];
        break;
      case ( group == "Miracle Tree Reconstruction" ) :
        color = colors[12];
        break;
      case ( group == "Miracle Tree Recycling" ) :
        color = colors[13];
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