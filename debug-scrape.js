const axios = require('axios');
const cheerio = require('cheerio');

async function scrape() {
    try {
        console.log("Fetching...");
        // Mock user agent to avoid basic blocks
        const { data } = await axios.get('https://giavang.org/', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });
        console.log("Fetched. Length:", data.length);
        const $ = cheerio.load(data);

        const tables = $('table');
        console.log("Tables found:", tables.length);

        tables.each((i, table) => {
            // Try to find a preceding header to identify table type
            const prevHeading = $(table).prevAll('h2, h3, div').first().text().trim();
            console.log(`\n--- Table ${i} [Context: ${prevHeading}] ---`);

            // Log Headers
            const headers = $(table).find('th').map((k, col) => $(col).text().trim()).get();
            console.log(`  Headers:`, headers);

            // Log first 3 rows
            $(table).find('tr').slice(0, 5).each((j, row) => {
                const cols = $(row).find('td').map((k, col) => $(col).text().trim()).get();
                if (cols.length > 0) console.log(`  Row ${j}:`, cols);
            });
        });

        // Try specific selector from route.ts
        console.log("Testing specific selector...");
        $('td:contains("SJC")').each((i, el) => {
            console.log("Found SJC cell:", $(el).text());
            const row = $(el).closest('tr');
            const cols = row.find('td').map((k, col) => $(col).text().trim()).get();
            console.log("  Row context:", cols);
        });

    } catch (e) {
        console.error("Error:", e.message);
    }
}

scrape();
