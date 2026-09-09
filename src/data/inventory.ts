export type Item = {
  id: string;
  name: string;
  sku: string;
  group: string;
  category: string;
  warehouse: string;
  stock: number;
  minimum: number;
  price: number;
  unit: string;
  supplier: string;
  dailyUsage: number;
  purchaseUnit: string;
  conversionFactor: number;
};

type Row = [name: string, sku: string, stock: number, minimum: number, price: number, unit: string, supplier?: string];

const inventory: Omit<Item, "id">[] = [];

function add(group: string, category: string, warehouse: string, supplier: string, rows: Row[]) {
  rows.forEach(([name, sku, stock, minimum, price, unit, customSupplier]) => {
    const conversion = getConversion(unit);
    inventory.push({ name, sku, group, category, warehouse, stock, minimum, price, unit, supplier: customSupplier ?? supplier, dailyUsage: 1, ...conversion });
  });
}

add("Bahan Mentah", "Dairy, Egg & Fats", "Chiller", "Greenfields / Diamond", [
  ["Fresh Milk Pasteurisasi 1 L", "DRY-MLK-PST-1L", 42, 18, 21000, "Kotak"],
  ["UHT Milk 1 L", "DRY-MLK-UHT-1L", 36, 15, 19500, "Kotak", "Diamond / Ultra Milk"],
  ["Evaporated Milk 380 g", "DRY-MLK-EVP-380", 18, 8, 17500, "Kaleng"],
  ["Condensed Milk 370 g", "DRY-MLK-CND-370", 26, 10, 14500, "Kaleng"],
  ["Heavy Cream 1 L", "DRY-CRM-HVY-1L", 12, 6, 92000, "Kotak", "Elle & Vire"],
  ["Whipping Cream Animal 1 L", "DRY-CRM-ANI-1L", 9, 6, 105000, "Kotak", "Anchor"],
  ["Whipping Cream Vegetable 1 L", "DRY-CRM-VEG-1L", 15, 6, 62000, "Kotak", "Rich's"],
  ["Unsalted Butter 500 g", "DRY-BTR-UNS-500", 14, 8, 75000, "Pack", "Anchor / Elle & Vire"],
  ["Salted Butter 500 g", "DRY-BTR-SLT-500", 8, 8, 73000, "Pack", "Anchor"],
  ["Margarin 1 kg", "DRY-MRG-001", 21, 8, 31000, "Pack", "Blue Band Master"],
  ["Keju Cheddar 2 kg", "DRY-CHS-CHD-2K", 10, 5, 178000, "Block", "Kraft / Prochiz"],
  ["Mozzarella 1 kg", "DRY-CHS-MOZ-1K", 7, 5, 118000, "Pack", "Greenfields"],
  ["Cream Cheese 1 kg", "DRY-CHS-CRM-1K", 5, 5, 148000, "Pack", "Anchor"],
  ["Telur Ayam", "DRY-EGG-TRAY", 11, 6, 57000, "Tray", "Supplier Telur Lokal"],
  ["Oat Milk Barista 1 L", "DRY-MLK-OAT-1L", 16, 8, 43000, "Kotak", "Oatside / Oatly"],
]);

add("Bahan Mentah", "Coffee, Tea & Cocoa", "Beverage Bar", "Roaster Lokal", [
  ["Biji Kopi House Blend Arabika/Robusta 70:30", "BEV-CFE-HBL-1K", 22, 10, 160000, "Kg", "Tanamera / Anomali"],
  ["Biji Kopi Arabika", "BEV-CFE-ARB-1K", 12, 8, 185000, "Kg", "Roaster Lokal"],
  ["Biji Kopi Robusta", "BEV-CFE-RBS-1K", 15, 8, 125000, "Kg", "Roaster Lokal"],
  ["Green Tea / Matcha Powder 1 kg", "BEV-PWD-MTC-1K", 6, 4, 145000, "Pack", "Toffin / SBI"],
  ["Black Tea Loose / Bag", "BEV-TEA-BLK", 18, 8, 68000, "Pack", "Dilmah"],
  ["Earl Grey Tea", "BEV-TEA-EGR", 9, 5, 82000, "Pack", "Twinings"],
  ["Chamomile Tea", "BEV-TEA-CHM", 4, 5, 86000, "Pack", "Dilmah"],
  ["Chocolate / Cocoa Powder 1 kg", "BEV-PWD-CCO-1K", 10, 5, 145000, "Pack", "Toffin / SBI"],
]);

