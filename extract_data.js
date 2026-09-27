const fs = require('fs');

const html = fs.readFileSync('public/index.html', 'utf8');

// We need to extract the data manually. Let's output it as JSON.
// Using regex since we don't have cheerio.
const menuItems = [];

// The menu items are inside <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-space-lg">
// And each item has an <img>, an <h3>, a <p>, and a span with the price.
// Also a badge.
let menuSectionRegex = /<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-space-lg">([\s\S]*?)<\/section>/i;
let menuMatch = html.match(menuSectionRegex);

if (menuMatch) {
  let menuHtml = menuMatch[1];
  let itemRegex = /<div class="bg-surface-container-lowest[^>]*>([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>/gi;
  let itemMatch;
  while ((itemMatch = itemRegex.exec(menuHtml)) !== null) {
    let itemHtml = itemMatch[1];
    
    // Extract Image
    let imgRegex = /<img alt="([^"]+)"[^>]*src="([^"]+)"/;
    let imgMatch = itemHtml.match(imgRegex);
    let title = imgMatch ? imgMatch[1] : '';
    let image = imgMatch ? imgMatch[2] : '';

    // Extract Badge
    let badgeRegex = /<span class="absolute top-3 left-3[^>]*>([^<]+)<\/span>/;
    let badgeMatch = itemHtml.match(badgeRegex);
    let badgeClass = badgeMatch ? badgeMatch[0].match(/class="([^"]+)"/)[1] : '';
    let badge = badgeMatch ? badgeMatch[1] : '';

    // Extract Description
    let descRegex = /<p class="font-body-sm[^>]*>([\s\S]*?)<\/p>/;
    let descMatch = itemHtml.match(descRegex);
    let description = descMatch ? descMatch[1].trim() : '';

    // Extract Price
    let priceRegex = /<span class="font-headline-sm[^>]*>([\$0-9\. USD]+)<\/span>/;
    let priceMatch = itemHtml.match(priceRegex);
    let priceStr = priceMatch ? priceMatch[1] : '';
    let price = parseFloat(priceStr.replace(/[^0-9.]/g, ''));

    // Message for WhatsApp
    let waRegex = /href="https:\/\/wa\.me\/\?text=([^"]+)"/;
    let waMatch = itemHtml.match(waRegex);
    let waMessage = waMatch ? decodeURIComponent(waMatch[1]) : '';

    if (title) {
      menuItems.push({
        id: menuItems.length + 1,
        title,
        image,
        badge,
        badgeClass,
        description,
        price,
        priceStr,
        waMessage
      });
    }
  }
}

fs.writeFileSync('public/js/data.js', 'const menuItems = ' + JSON.stringify(menuItems, null, 2) + ';\n');
console.log('Saved data.js with ' + menuItems.length + ' menu items.');

// Now we can replace the HTML content of the menu container with an empty div.
let newHtml = html.replace(/(<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-space-lg">)[\s\S]*?(<\/section>)/i, '$1</div>\n$2');
fs.writeFileSync('public/index.html', newHtml);
console.log('Cleared menu items from index.html');
