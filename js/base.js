function exists(o, obj) {
	var exists = false;
	$.each( obj, function( i,v ) {
		if( !(!!exists) ) {
			exists = (o.slug === v.slug) && o;
		}
	});
	if (exists) {
		return false
	}else {
		return o;
	}
}

function diffr( oldObj, newObj ) {
	var result = [];

	result = newObj.filter(function (o) {
		return exists(o, oldObj);
	})

	return result;
}

;(function($, global, document, undefined) {

	var EC = {
		$container : null,
		introFix : null,
		urlNews : "http://query.yahooapis.com/v1/public/yql?q=use%20%22http%3A%2F%2Fwww.datatables.org%2Fdata%2Fhtmlstring.xml%22%20as%20html.tostring%3B%20select%20*%20from%20html.tostring%20where%20url%3D%22http%3A%2F%2Felcomercio.pe%22%20and%20xpath%3D'%2F%2Fdiv%5B%40class%3D%22box-note%20wmedia%22%5D%2Fdiv%2Fa%2Fimg%7C%2F%2Fdiv%5B%40class%3D%22box-note%20wmedia%22%5D%2Fh2%2Fa%7C%2F%2Fdiv%5B%40class%3D%22box-note%20wmedia%22%5D%2Fp'&format=json&diagnostics=true&callback=",
		beforeInit : function() {
			var self           = this,
			    storageData    = localStorage.getItem( 'ECreader' ),
			    foundInStorage = false;

			this.$container = $('ul.news');
			this.url = window.location.href;
			this.url = this.url.substr(this.url.lastIndexOf('/') + 1);

			if( this.url.length > 3 ) {

				if( storageData ) {

					storageData = JSON.parse( storageData );

					$.each( storageData , function( i,v ) {

						if( !(!!foundInStorage) ) {
							foundInStorage = ( v.slug === self.url ) && v;
						}

					});

					if( foundInStorage ) {

						this.getStory( foundInStorage );

					}else {
						console.log('fetch new articles first');
					}


				}else {

					console.log('fetch new articles first')

				}

			}else {
				console.log('no URL');
				this.init();
			}

		},
		init : function() {
			var self = this;

			this.data;
			this.$container = $('ul.news');
			// this.urlNews = ;

			$.when( this.getJson( this.urlNews ) ).then( function( data ) {
				self.data = data.query.results.result;

				var story       = {},
				    data        = self.getMedia( self.data ),
				    intros      = self.getIntros( self.data ),
				    titles      = self.getTitles( self.introFix ),
				    // i           = data.length,
				    stories     = [],
				    storageData = localStorage.getItem( 'ECreader' ),
				    newData,        //var for the new Stories Obj
				    newStorageData, //the new Story Obj for localstorage
				    getStoryObj;    //parse all data from YQL


				getStoryObj = function() {

					var i = data.length;

					while( i-- ) {
						story.img   = data[i].replace(/\/thumb\//,'/');
						story.title = titles[i].text;
						story.intro = intros[i];
						story.link  = titles[i].link;
						story.slug  = story.link.substr( story.link.lastIndexOf('/') + 1 );
						// story.img   = story.img;

						stories.push( story );

						self.buildSegment( story );

						story = {};
					}

					return stories;
				}

				if( storageData ) {
					storageData = JSON.parse( storageData );
					newData     = getStoryObj();

					var leSD = [],
					    j = 0,
					    diff;

					$.each( storageData, function( i,v ) {
						leSD[j] = v;
						j++;
					});

					//add the new data to the old data;

					diff = diffr( leSD, newData );

					if( !!diff.length ) {
						newStorageData = diff.concat( leSD );
						localStorage.setItem( 'ECreader', JSON.stringify( newStorageData ) );
					}
					
				}else {
					//create new data

					newData = getStoryObj();

					localStorage.setItem( 'ECreader', JSON.stringify( stories ) );

				}


			});

			this.getJson();
		},
		getIntros : function( data ) {
			var leData        = data.match(/<p\s+class="intro">[\S\s]*?<\/p>/gi),
			    i             = leData.length,
			    intros        = [];

			this.introFix = data.replace(/<p\s+class="intro">[\S\s]*?<\/p>/gi,'');

			while(i--) {
				leData[i] = leData[i].replace(/(<\/?[^>]+>)/gi,'');
				leData[i] = leData[i].replace(/[\n\r]/g, '');
				intros.push( leData[i] );
			}

			return intros;
		},
		getJson : function( url ) {
			return $.getJSON( url, function( data ) {
				return data;
			});
		},
		getInsideStory : function( story ) {
			var paragraphs = story.match(/<p>[\S\s]*?<\/p>/gi),
			    i          = paragraphs.length;

			while( i-- ) {
				paragraphs[i] = paragraphs[i].replace(/(<\/?[^>]+>)/gi,'');
				paragraphs[i] = paragraphs[i].replace(/[\n\r]/g, '');
			}

			return paragraphs;
		},
		getMedia : function( data ) {
			var data = data.match(/src=(.+?[\.jpg|\.gif|\.png]")/gi),
			    i = data.length,
			    media= [];

			while(i--) {
				leData = data[i].substring(5);
				leData = leData.substring(0, leData.length-1);

				media.push( leData );
			}

			return media;
		},
		getStory : function( story ) {
			var self     = this,
			    urlLink  = story.link,
			    urlStory = "http://query.yahooapis.com/v1/public/yql?q=use%20%22http%3A%2F%2Fwww.datatables.org%2Fdata%2Fhtmlstring.xml%22%20as%20html.tostring%3B%20select%20*%20from%20html.tostring%20where%20url%3D%22"+encodeURIComponent( urlLink )+"%22%20and%20xpath%3D'%2F%2Fdiv%5B%40id%3D%22textonota%22%5D'&format=json&diagnostics=true&callback="

			$.when( this.getJson( urlStory ) ).then( function( data ) {
				var storyData   = data.query.results.result;

				storyParagraphs = self.getInsideStory(storyData);

				story.paragraphs = storyParagraphs;

				self.buildInsideStory( story );

			});
		},
		getTitles : function( data ) {
			var data = data.match(/<a([^>]+)>(.+?)<\/a>/gi),
			    i    = data.length,
			    titles= [];

			while(i--) {
				titles.push( this.stripTitles( data[i] ) );
			}

			return titles;
		},
		buildInsideStory : function( story ) {
			var $container,
			    animation,
			    afterAnimation;
			story.link = story.link.split('/');
			history.pushState(null, null, story.link[5]);

			afterAnimation = function( story ) {
				var $container      = $('div.page'),
				    $storyContainer = div().attr({"class":"story"}).appendTo($container),
				    $contentContainer,
				    $titleContainer,
				    i = 0;

				$titleContainer = div().attr({"class":"title-container"
																			}).css({'background-image':'url('+story.img+')'})
																.appendTo($storyContainer);
				h2() .attr({"class":"title"}).text(story.title).appendTo($titleContainer);
				p()  .attr({"class":"intro"}).text(story.content).appendTo($titleContainer);
				// img().attr({"class":"img","src":story.img}).appendTo($storyContainer);
				$contentContainer = div().attr({"class":"content"}).appendTo($storyContainer);

				for(; i < story.paragraphs.length; i++) {
					p().text(story.paragraphs[i]).appendTo($contentContainer);
				}

			}

			this.$container.fadeOut('slow');
			this.$container.promise().done(function() {
				var $this = $(this);
				$this.parent().empty().removeClass('news-container').addClass('story-container');
				afterAnimation( story );
			});

		},
		buildSegment : function( data ) {
			var self                = this,
			    title               = data .title,
			    link                = data .link,
			    leImg               = data .img,
			    content             = data .intro,
			    $storyContainer     = li() .attr({"class":"story row"}).data('header',title).appendTo(this.$container),
			    $linkContainer      = a()  .attr({"class":"link","href":link}).appendTo($storyContainer),
			    $innerStory         = div().attr({"class":"inner-story"}).appendTo($linkContainer),
			    $imgContainer       = div().attr({"class":"part img-part"}),
			    $contentContainer   = div().attr({"class":"part content-part"});

			this.$container.parent().addClass('news-container');

			h3() .attr({"class":"title"}).text(title).appendTo($innerStory);

			$imgContainer.appendTo($innerStory);
			$contentContainer.appendTo($innerStory);

			img().attr({"class":"img",src: leImg}).appendTo($imgContainer);
			p()  .attr({"class":"content"}).text(content).appendTo($contentContainer);

			$linkContainer.on('click',function(e) {
				e.preventDefault();
				var $this = $(this),
				    story = {};

				story.$link   = $this;
				story.title   = title;
				story.link    = link;
				story.img     = leImg;
				story.content = content;

				self.getStory( story );
			});

		},
		stripTitles : function( html ) {
			var tmp = document.createElement('div'),
			    o   = {};
			tmp.innerHTML = html;
			$tmp          = $(tmp).find('a');
			o.text        = $tmp.text();
			o.link        = $tmp.attr('href');
			return o;
		}
	}

	global.EC = EC;

})(jQuery, window, document);

$(function() {
	EC.beforeInit();
});