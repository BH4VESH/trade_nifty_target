const YahooFinance = require("yahoo-finance2").default;
const axios = require("axios");
const SunCalc = require("suncalc");
const sweph = require("sweph");
let latestData = [];

const yahooFinance = new YahooFinance({
  suppressNotices: ["yahooSurvey"],
});

const sectors = [
  { sector: "NIFTY 50", symbol: "^NSEI" },
  { sector: "NIFTY BANK", symbol: "^NSEBANK" },
  { sector: "NIFTY IT", symbol: "^CNXIT" },
  { sector: "NIFTY AUTO", symbol: "^CNXAUTO" },
  { sector: "NIFTY PHARMA", symbol: "^CNXPHARMA" },
  { sector: "NIFTY FMCG", symbol: "^CNXFMCG" },
  { sector: "NIFTY METAL", symbol: "^CNXMETAL" },
  { sector: "NIFTY REALTY", symbol: "^CNXREALTY" },
  { sector: "NIFTY ENERGY", symbol: "^CNXENERGY" },
  { sector: "NIFTY PSU BANK", symbol: "^CNXPSUBANK" },
  { sector: "NIFTY FIN SERVICE", symbol: "NIFTY_FIN_SERVICE.NS" },
];

const durMuhurat = {
  0: [14],
  1: [12, 13],
  2: [4, 11],
  3: [8],
  4: [6, 12],
  5: [4, 9],
  6: [1, 2],
};

// Mock Nakshatra Data
// function getNakshatraData() {
//   return {
//     nakshatra: 'Rohini',
//     bias: 'Bullish',
//     astroScore: 10
//   };
// }

// Simple Gann 90 Formula
// function calculateGann90(openPrice) {
//   return Number(Math.pow(Math.sqrt(openPrice) + 0.25, 2).toFixed(2));
// }

function getGannLevels(price) {
  const root = Math.sqrt(price);

  return {
    gannM360: Math.pow(root - 1.0, 2),
    gannM270: Math.pow(root - 0.75, 2),
    gannM180: Math.pow(root - 0.5, 2),
    gannM90: Math.pow(root - 0.25, 2),

    gann90: Math.pow(root + 0.25, 2),
    gann180: Math.pow(root + 0.5, 2),
    gann270: Math.pow(root + 0.75, 2),
    gann360: Math.pow(root + 1.0, 2),
  };
}

async function getSectorData(item) {
  try {
    const quote = await yahooFinance.quote(item.symbol);

    const livePrice = Number(quote.regularMarketPrice || 0);
    const dailyOpen = Number(quote.regularMarketOpen || 0);

    // const gann90 = calculateGann90(dailyOpen);

    // const position = livePrice > gann90 ? "Above" : "Below";

    const gann = getGannLevels(dailyOpen);

    let position = "";
    let strength = "";

    if (livePrice > gann.gann360) {
      position = "Above G360";
      strength = "EXTREMELY BULLISH";
    } else if (livePrice > gann.gann270) {
      position = "Above G270";
      strength = "STRONG BULLISH";
    } else if (livePrice > gann.gann180) {
      position = "Above G180";
      strength = "BULLISH";
    } else if (livePrice > gann.gann90) {
      position = "Above G90";
      strength = "MILD BULLISH";
    } else if (livePrice < gann.gannM360) {
      position = "Below M360";
      strength = "EXTREMELY BEARISH";
    } else if (livePrice < gann.gannM270) {
      position = "Below M270";
      strength = "STRONG BEARISH";
    } else if (livePrice < gann.gannM180) {
      position = "Below M180";
      strength = "BEARISH";
    } else if (livePrice < gann.gannM90) {
      position = "Below M90";
      strength = "MILD BEARISH";
    } else {
      position = "Between M90 & G90";
      strength = "NEUTRAL";
    }

    const direction = livePrice > dailyOpen ? "Bullish" : "Bearish";

    const changePercent = ((livePrice - dailyOpen) / dailyOpen) * 100;

    // return {
    //   sector: item.sector,
    //   symbol: item.symbol,
    //   livePrice,
    //   dailyOpen,
    //   gann90,
    //   position,
    //   direction,
    //   changePercent,
    // };

    return {
      sector: item.sector,
      symbol: item.symbol,
      livePrice,
      dailyOpen,

      gann90: gann.gann90,
      gann180: gann.gann180,
      gann270: gann.gann270,
      gann360: gann.gann360,

      gannM90: gann.gannM90,
      gannM180: gann.gannM180,
      gannM270: gann.gannM270,
      gannM360: gann.gannM360,

      strength,
      position,
      direction,
      changePercent,
    };
  } catch (err) {
    console.error(`Failed ${item.symbol}:`, err.message);
    return null;
  }
}