add("Bahan Mentah", "Meat & Poultry", "Freezer", "IndoGuna / Japfa Best", [
  ["Daging Sapi Slice Shortplate AUS/US", "MEA-BEF-SLC-1K", 18, 8, 110000, "Kg", "IndoGuna / Classic Fine Foods"],
  ["Daging Sapi Ribeye", "MEA-BEF-RBY-1K", 8, 5, 225000, "Kg", "IndoGuna"],
  ["Daging Sapi Sirloin", "MEA-BEF-SRL-1K", 10, 5, 175000, "Kg", "IndoGuna"],
  ["Daging Sapi Minced", "MEA-BEF-MNC-1K", 14, 7, 98000, "Kg", "Classic Fine Foods"],
  ["Dada Ayam Boneless / Fillet", "MEA-CHK-BRS-1K", 24, 12, 53000, "Kg", "Japfa Best / Charoen Pokphand"],
  ["Paha Ayam Boneless / Fillet", "MEA-CHK-THG-1K", 19, 10, 49000, "Kg", "Japfa Best"],
  ["Daging Bebek", "MEA-DCK-001", 8, 5, 72000, "Kg", "Supplier Unggas Lokal"],
  ["Sosis Sapi", "MEA-SAU-BEF-1K", 13, 6, 89000, "Pack", "Bernardi"],
  ["Beef Bacon", "MEA-BCN-BEF-500", 7, 4, 96000, "Pack", "IndoGuna"],
  ["Pepperoni", "MEA-PPR-500", 6, 4, 88000, "Pack", "Classic Fine Foods"],
]);

add("Bahan Mentah", "Seafood", "Freezer", "Supplier Seafood Lokal", [
  ["Udang Kupas", "SEA-SHR-1K", 12, 6, 105000, "Kg"],
  ["Cumi Bersih", "SEA-SQD-1K", 9, 5, 82000, "Kg"],
  ["Ikan Dori Fillet", "SEA-DOR-1K", 15, 7, 69000, "Kg"],
  ["Salmon Fillet", "SEA-SLM-1K", 5, 5, 245000, "Kg", "Classic Fine Foods"],
  ["Kepiting", "SEA-CRB-1K", 4, 3, 135000, "Kg"],
  ["Kerang", "SEA-SHL-1K", 7, 4, 52000, "Kg"],
]);

add("Bahan Mentah", "Sayuran & Buah Segar", "Chiller", "Pasar Induk / Supplier Produce", [
  ["Selada Romaine", "VEG-LTC-ROM", 10, 5, 36000, "Kg"], ["Selada Iceberg", "VEG-LTC-ICE", 8, 5, 33000, "Kg"],
  ["Tomat", "VEG-TMT-001", 16, 8, 18000, "Kg"], ["Bawang Bombay", "VEG-ONI-BMB", 12, 6, 32000, "Kg"],
  ["Bawang Putih", "VEG-ONI-GRL", 9, 5, 42000, "Kg"], ["Bawang Merah", "VEG-ONI-SHL", 11, 5, 39000, "Kg"],
  ["Daun Bawang", "VEG-SCL-001", 6, 4, 27000, "Kg"], ["Cabai Merah", "VEG-CHI-RED", 7, 4, 46000, "Kg"],
  ["Cabai Keriting", "VEG-CHI-CUR", 5, 4, 52000, "Kg"], ["Cabai Rawit", "VEG-CHI-BIR", 3, 4, 61000, "Kg"],
  ["Lemon", "FRT-LMN-001", 10, 5, 48000, "Kg"], ["Lime", "FRT-LIM-001", 12, 6, 31000, "Kg"],
  ["Alpukat", "FRT-AVC-001", 7, 5, 38000, "Kg"], ["Stroberi", "FRT-STR-250", 9, 5, 28000, "Pack"],
  ["Pisang", "FRT-BNN-001", 14, 7, 22000, "Sisir"],
]);

