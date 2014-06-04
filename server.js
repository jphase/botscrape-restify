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
    // Initialize
    var scrape = {
        url: req.params.url,
        search: req.params.search,
        match_element: req.params.match_element,
        return_element: req.params.return_element,
        next_page_element: req.params.next_page_element,
        results: []
    };

    // Log stuff
    console.log('scrape url: ' + scrape.url);
    console.log('scrape search: ' + scrape.search);
    console.log('scrape match_element: ' + scrape.match_element);
    console.log('scrape return_element: ' + scrape.return_element);
    console.log('scrape next_page_element: ' + scrape.next_page_element);

    // Request URL and match
    function request_url(url, scrape, fix_link, results, res, req) {
        request(url.replace(/\/$/, ''), function(error, response, html) {
            if (!error && response.statusCode == 200) {
                var $ = cheerio.load(html);
                // Create a regex based on the search string
                var regex = new RegExp(scrape.search.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&"), 'gim');
                // Check for match_element and match_element and loop through each
                if ($(scrape.match_element).length) {
                    $(scrape.match_element).each(function(index, element) {
                        // Match regex on current match_element
                        var match = $(this).text().match(regex);
                        if (match != null) {
                            // Push matches to results array
                            $(this).find(scrape.return_element).each(function(i, v) {
                                if ($(this).html().trim().length) {
                                    // Rebuild the element so we can get the HTML of the matched return_element
                                    // console.log('attribs: ' + $(this)[0].attribs.href);
                                    var result = $('<div>').append($('<' + $(this)[0].name + '>').attr('href', fix_link($(this)[0].attribs.href, scrape)));
                                    console.log(result.html());
                                    scrape.results.push(result);
                                    // var matched_html = $('<div>').append($('<' + $(this)[0].name + '>').append($('<a>').attr('href', fix_link($(this)[0].attribs.href, scrape))).text($(this).text())).html();
                                    // results.push(matched_html);
                                }
                            });
                        }
                    });
                    // Check for next page element and recurse as needed
                    if ($(scrape.next_page_element).length && $(scrape.next_page_element).attr('href') !== undefined) {
                        // Change the URL to the next page element
                        var url = fix_link($(scrape.next_page_element).attr('href'), scrape);
                        console.log('START of recursion on URL: ' + url);
                        // Recurse
                        request_url(url, scrape, fix_link, scrape.results, res, req);
                    } else {
                        console.log('END of recursion');
                    }
                }
            }
        });
    }

    // Fix links that have relative URLs
    function fix_link(link, scrape) {
        // console.log('fixing link: ' + link);
        // Fix relative links by adding scrape URL as needed
        if (link !== undefined && link.indexOf(scrape.url) <= 0) {
            // Rebuild URL
            var domain = scrape.url.split('/');
            // Check for / at beginning of href
            if (link.substring(0, 1) == '/') {
                // Add href to end of domain
                link = domain[0] + '//' + domain[2] + link;
            } else {
                console.log('building bits');
                // Build URL bits
                var URL = '';
                domain.forEach(function(bit, index) {
                    if (index < domain.length && bit !== undefined) URL += bit + '/';
                });
                // Strip off trailing / from URL
                if (URL.slice(-1) == '/') URL = URL.substring(0, URL.length - 1);
                // Fix href
                link = URL;
            }
        }
        // console.log('fixed link: ' + link);
        return link;
    }

    // Request first URL to start scraping sequence
    request_url(req.params.url, scrape, fix_link);

    // Send request back to client
    res.send(req.params);
    return next();
});

// Listen on port
server.listen(1337, function() {
    console.log('%s listening at %s', server.name, server.url);
});