exports.main = async () => {
  // console.log("\nFetching market data...\n");

  const results = (await Promise.all(sectors.map(getSectorData))).filter(
    Boolean,
  );

  // Rank by performance
  results.sort((a, b) => b.changePercent - a.changePercent);

  const astro = await getNakshatraData();

  const finalData = results.map((row, index) => {
    let technicalScore = 0;

    switch (row.position) {
      case "Above G360":
        technicalScore += 60;
        break;

      case "Above G270":
        technicalScore += 45;
        break;

      case "Above G180":
        technicalScore += 30;
        break;

      case "Above G90":
        technicalScore += 15;
        break;

      case "Below M90":
        technicalScore -= 15;
        break;

      case "Below M180":
        technicalScore -= 30;
        break;

      case "Below M270":
        technicalScore -= 45;
        break;

      case "Below M360":
        technicalScore -= 60;
        break;
    }

    const target =
      row.position === "Above G360"
        ? "New High Zone"
        : row.position === "Above G270"
          ? row.gann360.toFixed(2)
          : row.position === "Above G180"
            ? row.gann270.toFixed(2)
            : row.position === "Above G90"
              ? row.gann180.toFixed(2)
              : // Negative side
                row.position === "Below M360"
                ? "Breakdown Zone"
                : row.position === "Below M270"
                  ? row.gannM360.toFixed(2)
                  : row.position === "Below M180"
                    ? row.gannM270.toFixed(2)
                    : row.position === "Below M90"
                      ? row.gannM180.toFixed(2)
                      : row.gann90.toFixed(2);

    const combinedScore = technicalScore + astro.astroScore;

    const signal = getSignal({
      direction: row.direction,
      position: row.position,
      astroScore: astro.astroScore,
      changePercent: row.changePercent,
    });

    const trader = getTraderAction({
      direction: row.direction,
      position: row.position,
      astroScore: astro.astroScore,
      changePercent: row.changePercent,
      rank: index + 1,
    });

    // const astro2 = getAstroTradingDataKal();

    return {
      Sector: row.sector,
      LivePrice: row.livePrice.toFixed(2),
      DailyOpen: row.dailyOpen.toFixed(2),
      Gann90: row.position.startsWith("Above")
        ? row.gann90.toFixed(2)
        : row.gannM90.toFixed(2),

      Gann180: row.position.startsWith("Above")
        ? row.gann180.toFixed(2)
        : row.gannM180.toFixed(2),
      Gann270: row.position.startsWith("Above")
        ? row.gann270.toFixed(2)
        : row.gannM270.toFixed(2),
      Gann360: row.position.startsWith("Above")
        ? row.gann360.toFixed(2)
        : row.gannM360.toFixed(2),
      Target: target,
      Position: row.position,
      Strength: row.strength,
      Direction: row.direction,
      Rank: index + 1,
      N_Bias: astro.bias,
      A_Score: astro.astroScore,
      CombinedScore: combinedScore,
      Signal: signal,
      // Action: trader.action,
      // rahuKaal: astro2.rahuKaal,
    };
  });

  // console.table(finalData);

  // latestData = finalData;

  return finalData;

  // const topBuys = finalData
  //   .filter((x) => x.Signal === "STRONG BUY")
  //   .sort((a, b) => b.CombinedScore - a.CombinedScore);

  // console.log("\n===== TODAY TOP SECTORS =====");

  // topBuys.forEach((s, i) => {
  //   console.log(
  //     `${i + 1}. ${s.Sector} | Score: ${s.CombinedScore} | ${s.Action}`,
  //   );
  // });

  //   console.log("\nAstrology Data");
  //   console.log(astro);

  //   console.log("\nRaw Data");
  //   console.log(JSON.stringify(finalData, null, 2));
};

