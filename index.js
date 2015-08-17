var fs = require('fs');
var cheerio = require('cheerio');

var products = [];
var productsSummarized = [];
var transactionsCount = 0;

var fileCount = 0;
var filesParsedCount = 0;
var filesWithError = 0;

function consolidateInfo() {
    console.log('\n');
    
    var totalNetworth = 0;
    var totalCount = 0;
    for (var key in productsSummarized) {
        if (productsSummarized.hasOwnProperty(key)) {
            var value = productsSummarized[key];
            console.log(key + ' - ' + JSON.stringify(value));
            
            totalNetworth += +value.networth;
            totalCount++;
        }
    }
    
    console.log('\nTotal networth: R$' + totalNetworth);
    console.log('Items traded: ' + totalCount);
    console.log('Transactions count: ' + transactionsCount);
}

function proccessHtml(data) {
    $ = cheerio.load(data);
    
    var rows = $('.market_listing_row');
    
    for (var i = 0; i < rows.length; i++) {
        var currentRow = $(rows[i]);
        
        var product = {};
        
        product.price = currentRow.find('.market_listing_price').text().trim();
        
        var listingCancelled = false;
        
        var buyerText = currentRow.find('.market_listing_whoactedwith_name_block').text();
        if (!buyerText) {
            var listingText = currentRow.find('.market_listing_whoactedwith').text().trim();
            if (listingText.indexOf('created') === -1) {
                listingCancelled = true;
            }
        } else {
            var isBuyer = buyerText.indexOf("Buyer:") > -1;
            product.buyAction = isBuyer;
        }
        
        var dates = $(currentRow.find('.market_listing_listed_date'));        
        var actedOn, listedOn;
        actedOn = dates.first().text().trim();
        listedOn = dates.last().text().trim();
        
        product.actedOn = actedOn;
        product.listedOn = listedOn;
        
        product.itemName = currentRow.find('.market_listing_item_name').text().trim();
        product.gameName = currentRow.find('.market_listing_game_name').text().trim();
        
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
            if (listingCancelled) {
                summaryItem.listed--;
            } else {
                summaryItem.listed++;
            }
        }
    }
        
    //console.log('Products:\n' + JSON.stringify(products));
    
    transactionsCount += rows.length;
    console.log('this file had: ' + rows.length + ' transactions.\n');
}


function readFromHTML() {
    fs.readFile(__dirname + '/resources/html/history-spool-sample.html', function (err, data) {
        if (err) {
            throw err; 
        }

        proccessHtml(data);
    });
}

function readRawFile(filepath) {
    fs.readFile(filepath, function (err, data) {
        console.log('Finished reading file ' + filepath);
        
        if (err) {
            throw err; 
        }

        var rawToJSON;
        try {
            rawToJSON = JSON.parse(data);
        } catch (someException) {
            filesWithError++;
            isAllInfoParsed();
            console.log(someException);
            return;
        }
        
        var results = rawToJSON.results_html;
        
        var resultHTML = results.slice(1, -1);
        resultHTML = resultHTML.replace(/\"/g, '"');
        resultHTML = resultHTML.replace(/divclass/g, 'div class');
        
        //console.log(resultHTML);
        
        proccessHtml(resultHTML);
        
        filesParsedCount++;
        
        isAllInfoParsed();
    });
}

function readAllRawFiles(basePath) {
    fs.readdir(basePath, function (err, files) {
        if (err) {
            throw err;
        }
        
        fileCount = files.length;
        
        for (var i = 0; i < files.length; i++) {
            readRawFile(basePath + '/' + files[i]);
        }
    });
}

function isAllInfoParsed() {
    if ((filesParsedCount + filesWithError) === fileCount) {    
        consolidateInfo();
    }
}

var baseRawPath = __dirname + '/resources/raw';
readAllRawFiles(baseRawPath);
//var rawTestPath = __dirname + '/resources/raw/my-trade-history-spool.txt';
//readRawFile(rawTestPath);