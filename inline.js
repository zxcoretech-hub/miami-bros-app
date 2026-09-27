const fs = require('fs');
const configContent = fs.readFileSync('public/js/tailwind-config.js', 'utf8');
let html = fs.readFileSync('public/index.html', 'utf8');

let cleanConfig = configContent.replace('window.tailwind = window.tailwind || {};\nwindow.tailwind.config', 'tailwind.config');

html = html.replace('<script src="js/tailwind-config.js"></script>', '');

const inlineScript = '<script>\n' + cleanConfig + '\n</script>';
html = html.replace('<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>', '<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>\n    ' + inlineScript);

fs.writeFileSync('public/index.html', html);
console.log('Inlined tailwind config');