async function getNakshatraData() {
  try {
    const now = new Date();

    const startTime = now.toISOString().replace("T", " ").substring(0, 16);

    const endTime = new Date(now.getTime() + 60000)
      .toISOString()
      .replace("T", " ")
      .substring(0, 16);

    const url =
      `https://ssd.jpl.nasa.gov/api/horizons.api` +
      `?format=text` +
      `&COMMAND='301'` +
      `&OBJ_DATA='NO'` +
      `&MAKE_EPHEM='YES'` +
      `&EPHEM_TYPE='OBSERVER'` +
      `&CENTER='500@399'` +
      `&START_TIME='${encodeURIComponent(startTime)}'` +
      `&STOP_TIME='${encodeURIComponent(endTime)}'` +
      `&STEP_SIZE='1 m'` +
      `&QUANTITIES='31'`;

    const response = await axios.get(url);

    const text = response.data;

    const soeMatch = text.match(/\$\$SOE([\s\S]*?)\$\$EOE/);

    if (!soeMatch) {
      throw new Error("Ephemeris data not found");
    }

    const firstLine = soeMatch[1].trim().split(/\r?\n/)[0];

    const numbers = firstLine.match(/-?\d+\.\d+/g);

    if (!numbers || numbers.length === 0) {
      throw new Error("Longitude not found");
    }

    const tropicalLongitude = parseFloat(numbers[0]);

    const ayanamsa = 24.2;

    let siderealLongitude = tropicalLongitude - ayanamsa;

    while (siderealLongitude < 0) siderealLongitude += 360;

    while (siderealLongitude >= 360) siderealLongitude -= 360;

    const nakshatras = [
      "Ashwini",
      "Bharani",
      "Krittika",
      "Rohini",
      "Mrigashira",
      "Ardra",
      "Punarvasu",
      "Pushya",
      "Ashlesha",
      "Magha",
      "Purva Phalguni",
      "Uttara Phalguni",
      "Hasta",
      "Chitra",
      "Swati",
      "Vishakha",
      "Anuradha",
      "Jyeshtha",
      "Mula",
      "Purva Ashadha",
      "Uttara Ashadha",
      "Shravana",
      "Dhanishta",
      "Shatabhisha",
      "Purva Bhadrapada",
      "Uttara Bhadrapada",
      "Revati",
    ];

    const bullishNakshatras = [
      "Rohini",
      "Mrigashira",
      "Punarvasu",
      "Pushya",
      "Hasta",
      "Swati",
      "Anuradha",
      "Shravana",
      "Revati",
    ];

    const bearishNakshatras = [
      "Ardra",
      "Ashlesha",
      "Jyeshtha",
      "Mula",
      "Shatabhisha",
    ];

    const nakIndex = Math.floor(siderealLongitude / 13.3333333333);

    const nakshatra = nakshatras[nakIndex];

    let bias = "Neutral";
    let astroScore = 0;

    if (bullishNakshatras.includes(nakshatra)) {
      bias = "Bullish";
      astroScore = 10;
    }

    if (bearishNakshatras.includes(nakshatra)) {
      bias = "Bearish";
      astroScore = -10;
    }

    return {
      timestamp: new Date().toISOString(),
      tropicalLongitude: Number(tropicalLongitude.toFixed(6)),
      siderealLongitude: Number(siderealLongitude.toFixed(6)),
      nakshatra,
      bias,
      astroScore,
    };
  } catch (err) {
    console.error("Nakshatra Error:", err.message);

    return {
      nakshatra: "Unknown",
      bias: "Neutral",
      astroScore: 0,
    };
  }
}

// function getSignal({ direction, position, astroScore, changePercent }) {
//   if (position === "Above G360") {
//     return "CALL BUY";
//   }

//   if (position === "Above G270") {
//     return "CALL BUY";
//   }

//   if (position === "Below M360") {
//     return "PUT BUY";
//   }

//   if (position === "Below M270") {
//     return "PUT BUY";
//   }

//   if (position === "Between M90 & G90") {
//     return "NO TRADE";
//   }

//   return "WAIT";
// }

function getSignal({ direction, position, astroScore, changePercent }) {
  // SUPER BULLISH
  if (position === "Above G360" && astroScore >= 20 && changePercent > 1) {
    return "AGGRESSIVE BUY";
  }

  if (position === "Above G270" && astroScore > 0 && changePercent > 0) {
    return "STRONG BUY";
  }

  if (position === "Above G180" && direction === "Bullish") {
    return "BUY";
  }

  if (position === "Above G90" && direction === "Bullish") {
    return "MILD BUY";
  }

  // SUPER BEARISH
  if (position === "Below M360" && astroScore <= -20 && changePercent < -1) {
    return "AGGRESSIVE SELL";
  }

  if (position === "Below M270" && changePercent < 0) {
    return "STRONG SELL";
  }

  if (position === "Below M180" && direction === "Bearish") {
    return "SELL";
  }

  if (position === "Below M90" && direction === "Bearish") {
    return "MILD SELL";
  }

  // SIDEWAYS
  if (position === "Between M90 & G90") {
    return "WAIT";
  }

  return "WATCH";
}

