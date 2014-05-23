module.exports = {

	scrape: {
		// Escape all RegEx reserved characters from string - http://stackoverflow.com/questions/3446170/escape-string-for-use-in-javascript-regex#6969486
		escRegExp: function(str) {
			return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
		},

		// Return content based on match values in database for matched values
		matchContent: function($, values, options) {
			// Create a regex based on the bot match string
			var regex = new RegExp(escRegExp(values.search), 'gim');
			// Generate results based on regex matches within match_element
			var results = [];
			// Check for match_element and match_element and loop through each
			if($(values.match_element).length) {
				$(values.match_element).each(function(index, element) {
					// Match regex on current match_element
					var match = $(this).text().match(regex);
					if(match != null) {
						// Push matches to results array
						$(this).find(return_element).each(function(i, v) {
							results.push(fixLink($(this), options));
						});
					}
				});
			}
			return results;
		},

		// Request URL
		requestURL: function(request, scrape) {
			// Request source from URL and match
			request(scrape.url.replace(/\/$/, ''), function(error, response, html) {
				if(!error && response.statusCode == 200) {
					// Set $ as cheerio html DOM object from request URL
					var $ = cheerio.load(html);
					// Set bot matched content
					// var matched = [];
					// matched.push(matchContent($));
					// Callback
					// successCallback(botz, bot.matched);
					// Recurse as needed
					// if($(botz.match_element).length) recurse($(botz.next_page_el), botz, bot);
					return $;
				}
			});
			return false;
		},

		// Fix links that have relative URLs
		fixLink: function($, options) {
			// Filter links
			if(options.linksfix) {
				// Rebuild URL
				var domain = $.attr('href').split('/');
				// Fix relative link by adding bot URL
				if($.attr('href') !== undefined && !$.attr('href').indexOf(options.domain) >= 0) {
					// Check for / at beginning of href
					if($.attr('href').substring(0, 1).indexOf('/') > -1) {
						// Add href to end of domain
						$.attr('href', domain[0] + '//' + domain[2] + $.attr('href'));
					} else {
						// Build URL bits
						var URL = '';
						domain.forEach(function(bit, index) {
							if(index < domain.length && bit !== undefined) URL += bit + '/';
						});
						// Strip off trailing / from URL
						if(URL.slice(-1) == '/') URL = URL.substring(0, URL.length - 1);
						// Fix href
						$.attr('href', URL);
					}
				}
			}
			return $;
		},

		// Recurse through matched elements
		recurse: function($, valz, optz) {
			// Check for recurse option
			if(optz.recurse) {
				// Check for a recursion element in $ (cheerio object param)
				var link = fixLink($, optz);
				if(link.length) {
					sails.log.debug('recursing on link ' + link.attr('href'));
					requestURL(link.attr('href'), valz, optz);
				} else {
					// Render the view when done recursing
					// successCallback(valz, bot.matched);
				}
			} else {
				// Render the view
				// successCallback(valz, bot.matched);
			}
		},
	}

}