add("Bahan Mentah", "Dry Goods & Seasoning", "Dry Storage", "Lotte Grosir / Indogrosir", [
  ["Tepung Terigu Protein Tinggi 25 kg", "DRY-FLR-HIG-25K", 9, 4, 245000, "Sak", "Bogasari"],
  ["Tepung Terigu Protein Sedang 25 kg", "DRY-FLR-MED-25K", 8, 4, 235000, "Sak", "Bogasari"],
  ["Tepung Terigu Protein Rendah 25 kg", "DRY-FLR-LOW-25K", 6, 4, 228000, "Sak", "Bogasari"],
  ["Tepung Tapioka 1 kg", "DRY-FLR-TAP-1K", 18, 8, 16000, "Pack"], ["Maizena 1 kg", "DRY-FLR-CRN-1K", 15, 7, 25000, "Pack"],
  ["Tepung Panir 1 kg", "DRY-FLR-BRC-1K", 12, 6, 29000, "Pack"], ["Beras Premium 25 kg", "DRY-RCE-PRM-25K", 7, 4, 405000, "Sak"],
  ["Pasta Spaghetti 500 g", "DRY-PST-SPG-500", 24, 10, 27000, "Pack"], ["Pasta Penne 500 g", "DRY-PST-PNE-500", 18, 8, 29000, "Pack"],
  ["Pasta Macaroni 500 g", "DRY-PST-MCR-500", 16, 8, 24000, "Pack"], ["Gula Pasir 1 kg", "DRY-SGR-WHT-1K", 28, 12, 18000, "Kg"],
  ["Gula Aren 1 kg", "DRY-SGR-PLM-1K", 14, 7, 42000, "Kg"], ["Garam", "DRY-SLT-001", 20, 8, 12000, "Kg"],
  ["Lada Putih", "DRY-PPR-WHT-500", 7, 4, 68000, "Pack"], ["Lada Hitam", "DRY-PPR-BLK-500", 8, 4, 72000, "Pack"],
  ["MSG", "DRY-SSN-MSG-1K", 10, 5, 31000, "Pack"], ["Chicken Powder", "DRY-SSN-CHK-1K", 9, 5, 76000, "Pack"],
  ["Minyak Goreng 18 L", "DRY-OIL-FRY-18L", 8, 5, 335000, "Jeriken"], ["Olive Oil 1 L", "DRY-OIL-OLV-1L", 6, 4, 138000, "Botol"],
  ["Sesame Oil 600 ml", "DRY-OIL-SSM-600", 7, 4, 78000, "Botol"],
]);

add("Semi-Finished", "Sauce & Dressings", "Chiller Prep", "Produksi Internal", [
  ["House-made BBQ Sauce", "PRE-SAU-BBQ", 9, 5, 48000, "Liter"], ["Blackpepper Sauce", "PRE-SAU-BLP", 8, 5, 52000, "Liter"],
  ["Sambal Ulek", "PRE-SMB-ULK", 6, 4, 35000, "Kg"], ["Sambal Matah", "PRE-SMB-MTH", 5, 4, 46000, "Kg"],
  ["Mayonnaise Dressing", "PRE-DRS-MAY", 10, 5, 59000, "Liter"], ["Caesar Dressing", "PRE-DRS-CES", 4, 4, 68000, "Liter"],
  ["Garlic Butter", "PRE-BTR-GRL", 6, 4, 72000, "Kg"],
]);

add("Semi-Finished", "Batch Prep & Pre-cook", "Chiller Prep", "Produksi Internal", [
  ["Patty Sapi Portioned", "PRE-PTY-BEF", 36, 16, 18000, "Porsi"], ["Marinasi Ayam", "PRE-MRN-CHK", 28, 12, 14500, "Porsi"],
  ["Kaldu Ayam", "PRE-STK-CHK", 8, 4, 32000, "Liter"], ["Kaldu Sapi", "PRE-STK-BEF", 6, 4, 45000, "Liter"],
  ["Simple Syrup", "PRE-SYR-SMP", 12, 5, 18000, "Liter"], ["Sugar Syrup", "PRE-SYR-SGR", 10, 5, 22000, "Liter"],
  ["Cold Brew Concentrate", "PRE-CFE-CBR", 7, 4, 85000, "Liter"],
]);

add("Semi-Finished", "Bakery Prep", "Freezer Prep", "Produksi Internal", [
  ["Adonan Roti / Dough Frozen", "PRE-DGH-FRZ", 24, 10, 12000, "Porsi"],
  ["Whipped Cream Prepared", "PRE-CRM-WHP", 6, 4, 54000, "Liter"],
  ["Isian Pastry Custard", "PRE-FIL-CST", 5, 4, 62000, "Kg"],
  ["Isian Pastry Ganache", "PRE-FIL-GNC", 4, 4, 78000, "Kg"],
]);

