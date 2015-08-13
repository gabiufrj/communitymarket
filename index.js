var fs = require('fs');
var cheerio = require('cheerio');

var products = [];
var productsSummarized = [];

function proccessHtml(data) {
    $ = cheerio.load(data);
    
    var rows = $('.market_listing_row');
    
    for (var i = 0; i < rows.length; i++) {
        var currentRow = $(rows[i]);
        
        var product = {};
        
        product.price = currentRow.find('.market_listing_price').text().replace(/\r\n/g, '');
        
        var buyerText = currentRow.find('.market_listing_whoactedwith_name_block').text();
        var isBuyer = buyerText.indexOf("Buyer:") > -1;
        product.buyAction = isBuyer;
        
        var actedOn = currentRow.find('.market_listing_listed_date').first().text().replace(/\r\n/g, '');
        var listedOn = currentRow.find('.market_listing_listed_date').last().text().replace(/\r\n/g, '');
        
        product.actedOn = actedOn;
        product.listedOn = listedOn;
        
        product.itemName = currentRow.find('.market_listing_item_name').text().replace(/\r\n/g, '');
        product.gameName = currentRow.find('.market_listing_game_name').text().replace(/\r\n/g, '');
        
        products.push(product);
        
        var summaryItem = productsSummarized[product.itemName];
        if (!summaryItem) {
            summaryItem = { count: 0, gain: 0, loss: 0, sold: 0, bought: 0, networth: 0, listed: 0 };
            productsSummarized[product.itemName] = summaryItem;
        }
        
        summaryItem.count++;
        if (product.actedOn !== "") {
            var price = (product.price.replace('R$', ''));
            price = price.replace(/ /g, '');
            price = price.replace(',', '.');
            
            if (product.buyAction) {
                summaryItem.sold++;
                summaryItem.gain += +price;
                summaryItem.networth += +price;
            } else {
                summaryItem.bought++;
                summaryItem.loss += +price;
                summaryItem.networth -= +price;
            }
        } else {
            summaryItem.listed++;
        }
    }
    
    //console.log('Products:\n' + JSON.stringify(products));
    
    //console.log('\nSummarized:\n');
    
    var totalNetworth = 0;
    var totalCount = 0;
    for (var key in productsSummarized) {
        if (productsSummarized.hasOwnProperty(key)) {
            var value = productsSummarized[key];
            console.log(JSON.stringify(value) + ' - ' + key);
            
            totalNetworth += +value.networth;
            totalCount++;
        }
    }
    
    console.log('\nTotal networth: R$' + totalNetworth);
    console.log('Items traded: ' + totalCount);
    console.log('Transactions count: ' + rows.length);
}

fs.readFile(__dirname + '/resources/html/history-spool-sample.html', function (err, data) {
    if (err) {
        throw err; 
    }
    
    proccessHtml(data);
});