if( typeof toArray !== 'function') {
	function toArray(leEnum) {
		return Array.prototype.slice.call(leEnum);
	}
}

if( !Function.prototype.curry ) {
	Function.prototype.curry = function() {
		if ( arguments.length < 1 ) {
				return this; //nothing to curry with - return function
		}
		var __method = this;
		var args = toArray(arguments);
		return function() {
				return __method.apply(this, args.concat(toArray(arguments)));
		}
	}
}


(function( $, global, document, undefined ) {

	var tags = ["html","head","title","base","link","meta","style",
	            "script","noscript",
	            "body","section","nav","article","aside",
	            "h1","h2","h3","h4","h5","h6",
	            "hgroup","header","footer","address",
	            "p","hr","pre","blockquote","ol","ul","li","dl","dt","dd","figure","figcaption","div",
	            "a","em","strong","small","s","cite","q","dfn","abbr","time","code","var","samp","kbd","sub","sup","i","b","u","mark","ruby","rt","rp","bdi","bdo","span","br","wbr",
	            "ins","del",
	            "img","iframe","embed","object","param","video","audio","source","track","canvas","map","area","svg","math",
	            "table","caption","colgroup","col","tbody","thead","tfoot","tr","td","th",
	            "form","fieldset","legend","label","input","button","select","datalist","optgroup","option","textarea","keygen","output","progress","meter",
	            "details","summary","command","menu"], //warning no data tag!
	    $h   = function( name ) { 
		           return $( document.createElement( name ) ); 
	           },
	    i    = tags.length;

	while( i-- ) {
		$[tags[i]] = $h.curry(tags[i]);
	}

})( jQuery, window, document );