add("Sirup & Topping", "Flavored Syrups", "Beverage Bar", "Toffin / Monin / Dripp", [
  ["Vanilla Syrup 700 ml", "SYR-VNL-700", 13, 6, 125000, "Botol"], ["Caramel Syrup 700 ml", "SYR-CRL-700", 11, 6, 125000, "Botol"],
  ["Hazelnut Syrup 700 ml", "SYR-HZN-700", 8, 5, 135000, "Botol"], ["Palm Sugar Syrup 1 L", "SYR-PLM-1L", 15, 7, 98000, "Botol"],
  ["Lychee Syrup", "SYR-FRT-LYC", 7, 4, 105000, "Botol"], ["Peach Syrup", "SYR-FRT-PCH", 7, 4, 105000, "Botol"],
  ["Mango Syrup", "SYR-FRT-MNG", 6, 4, 98000, "Botol"], ["Strawberry Syrup", "SYR-FRT-STR", 8, 4, 98000, "Botol"],
  ["Passion Fruit Syrup", "SYR-FRT-PSF", 5, 4, 112000, "Botol"], ["Mojito Mint Syrup", "SYR-MNT-001", 6, 4, 115000, "Botol"],
]);

add("Sirup & Topping", "Sauces & Toppings", "Beverage Bar", "Toffin / Supplier Lokal", [
  ["Chocolate Sauce", "TOP-SAU-CHO", 10, 5, 92000, "Botol"], ["Caramel Sauce", "TOP-SAU-CRL", 8, 5, 98000, "Botol"],
  ["Matcha Sauce", "TOP-SAU-MTC", 5, 4, 115000, "Botol"], ["Tapioca Boba", "TOP-BOB-TAP", 12, 6, 52000, "Pack"],
  ["Grass Jelly", "TOP-JLY-GRS", 8, 4, 38000, "Pack"], ["Popping Boba", "TOP-BOB-POP", 7, 4, 72000, "Jar"],
  ["Oreo Biscuit Crumbs", "TOP-CRM-ORE", 9, 4, 56000, "Pack"], ["Lotus Biscoff Crumbs", "TOP-CRM-BSC", 6, 4, 86000, "Pack"],
  ["Sprinkles", "TOP-SPR-001", 0, 4, 45000, "Pack"],
]);

add("Kemasan", "Beverage Packaging", "Packaging Store", "Kyodo / Sip Fancy", [
  ["Paper Cup Hot 8 oz", "PKG-CUP-H08", 18, 8, 42000, "Pack"], ["Paper Cup Hot 12 oz", "PKG-CUP-H12", 16, 8, 48000, "Pack"],
  ["Plastic Cup Cold 12 oz", "PKG-CUP-C12", 22, 10, 38000, "Pack"], ["Plastic Cup PET 16 oz + Lid", "PKG-CUP-C16", 26, 12, 42500, "Pack"],
  ["Plastic Cup Cold 22 oz", "PKG-CUP-C22", 14, 8, 52000, "Pack"], ["Cup Lid Flat", "PKG-LID-FLT", 18, 8, 24000, "Pack"],
  ["Cup Lid Dome", "PKG-LID-DOM", 12, 8, 29000, "Pack"], ["Cup Lid Strawless", "PKG-LID-STL", 9, 6, 36000, "Pack"],
  ["Sealer Film Roll", "PKG-SLR-FLM", 7, 4, 77500, "Roll", "Getra / Eaton"], ["Sedotan Plastik", "PKG-STR-PLS", 20, 8, 18000, "Pack"],
  ["Sedotan Kertas", "PKG-STR-PPR", 10, 6, 32000, "Pack"], ["Sedotan Boba", "PKG-STR-BOB", 12, 6, 26000, "Pack"],
  ["Cup Holder / Tray", "PKG-CUP-HLD", 8, 6, 35000, "Pack"],
]);

add("Kemasan", "Food Packaging", "Packaging Store", "PaperKlip / Packgora", [
  ["Paper Lunch Box S", "PKG-BOX-LBS", 14, 8, 62000, "Pack"], ["Paper Lunch Box M Waterproof", "PKG-BOX-LBM", 12, 8, 72500, "Pack"],
  ["Paper Lunch Box L", "PKG-BOX-LBL", 9, 7, 88000, "Pack"], ["Rice Bowl Container", "PKG-BWL-RCE", 16, 8, 68000, "Pack"],
  ["Bento Box", "PKG-BOX-BNT", 10, 6, 85000, "Pack"], ["Kraft Window Box", "PKG-BOX-KRF", 8, 6, 92000, "Pack"],
  ["Aluminum Foil Tray", "PKG-TRY-ALM", 7, 5, 76000, "Pack"], ["Greaseproof Paper / Kertas Roti", "PKG-PPR-GRS", 11, 6, 48000, "Pack"],
]);

