const fs = require('fs');

const filePath = 'src/pages/CartPage.jsx';
let content = fs.readFileSync(filePath, 'utf8');

// Replace the onClick handler to make it async
content = content.replace(
  /onClick=\{\(\) => \{[\s\S]*?const resp = applyCoupon\(couponInput\);/,
  'onClick={async () => {\n                      const resp = await applyCoupon(couponInput);'
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ Fixed async/await issue in CartPage.jsx');
