var fs = require('fs');
var cheerio = require('cheerio');

var products = [];

fs.readFile(__dirname + '/resources/html/history-spool-sample.html', function (err, data) {
    if (err) {
        throw err; 
    }
    
    console.log('Loading data to cheerio');
    $ = cheerio.load(data);
    
    var rows = $('.market_listing_row');    
    console.log('Rows count: ' + rows.length);
    
    for (var i = 0; i < rows.length; i++) {
        var currentRow = rows[i];
        
        var product = {};
        
        product.price = currentRow.find('.market_listing_price').text();
        
        var buyerText = currentRow.find('.market_listing_whoactedwith_name_block').text();
        var isBuyer = buyerText.indexOf("Buyer:") > -1;
        product.buyAction = isBuyer;
        
        var actedOn = currentRow.find('.market_listing_listed_date').first().text();
        var listedOn = currentRow.find('.market_listing_listed_date').last().text();
        
        product.actedOn = actedOn;
        product.listedOn = listedOn;
        
        product.itemName = currentRow.find('.market_listing_item_name').text();
        product.gameName = currentRow.find('.market_listing_game_name').text();
        
        products.add(product);
    }
    
    console.log(JSON.stringify(products));
});