add("Kemasan", "Cutlery & Accessories", "Packaging Store", "Indogrosir / Supplier Kemasan", [
  ["Sendok Plastik", "PKG-CTL-SPN", 15, 8, 24000, "Pack"], ["Garpu Plastik", "PKG-CTL-FRK", 14, 8, 24000, "Pack"],
  ["Sumpit Sekali Pakai", "PKG-CTL-CHP", 12, 6, 28000, "Pack"], ["Tissue Makan", "PKG-TIS-NPK", 20, 10, 18000, "Pack"],
  ["Tissue Serve", "PKG-TIS-SRV", 12, 6, 25000, "Pack"], ["Paper Bag", "PKG-BAG-PPR", 10, 7, 58000, "Pack"],
  ["Plastik Takeaway Singlet / Oso", "PKG-BAG-PLS", 16, 8, 36000, "Pack"],
]);

add("Operasional", "Kitchen Consumables", "Hygiene Store", "Lotte Grosir / Supplier Hygiene", [
  ["Plastic Wrap / Cling Film", "OPS-WRP-CLG", 9, 5, 68000, "Roll"], ["Aluminum Foil Roll", "OPS-WRP-ALM", 7, 5, 82000, "Roll"],
  ["Baking Paper", "OPS-PPR-BKG", 8, 5, 58000, "Roll"], ["Sarung Tangan Latex", "OPS-GLV-LTX", 10, 6, 72000, "Box"],
  ["Sarung Tangan Plastik", "OPS-GLV-PLS", 15, 8, 28000, "Pack"], ["Hairnet", "OPS-HRN-001", 12, 6, 32000, "Pack"],
  ["Masker", "OPS-MSK-001", 11, 6, 35000, "Box"],
]);

add("Operasional", "Cleaning Chemicals", "Chemical Store", "Supplier Cleaning Komersial", [
  ["Sabun Cuci Piring Komersial", "CLN-DSH-SOP", 10, 5, 85000, "Jeriken"], ["Liquid Degreaser", "CLN-DEG-LQD", 6, 4, 115000, "Jeriken"],
  ["Sanitizer / Surface Disinfectant", "CLN-SNT-SRF", 8, 5, 98000, "Jeriken"], ["Hand Soap", "CLN-HND-SOP", 9, 5, 76000, "Jeriken"],
  ["Liquid Descaler Mesin Kopi / Ice Maker", "CLN-DSC-LQD", 3, 4, 135000, "Botol"], ["Floor Cleaner", "CLN-FLR-001", 7, 4, 88000, "Jeriken"],
]);

add("Operasional", "Hygiene & Waste", "Hygiene Store", "Supplier Hygiene Lokal", [
  ["Plastik Sampah Hitam", "WST-BAG-BLK", 14, 7, 45000, "Pack"], ["Plastik Sampah Kuning", "WST-BAG-YLW", 6, 5, 52000, "Pack"],
  ["Plastik Sampah Transparan", "WST-BAG-CLR", 8, 5, 48000, "Pack"], ["Kain Lap Microfiber", "HYG-CLT-MCF", 18, 8, 15000, "Pcs"],
  ["Spons Cuci Piring", "HYG-SPG-DSH", 20, 10, 5000, "Pcs"], ["Pad Sabut Kawat", "HYG-PAD-STL", 12, 6, 8000, "Pcs"],
  ["Sikat Pipa / Grinder", "HYG-BRS-PIP", 5, 4, 38000, "Pcs"],
]);

export const seedItems: Item[] = inventory.map((item, index) => ({ ...item, id: String(index + 1), dailyUsage: (index % 6) + 1 }));

function getConversion(unit: string) {
  const conversions: Record<string, { purchaseUnit: string; conversionFactor: number }> = {
    Kotak: { purchaseUnit: "Kardus", conversionFactor: 12 }, Botol: { purchaseUnit: "Karton", conversionFactor: 12 },
    Pack: { purchaseUnit: "Karton", conversionFactor: 10 }, Kaleng: { purchaseUnit: "Karton", conversionFactor: 24 },
    Pcs: { purchaseUnit: "Box", conversionFactor: 50 }, Kg: { purchaseUnit: "Sak", conversionFactor: 25 },
    Liter: { purchaseUnit: "Jeriken", conversionFactor: 5 }, Porsi: { purchaseUnit: "Batch", conversionFactor: 20 },
    Roll: { purchaseUnit: "Karton", conversionFactor: 6 }, Tray: { purchaseUnit: "Krat", conversionFactor: 10 },
  };
  return conversions[unit] ?? { purchaseUnit: unit, conversionFactor: 1 };
}

export const groupColors: Record<string, string> = {
  "Bahan Mentah": "#6d5dfc",
  "Semi-Finished": "#18b6a4",
  "Sirup & Topping": "#ffb547",
  Kemasan: "#50a5ff",
  Operasional: "#b5ef4a",
};
