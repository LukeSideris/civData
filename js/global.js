document.addEventListener('touchmove', function (e) { e.preventDefault(); }, false);

(function($){ 
	$(function(){
		
	var animSpeed 		= 1240,
		leaderData,
		leaderRef,
		scrollHandler,
		civCount = 0,
		showingModal = false,
		traitCount = 0,
		$doc = $(document),
		$leftHeader = $('#left-header'),
		$topHeader = $('#top-header'),
		headerPaddingX = 150,
		headerPaddingY = 90,
		cellSize = 80,
		leaderTable = $('#civleader-datatable-holder'),
		isTouchDevice = 'ontouchstart' in document.documentElement || navigator.userAgent.toLowerCase().indexOf('touch') >= 0;
	
	
	$('body').addClass('ready');
	// Load additional javascript files
	$.when(
	    $.getScript( "js/iscroll-custom.js" ),
	    $.ajax(
		{
			url:		'data/leaderdata.json',
			dataType:	'json',
			cache:		true,
			error: 		ajaxError,
			success:	function( data, textStatus, jqXHR )
			{
				leaderData = data;
			}
		}),
	    $.ajax(
		{
			url:		'data/leaderref.json',
			dataType:	'json',
			cache:		true,
			error: 		ajaxError,
			success:	function( data, textStatus, jqXHR )
			{
				leaderRef = data;
			}
		}),
	    $.Deferred(function( deferred ){
	        $( deferred.resolve );
	    })
	).done(init);
		
	
	function init()
	{
		console.log('init');
		console.log("leader data", leaderData);
		console.log("leader references", leaderRef);
		
		var headerRows = generate_header_html();
		var leftRows = generate_sidebar_html();
		var tableContent = generate_table_html();
		
		$topHeader.html(headerRows);
		$leftHeader.html(leftRows);
		$('#civleader-datatable').html(tableContent);
		
		$('#scroller').width( cellSize * leaderRef.leaders.length +8 );
		
		onWindowResize();
		
		scrollHandler = new iScroll(
			'civleader-datatable-holder', 
			{
				lockDirection: false,
				onScrollUpdate: moveHeaders
			}
		);
		
		addTraitKeys();
		
		$('#splash').fadeOut(400);
		
		// sorting
		$topHeader.on('click', '.header-cell', columnSort);
		$leftHeader.on('click', '.row-label span', rowSort);
		$('#menu-launcher').on('click', function(e)
		{
			e.preventDefault();
			
			showModal( $('#about') );
		});
		$('a.feedback').on('click', function(e)
		{
			e.preventDefault();
			
			$('#feedback .md-content').html('<iframe src="feedback.html" />');
			
			showModal( $('#feedback') );
		});
		$('a.bug').on('click', function(e)
		{
			e.preventDefault();
			
			$('#bug-report .md-content').html('<iframe src="bug-report.html" />');
			
			showModal( $('#bug-report') );
		});
	}
	
	
	function showModal(target)
	{
		if(showingModal)
			closeModal();
	
		showingModal = true;
		target.addClass('md-show');
		$('.md-overlay').addClass('visible');
		$('.md-overlay').on('click', closeModal);
	}
	function closeModal()
	{
		if( !showingModal )
			return false;
		
		showingModal = false;
		$('.md-show').removeClass('md-show').find('iframe').remove();
		$('.md-overlay').removeClass('visible');
		$('.md-overlay').off('click', closeModal);
	}
	
	function rowSort(e)
	{
		e.preventDefault();
		
		var target = $(this).closest('.row-label');
		var rowIndex = target.index(),
			sortValues = [],
			$tableRows = $('#civleader-datatable tr'),
			$labelRows = $leftHeader.find('.row-label'),
			$topRows   = $topHeader.find('.header-cell'),
	    	order;
	    	
		// determine order
		if( target.hasClass('desc') )
		{
			order = 'asc';
		}
		else if( target.hasClass('asc') )
		{
			order = null;
		}
		else
		{
			target.addClass('desc');
			order = 'desc';
		}
		
	    // clear any other sort classes
	    $labelRows.filter('.desc, .asc').removeClass('desc asc');
	    $tableRows.filter('.desc, .asc').removeClass('desc asc');
	    target.addClass(order);
	    $tableRows.eq(rowIndex).addClass(order);
	    
	    var $thisRow = $tableRows.eq(rowIndex);
		// store values into sorting array
		for(var i = 0; i < civCount; i++ )
		{
			// if sorting by default order use the traitindex
			if( !order )
				var cellVal = $thisRow.children().eq(i).data('civindex');
			else
				var cellVal = $thisRow.children().eq(i).text();
			
			if(!isNaN(cellVal)) 
				sortValues.push([parseInt(cellVal), i]);
			else
				sortValues.push([0, i]);
		}
		if( order === 'asc' )
		{
			// sort asc
			sortValues.sort(function(x,y){
		        return x[0] - y[0];
		    });
		}
		if( order === 'desc' )
		{
			// sort desc
			sortValues.sort(function(x,y){
		        return y[0] - x[0];
		    });
		}
		else 
		{
			// sort by default order
			sortValues.sort(function(x,y){
		        return x[0] - y[0];
		    });
		}
		/*
		console.log( civCount, $thisRow.children().length, sortValues.length) ;
		for( var i = 0; i < sortValues.length; i++ )
		{
			console.log(sortValues[i]);
		}
		*/
		var $innerHeader = $topHeader.find('.inner');
	    // rearrange header labels by appending them in order
	    for(var i=0; i<civCount; i++)
	    {
	    	$innerHeader.append( $topRows.eq( sortValues[i][1] ) );
	    }
	    // rearrange table cells by appending them in order
	    for(var rowIndex=0; rowIndex < $tableRows.length; rowIndex++)
	    {
	    	var row = $tableRows.eq(rowIndex);
	    	var cells = row.find('td');
		    for(var i=0; i<civCount; i++)
		    {
		    	row.append( cells.eq( sortValues[i][1] ) );
		    }
		}
	}
	
	function columnSort(e)
	{
		e.preventDefault();
		
		var civIndex = $(this).index(),
			sortValues = [],
			$tableRows = $('#civleader-datatable tr'),
			$labelRows = $leftHeader.find('.row-label'),
			$topRows   = $topHeader.find('.header-cell'),
	    	order;
	    
		// determine order
		if( $(this).hasClass('desc') )
		{
			order = 'asc';
		}
		else if( $(this).hasClass('asc') )
		{
			order = null;
		    $tableRows.find('td.sorted').removeClass('sorted');
		}
		else
		{
			$(this).addClass('desc');
			order = 'desc';
		    $tableRows.find('td.sorted').removeClass('sorted');
		    $tableRows.find('td:nth-child('+(civIndex+1)+')').addClass('sorted');
		}
		
	    // clear any other sorted cols
	    $topRows.filter('.desc, .asc').removeClass('desc asc');
	    $(this).addClass(order);
		
		
		// store values into sorting array
		for(var i = 0; i < traitCount; i++ )
		{
			// if sorting by default order use the traitindex
			if( !order )
				var cellVal = $tableRows.eq(i).children().eq(civIndex).data('traitindex');
			else
				var cellVal = $tableRows.eq(i).children().eq(civIndex).text();
			
			if(!isNaN(cellVal)) 
				sortValues.push([parseInt(cellVal), i]);
			else
				sortValues.push([0, i]);
		}
		if( order === 'asc' )
		{
			// sort asc
			sortValues.sort(function(x,y){
		        return x[0] - y[0];
		    });
		}
		if( order === 'desc' )
		{
			// sort desc
			sortValues.sort(function(x,y){
		        return y[0] - x[0];
		    });
		}
		else 
		{
			// sort by default order
			sortValues.sort(function(x,y){
		        return x[0] - y[0];
		    });
		}
		    
	    // rearrange rows by appending them in order
	    for(var i=0; i<traitCount; i++)
	    {
	    	$leftHeader.append( $labelRows.eq( sortValues[i][1] ) );
	    	$('#civleader-datatable').append( $tableRows.eq( sortValues[i][1] ) );
	    }
	    
	    addTraitKeys();
	}
	
	function moveHeaders(x,y)
	{
		$leftHeader.css('top', y+headerPaddingY);
		$topHeader.css('left', x+headerPaddingX);
	}
	
	function ajaxError( jqXHR, textStatus, errorThrown )
	{
		console.log( 'Error loading AJAX data!' );
		console.log( 'errorThrown: ', errorThrown );
		console.log( 'textStatus: ', textStatus );
		$('#splash').html('<h4>Server Error: Unable to get civilization data. Please try again later.</h4>');		
	}
	
	function generate_header_html()
	{
		var value = '<div class="clearfix inner">';
		
		civCount = leaderRef.leaders.length;
		
		for( var i = 0; i < leaderRef.leaders.length; i++ )
		{
			var leader = leaderRef.leaders[i];
			
			// add header graphic for this leader
			value += '<div class="header-cell" data-civindex="'+i+'">';
			value += '<img class="civ-icon" src="images/icons/' + leader.icon + '" />';
			value += '<span class="leadername">' + leader.name + '</span>';
			value += '<span class="sorter"></span>';
			value += '</div>';
		}
		
		value += '</div>';
		return value;
	}
	function generate_sidebar_html()
	{
		var value = '';
		
		$.each( leaderRef.traits, function(traitName, traitText)
		{
			value += '<div class="row-label trait"><span>' + traitText + '</span></div>';
		});
		$.each( leaderRef.flavors, function(flavorName, flavorText)
		{
			value += '<div class="row-label flavor"><span>' + flavorText + '</span></div>';
		});
		$.each( leaderRef.major_approach_biases, function(biasName, biasText)
		{
			value += '<div class="row-label pvp-bias"><span>' + biasText + '</span></div>';
		});
		$.each( leaderRef.minor_approach_biases, function(flavorName, biasText)
		{
			value += '<div class="row-label cs-bias"><span>' + biasText + '</span></div>';
		});
		
		return value;
	}
	function generate_table_html()
	{
		var tbody = '<tbody>';
		var emptyText = '<span class="empty">X</span>';
		var tableRows = {};
		var traitTally;
		
		for( var i = 0; i < leaderRef.leaders.length; i++ )
		{
			var leader = leaderRef.leaders[i];
			traitTally = 0;
			
			var leaderID = leader.id;
			// add a table cell to each row by category
			for(var traitName in leaderRef.traits )
			{
				var traitval = leaderData[leaderID].Leaders[traitName] || emptyText;
				
				tableRows[traitName] += tableCellLoop(leaderID, traitval, traitTally, i);
				
				traitTally++;
			}
			for(var traitName in leaderRef.flavors )
			{
				var traitval = leaderData[leaderID].Leader_Flavors[traitName] || emptyText;
				
				tableRows[traitName] += tableCellLoop(leaderID, traitval, traitTally, i);
				
				traitTally++;
			}
			for(var traitName in leaderRef.major_approach_biases )
			{
				var traitval = leaderData[leaderID].Leader_MajorCivApproachBiases[traitName] || emptyText;
				
				tableRows[traitName] += tableCellLoop(leaderID, traitval, traitTally, i);
				
				traitTally++;
			}
			for(var traitName in leaderRef.minor_approach_biases )
			{
				var traitval = leaderData[leaderID].Leader_MinorCivApproachBiases[traitName] || emptyText;
				
				tableRows[traitName] += tableCellLoop(leaderID, traitval, traitTally, i);
				
				traitTally++;
			}
		}
		traitCount = traitTally;
		
		// add traits HTML to the tbody
		$.each( leaderRef.traits, function(traitName, traitText)
		{
			tbody += '<tr>';
			tbody += tableRows[traitName];
			tbody += '</tr>';
		});
		// add flavors HTML to the tbody
		$.each( leaderRef.flavors, function(flavorName, flavorText)
		{
			tbody += '<tr>';
			tbody += tableRows[flavorName];
			tbody += '</tr>';
		});
		$.each( leaderRef.major_approach_biases, function(biasName, biasText)
		{
			tbody += '<tr>';
			tbody += tableRows[biasName];
			tbody += '</tr>';
		});
		$.each( leaderRef.minor_approach_biases, function(biasName, biasText)
		{
			tbody += '<tr>';
			tbody += tableRows[biasName];
			tbody += '</tr>';
		});
		
		tbody += '</tbody>';
		
		return tbody;
	}
	
	function addTraitKeys()
	{
		$leftHeader.find('.key').removeClass('key');
		
		$leftHeader.find('.trait').eq(0).addClass('key');
		$leftHeader.find('.flavor').eq(0).addClass('key');
		$leftHeader.find('.pvp-bias').eq(0).addClass('key');
		$leftHeader.find('.cs-bias').eq(0).addClass('key');
	}
	
	function tableCellLoop(leaderID, traitval, traitTally, civindex )
	{
		var traitclass = '';
		var value = '';
		
		if( !isNaN(traitval) )
			traitclass += 'traitval-'+traitval;
		
		if( traitval >= 8 )
			traitclass += " high";
		if( traitval <= 3 )
			traitclass += " low";
		
		value += '<td data-civindex="'+civindex+'" data-traitindex="'+traitTally+'" class="'+traitclass+'">';
		value += ''+traitval;
		value += '</td>';
		
		return value;
	}
	
	$(window).resize( $.throttle( 200, onWindowResize ) );
	var fullsize = $(window).width() >= 720 ? false : true;
	onWindowResize();
	function onWindowResize()
	{
		// fit table holder to screen
		leaderTable.css({
			marginTop: headerPaddingY,
			marginLeft: headerPaddingX,
			width: $(window).width() - headerPaddingX,
			height: $(window).height() - headerPaddingY
		});
	}
	
	
	// keyboard listener for escape
	$(document).on('keydown', function(e) 
	{
		if (e.keyCode == 27) 
		{
			// ESC pressed
			if( showingModal )
				closeModal();
		}
		else if(e.keyCode == 39) 
		{
			// Right arrow pressed
			var x = Math.ceil(scrollHandler.x/cellSize)*cellSize - cellSize,
				y = Math.ceil(scrollHandler.y/24)*24;
			
			if( x < scrollHandler.maxScrollX )
				x = scrollHandler.maxScrollX;
			
			
			if(!showingModal)
				scrollHandler.scrollTo( x, y, 80 );
		}
		else if(e.keyCode == 37) 
		{
			// left arrow pressed
			var x = Math.ceil(scrollHandler.x/cellSize)*cellSize + cellSize,
				y = Math.ceil(scrollHandler.y/24)*24;
			
			if( x > 0 )
				x = 0;
				
			if(!showingModal)
				scrollHandler.scrollTo( x, y, 80 );
		}
		else if(e.keyCode == 38) 
		{
			// up arrow pressed
			var x = Math.ceil(scrollHandler.x/cellSize)*cellSize,
				y = Math.ceil(scrollHandler.y/24)*24 + 24;
				
			if( y > 0 )
				y = 0;
				
			if(!showingModal)
				scrollHandler.scrollTo( x, y, 80 );
		}
		else if(e.keyCode == 40) 
		{
			// down arrow pressed
			var x = Math.ceil(scrollHandler.x/cellSize)*cellSize,
				y = Math.ceil(scrollHandler.y/24)*24 - 24;
				
			if( y < scrollHandler.maxScrollY )
				y = scrollHandler.maxScrollY;
				
			// down arrow pressed
			if(!showingModal)
				scrollHandler.scrollTo( x, y, 80 );
			
			setTimeout(function(){
				console.log(scrollHandler);
			}, 40);
		}
	});
	/*
	$(window).on("mousewheel DOMMouseScroll", function(e){
		$.scrollTo.window().stop(true);
	});
*/
	
		
	});
})(jQuery);
String.prototype.format = function() {
  var args = arguments;
  return this.replace(/{(\d+)}/g, function(match, number) { 
    return typeof args[number] != 'undefined'
      ? args[number]
      : match
    ;
  });
};
// Throttle function
(function(b,c){var $=b.jQuery||b.Cowboy||(b.Cowboy={}),a;$.throttle=a=function(e,f,j,i){var h,d=0;if(typeof f!=="boolean"){i=j;j=f;f=c}function g(){var o=this,m=+new Date()-d,n=arguments;function l(){d=+new Date();j.apply(o,n)}function k(){h=c}if(i&&!h){l()}h&&clearTimeout(h);if(i===c&&m>e){l()}else{if(f!==true){h=setTimeout(i?k:l,i===c?e-m:e)}}}if($.guid){g.guid=j.guid=j.guid||$.guid++}return g};$.debounce=function(d,e,f){return f===c?a(d,e,false):a(d,f,e!==false)}})(this);