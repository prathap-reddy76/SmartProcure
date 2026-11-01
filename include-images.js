const fs = require('fs');
const path = 'src/app/(roles)/shop/products/[productId]/edit/page.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  /const product = await prisma\.product\.findUnique\(\{\n    where: \{ id: params\.productId, shopId: shop\.id \},\n  \}\);/,
  `const product = await prisma.product.findUnique({
    where: { id: params.productId, shopId: shop.id },
    include: { images: { orderBy: { sortOrder: 'asc' }, take: 1 } }
  });`
);

fs.writeFileSync(path, content, 'utf8');
console.log("Updated product query to include images.");
