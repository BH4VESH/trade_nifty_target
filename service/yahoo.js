const axios = require("axios");

const client = axios.create({
  timeout: 10000,
  headers: {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/137.0 Safari/537.36",
  },
});

async function getQuote(symbol) {
  try {
    const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(symbol)}`;

    const { data } = await client.get(url);

    const result = data?.chart?.result?.[0];

    if (!result) {
      console.log(`No data: ${symbol}`);
      return null;
    }

    const meta = result.meta;
    const quote = result.indicators.quote[0];

    return {
      symbol,
      company: meta.longName || meta.shortName,
      regularMarketPrice: meta.regularMarketPrice,
      regularMarketPreviousClose: meta.previousClose,
      regularMarketOpen: quote.open?.[0],
      regularMarketDayHigh: quote.high?.[0],
      regularMarketDayLow: quote.low?.[0],
      regularMarketVolume: quote.volume?.[0],
    };
  } catch (err) {
    console.log(`Failed ${symbol}: ${err.message}`);
    return null;
  }
}

module.exports = {
  getQuote,
};
