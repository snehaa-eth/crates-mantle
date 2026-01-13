// mergeStocks.js
import fs from "fs";

// Read files
const stocks = JSON.parse(fs.readFileSync("./xstocks_json.json", "utf8"));
const metrics = JSON.parse(fs.readFileSync("./csvjson.json", "utf8"));

const result = [];
let totalWeight = 0;

for (const stock of stocks.data) {
 
    const metric = metrics.find(m => m["__3"] === stock.symbol);

    if (metric) {
      

        result.push({
            stock: stock._id, 
            weight: metric["__6"],
        });

        totalWeight += metric["__6"];
    }
}

// Output result
console.log(JSON.stringify(result, null, 2));
console.log(`Total weight: ${totalWeight}`);

// Save result
fs.writeFileSync("./merged_result.json", JSON.stringify(result, null, 2));

console.log("✅ Merge completed! Saved to merged_result.json");
