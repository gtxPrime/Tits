# Run local regression checks

Requires Node.js and npm. From this folder:

```
npm install
npx playwright install chromium
npm test
```

This starts a local fixture on port 8989, loads the full unpacked extension in Chromium, tests editable Ace and ordinary inputs, writes results.json and a screenshot, then closes the browser. Use a free port 8989. The fixture does not contact the IITM portal. The Ace fixture does not enforce read-only mode or assessment restrictions.
