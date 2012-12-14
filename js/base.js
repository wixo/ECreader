;(function($, global, document, undefined) {

	var EC = {
		config : {
			newsURL  : "http://query.yahooapis.com/v1/public/yql?q=use%20%22http%3A%2F%2Fwww.datatables.org%2Fdata%2Fhtmlstring.xml%22%20as%20html.tostring%3B%20select%20*%20from%20html.tostring%20where%20url%3D%22http%3A%2F%2Felcomercio.pe%22%20and%20xpath%3D'%2F%2Fdiv%5B%40class%3D%22box-note%20wmedia%22%5D%2Fdiv%2Fa%2Fimg%7C%2F%2Fdiv%5B%40class%3D%22box-note%20wmedia%22%5D%2Fh2%2Fa%7C%2F%2Fdiv%5B%40class%3D%22box-note%20wmedia%22%5D%2Fp'&format=json&diagnostics=true&callback=",
			storyURL : ["http://query.yahooapis.com/v1/public/yql?q=use%20%22http%3A%2F%2Fwww.datatables.org%2Fdata%2Fhtmlstring.xml%22%20as%20html.tostring%3B%20select%20*%20from%20html.tostring%20where%20url%3D%22",
									"%22%20and%20xpath%3D'%2F%2Fdiv%5B%40id%3D%22textonota%22%5D'&format=json&diagnostics=true&callback="],
			completeStoryURL : ["http://query.yahooapis.com/v1/public/yql?q=use%20%22http%3A%2F%2Fwww.datatables.org%2Fdata%2Fhtmlstring.xml%22%20as%20html.tostring%3B%20select%20*%20from%20html.tostring%20where%20url%3D%22",
													"%22%20and%20xpath%3D'%2F%2Fdiv%5B%40id%3D%22news%22%5D%2Fh1%7C%2F%2Fdiv%5B%40class%3D%22cnt-player%22%5D%2Fimg%7C%2F%2Fp%5B%40class%3D%22bajada%22%5D%7C%2F%2Fdiv%5B%40id%3D%22textonota%22%5D'&format=json&diagnostics=true&callback="],
			$container  : null,
			$global     : null,
			$disclaimer : null,
			$footer     : null,
			homeRef     : '/jquery.helm',
			container   : 'div.container',
			showing     : 'news',
			nameSpace   : 'ECreader'
		},
		init : function() {
			var self = this;

			this.config.$global     = $(global);
			this.config.$container  = $('ul.news');
			this.config.$disclaimer = $('div.disclaimer');
			this.config.$footer     = $('footer');

			this.URL.init( self );
			this.DATA.init( self );
			this.UTIL.init( self );
			this.BUILD.init( self );
			this.COOKIES.init( self );
			this.STORAGE.init( self );
			this.ANIMATION.init( self );

			if( !this.COOKIES.isPresent( this.config.nameSpace ) ) {
				this.BUILD.buildDisclaimer();
			}

			if( this.URL.slug ) {

				this.BUILD.buildStory(null, this.config.$container, true);

			}else {

				this.config.$container.parent().addClass('news-container');
				this.BUILD.buildNews( this.config.$container );

			}

		},
		ANIMATION : {
			init : function( scope ) {
				this.scope = scope;
			},
			scrollToTop : function( $element ) {
				$element = $element || $('html,body'); //just to be clear this is not a global variable because is already declared in the function parameters
				$element.animate({scrollTop: 0});
				return false;
			},
			showLoading : function( $container ) {
				var $loading = $( 'body' ).find('div.loading-container');

				$loading.length && $loading.find('div.icon-container').addClass('rotation');

				$loading.length && $loading.fadeIn('100');
				$loading.length || this.scope.BUILD.loading().hide().appendTo( $container.parent().parent() ).fadeIn('100');
			},
			hideLoading : function() {
				var $loading = $( 'body' ).find('div.loading-container');

				$loading.fadeOut('100');
				$loading.promise().done( function() {
					$loading.find('div.icon-container').removeClass('rotation');
				});
			}
		},
		COOKIES : {
			init : function( scope ) {
				this.scope = scope;
			},
			setCookie : function( name, value ) { //as we use them in a basic way we will set them to last *forever* yay!
				document.cookie = name + '=' + value + '; path=/';
				return false;
			},
			isPresent : function( name ) { //returns if there is a cookie with that name
				var cookies = document.cookie.split(';'),
						parts   = [],
						i       = cookies.length;

				while( i-- ) {
					parts.push(cookies[i].split('='));
				}

				return parts.some(function(c) {
					return c[0].trim() === name;
				});
			}
		},
		BUILD : {
			init : function( scope ) {
				this.scope = scope;
				this.COMPONENT.init( scope );

				this.scope.URL.setPopStateListener();
			},
			error : function( message ) {
				var $error = div().attr("class","error-container hero-unit");
				$('body').empty().append($error);

				h1().text(":(").appendTo( $error );
				p().attr("class","tagline").text("Hubo un error.").appendTo( $error );
				p().text( message + "." ).appendTo( $error );
				p().html("Por favor intenta <a href='"+this.scope.config.homeRef+"'>recargando la página</a>. Si el error persiste contáctame.").appendTo( $error );
			},
			alert : function( message ) {
				var $leDiv = div().attr("class","alert alert-error").text( message );
				a().attr("class","close").html('&times;').on('click', function() {$(this).parent().slideUp()}).appendTo($leDiv);
				return $leDiv;
			},
			loading : function() {
				var $loadingContainer,
				    $shield,
				    $iconContainer;
				$loadingContainer = div().attr("class","loading-container");
				$shield           = div().attr("class","shield").appendTo( $loadingContainer );
				$iconContainer    = div().attr("class","icon-container rotation").appendTo( $shield );
				i().attr({"class":"icon-cog icon-xxl"}).appendTo( $iconContainer );

				return $loadingContainer;
			},
			buildNews : function( $container ) { //appends the news to $container
				var self = this;
				self.scope.ANIMATION.showLoading( $container );
				$.when( self.scope.DATA.fetchNews() ).then( function( data ) {
					var unparsedData = data.query.results.result,
							parsedStories;

					self.scope.ANIMATION.hideLoading();

					parsedStories = self.scope.DATA.parseNewsData( unparsedData );

					//storing on localStorage
					self.scope.STORAGE.setStories( parsedStories );

					$.each( parsedStories, function( i,v ) {
						var h = self.buildStoriesSegment( v, $container );
						h.appendTo($container);
					});

				}, function() {
					self.error('No pudimos conectarnos a la web de El Comercio');
				} );
			},
			fetchStoriesAndBuildFromSlug : function($container) { //to use as a fallback when no data storage and slug
				var self = this;
				$.when( self.scope.DATA.fetchNews() ).then( function( data ) {
					var unparsedData = data.query.results.result || self.error('No pudimos conectarnos a la web de El Comercio'),
							storyFound,
							parsedStories;

					parsedStories = self.scope.DATA.parseNewsData( unparsedData );
					$.each( parsedStories, function( i,v ) {
						if( !storyFound ) {
							storyFound = (v.slug === self.scope.URL.slug) && v;
						}
					});

					if( storyFound ) {
						self.buildStory( storyFound, $container )
					}else {
						self.error('No se encontró la historia');
					}

				}, function() {
					self.error('No pudimos conectarnos a la web de El Comercio');
				});
			},
			buildFooter : function( story ) { //show footer mark up if exists and bind events
				var $footer = this.scope.config.$footer,
						beforeAfter,
						self    = this;

				$footer.length && $footer.show();

				$footer.find('li.home').on('click', function() {
					self.scope.UTIL.NAVIGATION.home();
				});
				beforeAfter = self.scope.DATA.beforeAfterStory( story );

				self.bindFooterNavigation( $footer, beforeAfter );

				return false
			},
			bindFooterNavigation : function( $footer, beforeAfter, story ) {
				var self = this;
				$footer = $footer || this.scope.config.$footer; //not global

				story && (beforeAfter = self.scope.DATA.beforeAfterStory( story ));

				$footer.find('li.back').off('click').one('click', function() {
					if( !!beforeAfter.before ) {
						self.buildStory( beforeAfter.before , self.scope.config.$container, false, true );

					}else {
						self.alert('Ya no hay historias más recientes que mostrar.').prependTo($footer);
					}
				});

				$footer.find('li.next').off('click').one('click', function() {
					if( !!beforeAfter.after ) {
						self.buildStory( beforeAfter.after , self.scope.config.$container, false, true );

					}else {
						self.alert('Llegamos al final de la lista de historias. Gracias por usar ECreader :)').prependTo($footer);
					}
				});
				return false;
			},
			buildDisclaimer : function() { //show the disclaimer if present in the markup else it builds up one
				var self = this;
				if( this.scope.config.$disclaimer.length ) {
					this.scope.config.$disclaimer.slideDown();
					this.scope.config.$disclaimer.promise().done(function() {
						self.COMPONENT.closeDisclaimer();
					});
				}else {
					//no markup with $disclaimer, build one;
				}
			},
			buildStory : function( story, $container, isNew, fromStory ) { //clean the containers and append Story Html fragment
				var self = this;

				if( isNew ) {
					self.fetchStoriesAndBuildFromSlug( $container );
				}else {
					self.scope.ANIMATION.showLoading( $container );
					$.when( self.scope.DATA.fetchStory( story.link ) ).then( function( data ) {
						var unparsedData = data.query.results.result || self.error('No pudimos conectarnos a la web de El Comercio'),
								storyFragment;

						self.scope.ANIMATION.hideLoading();

						if( fromStory ) {
							$container = $('div.story');
						}

						story.paragraphs = self.scope.DATA.getParagraphs( unparsedData );
						storyFragment    = self.buildStorySegment( story );

						self.scope.URL.setSlug( story, story.slug );

						$container.animate({left: parseInt( $container.css('left'), 10) === 0 ? -$container.outerWidth() : 0});
						//nasty code alert
						$container.promise().done(function() {
							self.scope.config.$global.scrollTop() !== 0 ? self.scope.ANIMATION.scrollToTop() : false;
						});
						$container.promise().done(function() {
							var $parentContainer = $container.parent();

							!!fromStory ? self.bindFooterNavigation( false, false, story ) : self.scope.UTIL.toggleState( null,story );
							$parentContainer.empty();

							storyFragment.appendTo( $parentContainer );

						});

					}, function() {
						self.error('No pudimos conectarnos a la web de El Comercio');
					});

				}

			},
			buildStorySegment : function( story ) {//returns html fragment for a story
				var $storyContainer,   //div
						$contentContainer, //div with the story paragraphs
						$titleContainer,   //div
						$textContainer,
						self = this,
						j = 0; //to iterate paragraphs

				$storyContainer = div().attr({"class":"story"});
				$titleContainer = div().attr({"class":"title-container"}).
																css({'background-image':'url('+story.img+')'}).
																appendTo( $storyContainer );
				$textContainer  = div().attr({"class":"title-text-container"}).appendTo( $titleContainer );

				h2().attr({"class":"title"}).text( story.title ).appendTo( $textContainer );
				p() .attr({"class":"intro"}).text( story.intro ).appendTo( $textContainer );

				$contentContainer = div().attr({"class":"content"});

				for(; j < story.paragraphs.length; j++ ) {
					p().text( story.paragraphs[j] ).appendTo( $contentContainer );
				}

				$contentContainer.appendTo( $storyContainer );

				//adding scrollFixer Div to allow user scroll the content better
				div().attr({"class":"scroll-fix"}).css({'min-height': ( self.scope.config.$global.height() / 4 ) + 'px' }).appendTo( $contentContainer );

				self.COMPONENT.liftMeUp( $textContainer ).appendTo( $storyContainer );

				return $storyContainer;
			},
			buildStoriesSegment : function( story, $container ) { //returns html fragment for news
				var $storyContainer,   //li that contains the link
						$linkContainer,    //a that contains the div
						$innerContainer,   //div that contains the content
						$imgContainer,     //div that containes the img
						$contentContainer, //div that contains the paragraph with the intro
						self = this;

				//we will use $helm to build the html fragments

				$storyContainer   = li() .attr({"class":"story row"}).data( 'header', story.title );
				$linkContainer    = a()  .attr({"class":"link","href":story.link}).appendTo($storyContainer);
				$innerContainer   = div().attr({"class":"inner-story"}).appendTo($linkContainer);
				$imgContainer     = div().attr({"class":"part img-part"});
				$contentContainer = div().attr({"class":"part content-part"});

				h3() .attr({"class":"title"}).text( story.title ).appendTo($innerContainer);
				$imgContainer.appendTo( $innerContainer );
				$contentContainer.appendTo( $innerContainer );

				img().attr({"class":"img",src: story.img }).appendTo( $imgContainer );
				p()  .attr({"class":"content"}).text( story.intro ).appendTo( $contentContainer );

				$linkContainer.on('click', function(e) {
					e.preventDefault();
					self.buildStory( story, $container );
				});

				return $storyContainer;
			},
			COMPONENT : {
				init: function( scope ) {
					this.scope = scope;
				},
				liftMeUp: function( $referrer ) { //builds an arrow with the power to lift up the viewport
					var $liftMeUp,
							self = this;

					$liftMeUp = div().attr({"class":"lift-me-up"});
					i().attr({"class":"icon-circle-arrow-up icon-xxl"}).on('click', function() {
						self.scope.ANIMATION.scrollToTop()
					}).appendTo( $liftMeUp );

					//nasty code alert
					if( self.scope.config.$global.width() > 1199 ) {
						self.scope.config.$global.off('scroll').on('scroll', function() {
							$liftMeUp.toggleClass('show', !($referrer.offset().top > self.scope.config.$global.scrollTop()));
						});
					}

					return $liftMeUp;
				},
				closeDisclaimer: function() { //check the presence of a disclaimer, if present set close listeners also with cookies
					var $disclaimer = this.scope.config.$disclaimer,
							$close      = $disclaimer.find('a.close-disclaimer')
							self        = this;

					if( $disclaimer.length ) {

						$close.length && $close.on('click', function(e) {
							var $this = $(this);
							e.preventDefault();

							$this.parent().slideUp();
							$this.promise().done(function() {
								self.scope.COOKIES.setCookie( self.scope.config.nameSpace, self.scope.config.nameSpace );
							});

						});

					}
					return false;
				}
			}
		},
		URL : {
			init : function( scope ) {
				this.scope   = scope;                       //EC referrer
				this.current = global.location.href;        //we get the current URL
				this.slug    = this.getSlug( this.current ) //then we get the slug
				
			},
			getSlug : function( url ) { //slug from url, TODO: test if valid
				return url.substr( url.lastIndexOf('/') + 1 );
			},
			hasSlug : function( url ) {
				return !!(url.substr( url.lastIndexOf('/') + 1 ));
			},
			setSlug : function( data, slug ) {
				history.pushState( data, slug, slug );
			},
			setPopStateListener : function() { //add listener to popstate and manage changes
				var self = this;
				window.addEventListener('popstate', function(e){

					if( self.scope.config.showing === 'story' ) {
						self.scope.BUILD.buildStory( e.state , self.scope.config.$container, false, true );
					}

				});
			}
		},
		UTIL : {
			init : function( scope ) {
				this.scope = scope;
				this.NAVIGATION.init( scope );
			},
			fetchJSON : function( url ) {
				return $.getJSON( url, function( data ) {
					return data;
				});
			},
			stripTitles : function( anchorTag ) { //returns title with text and link
				var dummyDiv = document.createElement('div'),
						o        = {};

				dummyDiv.innerHTML = anchorTag;
				$dummyA            = $(dummyDiv).find('a');
				o.text             = $dummyA.text();
				o.link             = $dummyA.attr('href');
				return o;
			},
			toggleState : function( state, story ) {
				var self = this,
						$container = self.scope.config.$container.parent();

				if( self.scope.config.showing === 'news') {
					$container.removeClass('news-container').addClass('story-container');
					self.scope.config.showing = 'story';
					$('body').addClass('state-story');
					self.scope.config.$container = $('div.story');
					self.scope.BUILD.buildFooter( story );

				}else if( self.scope.config.showing === 'story' ) {
					$container.removeClass('story-container').addClass('news-container');
					self.scope.config.showing = 'news';
					self.scope.config.$container = $('ul.news');
					$('body').addClass('state-news');
				}else {
					$container.removeClass('story-container').removeClass('news-container').addClass(state+'-container');
					self.scope.config.showing = state;
				}
			},
			NAVIGATION : {
				init : function( scope ) {
					this.scope = scope;
				},
				home : function() {
					var self = this;
					global.location.href = self.scope.config.homeRef;
				},
				windowReload : function() {
					global.location.reload();
				}
			}
		},
		DATA : {
			init : function( scope ) {
				this.scope         = scope;
				this.withoutIntros = null;
			},
			fetchNews : function() {
				return this.scope.UTIL.fetchJSON( this.scope.config.newsURL );
			},
			fetchStory : function( link ) {
				return this.scope.UTIL.fetchJSON( this.scope.config.storyURL[0] +link+ this.scope.config.storyURL[1] );
			},
			fetchCompleteStory : function( link ) {
				return this.scope.UTIL.fetchJSON( this.scope.config.completeStoryURL[0] +link+ this.scope.config.completeStoryURL[1] );
			},
			getIntros : function( data ){
				var leData        = data.match(/<p\s+class="intro">[\S\s]*?<\/p>/gi),
						i             = leData.length,
						intros        = [];

				this.withoutIntros = data.replace(/<p\s+class="intro">[\S\s]*?<\/p>/gi,'');

				while(i--) {
					leData[i] = leData[i].replace(/(<\/?[^>]+>)/gi,'');
					leData[i] = leData[i].replace(/[\n\r]/g, '');
					intros.push( leData[i] );
				}

				return intros; //return intros and replace with ''
			},
			getMedia : function( data ) {
				var i,
						media = [];

				data  = data.match(/src=(.+?[\.jpg|\.gif|\.png]")/gi); //not global
				i     = data.length;

				while(i--) {
					leData = data[i].substring(5);
					leData = leData.substring(0, leData.length-1);
					leData = leData.replace(/\/thumb\//,'/');
					media.push( leData );
				}

				return media; //returns media
			},
			getParagraphs : function( unparsedStoryData ) { //returns paragraphs
				var paragraphs = unparsedStoryData.match(/<p>[\S\s]*?<\/p>/gi),
						i          = paragraphs.length;
						
				while( i-- ) {
					paragraphs[i] = paragraphs[i].replace(/(<\/?[^>]+>)/gi,'');
					paragraphs[i] = paragraphs[i].replace(/[\n\r]/g, '');
				}

				return paragraphs;
			},
			getTitles : function( dataWithoutIntro ) { //returns titles with text and link
				var data   = dataWithoutIntro.match(/<a([^>]+)>(.+?)<\/a>/gi),
						i      = data.length,
						titles = [],
						self   = this;

				while(i--) {
					titles.push( self.scope.UTIL.stripTitles( data[i] ) );
				}

				return titles;
			},
			parseNewsData : function( unparsedData ) { //returns array of stories
				var story        = {},
						stories      = [],
						parsedMedia, //src from imgs so far
						parsedIntros,//taglines from news
						parsedTitles,//links with hrefs and texts
						i;

				parsedMedia  = this.getMedia( unparsedData );
				parsedIntros = this.getIntros( unparsedData );
				parsedTitles = this.getTitles( this.withoutIntros );

				i = parsedMedia.length;

				while( i-- ) {
					story.img   = parsedMedia[i];
					story.title = parsedTitles[i] ? parsedTitles[i].text : self.scope.BUILD.error('No se obtuvo la información completa.');
					story.intro = parsedIntros[i];
					story.link  = parsedTitles[i] ? parsedTitles[i].link : self.scope.BUILD.error('No se obtuvo la información completa.');
					story.slug  = this.scope.URL.getSlug( story.link );

					stories.push( story );

					story = {};
				}

				return stories;
			},
			parseNewsList : function( unparsedData ) { //returns array of story titles
				var parsedTitles,
						self = this;

				this.getIntros( unparsedData );
				parsedTitles = this.getTitles( this.withoutIntros );
				parsedTitles.every( function(t) {
					t.slug = self.scope.URL.getSlug( t.link );
					return t.slug;
				});

				return parsedTitles;
			},
			beforeAfterStory : function( story ) { //returns an object with the urls of the before and after story
				var stories = this.scope.STORAGE.getStories() || [],
						ba      = {},
						i       = stories.length;

				while( i-- ){
					if( stories[i].slug === story.slug ) {

						ba.after   = stories[i+1] ? stories[i+1] : null;
						ba.before  = stories[i-1] ? stories[i-1] : null;
						break;

					}else {

						ba.before = null;
						ba.after  = null;

					} 
				}

				return ba;
			}
		},
		STORAGE : {
			init : function( scope ) {
				this.scope = scope;
			},
			setStories : function( stories ) {
				localStorage.setItem( this.scope.config.storageNS , JSON.stringify( stories ) );
			},
			getStories : function() {
				return JSON.parse(localStorage.getItem( this.scope.config.storageNS ));
			}
		},
		addToStorage : function() { //experimental, not in production

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

		}
	}

	global.EC = EC;

})(jQuery, window, document);

$(function() {

	if( !( Modernizr.localstorage && (typeof [].every === 'function') && Modernizr.history && Modernizr.csstransitions )) {
		var $error = div().attr("class","error-container hero-unit");
		$('body').empty().append($error);

		h1().text(":(").appendTo( $error );
		p().attr("class","tagline").text("Hubo un error.").appendTo( $error );
		p().text("Tu navegador no soporta algunas de las tecnologías usadas.").appendTo( $error );
		p().html("Por favor intenta <a href='//browsehappy.com/'>con un navegador moderno</a>.").appendTo( $error );
	}else {
		EC.init();
	}

});