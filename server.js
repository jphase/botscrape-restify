// Requirements
var restify = require('restify');
var cheerio = require('cheerio');
var extend = require('jquery-extend');
var request = require('request');
var utils = require('./utils.js');

// Create server
var server = restify.createServer({
	name: 'botscrape',
	version: '0.0.1'
});
server.use(restify.acceptParser(server.acceptable));
server.use(restify.queryParser());
server.use(restify.bodyParser());

// Scrape route
server.post('/scrape/:search', function(req, res, next) {
	console.log('url: ' + req.params.url);
	console.log('string: ' + req.params.search);
	console.log('match element: ' + req.params.match_element);
	console.log('return element: ' + req.params.return_element);

	// Request URL and match
	request(req.params.url.replace(/\/$/, ''), function(error, response, html) {
		var results = [];
		if(!error && response.statusCode == 200) {
			var $ = cheerio.load(html);
			// Create a regex based on the search string
			var regex = new RegExp(req.params.search.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&"), 'gim');
			// Check for match_element and match_element and loop through each
			if($(req.params.match_element).length) {
				$(req.params.match_element).each(function(index, element) {
					// Match regex on current match_element
					var match = $(this).text().match(regex);
					if(match != null) {
						// Push matches to results array
						$(this).find(req.params.return_element).each(function(i, v) {
							if($(this).html().trim().length) {
								// Rebuild the element so we can get the HTML of the matched return_element
								console.log($(this)[0].attribs);
								var matched_html = $('<div>').append($('<' + $(this)[0].name + '>').attr(fix_link($(this)[0].attribs, req.params.url)).text($(this).text())).html();
								results.push(matched_html);
							}
						});
					}
				});
			}
		}
		console.log(results);
	});

	// Fix links that have relative URLs
	function fix_link($, url) {
		// Fix relative link by adding bot URL
		console.log($.href.substring(0, 1));
		if($.href !== undefined && !$.href.indexOf(url)) {
			// Rebuild URL
			var domain = url.split('/');
			// Check for / at beginning of href
			if($.href.substring(0, 1) == '/') {
				console.log('root url');
				// Add href to end of domain
				$.href = domain[0] + '//' + domain[2] + $.href;
			} else {
				// Build URL bits
				var URL = '';
				domain.forEach(function(bit, index) {
					if(index < domain.length && bit !== undefined) URL += bit + '/';
				});
				// Strip off trailing / from URL
				if(URL.slice(-1) == '/') URL = URL.substring(0, URL.length - 1);
				// Fix href
				$.href = URL;
			}
		}
		return $;
	}

	res.send(req.params);
	return next();
});

// Listen on port
server.listen(1337, function () {
	console.log('%s listening at %s', server.name, server.url);
});