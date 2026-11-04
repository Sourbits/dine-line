const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');

// Read a JSON file from data/ and return its array.
// If the file is missing, empty or broken, return [] instead of crashing.
function readJSON(filename) {
  const filePath = path.join(DATA_DIR, filename);
  try {
    const text = fs.readFileSync(filePath, 'utf8');
    if (text.trim() === '') {
      return [];
    }
    const data = JSON.parse(text);
    return Array.isArray(data) ? data : [];
  } catch (err) {
    if (err.code !== 'ENOENT') {
      console.error(`Could not read ${filename}:`, err.message);
    }
    return [];
  }
}

// Save an array to a JSON file in data/ (pretty-printed so it's easy to read).
function writeJSON(filename, data) {
  const filePath = path.join(DATA_DIR, filename);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

module.exports = { readJSON, writeJSON };