function getTraderAction({
  direction,
  position,
  astroScore,
  changePercent,
  rank,
}) {
  // Strong bullish setup
  if (
    direction === "Bullish" &&
    position.startsWith("Above") &&
    astroScore > 0 &&
    rank <= 3
  ) {
    return {
      signal: "STRONG BUY",
      action: "Buy on dips, hold existing positions, trail stop loss.",
    };
  }

  // Bullish setup
  if (direction === "Bullish" && position.startsWith("Above")) {
    return {
      signal: "BUY",
      action: "Accumulation zone, fresh entries allowed.",
    };
  }

  // Neutral
  if (direction === "Bullish" && position === "Below") {
    return {
      signal: "WATCH",
      action: "Wait for breakout above Gann 90 before entry.",
    };
  }

  // Weak
  if (direction === "Bearish" && changePercent > -1) {
    return {
      signal: "PARTIAL PROFIT",
      action: "Book partial profit and tighten stop loss.",
    };
  }

  // Strong bearish
  return {
    signal: "SELL",
    action: "Avoid fresh entries, exit weak positions.",
  };
}

async function getAstroTradingDataKal(
  lat = 22.3039, // Rajkot
  lon = 70.8022,
) {
  return new Promise((resolve, reject) => {
    const now = new Date();

    // Sunrise / Sunset
    const times = SunCalc.getTimes(now, lat, lon);

    const sunrise = times.sunrise;
    const sunset = times.sunset;

    const dayMinutes = (sunset - sunrise) / (1000 * 60);

    const segment = dayMinutes / 8;

    const weekday = now.getDay();

    const rahuMap = {
      0: 8,
      1: 2,
      2: 7,
      3: 5,
      4: 6,
      5: 4,
      6: 3,
    };

    const gulikaMap = {
      0: 7,
      1: 6,
      2: 5,
      3: 4,
      4: 3,
      5: 2,
      6: 1,
    };

    const yamagandaMap = {
      0: 5,
      1: 4,
      2: 3,
      3: 2,
      4: 1,
      5: 7,
      6: 6,
    };

    const formatRange = (part) => {
      const start = sunrise.getTime() + (part - 1) * segment * 60 * 1000;

      const end = start + segment * 60 * 1000;

      const format = (ms) => {
        return new Date(ms).toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
          timeZone: "Asia/Kolkata",
        });
      };

      return {
        start,
        end,
        text: `${format(start)} - ${format(end)}`,
      };
    };

    const rahu = formatRange(rahuMap[weekday]);

    const gulika = formatRange(gulikaMap[weekday]);

    const yamaganda = formatRange(yamagandaMap[weekday]);

    const currentTime = now.getTime();

    const tradingStatus =
      currentTime >= rahu.start && currentTime <= rahu.end
        ? "RAHU KAAL"
        : currentTime >= gulika.start && currentTime <= gulika.end
          ? "GULIKA"
          : currentTime >= yamaganda.start && currentTime <= yamaganda.end
            ? "YAMAGANDA"
            : "OPEN";

    // Moon Longitude
    const jd = sweph.julday(
      now.getUTCFullYear(),
      now.getUTCMonth() + 1,
      now.getUTCDate(),
      now.getUTCHours() + now.getUTCMinutes() / 60,
      1,
    );

    sweph.calc_ut(
      jd,
      sweph.constants.SE_MOON,
      sweph.constants.SEFLG_SWIEPH,
      (result) => {
        try {
          const moonLongitude = result.longitude;

          const ayanamsa = 24.2;

          let sidereal = moonLongitude - ayanamsa;

          if (sidereal < 0) sidereal += 360;

          const nakshatras = [
            "Ashwini",
            "Bharani",
            "Krittika",
            "Rohini",
            "Mrigashira",
            "Ardra",
            "Punarvasu",
            "Pushya",
            "Ashlesha",
            "Magha",
            "Purva Phalguni",
            "Uttara Phalguni",
            "Hasta",
            "Chitra",
            "Swati",
            "Vishakha",
            "Anuradha",
            "Jyeshtha",
            "Mula",
            "Purva Ashadha",
            "Uttara Ashadha",
            "Shravana",
            "Dhanishta",
            "Shatabhisha",
            "Purva Bhadrapada",
            "Uttara Bhadrapada",
            "Revati",
          ];

          const nakshatra = nakshatras[Math.floor(sidereal / 13.333333333)];

          resolve({
            nakshatra,
            rahuKaal: rahu.text,
            gulikaKaal: gulika.text,
            yamagandaKaal: yamaganda.text,
            tradingStatus,
          });
        } catch (err) {
          reject(err);
        }
      },
    );
  });
}

// setInterval(async () => {
//   await main().catch(console.error);
// }, 1000 * 20);
setInterval(async () => {
  try {
    const res = await axios.get("https://nifty-trade.onrender.com");
  } catch (err) {
    console.error("Error:", err.message);
  }
}, 6000);
