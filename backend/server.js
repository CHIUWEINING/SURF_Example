const express = require('express');
const { Pool } = require('pg'); // Import PostgreSQL client
const cors = require('cors'); // Import the cors middleware
const fs = require('fs');
const app = express();

app.use(cors()); // Enable CORS for all routes

// PostgreSQL connection details
const pool = new Pool({
  connectionString: 'postgres://<user>:<password>@<host>:<port>/<database>',
  ssl: {
    rejectUnauthorized: false // This might be necessary depending on Render's SSL setup
  }
});

// Read the top50.txt file into an array of valid tickers
let top50Tickers = [];
fs.readFile('./top50.txt', 'utf8', (err, data) => {
  if (err) {
    console.error('Error reading top50.txt:', err);
    return;
  }
  top50Tickers = data.split('\n').map(ticker => ticker.trim()); // Create array of tickers
});

// API endpoint to filter relations based on top50.txt
app.get('/api/relations', async (req, res) => {
  const { year = 2023 } = req.query;
  try {
    // Ensure top50Tickers array is not empty
    if (top50Tickers.length === 0) {
      return res.status(400).json({ error: 'No tickers available in top50.txt' });
    }
    
    // Create a query that filters company1 and company2 based on top50Tickers
    const query = `
      SELECT * FROM relations
      WHERE company1_ticker = ANY($1) AND company2_ticker = ANY($1) AND year = $2
    `;
    
    // Execute the query with top50Tickers array as parameter
    const result = await pool.query(query, [top50Tickers, year]);

    // Collect all unique nodes from the result
    const nodes = {};
    result.rows.forEach(row => {
      const company1_str = row.company1 + " (" + row.company1_ticker + ")";
      const company2_str = row.company2 + " (" + row.company2_ticker + ")";

      // Store company1 and company2 information, including their sectors
      nodes[company1_str] = {
        id: company1_str,
        ticker: row.company1_ticker,
        sector: row.company1_sector, // Add company1 sector
        cap: row.company1_cap
      };
      nodes[company2_str] = {
        id: company2_str,
        ticker: row.company2_ticker,
        sector: row.company2_sector, // Add company2 sector
        cap: row.company2_cap
      };
    });

    // Format the response as { nodes: [], links: [] }
    res.json({
      nodes: Object.values(nodes), // Convert the nodes object to an array
      links: result.rows.map(row => ({
        source: row.company1 + " (" + row.company1_ticker + ")",
        source_ticker: row.company1_ticker,
        source_sector: row.company1_sector, // Include company1_sector in link
        target: row.company2 + " (" + row.company2_ticker + ")",
        target_ticker: row.company2_ticker,
        target_sector: row.company2_sector, // Include company2_sector in link
        value: row.relation_value,
        ranking: row.ranking,
        summary: row.summary,
        mutual_company1: row.mutual_company1,
        mutual_company2: row.mutual_company2
      }))
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/nodesData', (req, res) => {
  fs.readFile('./valid_firm_names1.txt', 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading valid.txt:', err);
      return res.status(500).json({ error: 'Failed to read file' });
    }

    const nodesData = data.split('\n').map(ticker => ticker.trim());
    res.json(nodesData); // Send the array of tickers as the response
  });
});

// API to fetch relations based on settings
app.get('/api/filter-relations', async (req, res) => {
  const { main_company, topK = 10, relationStrength = 'strongest', threshold = 0, year=2023 } = req.query;
  let query = `SELECT * FROM relations WHERE relation_value >= $1 AND year = $2`;
  let params = [threshold, year];

  if (main_company !== 'All Companies') {
    query += ` AND (company1_ticker = $3 OR company2_ticker = $4)`;
    params.push(main_company, main_company);
  }

  query += ` ORDER BY relation_value ${relationStrength === 'strongest' ? 'DESC' : 'ASC'} LIMIT $${params.length + 1}`;
  params.push(parseInt(topK));

  try {
    const result = await pool.query(query, params);

    // Collect all unique nodes from the result
    const nodes = {};
    result.rows.forEach(row => {
      const company1_str = row.company1 + " (" + row.company1_ticker + ")";
      const company2_str = row.company2 + " (" + row.company2_ticker + ")";

      // Store company1 and company2 information, including their sectors
      nodes[company1_str] = {
        id: company1_str,
        ticker: row.company1_ticker,
        sector: row.company1_sector, // Add company1 sector
        cap: row.company1_cap
      };
      nodes[company2_str] = {
        id: company2_str,
        ticker: row.company2_ticker,
        sector: row.company2_sector, // Add company2 sector
        cap: row.company2_cap
      };
    });

    // Format the response as { nodes: [], links: [] }
    res.json({
      nodes: Object.values(nodes), // Convert the nodes object to an array
      links: result.rows.map(row => ({
        source: row.company1 + " (" + row.company1_ticker + ")",
        source_ticker: row.company1_ticker,
        source_sector: row.company1_sector, // Include company1_sector in link
        target: row.company2 + " (" + row.company2_ticker + ")",
        target_ticker: row.company2_ticker,
        target_sector: row.company2_sector, // Include company2_sector in link
        value: row.relation_value,
        ranking: row.ranking,
        summary: row.summary,
        mutual_company1: row.mutual_company1,
        mutual_company2: row.mutual_company2
      }))
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start the server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
