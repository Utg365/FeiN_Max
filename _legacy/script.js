// Core Application Engine for Fein Trade

// Global Application State
let state = {
    user: {
        name: "Guest Trader",
        avatar: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=100&q=80",
        isLoggedIn: false
    },
    balance: {
        initial: 100000.00,
        cash: 100000.00,
        netLiq: 100000.00,
        unrealizedPnL: 0.00,
        unrealizedPnLPct: 0.00
    },
    portfolio: {}, // { SYMBOL: { qty, avgPrice, type, exchange, category } }
    watchlist: ["AAPL", "BTCUSD", "TSLA", "EURUSD"],
    transactions: [], // [ { timestamp, symbol, action, price, qty, total } ]
    journal: [], // [ { timestamp, text } ]
    activeSymbol: "AAPL",
    activeExchange: "NASDAQ",
    activeCategory: "STOCKS", // STOCKS, CRYPTO, FOREX
    activeOrderSide: "BUY",
    activeOrderType: "MARKET",
    volumeMuted: false,
    dashboardPeriod: "1W"
};

// Global Asset Database (NYSE, NASDAQ, NSE, NEPSE, Crypto, Forex)
const assetDatabase = [
    // US Equities (NYSE / NASDAQ)
    { symbol: "AAPL", name: "Apple Inc.", exchange: "NASDAQ", category: "STOCKS", price: 175.40, change: 1.45, volatility: 0.15 },
    { symbol: "TSLA", name: "Tesla Motors", exchange: "NASDAQ", category: "STOCKS", price: 182.20, change: -4.10, volatility: 0.35 },
    { symbol: "MSFT", name: "Microsoft Corporation", exchange: "NASDAQ", category: "STOCKS", price: 420.55, change: 0.85, volatility: 0.12 },
    { symbol: "NVDA", name: "NVIDIA Corporation", exchange: "NASDAQ", category: "STOCKS", price: 940.10, change: 6.80, volatility: 0.40 },
    { symbol: "AMZN", name: "Amazon.com Inc.", exchange: "NASDAQ", category: "STOCKS", price: 178.15, change: -1.15, volatility: 0.18 },
    { symbol: "GOOGL", name: "Alphabet Inc.", exchange: "NASDAQ", category: "STOCKS", price: 152.50, change: 0.30, volatility: 0.14 },
    { symbol: "JPM", name: "JPMorgan Chase & Co.", exchange: "NYSE", category: "STOCKS", price: 195.80, change: 0.90, volatility: 0.10 },
    { symbol: "DIS", name: "Walt Disney Co.", exchange: "NYSE", category: "STOCKS", price: 112.40, change: -2.30, volatility: 0.20 },

    // Indian Equities (NSE)
    { symbol: "RELIANCE", name: "Reliance Industries", exchange: "NSE", category: "STOCKS", price: 2870.50, change: 1.10, volatility: 0.16 },
    { symbol: "TCS", name: "Tata Consultancy Services", exchange: "NSE", category: "STOCKS", price: 3855.00, change: -0.95, volatility: 0.12 },
    { symbol: "INFY", name: "Infosys Ltd.", exchange: "NSE", category: "STOCKS", price: 1420.10, change: -1.80, volatility: 0.18 },
    { symbol: "HDFCBANK", name: "HDFC Bank Ltd.", exchange: "NSE", category: "STOCKS", price: 1445.60, change: 0.45, volatility: 0.14 },

    // Nepal Equities (NEPSE)
    { symbol: "NABIL", name: "Nabil Bank Limited", exchange: "NEPSE", category: "STOCKS", price: 620.00, change: 2.15, volatility: 0.22, logo: "data:image/svg+xml,%3Csvg%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%20width%3D%2780%27%20height%3D%2780%27%3E%3Crect%20width%3D%2780%27%20height%3D%2780%27%20rx%3D%2718%27%20fill%3D%27%231E88E5%27%2F%3E%3Ctext%20x%3D%2750%25%27%20y%3D%2754%25%27%20text-anchor%3D%27middle%27%20fill%3D%27%2523ffffff%27%20font-family%3D%27Outfit%2Csans-serif%27%20font-size%3D%2732%27%20font-weight%3D%27700%27%3ENABIL%3C%2Ftext%3E%3C%2Fsvg%3E" },
    { symbol: "NICA", name: "NIC Asia Bank Limited", exchange: "NEPSE", category: "STOCKS", price: 540.50, change: -1.85, volatility: 0.25, logo: "data:image/svg+xml,%3Csvg%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%20width%3D%2780%27%20height%3D%2780%27%3E%3Crect%20width%3D%2780%27%20height%3D%2780%27%20rx%3D%2718%27%20fill%3D%27%2343A047%27%2F%3E%3Ctext%20x%3D%2750%25%27%20y%3D%2754%25%27%20text-anchor%3D%27middle%27%20fill%3D%27%2523ffffff%27%20font-family%3D%27Outfit%2Csans-serif%27%20font-size%3D%2732%27%20font-weight%3D%27700%27%3ENICA%3C%2Ftext%3E%3C%2Fsvg%3E" },
    { symbol: "AHPC", name: "Arun Valley Hydropower Development Company Limited", exchange: "NEPSE", category: "STOCKS", price: 210.00, change: 4.80, volatility: 0.45, logo: "data:image/svg+xml,%3Csvg%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%20width%3D%2780%27%20height%3D%2780%27%3E%3Crect%20width%3D%2780%27%20height%3D%2780%27%20rx%3D%2718%27%20fill%3D%27%238E24AA%27%2F%3E%3Ctext%20x%3D%2750%25%27%20y%3D%2754%25%27%20text-anchor%3D%27middle%27%20fill%3D%27%2523ffffff%27%20font-family%3D%27Outfit%2Csans-serif%27%20font-size%3D%2732%27%20font-weight%3D%27700%27%3EAHPC%3C%2Ftext%3E%3C%2Fsvg%3E" },
    { symbol: "HIDCL", name: "Hydroelectricity Investment and Development Company Limited", exchange: "NEPSE", category: "STOCKS", price: 165.20, change: 0.00, volatility: 0.30, logo: "data:image/svg+xml,%3Csvg%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%20width%3D%2780%27%20height%3D%2780%27%3E%3Crect%20width%3D%2780%27%20height%3D%2780%27%20rx%3D%2718%27%20fill%3D%27%23F4511E%27%2F%3E%3Ctext%20x%3D%2750%25%27%20y%3D%2754%25%27%20text-anchor%3D%27middle%27%20fill%3D%27%2523ffffff%27%20font-family%3D%27Outfit%2Csans-serif%27%20font-size%3D%2732%27%20font-weight%3D%27700%27%3EHIDCL%3C%2Ftext%3E%3C%2Fsvg%3E" },
    { symbol: "NTC", name: "Nepal Telecom Limited", exchange: "NEPSE", category: "STOCKS", price: 810.00, change: 0.50, volatility: 0.15, logo: "data:image/svg+xml,%3Csvg%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%20width%3D%2780%27%20height%3D%2780%27%3E%3Crect%20width%3D%2780%27%20height%3D%2780%27%20rx%3D%2718%27%20fill%3D%27%233949AB%27%2F%3E%3Ctext%20x%3D%2750%25%27%20y%3D%2754%25%27%20text-anchor%3D%27middle%27%20fill%3D%27%2523ffffff%27%20font-family%3D%27Outfit%2Csans-serif%27%20font-size%3D%2732%27%20font-weight%3D%27700%27%3ENTC%3C%2Ftext%3E%3C%2Fsvg%3E" },
    { symbol: "SHL", name: "Soaltee Hotel Limited", exchange: "NEPSE", category: "STOCKS", price: 412.00, change: 1.15, volatility: 0.28, logo: "data:image/svg+xml,%3Csvg%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%20width%3D%2780%27%20height%3D%2780%27%3E%3Crect%20width%3D%2780%27%20height%3D%2780%27%20rx%3D%2718%27%20fill%3D%2700897B%27%2F%3E%3Ctext%20x%3D%2750%25%27%20y%3D%2754%25%27%20text-anchor%3D%27middle%27%20fill%3D%27%2523ffffff%27%20font-family%3D%27Outfit%2Csans-serif%27%20font-size%3D%2732%27%20font-weight%3D%27700%27%3ESHL%3C%2Ftext%3E%3C%2Fsvg%3E" },
    { symbol: "HDL", name: "Himalayan Distillery Limited", exchange: "NEPSE", category: "STOCKS", price: 1820.00, change: 2.30, volatility: 0.40, logo: "data:image/svg+xml,%3Csvg%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%20width%3D%2780%27%20height%3D%2780%27%3E%3Crect%20width%3D%2780%27%20height%3D%2780%27%20rx%3D%2718%27%20fill%3D%27%23D81B60%27%2F%3E%3Ctext%20x%3D%2750%25%27%20y%3D%2754%25%27%20text-anchor%3D%27middle%27%20fill%3D%27%2523ffffff%27%20font-family%3D%27Outfit%2Csans-serif%27%20font-size%3D%2732%27%20font-weight%3D%27700%27%3EHDL%3C%2Ftext%3E%3C%2Fsvg%3E" },
    { symbol: "UPCL", name: "Upper Tamakoshi Hydropower Company Limited", exchange: "NEPSE", category: "STOCKS", price: 245.00, change: -0.80, volatility: 0.35, logo: "data:image/svg+xml,%3Csvg%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%20width%3D%2780%27%20height%3D%2780%27%3E%3Crect%20width%3D%2780%27%20height%3D%2780%27%20rx%3D%2718%27%20fill%3D%27%236D4C41%27%2F%3E%3Ctext%20x%3D%2750%25%27%20y%3D%2754%25%27%20text-anchor%3D%27middle%27%20fill%3D%27%2523ffffff%27%20font-family%3D%27Outfit%2Csans-serif%27%20font-size%3D%2732%27%20font-weight%3D%27700%27%3EUPCL%3C%2Ftext%3E%3C%2Fsvg%3E" },
    { symbol: "NLIC", name: "Nepal Life Insurance Company Limited", exchange: "NEPSE", category: "STOCKS", price: 680.00, change: -1.20, volatility: 0.22, logo: "data:image/svg+xml,%3Csvg%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%20width%3D%2780%27%20height%3D%2780%27%3E%3Crect%20width%3D%2780%27%20height%3D%2780%27%20rx%3D%2718%27%20fill%3D%27039BE5%27%2F%3E%3Ctext%20x%3D%2750%25%27%20y%3D%2754%25%27%20text-anchor%3D%27middle%27%20fill%3D%27%2523ffffff%27%20font-family%3D%27Outfit%2Csans-serif%27%20font-size%3D%2732%27%20font-weight%3D%27700%27%3ENLIC%3C%2Ftext%3E%3C%2Fsvg%3E" },
    { symbol: "CHCL", name: "Chilime Hydropower Company Limited", exchange: "NEPSE", category: "STOCKS", price: 385.00, change: 0.90, volatility: 0.20, logo: "data:image/svg+xml,%3Csvg%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%20width%3D%2780%27%20height%3D%2780%27%3E%3Crect%20width%3D%2780%27%20height%3D%2780%27%20rx%3D%2718%27%20fill%3D%27%23FDD835%27%2F%3E%3Ctext%20x%3D%2750%25%27%20y%3D%2754%25%27%20text-anchor%3D%27middle%27%20fill%3D%27%2523ffffff%27%20font-family%3D%27Outfit%2Csans-serif%27%20font-size%3D%2732%27%20font-weight%3D%27700%27%3ECHCL%3C%2Ftext%3E%3C%2Fsvg%3E" },
    { symbol: "CIT", name: "Citizen Investment Trust", exchange: "NEPSE", category: "STOCKS", price: 2150.00, change: 1.60, volatility: 0.25 },
    { symbol: "GBIME", name: "Global IME Bank Limited", exchange: "NEPSE", category: "STOCKS", price: 178.00, change: -0.45, volatility: 0.18 },
    { symbol: "NIFRA", name: "Nepal Infrastructure Bank Limited", exchange: "NEPSE", category: "STOCKS", price: 198.00, change: 0.10, volatility: 0.20 },
    { symbol: "HRL", name: "Himalayan Reinsurance Limited", exchange: "NEPSE", category: "STOCKS", price: 615.00, change: 3.12, volatility: 0.32 },
    { symbol: "ACLBSL", name: "Aarambha Chautari Laghubitta Bittiya Sanstha Limited", exchange: "NEPSE", category: "STOCKS", price: 173, change: -0.41, volatility: 0.17, website: "https://www.aarambhachautari.com/" },
    { symbol: "ADBL", name: "Agricultural Development Bank", exchange: "NEPSE", category: "STOCKS", price: 226, change: -0.74, volatility: 0.14, website: "https://adbl.gov.np/en" },
    { symbol: "AHL", name: "Asian Hydropower Limited", exchange: "NEPSE", category: "STOCKS", price: 157, change: 0.8, volatility: 0.37, website: "https://asianhydro.com.np" },
    { symbol: "AKJCL", name: "Ankhu Khola Jalvidhyut Company Ltd", exchange: "NEPSE", category: "STOCKS", price: 223, change: 0.18, volatility: 0.23, website: "https://www.aankhukholahydro.com.np/" },
    { symbol: "AKPL", name: "Arun Kabeli Power Ltd. (AKPL)", exchange: "NEPSE", category: "STOCKS", price: 270, change: -0.44, volatility: 0.03, website: "https://arunkabeli.com.np/" },
    { symbol: "ALBSL", name: "Asha Laghubitta Bittiya Sanstha Ltd", exchange: "NEPSE", category: "STOCKS", price: 207, change: 1.13, volatility: 0.38, website: "https://ashamicrofinance.com.np/" },
    { symbol: "ALICL", name: "Asian Life Insurance Co. Limited (ALICL)", exchange: "NEPSE", category: "STOCKS", price: 105, change: -0.87, volatility: 0.43, website: "https://www.asianlife.com.np/" },
    { symbol: "ANLB", name: "Aatmanirbhar Laghubitta Bittiya Sanstha Limited (ANLB)", exchange: "NEPSE", category: "STOCKS", price: 171, change: -0.57, volatility: 0.27, website: "https://aatmanirbhar.com.np/" },
    { symbol: "API", name: "Api Power Company Ltd. (API)", exchange: "NEPSE", category: "STOCKS", price: 219, change: 0.56, volatility: 0.22, website: "https://apipower.com.np/" },
    { symbol: "AVYAN", name: "Aviyan Laghubitta Bittiya Sanstha Limited (AVYAN)", exchange: "NEPSE", category: "STOCKS", price: 160, change: 0.15, volatility: 0.37, website: "https://aviyanlaghubitta.com.np/" },
    { symbol: "BANDIPUR", name: "Bandipur Cablecar and Tourism Limited (BANDIPUR)", exchange: "NEPSE", category: "STOCKS", price: 294, change: -0.2, volatility: 0.19, website: "https://bandipurhill.com.np/" },
    { symbol: "BARUN", name: "Barun Hydropower Co. Ltd. (BARUN)", exchange: "NEPSE", category: "STOCKS", price: 169, change: -0.94, volatility: 0.29, website: "https://www.barunhydro.com.np/" },
    { symbol: "BBC", name: "Bishal Bazar Company Limited (BBC)", exchange: "NEPSE", category: "STOCKS", price: 148, change: -1.28, volatility: 0.22 },
    { symbol: "BEDC", name: "Bhugol Energy Development Company Limited (BEDC)", exchange: "NEPSE", category: "STOCKS", price: 209, change: -0.55, volatility: 0.46, website: "https://www.bedc.com.np/" },
    { symbol: "BFC", name: "Best Finance Company Ltd", exchange: "NEPSE", category: "STOCKS", price: 142, change: 1.01, volatility: 0.41, website: "https://bestfinance.com.np/" },
    { symbol: "BGWT", name: "Bhagawati Hydropower Development Company Limited", exchange: "NEPSE", category: "STOCKS", price: 192, change: 0.62, volatility: 0.38, website: "https://bhagawatihydro.com.np/" },
    { symbol: "BHCL", name: "Bikash Hydropower Company Limited (BHCL)", exchange: "NEPSE", category: "STOCKS", price: 206, change: -1.31, volatility: 0.15, website: "https://bikashhydro.com.np/" },
    { symbol: "BHDC", name: "Bindyabasini Hydropower Development Company Limited", exchange: "NEPSE", category: "STOCKS", price: 270, change: -0.79, volatility: 0.36, website: "https://bindhyabasinihydro.com.np/" },
    { symbol: "BHL", name: "Balephi Hydropower Limited (BHL)", exchange: "NEPSE", category: "STOCKS", price: 107, change: -1.35, volatility: 0.02, website: "https://balephihydro.com/" },
    { symbol: "BHPL", name: "Barahi Hydropower Public Limited (BHPL)", exchange: "NEPSE", category: "STOCKS", price: 134, change: 0.25, volatility: 0.05, website: "https://barahihydropower.com.np/" },
    { symbol: "BJHL", name: "Bhujung Hydropower Limited (BJHL)", exchange: "NEPSE", category: "STOCKS", price: 219, change: 1.32, volatility: 0.37, website: "https://bhujunghydro.com/" },
    { symbol: "BNHC", name: "Buddha Bhumi Nepal Hydropower Company Ltd.", exchange: "NEPSE", category: "STOCKS", price: 197, change: 1.06, volatility: 0.34, website: "https://buddhabhuminepalhydro.com.np/" },
    { symbol: "BNL", name: "Bottlers Nepal (Balaju) Limited (BNL)", exchange: "NEPSE", category: "STOCKS", price: 267, change: -0.16, volatility: 0.43 },
    { symbol: "BNT", name: "Bottlers Nepal (Terai) Limited (BNT)", exchange: "NEPSE", category: "STOCKS", price: 145, change: -1.2, volatility: 0.06, website: "https://bnl.com.np/" },
    { symbol: "BPCL", name: "Butwal Power Company Limited", exchange: "NEPSE", category: "STOCKS", price: 193, change: -0.98, volatility: 0.11, website: "https://www.bpc.com.np/" },
    { symbol: "BUNGAL", name: "Bungal Hydro Limited (BUNGAL)", exchange: "NEPSE", category: "STOCKS", price: 246, change: -0.49, volatility: 0.32, website: "https://bungalhydro.com.np/" },
    { symbol: "C30MF", name: "Citizens Super 30 Mutual Fund (C30MF)", exchange: "NEPSE", category: "STOCKS", price: 232, change: -1.42, volatility: 0.43, website: "https://kumarisecurities.com/" },
    { symbol: "CBBL", name: "Chhimek Laghubitta Bittiya Sanstha Limited (CBBL)", exchange: "NEPSE", category: "STOCKS", price: 229, change: -0.79, volatility: 0.43, website: "https://www.chhimekbank.org/" },
    { symbol: "CBLD88", name: "Civil Bank Debenture 2088 (CBLD88)", exchange: "NEPSE", category: "STOCKS", price: 292, change: -0.95, volatility: 0.25 },
    { symbol: "CFCL", name: "Central Finance Co. Ltd. (CFCL)", exchange: "NEPSE", category: "STOCKS", price: 162, change: -0.91, volatility: 0.17, website: "https://centralfinance.com.np/" },
    { symbol: "CGH", name: "Chandragiri Hills Limited (CGH)", exchange: "NEPSE", category: "STOCKS", price: 219, change: 1.39, volatility: 0.11, website: "https://www.chandragirihills.com/" },
    { symbol: "CHDC", name: "CEDB Hydropower Development Co. Ltd.", exchange: "NEPSE", category: "STOCKS", price: 259, change: 0.39, volatility: 0.35, website: "https://chdc.com.np/" },
    { symbol: "CHL", name: "Chhyangdi Hydropower Ltd. (CHL)", exchange: "NEPSE", category: "STOCKS", price: 264, change: -1.33, volatility: 0.17, website: "https://chpl.com.np/" },
    { symbol: "CITY", name: "City Hotel Limited (CITY)", exchange: "NEPSE", category: "STOCKS", price: 203, change: -0.59, volatility: 0.37, website: "https://cityhotel.com.np/" },
    { symbol: "CKHL", name: "Chirkhwa Hydropower Limited (CKHL)", exchange: "NEPSE", category: "STOCKS", price: 211, change: -0.43, volatility: 0.24, website: "https://www.chirkhwahydropower.com/" },
    { symbol: "CLI", name: "Citizen Life Insurance Company Limited (CLI)", exchange: "NEPSE", category: "STOCKS", price: 133, change: -1.24, volatility: 0.05, website: "https://citizenlifenepal.com/" },
    { symbol: "CORBL", name: "Corporate Development Bank Limited (CORBL)", exchange: "NEPSE", category: "STOCKS", price: 291, change: 0.27, volatility: 0.26, website: "https://www.corporatebank.com.np/" },
    { symbol: "CREST", name: "Crest Micro Life Insurance Ltd. (CREST)", exchange: "NEPSE", category: "STOCKS", price: 180, change: 0.53, volatility: 0.32, website: "https://cmli.com.np/" },
    { symbol: "CSY", name: "Citizens Santulit Yojana (CSY)", exchange: "NEPSE", category: "STOCKS", price: 216, change: -0.41, volatility: 0.47 },
    { symbol: "CYCL", name: "CYC Nepal Laghubitta Bittiya Sanstha Limited (CYCL)", exchange: "NEPSE", category: "STOCKS", price: 185, change: -1.11, volatility: 0.21, website: "https://cycnlbsl.org.np/" },
    { symbol: "DHEL", name: "Daramkhola Hydro Energy Limited (DHEL)", exchange: "NEPSE", category: "STOCKS", price: 116, change: 1.36, volatility: 0.34, website: "https://www.daramkholahydro.com.np/" },
    { symbol: "DHPL", name: "Dibyashwori Hydropower Ltd. (DHPL)", exchange: "NEPSE", category: "STOCKS", price: 137, change: -0.49, volatility: 0.07, website: "https://dibyashwarihydro.com.np/" },
    { symbol: "DLBS", name: "Dhaulagiri Laghubitta Bittiya Sanstha Limited (DLBS)", exchange: "NEPSE", category: "STOCKS", price: 144, change: 0.85, volatility: 0.12, website: "https://dhaulagiribank.com/" },
    { symbol: "DOLTI", name: "Dolti Power Company Limited (DOLTI)", exchange: "NEPSE", category: "STOCKS", price: 199, change: -1.2, volatility: 0.16, website: "https://www.doltipower.org.np/" },
    { symbol: "DORDI", name: "Dordi Khola Jal Bidyut Company Limited (DORDI)", exchange: "NEPSE", category: "STOCKS", price: 255, change: -0.33, volatility: 0.37, website: "https://dordikhola.com.np/" },
    { symbol: "EBL", name: "Everest Bank Limited (EBL)", exchange: "NEPSE", category: "STOCKS", price: 262, change: 1.35, volatility: 0.37, website: "https://everestbankltd.com/" },
    { symbol: "EDBL", name: "Excel Development Bank Ltd. (EDBL)", exchange: "NEPSE", category: "STOCKS", price: 167, change: -0.02, volatility: 0.19, website: "https://edb.com.np/" },
    { symbol: "EHPL", name: "Eastern Hydropower Limited (EHPL)", exchange: "NEPSE", category: "STOCKS", price: 242, change: 1.09, volatility: 0.31, website: "https://ehpl.com.np/" },
    { symbol: "ENL", name: "merging Nepal Limited ( ENL )", exchange: "NEPSE", category: "STOCKS", price: 162, change: -1.35, volatility: 0.45, website: "https://emergingnep.com/" },
    { symbol: "FMDBL", name: "First Microfinance Laghubitta Bittiya Sanstha Limited", exchange: "NEPSE", category: "STOCKS", price: 114, change: -1.3, volatility: 0.14, website: "https://fmdb.com.np/" },
    { symbol: "FOWAD", name: "FORWARD Microfinance Laghubitta Bittiya Sanstha Ltd.", exchange: "NEPSE", category: "STOCKS", price: 128, change: -0.33, volatility: 0.23, website: "https://forwardmfbank.com.np/" },
    { symbol: "GBBL", name: "Garima Bikas Bank Limited (GBBL)", exchange: "NEPSE", category: "STOCKS", price: 270, change: 0.46, volatility: 0.01, website: "https://garimabank.com.np/" },
    { symbol: "GBILD86/87", name: "8.5% Global IME Bank Ltd. Debenture 2086/87", exchange: "NEPSE", category: "STOCKS", price: 122, change: -1.32, volatility: 0.11 },
    { symbol: "GBIMESY2", name: "Global IME Samunnat Yojana - II (GBIMESY2)", exchange: "NEPSE", category: "STOCKS", price: 224, change: -1.24, volatility: 0.48, website: "https://www.globalimecapital.com/" },
    { symbol: "GBLBS", name: "Grameen Bikas Laghubitta Bittiya Sanstha Ltd. (GBLBS)", exchange: "NEPSE", category: "STOCKS", price: 260, change: -0.72, volatility: 0.41, website: "https://gblbs.com.np/" },
    { symbol: "GCIL", name: "Ghorahi Cement Industry Limited (GCIL)", exchange: "NEPSE", category: "STOCKS", price: 104, change: -0.9, volatility: 0.25, website: "https://ghorahicement.com.np/" },
    { symbol: "GFCL", name: "Goodwill Finance Co. Ltd. (GFCL)", exchange: "NEPSE", category: "STOCKS", price: 146, change: 1.04, volatility: 0.16, website: "https://goodwillfinance.com.np/" },
    { symbol: "GHL", name: "Ghalemdi Hydro Limited (GHL)", exchange: "NEPSE", category: "STOCKS", price: 199, change: 0.22, volatility: 0.22, website: "https://ghalemdi.com/" },
    { symbol: "GIBF1", name: "Global IME Balanced Fund-1 (GIBF1)", exchange: "NEPSE", category: "STOCKS", price: 208, change: -0.65, volatility: 0.31, website: "https://www.globalimecapital.com/" },
    { symbol: "GILB", name: "Global IME Laghubitta Bittiya Sanstha Ltd. (GILB)", exchange: "NEPSE", category: "STOCKS", price: 117, change: -0.19, volatility: 0.17, website: "https://gilb.com.np/" },
    { symbol: "GLBSL", name: "Gurans Laghubitta Bittiya Sanstha Limited (GLBSL)", exchange: "NEPSE", category: "STOCKS", price: 268, change: 1.32, volatility: 0.17, website: "https://glbsl.com.np/" },
    { symbol: "GLH", name: "Greenlife Hydropower Limited (GLH)", exchange: "NEPSE", category: "STOCKS", price: 121, change: 1.42, volatility: 0.48, website: "https://greenlifehydropower.com.np/" },
    { symbol: "GMFBS", name: "Ganapati Microfinance Bittiya Sanstha Ltd (GMFBS)", exchange: "NEPSE", category: "STOCKS", price: 140, change: -0.72, volatility: 0.34, website: "https://ganapatimicro.com.np/en" },
    { symbol: "GMFIL", name: "Guheshowori Merchant Bank & Finance Co. Ltd. (GMFIL)", exchange: "NEPSE", category: "STOCKS", price: 222, change: 0.86, volatility: 0.02, website: "https://www.gmbf.com.np/" },
    { symbol: "GMLI", name: "Guardian Micro-Life Insurance Limited (GMLI)", exchange: "NEPSE", category: "STOCKS", price: 231, change: -0.05, volatility: 0.31, website: "https://gmli.com.np/" },
    { symbol: "GRDBL", name: "Green Development Bank Ltd. (GRDBL)", exchange: "NEPSE", category: "STOCKS", price: 145, change: -1.4, volatility: 0.33, website: "https://greenbank.com.np/" },
    { symbol: "GSY", name: "Garima Samriddhi Yojana (GSY)", exchange: "NEPSE", category: "STOCKS", price: 243, change: -0.52, volatility: 0.25, website: "https://garimacapital.com/" },
    { symbol: "GUFL", name: "Gurkhas Finance Ltd. (GUFL)", exchange: "NEPSE", category: "STOCKS", price: 168, change: -0.2, volatility: 0.36, website: "https://gurkhasfinance.com.np/" },
    { symbol: "GVL", name: "Green Ventures Limited (GVL)", exchange: "NEPSE", category: "STOCKS", price: 131, change: 1.19, volatility: 0.24, website: "https://greenventuresnepal.com/" },
    { symbol: "H8020", name: "Himalayan 80-20 (H8020)", exchange: "NEPSE", category: "STOCKS", price: 159, change: -0.35, volatility: 0.46, website: "https://himalayancapital.com/" },
    { symbol: "HATHY", name: "Hathway Investment Nepal Limited (HATHY)", exchange: "NEPSE", category: "STOCKS", price: 220, change: -0.98, volatility: 0.05, website: "https://www.hathwaynepal.com.np/" },
    { symbol: "HBL", name: "Himalayan Bank Limited (HBL)", exchange: "NEPSE", category: "STOCKS", price: 228, change: -0.15, volatility: 0.26, website: "https://himalayanbank.com/" },
    { symbol: "HDHPC", name: "Himal Dolakha Hydropower Company Limited (HDHPC)", exchange: "NEPSE", category: "STOCKS", price: 102, change: -0.02, volatility: 0.36, website: "https://himaldolakhahydropower.com/" },
    { symbol: "HEI", name: "Himalayan Everest Insurance Limited (HEI)", exchange: "NEPSE", category: "STOCKS", price: 135, change: -0.71, volatility: 0.26, website: "https://www.hei.com.np/" },
    { symbol: "HEIP", name: "Himalayan Everest Insurance Limited Promoter (HEIP)", exchange: "NEPSE", category: "STOCKS", price: 156, change: 0.4, volatility: 0.47, website: "https://www.hei.com.np/" },
    { symbol: "HFIN", name: "Hotel Forest Inn Limited (HFIN)", exchange: "NEPSE", category: "STOCKS", price: 102, change: -1.0, volatility: 0.15, website: "https://hotelforestinn.com.np/" },
    { symbol: "HHL", name: "Himalayan Hydropower Limited (HHL)", exchange: "NEPSE", category: "STOCKS", price: 192, change: -1.49, volatility: 0.08, website: "https://hhpl.com.np/" },
    { symbol: "HIDCLP", name: "Hydroelectricity Investment and Development Company Limited Promoter (HIDCLP)", exchange: "NEPSE", category: "STOCKS", price: 148, change: 0.33, volatility: 0.04, website: "https://hidcl.org.np/" },
    { symbol: "HIMSTAR", name: "Him Star Urja Company Limited (HIMSTAR)", exchange: "NEPSE", category: "STOCKS", price: 246, change: -1.25, volatility: 0.47, website: "https://himstar.com.np/" },
    { symbol: "HLI", name: "Himalayan Life Insurance Limited (HLI)", exchange: "NEPSE", category: "STOCKS", price: 235, change: -0.91, volatility: 0.37, website: "https://www.himalayanlife.com.np/" },
    { symbol: "HLICF", name: "HLI Large Cap Fund (HLICF)", exchange: "NEPSE", category: "STOCKS", price: 155, change: -0.87, volatility: 0.3, website: "https://himalayanlife.com.np/" },
    { symbol: "HPPL", name: "Himalayan Power Partner Ltd. (HPPL)", exchange: "NEPSE", category: "STOCKS", price: 169, change: 0.74, volatility: 0.28, website: "https://hpp.com.np/" },
    { symbol: "HURJA", name: "Himalaya Urja Bikas Company Limited (HURJA)", exchange: "NEPSE", category: "STOCKS", price: 283, change: -0.09, volatility: 0.48, website: "https://hurja.fi/en/" },
    { symbol: "ICFC", name: "ICFC Finance Limited (ICFC)", exchange: "NEPSE", category: "STOCKS", price: 134, change: 1.14, volatility: 0.06, website: "https://www.icfcbank.com/" },
    { symbol: "ICFCD89", name: "8% ICFC Finance Limited Debenture-2089 (ICFCD89)", exchange: "NEPSE", category: "STOCKS", price: 207, change: 0.35, volatility: 0.36 },
    { symbol: "IGI", name: "IGI Prudential Insurance Company Limited (IGI)", exchange: "NEPSE", category: "STOCKS", price: 292, change: -0.78, volatility: 0.27, website: "https://igiprudential.com/" },
    { symbol: "IHL", name: "GI Prudential Insurance Company Limited (IGI)", exchange: "NEPSE", category: "STOCKS", price: 218, change: -0.01, volatility: 0.22, website: "https://igiprudential.com/" },
    { symbol: "ILBS", name: "Infinity Laghubitta Bittiya Sanstha Limited (ILBS)", exchange: "NEPSE", category: "STOCKS", price: 220, change: 1.16, volatility: 0.09, website: "https://www.ilbs.in/" },
    { symbol: "JBBL", name: "Jyoti Bikas Bank Limited (JBBL)", exchange: "NEPSE", category: "STOCKS", price: 246, change: -1.47, volatility: 0.03, website: "https://jbbl.com.np/" },
    { symbol: "JBLB", name: "Jeevan Bikas Laghubitta Bittiya Sanstha Limited (JBLB)", exchange: "NEPSE", category: "STOCKS", price: 231, change: -1.32, volatility: 0.04, website: "https://jeevanbikasmf.com/eg/" },
    { symbol: "JFL", name: "Janaki Finance Ltd. (JFL)", exchange: "NEPSE", category: "STOCKS", price: 160, change: -0.69, volatility: 0.22, website: "https://jflglobal.com/en-ca/home/" },
    { symbol: "JHAPA", name: "Jhapa Energy Limited (JHAPA)", exchange: "NEPSE", category: "STOCKS", price: 237, change: 0.93, volatility: 0.08, website: "https://jhapaenergy.com.np/" },
    { symbol: "JOSHI", name: "Joshi Hydropower Development Company Ltd (JOSHI)", exchange: "NEPSE", category: "STOCKS", price: 254, change: 0.16, volatility: 0.4, website: "https://jhdc.com.np/" },
    { symbol: "KBL", name: "Kumari Bank Limited (KBL)", exchange: "NEPSE", category: "STOCKS", price: 251, change: 0.85, volatility: 0.16, website: "https://www.kumaribank.com/en/personal-banking" },
    { symbol: "KBSH", name: "Kutheli Bukhari Small Hydropower Limited (KBSH)", exchange: "NEPSE", category: "STOCKS", price: 190, change: 1.42, volatility: 0.47, website: "https://kuthelihydropower.com.np/" },
    { symbol: "KDBY", name: "Kumari Dhanabriddhi Yojana (KDBY)", exchange: "NEPSE", category: "STOCKS", price: 243, change: 0.6, volatility: 0.25 },
    { symbol: "KDL", name: "Kalinchowk Darshan Limited (KDL)", exchange: "NEPSE", category: "STOCKS", price: 233, change: 1.11, volatility: 0.25, website: "https://kalinchowkdarshan.com.np/" },
    { symbol: "KEF", name: "Kumari Equity Fund (KEF)", exchange: "NEPSE", category: "STOCKS", price: 155, change: 0.19, volatility: 0.13, website: "https://kumaricapital.com/" },
    { symbol: "KKHC", name: "Khanikhola Hydropower Co. Ltd. (KKHC)", exchange: "NEPSE", category: "STOCKS", price: 216, change: -0.58, volatility: 0.19, website: "https://kkhpcl.com.np/" },
    { symbol: "KMCDB", name: "Kalika Laghubitta Bittiya Sanstha Limited (KMCDB)", exchange: "NEPSE", category: "STOCKS", price: 131, change: -0.93, volatility: 0.22, website: "https://www.kalikabank.com.np/" },
    { symbol: "KPCL", name: "Kalika power Company Ltd (KPCL)", exchange: "NEPSE", category: "STOCKS", price: 280, change: 1.25, volatility: 0.33, website: "https://kalikapower.com.np/" },
    { symbol: "KSBBL", name: "Kamana Sewa Bikas Bank Limited (KSBBL)", exchange: "NEPSE", category: "STOCKS", price: 251, change: 0.54, volatility: 0.4, website: "https://kamanasewabank.com/" },
    { symbol: "KSY", name: "Kumari Sabal Yojana (KSY)", exchange: "NEPSE", category: "STOCKS", price: 190, change: -1.17, volatility: 0.11, website: "https://kumarisecurities.com/pages/profile/KSY" },
    { symbol: "LBBL", name: "Lumbini Bikas Bank Ltd. (LBBL)", exchange: "NEPSE", category: "STOCKS", price: 181, change: 0.35, volatility: 0.29, website: "https://www.lumbinibikasbank.com/" },
    { symbol: "LEC", name: "Liberty Energy Company Limited (LEC)", exchange: "NEPSE", category: "STOCKS", price: 102, change: 1.49, volatility: 0.48, website: "https://www.libertyenergy.com.np/" },
    { symbol: "LICN", name: "Life Insurance Co. Nepal (LICN)", exchange: "NEPSE", category: "STOCKS", price: 168, change: -0.18, volatility: 0.14, website: "https://www.licnepal.com.np/" },
    { symbol: "LLBS", name: "Laxmi Laghubitta Bittiya Sanstha Ltd. (LLBS)", exchange: "NEPSE", category: "STOCKS", price: 166, change: 0.28, volatility: 0.21, website: "https://laxmilaghu.com.np/" },
    { symbol: "LSL", name: "Laxmi Sunrise Bank Limited (LSL)", exchange: "NEPSE", category: "STOCKS", price: 165, change: 1.04, volatility: 0.16, website: "https://lscapital.com.np/" },
    { symbol: "LUK", name: "Laxmi unnati Kosh (LUK)", exchange: "NEPSE", category: "STOCKS", price: 224, change: 0.22, volatility: 0.02 },
    { symbol: "LVF2", name: "Laxmi Value Fund 2 (LVF2)", exchange: "NEPSE", category: "STOCKS", price: 166, change: -0.32, volatility: 0.28 },
    { symbol: "MABEL", name: "Mabilung Energy Limited (MABEL)", exchange: "NEPSE", category: "STOCKS", price: 252, change: -0.28, volatility: 0.27 },
    { symbol: "MAKAR", name: "Makar Jitumaya Suri Hydropower Limited (MAKAR)", exchange: "NEPSE", category: "STOCKS", price: 204, change: 0.55, volatility: 0.04, website: "https://www.mjshydropower.com.np/" },
    { symbol: "MANDU", name: "Mandu Hydropower Ltd. (MANDU)", exchange: "NEPSE", category: "STOCKS", price: 131, change: -0.12, volatility: 0.33, website: "https://manduhydropower.com/" },
    { symbol: "MATRI", name: "Matribhumi Laghubitta Bittiya Sanstha Limited (MATRI)", exchange: "NEPSE", category: "STOCKS", price: 121, change: 1.29, volatility: 0.34, website: "https://matribhumimf.com.np/" },
    { symbol: "MBJC", name: "Madhya Bhotekoshi Jalavidyut Company Limited (MBJC)", exchange: "NEPSE", category: "STOCKS", price: 185, change: -0.49, volatility: 0.05, website: "https://mbjcl.com.np/" },
    { symbol: "MBL", name: "Machhapuchchhre Bank Limited (MBL)", exchange: "NEPSE", category: "STOCKS", price: 182, change: 0.4, volatility: 0.15, website: "https://www.machbank.com/" },
    { symbol: "MBLEF", name: "MBL Equity Fund (MBLEF)", exchange: "NEPSE", category: "STOCKS", price: 280, change: 1.08, volatility: 0.23, website: "https://mcl.com.np/" },
    { symbol: "MCHL", name: "Menchhiyam Hydropower Limited (MCHL)", exchange: "NEPSE", category: "STOCKS", price: 197, change: 1.43, volatility: 0.38, website: "https://menchhiyamhydro.com.np/" },
    { symbol: "MDB", name: "Miteri Development Bank Limited (MDB)", exchange: "NEPSE", category: "STOCKS", price: 145, change: -1.16, volatility: 0.46, website: "https://miteribank.com.np/" },
    { symbol: "MEHL", name: "Manakamana Engineering Hydropower Limited (MEHL)", exchange: "NEPSE", category: "STOCKS", price: 224, change: 0.01, volatility: 0.12, website: "https://hydromanakamana.com.np/" },
    { symbol: "MEL", name: "Modi Energy Limited (MEL)", exchange: "NEPSE", category: "STOCKS", price: 264, change: -1.22, volatility: 0.48, website: "https://modihydro.com/" },
    { symbol: "MEN", name: "Mountain Energy Nepal Limited (MEN)", exchange: "NEPSE", category: "STOCKS", price: 105, change: -0.34, volatility: 0.44, website: "https://www.mountainenergy.com.np/" },
    { symbol: "MERO", name: "Meromicrofinance Laghubitta Bittiya Sanstha Ltd. (MERO)", exchange: "NEPSE", category: "STOCKS", price: 205, change: -0.82, volatility: 0.05, website: "https://www.meromicrofinance.com/" },
    { symbol: "MFIL", name: "Manjushree Finance Limited (MFIL)", exchange: "NEPSE", category: "STOCKS", price: 245, change: 0.6, volatility: 0.26, website: "https://www.manjushreefinance.com.np/" },
    { symbol: "MHCL", name: "Molung Hydropower Company Limited (MHCL)", exchange: "NEPSE", category: "STOCKS", price: 214, change: -0.76, volatility: 0.24, website: "https://molunghydropower.com.np/" },
    { symbol: "MHL", name: "Mandakini Hydropower Limited (MHL)", exchange: "NEPSE", category: "STOCKS", price: 275, change: -0.78, volatility: 0.37, website: "https://www.mandakinihydro.com.np/" },
    { symbol: "MHNL", name: "Mountain Hydro Nepal Limited (MHNL)", exchange: "NEPSE", category: "STOCKS", price: 151, change: 0.65, volatility: 0.15, website: "https://mhnl.com.np/" },
    { symbol: "MKCL", name: "Muktinath Krishi Company Limited (MKCL)", exchange: "NEPSE", category: "STOCKS", price: 218, change: -1.39, volatility: 0.03, website: "https://www.muktinathkrishi.com/" },
    { symbol: "MKHC", name: "Maya Khola Hydropower Company Limited (MKHC)", exchange: "NEPSE", category: "STOCKS", price: 165, change: 0.62, volatility: 0.27, website: "https://mkhpcl.com.np/" },
    { symbol: "MKHL", name: "Mai Khola Hydropower Limited (MKHL)", exchange: "NEPSE", category: "STOCKS", price: 107, change: 0.05, volatility: 0.29, website: "https://maikholahydropower.com.np/" },
    { symbol: "MKJC", name: "Mailung Khola Jal Vidhyut Company Limited (MKJC)", exchange: "NEPSE", category: "STOCKS", price: 196, change: 1.2, volatility: 0.1, website: "https://www.mailungkhola.com.np/" },
    { symbol: "MLBBL", name: "Mithila Laghubitta Bittiya Sanstha Ltd. (MLBBL)", exchange: "NEPSE", category: "STOCKS", price: 116, change: -0.8, volatility: 0.22, website: "https://mlbbank.com.np/" },
    { symbol: "MLBL", name: "Mahalaxmi Bikas Bank Ltd. (MLBL)", exchange: "NEPSE", category: "STOCKS", price: 148, change: -0.63, volatility: 0.21, website: "https://www.mahalaxmibank.com/" },
    { symbol: "MLBS", name: "Manushi Laghubitta Bittiya Sanstha Limited (MLBS)", exchange: "NEPSE", category: "STOCKS", price: 198, change: 1.48, volatility: 0.17, website: "https://www.manushilbs.com/" },
    { symbol: "MLBSL", name: "Mahila Laghubitta Bittiya Sanstha Limited (MLBSL)", exchange: "NEPSE", category: "STOCKS", price: 216, change: 1.39, volatility: 0.3, website: "https://www.mlbsl.com.np/" },
    { symbol: "MMF1", name: "Mega Mutual Fund-1 (MMF1)", exchange: "NEPSE", category: "STOCKS", price: 109, change: 0.98, volatility: 0.15, website: "https://nimbacecapital.com/mega-mutual-fund-1/" },
    { symbol: "MMKJL", name: "Mathillo Mailun Khola Jalvidhyut Limited (MMKJL)", exchange: "NEPSE", category: "STOCKS", price: 260, change: 1.13, volatility: 0.05, website: "https://sanimamailung.com/" },
    { symbol: "MNBBL", name: "Muktinath Bikas Bank Ltd. (MNBBL)", exchange: "NEPSE", category: "STOCKS", price: 175, change: -0.57, volatility: 0.23, website: "https://www.muktinathbank.com.np/" },
    { symbol: "MNMF1", name: "Muktinath Mutual Fund 1 (MNMF1)", exchange: "NEPSE", category: "STOCKS", price: 134, change: -1.41, volatility: 0.1, website: "https://muktinathcapital.com/" },
    { symbol: "MPFL", name: "Multipurpose Finance Company Limited (MPFL)", exchange: "NEPSE", category: "STOCKS", price: 204, change: 1.15, volatility: 0.45, website: "https://multipurposefinance.com/" },
    { symbol: "MSHL", name: "Mid-Solu Hydropower Limited (MSHL)", exchange: "NEPSE", category: "STOCKS", price: 164, change: 1.12, volatility: 0.03, website: "https://midsoluhydropower.com.np/" },
    { symbol: "MSLB", name: "Mahuli Laghubitta Bittiya Sanstha Ltd. (MSLB)", exchange: "NEPSE", category: "STOCKS", price: 154, change: -0.28, volatility: 0.3, website: "https://www.mslbsl.com.np/" },
    { symbol: "NABBC", name: "Narayani Development Bank Limited (NABBC)", exchange: "NEPSE", category: "STOCKS", price: 149, change: -0.6, volatility: 0.28, website: "https://ndbl.com.np/" },
    { symbol: "NADEP", name: "Nadep Laghubitta Bittiya Sanstha Ltd. (NADEP)", exchange: "NEPSE", category: "STOCKS", price: 158, change: 1.46, volatility: 0.33, website: "https://www.nadeplaghubitta.com/" },
    { symbol: "NBF2", name: "nabil balanced fund-2 (nbf2)", exchange: "NEPSE", category: "STOCKS", price: 100, change: -1.04, volatility: 0.05, website: "https://nabilinvest.com.np/investment-banking/mutual-funds/nabil-balanced-fund-ii/" },
    { symbol: "NBF3", name: "Nabil Invest's Nabil Balanced Fund- Ill (NBF3)", exchange: "NEPSE", category: "STOCKS", price: 163, change: 1.3, volatility: 0.23, website: "https://nabilinvest.com.np/investment-banking/mutual-funds/nabil-balanced-fund-iii/" },
    { symbol: "NBL", name: "Nepal Bank Limited (NBL)", exchange: "NEPSE", category: "STOCKS", price: 224, change: 0.16, volatility: 0.24, website: "https://nepalbank.com.np/" },
    { symbol: "NESDO", name: "NESDO Sambridha Laghubitta Bittiye Sanstha Limited", exchange: "NEPSE", category: "STOCKS", price: 232, change: -0.22, volatility: 0.15, website: "https://slbs.nesdonepal.org/" },
    { symbol: "NFS", name: "Nepal Finance Ltd. (NFS)", exchange: "NEPSE", category: "STOCKS", price: 236, change: 0.76, volatility: 0.42, website: "https://www.npci.org.in/product/nfs/about-nfs" },
    { symbol: "NGPL", name: "Ngadi Group Power Ltd. (NGPL)", exchange: "NEPSE", category: "STOCKS", price: 111, change: -1.16, volatility: 0.41, website: "https://ngpl.com.np/" },
    { symbol: "NHDL", name: "Nepal Hydro Developers Limited (NHDL)", exchange: "NEPSE", category: "STOCKS", price: 256, change: 0.52, volatility: 0.18, website: "https://www.charnawatihydro.com/" },
    { symbol: "NHPC", name: "National Hydro Power Company Limited (NHPC)", exchange: "NEPSE", category: "STOCKS", price: 265, change: 0.24, volatility: 0.05, website: "https://nhpc.gov.np/" },
    { symbol: "NIBLGF", name: "NIBL Growth Fund (NIBLGF)", exchange: "NEPSE", category: "STOCKS", price: 164, change: 0.38, volatility: 0.2, website: "https://nimbacecapital.com/nibl-growth-fund/" },
    { symbol: "NIBLSTF", name: "NIBL Stable Fund ( NIBLSTF )", exchange: "NEPSE", category: "STOCKS", price: 196, change: -0.3, volatility: 0.01, website: "https://nimbacecapital.com/nibl-stable-fund/" },
    { symbol: "NIBSF2", name: "NIBL Samriddhi Fund 2 (NIBSF2)", exchange: "NEPSE", category: "STOCKS", price: 142, change: -1.08, volatility: 0.46, website: "https://nimbacecapital.com/nibl-samriddhi-fund-ii/" },
    { symbol: "NICBF", name: "NIC Asia Balanced Fund (NICBF)", exchange: "NEPSE", category: "STOCKS", price: 182, change: -1.33, volatility: 0.35, website: "https://nicasiacapital.com/" },
    { symbol: "NICFC", name: "NIC ASIA Flexi CAP Fund (NICFC)", exchange: "NEPSE", category: "STOCKS", price: 121, change: 1.31, volatility: 0.11, website: "https://nicasiacapital.com/" },
    { symbol: "NICGF2", name: "NIC Asia Growth Fund-2 (NICGF2)", exchange: "NEPSE", category: "STOCKS", price: 274, change: 1.01, volatility: 0.05, website: "https://nicasiacapital.com/" },
    { symbol: "NICL", name: "Nepal Insurance Co. Ltd. (NICL)", exchange: "NEPSE", category: "STOCKS", price: 161, change: 0.61, volatility: 0.11, website: "https://nicnepal.com.np/" },
    { symbol: "NICLBSL", name: "NIC Asia Laghubitta Biitiya Sanstha Limited (NICLBSL)", exchange: "NEPSE", category: "STOCKS", price: 177, change: -0.45, volatility: 0.42, website: "https://www.nicasialaghubitta.com/" },
    { symbol: "NICSF", name: "NIC Asia Select-30 ( NICSF )", exchange: "NEPSE", category: "STOCKS", price: 194, change: -0.25, volatility: 0.15, website: "https://nicasiacapital.com/" },
    { symbol: "NIL", name: "Neco Insurance Co. Ltd. (NIL)", exchange: "NEPSE", category: "STOCKS", price: 289, change: 0.12, volatility: 0.47, website: "https://www.nilnetwork.com/" },
    { symbol: "NIMB", name: "Nepal Investment Mega Bank Limited (NIMB)", exchange: "NEPSE", category: "STOCKS", price: 292, change: -1.05, volatility: 0.41, website: "https://www.nimb.com.np/en/personal-banking" },
    { symbol: "NIMBPO", name: "Nepal Investment Mega Bank Ltd. Promoter Share (NIMBPO)", exchange: "NEPSE", category: "STOCKS", price: 234, change: -0.34, volatility: 0.35, website: "https://www.nimb.com.np/en/personal-banking" },
    { symbol: "NLG", name: "NLG Insurance Company Ltd. (NLG)", exchange: "NEPSE", category: "STOCKS", price: 196, change: 1.14, volatility: 0.16, website: "https://nlgi.com.np/" },
    { symbol: "NLICL", name: "National Life Insurance Company Limited", exchange: "NEPSE", category: "STOCKS", price: 210, change: -0.89, volatility: 0.05, website: "https://nationallife.com.np/" },
    { symbol: "NMB", name: "NMB Bank Limited", exchange: "NEPSE", category: "STOCKS", price: 250, change: 0.95, volatility: 0.08, website: "https://web.nmb.com.np/" },
    { symbol: "NMB50", name: "NMB 50 ( NMB50 )", exchange: "NEPSE", category: "STOCKS", price: 129, change: 1.07, volatility: 0.43 },
    { symbol: "NMBHF2", name: "NMB Hybrid Fund L-II (NMBHF2)", exchange: "NEPSE", category: "STOCKS", price: 223, change: 0.23, volatility: 0.32, website: "https://nmbcl.com.np/" },
    { symbol: "NMBMF", name: "NMB Laghubitta Bittiya Sanstha Ltd. (NMBMF)", exchange: "NEPSE", category: "STOCKS", price: 116, change: 1.23, volatility: 0.17, website: "https://nmbmicrofinance.com.np/" },
    { symbol: "NMFBS", name: "National Laghubitta Bittiya Sanstha Limited (NMFBS)", exchange: "NEPSE", category: "STOCKS", price: 264, change: -1.35, volatility: 0.15, website: "https://nationalmicrofinance.com.np/" },
    { symbol: "NMIC", name: "Nepal Micro Insurance Co. Ltd. (NMIC)", exchange: "NEPSE", category: "STOCKS", price: 123, change: -0.85, volatility: 0.25, website: "https://nepalmicro.com/en" },
    { symbol: "NMLBBL", name: "Nerude Mirmire Laghubitta Bittiya Sanstha Limited (NMLBBL)", exchange: "NEPSE", category: "STOCKS", price: 191, change: 0.02, volatility: 0.2, website: "https://www.nerudemirmire.com.np/" },
    { symbol: "NRIC", name: "Nepal Re-Insurance Company Limited (NRIC)", exchange: "NEPSE", category: "STOCKS", price: 201, change: -1.36, volatility: 0.39, website: "https://nepalre.com.np/enm" },
    { symbol: "NRM", name: "Nepal Republic Media Limited (NRM)", exchange: "NEPSE", category: "STOCKS", price: 130, change: 1.31, volatility: 0.08, website: "https://nepalrepublicmedia.com/" },
    { symbol: "NRN", name: "NRN Infrastructure and Development Limited (NRN)", exchange: "NEPSE", category: "STOCKS", price: 286, change: -0.39, volatility: 0.05, website: "https://nrnil.com/" },
    { symbol: "NSIF2", name: "NMB Sulav Investment Fund - II ( NSIF2 )", exchange: "NEPSE", category: "STOCKS", price: 139, change: -1.5, volatility: 0.07, website: "https://nmbcl.com.np/" },
    { symbol: "NSY", name: "Nepal Life Samriddhi Lagani Yojana (NSY)", exchange: "NEPSE", category: "STOCKS", price: 179, change: -0.64, volatility: 0.45, website: "https://nepallife.com.np/" },
    { symbol: "NUBL", name: "Nirdhan Utthan Laghubitta Bittiya Sanstha Limited (NUBL)", exchange: "NEPSE", category: "STOCKS", price: 268, change: 0.85, volatility: 0.34, website: "https://www.nirdhan.com.np/" },
    { symbol: "NWCL", name: "Nepal Warehousing Company Limited (NWCL)", exchange: "NEPSE", category: "STOCKS", price: 198, change: 0.52, volatility: 0.16, website: "https://nwcl.com.np/" },
    { symbol: "NYADI", name: "Nyadi Hydropower Limited (NYADI)", exchange: "NEPSE", category: "STOCKS", price: 133, change: 0.03, volatility: 0.17, website: "https://nhl.com.np/" },
    { symbol: "OHL", name: "Oriental Hotels Limited (OHL)", exchange: "NEPSE", category: "STOCKS", price: 289, change: -1.45, volatility: 0.05, website: "https://ohl.com.np/" },
    { symbol: "OMPL", name: "Om Megashree Pharmaceuticals Limited (OMPL)", exchange: "NEPSE", category: "STOCKS", price: 170, change: -0.12, volatility: 0.18, website: "https://ommegashreepharmaceuticals.com/" },
    { symbol: "PBD88", name: "10% Prime Debenture 2088 (PBD88)", exchange: "NEPSE", category: "STOCKS", price: 293, change: 0.55, volatility: 0.44 },
    { symbol: "PCBL", name: "Prime Commercial Bank Ltd. (PCBL)", exchange: "NEPSE", category: "STOCKS", price: 215, change: 1.23, volatility: 0.17, website: "https://www.primebank.com.np/" },
    { symbol: "PCIL", name: "Palpa Cement Industries Limited (PCIL)", exchange: "NEPSE", category: "STOCKS", price: 100, change: 0.94, volatility: 0.4, website: "https://www.tansencement.com/" },
    { symbol: "PFL", name: "Pokhara Finance Ltd. (PFL)", exchange: "NEPSE", category: "STOCKS", price: 149, change: 1.41, volatility: 0.42, website: "https://www.pokharafinance.com.np/" },
    { symbol: "PHCL", name: "Peoples Hydropower Company Limited (PHCL)", exchange: "NEPSE", category: "STOCKS", price: 201, change: 1.09, volatility: 0.29, website: "https://peopleshydro.com.np/" },
    { symbol: "PMHPL", name: "Panchakanya Mai Hydropower Limited ( PMHPL )", exchange: "NEPSE", category: "STOCKS", price: 256, change: -1.04, volatility: 0.07, website: "https://panchakanyamai.com.np/" },
    { symbol: "PMLI", name: "Prabhu Mahalaxmi Life Insurance Limited (PMLI)", exchange: "NEPSE", category: "STOCKS", price: 237, change: -1.34, volatility: 0.1, website: "https://pmlil.com/" },
    { symbol: "PPCL", name: "Panchthar Power Company Limited (PPCL)", exchange: "NEPSE", category: "STOCKS", price: 111, change: 0.49, volatility: 0.24, website: "https://www.ppcl.com.np/" },
    { symbol: "PPL", name: "People's Power Limited (PPL)", exchange: "NEPSE", category: "STOCKS", price: 183, change: 0.99, volatility: 0.2, website: "https://peoplespower.com.np/" },
    { symbol: "PRIN", name: "Prabhu Insurance Ltd. (PRIN)", exchange: "NEPSE", category: "STOCKS", price: 211, change: 0.05, volatility: 0.46, website: "https://prabhuinsurance.com/" },
    { symbol: "PROFL", name: "Progressive Finance Limited (PROFL)", exchange: "NEPSE", category: "STOCKS", price: 227, change: 0.66, volatility: 0.22, website: "https://www.pfltd.com.np/" },
    { symbol: "PRSF", name: "Prabhu Smart Fund (PRSF)", exchange: "NEPSE", category: "STOCKS", price: 231, change: 1.19, volatility: 0.07, website: "https://www.prabhucapital.com/" },
    { symbol: "PRVU", name: "Prabhu Bank Limited (PRVU)", exchange: "NEPSE", category: "STOCKS", price: 147, change: 0.78, volatility: 0.07, website: "https://www.prabhubank.com/" },
    { symbol: "PSF", name: "Prabhu Select Fund (PSF)", exchange: "NEPSE", category: "STOCKS", price: 139, change: 0.02, volatility: 0.41, website: "https://www.prabhucapital.com/" },
    { symbol: "PURE", name: "Pure Energy Ltd", exchange: "NEPSE", category: "STOCKS", price: 126, change: -1.24, volatility: 0.47, website: "https://pureenergynepal.com/" },
    { symbol: "RADHI", name: "Radhi Bidyut Company Ltd (RADHI)", exchange: "NEPSE", category: "STOCKS", price: 286, change: 1.16, volatility: 0.36, website: "https://radhibidyut.com.np/" },
    { symbol: "RAWA", name: "Rawa Energy Development Limited (RAWA)", exchange: "NEPSE", category: "STOCKS", price: 284, change: 0.5, volatility: 0.38 },
    { symbol: "RBBF40", name: "RBB FOCUS 40 | Nepal Stock Exchange | RBBF40", exchange: "NEPSE", category: "STOCKS", price: 200, change: 1.26, volatility: 0.47, website: "https://www.rbbmbl.com.np/" },
    { symbol: "RBCL", name: "Rastriya Beema Company Limited (RBCL)", exchange: "NEPSE", category: "STOCKS", price: 218, change: 0.57, volatility: 0.23, website: "http://rbcl.gov.np/" },
    { symbol: "RFPL", name: "River Falls Power Limited (RFPL)", exchange: "NEPSE", category: "STOCKS", price: 124, change: 0.65, volatility: 0.45, website: "https://www.riverfallshydro.com.np/" },
    { symbol: "RHGCL", name: "Rapti Hydro and General Construction Limited (RHGCL)", exchange: "NEPSE", category: "STOCKS", price: 114, change: -0.42, volatility: 0.42, website: "https://raptihydro.com.np/" },
    { symbol: "RHPL", name: "rasuwagadhi hydropower company limited (rhpl)", exchange: "NEPSE", category: "STOCKS", price: 149, change: 1.33, volatility: 0.3, website: "https://rghpcl.com.np/" },
    { symbol: "RIDI", name: "Ridi Power Company Limited (RIDI)", exchange: "NEPSE", category: "STOCKS", price: 122, change: -0.1, volatility: 0.23, website: "https://ridipower.com.np/" },
    { symbol: "RLEL", name: "Ridge Line Energy Limited (RLEL)", exchange: "NEPSE", category: "STOCKS", price: 141, change: 1.0, volatility: 0.08, website: "https://ridgeline.com.np/" },
    { symbol: "RLFL", name: "Reliance Finance Ltd. (RLFL)", exchange: "NEPSE", category: "STOCKS", price: 136, change: -1.05, volatility: 0.34, website: "https://reliancenepal.com.np/" },
    { symbol: "RMF1", name: "RBB Mutual Fund 1 (RMF1)", exchange: "NEPSE", category: "STOCKS", price: 118, change: 0.38, volatility: 0.2, website: "https://www.rbbmbl.com.np/" },
    { symbol: "RMF2", name: "RBB Mutual Fund 2 (RMF2)", exchange: "NEPSE", category: "STOCKS", price: 242, change: 1.2, volatility: 0.26, website: "https://www.rbbmbl.com.np/" },
    { symbol: "RNLI", name: "Reliable Nepal Life Insurance Limited (RNLI)", exchange: "NEPSE", category: "STOCKS", price: 156, change: 0.8, volatility: 0.37, website: "https://reliablelife.com.np/en" },
    { symbol: "RSDC", name: "Rural Self-Reliance Development Center (RSDC)", exchange: "NEPSE", category: "STOCKS", price: 279, change: -0.48, volatility: 0.06, website: "https://rsdc.org.np/" },
    { symbol: "RSML", name: "Reliance Spinning Mills Limited (RSML)", exchange: "NEPSE", category: "STOCKS", price: 183, change: -1.02, volatility: 0.23, website: "https://reliancespinningnepal.com/" },
    { symbol: "RSY", name: "Reliable Samriddhi Yojana (RSY)", exchange: "NEPSE", category: "STOCKS", price: 160, change: -1.34, volatility: 0.44, website: "https://rsy-netzer.org.uk/" },
    { symbol: "RURU", name: "Ru Ru Jalbidhyut Pariyojana Limited (RURU)", exchange: "NEPSE", category: "STOCKS", price: 181, change: 1.4, volatility: 0.33, website: "https://rurufm.com.np/" },
    { symbol: "SABBL", name: "Salapa Bikas Bank Limited (SABBL)", exchange: "NEPSE", category: "STOCKS", price: 173, change: 0.59, volatility: 0.43, website: "https://salapabikasbank.com.np/" },
    { symbol: "SADBL", name: "Shangrila Development Bank Ltd. (SADBL)", exchange: "NEPSE", category: "STOCKS", price: 176, change: -0.76, volatility: 0.09, website: "https://www.shangrilabank.com/" },
    { symbol: "SAGAR", name: "Sagar Distillery Limited (SAGAR)", exchange: "NEPSE", category: "STOCKS", price: 125, change: -1.5, volatility: 0.33, website: "https://sagarnetwork.com/" },
    { symbol: "SAGF", name: "Sanima Growth Fund (SAGF)", exchange: "NEPSE", category: "STOCKS", price: 104, change: 0.85, volatility: 0.08, website: "https://www.sanima.capital/" },
    { symbol: "SAHAS", name: "ahas Urja Limited (SAHAS)", exchange: "NEPSE", category: "STOCKS", price: 119, change: 0.76, volatility: 0.29, website: "https://www.sahasnepal.org.np/" },
    { symbol: "SAIL", name: "Shreenagar Agritech Industries Limited (SAIL)", exchange: "NEPSE", category: "STOCKS", price: 204, change: -1.11, volatility: 0.03, website: "https://www.safnepal.com/" },
    { symbol: "SALICO", name: "SALICO (Sagarmatha Lumbini Insurance Co. Ltd.)", exchange: "NEPSE", category: "STOCKS", price: 291, change: 0.57, volatility: 0.35, website: "https://salico.com.np/" },
    { symbol: "SANIMA", name: "Sanima Bank Limited (SANIMA)", exchange: "NEPSE", category: "STOCKS", price: 117, change: -0.12, volatility: 0.3, website: "https://www.sanima.capital/" },
    { symbol: "SANVI", name: "Sanvi Energy Limited (SANVI)", exchange: "NEPSE", category: "STOCKS", price: 295, change: 0.6, volatility: 0.05, website: "https://www.sanvienergy.com/" },
    { symbol: "SAPDBL", name: "Saptakoshi Development Bank Ltd (SAPDBL)", exchange: "NEPSE", category: "STOCKS", price: 278, change: 0.96, volatility: 0.31, website: "https://skdbl.com.np/" },
    { symbol: "SARBTM", name: "Sarbottam Cement Limited (SARBTM)", exchange: "NEPSE", category: "STOCKS", price: 227, change: -1.26, volatility: 0.47, website: "https://sarbottamcement.com/" },
    { symbol: "SBCF", name: "Sunrise Bluechip Fund (SBCF)", exchange: "NEPSE", category: "STOCKS", price: 136, change: 0.56, volatility: 0.08, website: "https://lscapital.com.np/" },
    { symbol: "SBI", name: "Nepal SBI Bank Limited (SBI)", exchange: "NEPSE", category: "STOCKS", price: 270, change: 0.82, volatility: 0.49, website: "https://nsbl.statebank/" },
    { symbol: "SBL", name: "Siddhartha Bank Limited (SBL)", exchange: "NEPSE", category: "STOCKS", price: 212, change: -0.17, volatility: 0.3, website: "https://www.siddharthabank.com/" },
    { symbol: "SCB", name: "Standard Chartered Bank Limited (SCB)", exchange: "NEPSE", category: "STOCKS", price: 136, change: 1.16, volatility: 0.2, website: "https://www.sc.com/np/" },
    { symbol: "SEF", name: "Siddhartha Equity Fund (SEF)", exchange: "NEPSE", category: "STOCKS", price: 157, change: 1.04, volatility: 0.09, website: "https://www.siddharthacapital.com/" },
    { symbol: "SFCL", name: "Samriddhi Finance Company Limited (SFCL)", exchange: "NEPSE", category: "STOCKS", price: 112, change: -0.82, volatility: 0.22, website: "https://www.sfcl.com.np/en" },
    { symbol: "SFEF", name: "Sunrise Focused Equity Fund (SFEF)", exchange: "NEPSE", category: "STOCKS", price: 261, change: 0.67, volatility: 0.33, website: "https://lscapital.com.np/" },
    { symbol: "SGHC", name: "Swet-Ganga Hydropower & Construction Limited (SGHC)", exchange: "NEPSE", category: "STOCKS", price: 212, change: 0.72, volatility: 0.36, website: "https://swetgangahydropower.com/" },
    { symbol: "SGIC", name: "Sanima GIC Insurance Limited (SGIC)", exchange: "NEPSE", category: "STOCKS", price: 250, change: -0.85, volatility: 0.31, website: "https://sgic.com.np/" },
    { symbol: "SHEL", name: "Singati Hydro Energy Limited ( SHEL )", exchange: "NEPSE", category: "STOCKS", price: 166, change: 1.25, volatility: 0.15, website: "https://singatihydro.com.np/" },
    { symbol: "SHINE", name: "Shine Resunga Development Bank Ltd. (SHINE)", exchange: "NEPSE", category: "STOCKS", price: 221, change: -0.55, volatility: 0.28, website: "https://srdb.com.np/" },
    { symbol: "SHIVM", name: "Shivam Cements Limited (SHIVM)", exchange: "NEPSE", category: "STOCKS", price: 179, change: -1.06, volatility: 0.08, website: "https://shivamcement.com.np/" },
    { symbol: "SHLB", name: "Shrijanshil Laghubitta Bittiya Sanstha Limited (SHLB)", exchange: "NEPSE", category: "STOCKS", price: 172, change: -0.33, volatility: 0.31, website: "https://shrijanshil.org/en" },
    { symbol: "SHPC", name: "Sanima Mai Hydropower Ltd. (SHPC)", exchange: "NEPSE", category: "STOCKS", price: 128, change: -0.64, volatility: 0.23, website: "https://maihydro.com/" },
    { symbol: "SICL", name: "Shikhar Insurance Co. Ltd. (SICL)", exchange: "NEPSE", category: "STOCKS", price: 203, change: -0.42, volatility: 0.45, website: "https://shikharinsurance.com/" },
    { symbol: "SIFC", name: "Shree Investment Finance Co. Ltd. (SIFC)", exchange: "NEPSE", category: "STOCKS", price: 102, change: 0.86, volatility: 0.12, website: "https://www.shreefinance.com.np/" },
    { symbol: "SIGS2", name: "Siddhartha Investment Growth Scheme 2 (SIGS 2)", exchange: "NEPSE", category: "STOCKS", price: 165, change: -0.66, volatility: 0.47, website: "https://www.siddharthacapital.com/" },
    { symbol: "SIGS3", name: "Siddhartha Investment Growth Scheme 3 (SIGS3)", exchange: "NEPSE", category: "STOCKS", price: 220, change: 0.59, volatility: 0.44, website: "https://www.siddharthacapital.com/" },
    { symbol: "SIKLES", name: "Sikles Hydropower Limited (SIKLES)", exchange: "NEPSE", category: "STOCKS", price: 217, change: 0.28, volatility: 0.48, website: "https://sikleshydro.com.np/" },
    { symbol: "SINDU", name: "Sindhu Bikash Bank Ltd (SINDU)", exchange: "NEPSE", category: "STOCKS", price: 276, change: 0.36, volatility: 0.29, website: "https://www.sindhubank.com.np/" },
    { symbol: "SIPD", name: "Shikhar Power Development Limited (SIPD)", exchange: "NEPSE", category: "STOCKS", price: 258, change: 0.12, volatility: 0.3, website: "https://www.shikharpower.com.np/" },
    { symbol: "SJCL", name: "sanjen jalavidhyut company limited (sjcl)", exchange: "NEPSE", category: "STOCKS", price: 269, change: -0.1, volatility: 0.07, website: "https://sjcl.com.np/" },
    { symbol: "SJLIC", name: "SuryaJyoti Life Insurance Company Limited (SJLIC)", exchange: "NEPSE", category: "STOCKS", price: 147, change: 1.0, volatility: 0.44, website: "https://suryajyotilife.com/" },
    { symbol: "SKBBL", name: "Sana Kisan Bikas Laghubitta Bittiya Sanstha Limited", exchange: "NEPSE", category: "STOCKS", price: 145, change: -0.65, volatility: 0.36, website: "https://www.skbbl.com.np/" },
    { symbol: "SKHEL", name: "Suryakunda Hydro Electric Limited (SKHEL)", exchange: "NEPSE", category: "STOCKS", price: 218, change: 1.36, volatility: 0.28, website: "https://suryakundahydro.com.np/" },
    { symbol: "SKHL", name: "Super Khudi Hydropower Limited (SKHL)", exchange: "NEPSE", category: "STOCKS", price: 194, change: 0.41, volatility: 0.49, website: "https://www.superkhudi.com.np/" },
    { symbol: "SLBBL", name: "Swarojgar Laghubitta Bittiya Sanstha Ltd. (SLBBL)", exchange: "NEPSE", category: "STOCKS", price: 196, change: -0.31, volatility: 0.29, website: "https://www.slbbl.com.np/" },
    { symbol: "SLBSL", name: "Samudayik Laghubitta Bittiya Sanstha Limited (SLBSL)", exchange: "NEPSE", category: "STOCKS", price: 202, change: 0.71, volatility: 0.22, website: "https://www.slbsl.com.np/" },
    { symbol: "SLCF", name: "Sanima Large Cap Fund (SLCF)", exchange: "NEPSE", category: "STOCKS", price: 183, change: 0.56, volatility: 0.32, website: "https://www.sanima.capital/" },
    { symbol: "SMATA", name: "Samata Gharelu Laghubitta Bittiya Sanstha Limited (SMATA)", exchange: "NEPSE", category: "STOCKS", price: 298, change: -0.6, volatility: 0.26, website: "https://samata.org.np/" },
    { symbol: "SMB", name: "Support Laghubitta Bittiya Sanstha Limited (SMB)", exchange: "NEPSE", category: "STOCKS", price: 133, change: -1.15, volatility: 0.11, website: "https://www.supportmicrofinance.com.np/" },
    { symbol: "SMFBS", name: "Swabhimaan Laghubitta Bittiya Sanstha Ltd (SMFBS)", exchange: "NEPSE", category: "STOCKS", price: 151, change: -0.32, volatility: 0.32, website: "https://swabhimaanlaghubitta.com.np/" },
    { symbol: "SMH", name: "Super Mai Hydropower Limited (SMH)", exchange: "NEPSE", category: "STOCKS", price: 124, change: -1.17, volatility: 0.19, website: "https://www.supermaihydro.com.np/" },
    { symbol: "SMHL", name: "Super Madi Hydropower Limited (SMHL)", exchange: "NEPSE", category: "STOCKS", price: 196, change: 1.13, volatility: 0.26, website: "https://supermadihydro.com.np/" },
    { symbol: "SMJC", name: "Sagarmatha Jalabidhyut Company Limited (SMJC)", exchange: "NEPSE", category: "STOCKS", price: 180, change: -0.6, volatility: 0.47, website: "https://sagarmathajbc.com.np/" },
    { symbol: "SMPDA", name: "Sampada Laghubitta Bittiya Sanstha Limited (SMPDA)", exchange: "NEPSE", category: "STOCKS", price: 183, change: -0.32, volatility: 0.26, website: "https://sampadalaghubitta.com.np/" },
    { symbol: "SNLI", name: "Sun Nepal Life Insurance Company Limited (SNLI)", exchange: "NEPSE", category: "STOCKS", price: 126, change: -0.59, volatility: 0.23, website: "https://sunlife.com.np/en" },
    { symbol: "SOHL", name: "Solu Hydropower Limited (SOHL)", exchange: "NEPSE", category: "STOCKS", price: 137, change: -0.27, volatility: 0.1, website: "https://soluhydro.com/" },
    { symbol: "SONA", name: "Sonapur Minerals and Oil Limited (SONA)", exchange: "NEPSE", category: "STOCKS", price: 286, change: -0.84, volatility: 0.19, website: "https://sona.org.np/" },
    { symbol: "SPC", name: "Samling Power Company Limited (SPC)", exchange: "NEPSE", category: "STOCKS", price: 157, change: -0.29, volatility: 0.01, website: "https://spc.gov.np/" },
    { symbol: "SPDL", name: "Synergy Power Development Ltd. (SPDL)", exchange: "NEPSE", category: "STOCKS", price: 194, change: 0.26, volatility: 0.08, website: "https://synergyhydro.com/" },
    { symbol: "SPHL", name: "Sayapatri Hydropower Limited (SPHL)", exchange: "NEPSE", category: "STOCKS", price: 271, change: -0.89, volatility: 0.48, website: "https://www.sharesansar.com/company/sphl" },
    { symbol: "SPIL", name: "Siddhartha Premier Insurance Limited (SPIL)", exchange: "NEPSE", category: "STOCKS", price: 202, change: -1.06, volatility: 0.36, website: "https://siddharthapremier.com.np/" },
    { symbol: "SPL", name: "Shuvam Power Limited - SPL Stock Price", exchange: "NEPSE", category: "STOCKS", price: 260, change: -1.27, volatility: 0.03, website: "https://www.sharesansar.com/company/spl" },
    { symbol: "SRLI", name: "Sanima Reliance Life Insurance Limited (SRLI)", exchange: "NEPSE", category: "STOCKS", price: 217, change: -0.58, volatility: 0.23, website: "https://www.sanimareliancelife.com/" },
    { symbol: "SSHL", name: "Shiva Shree Hydropower Limited (SSHL)", exchange: "NEPSE", category: "STOCKS", price: 176, change: -1.21, volatility: 0.36, website: "https://shivashreehydro.com.np/" },
    { symbol: "STC", name: "Salt Trading Corporation (STC)", exchange: "NEPSE", category: "STOCKS", price: 164, change: -1.05, volatility: 0.27, website: "https://stcnepal.com/" },
    { symbol: "SWASTIK", name: "Swastik Laghubitta Bittiya Sanstha Limited (SWASTIK)", exchange: "NEPSE", category: "STOCKS", price: 134, change: -1.35, volatility: 0.16, website: "https://swastiklbs.com.np/" },
    { symbol: "SWBBL", name: "Swabalamban Laghubitta Bittiya Sanstha Limited (SWBBL)", exchange: "NEPSE", category: "STOCKS", price: 171, change: -0.31, volatility: 0.02, website: "https://www.swbbl.com.np/" },
    { symbol: "SWMF", name: "Suryodaya Womi Laghubitta Bittiya Sanstha Limited (SWMF)", exchange: "NEPSE", category: "STOCKS", price: 138, change: 0.49, volatility: 0.21, website: "https://swmfi.com.np/" },
    { symbol: "SYPNL", name: "Y Panel Nepal Limited (SYPNL)", exchange: "NEPSE", category: "STOCKS", price: 275, change: -0.72, volatility: 0.47, website: "https://synepal.com/" },
    { symbol: "TAMOR", name: "anima Middle Tamor Hydropower Limited (TAMOR)", exchange: "NEPSE", category: "STOCKS", price: 288, change: -0.69, volatility: 0.18, website: "https://middletamor.com/" },
    { symbol: "TPC", name: "erhathum Power Company Limited (TPC)", exchange: "NEPSE", category: "STOCKS", price: 279, change: 0.16, volatility: 0.01, website: "https://terhathumpower.com/" },
    { symbol: "TRH", name: "Taragaon Regency Hotel Limited (TRH)", exchange: "NEPSE", category: "STOCKS", price: 111, change: -0.84, volatility: 0.43, website: "https://taragaon.com/" },
    { symbol: "TSHL", name: "Three Star Hydropower Limited (TSHL)", exchange: "NEPSE", category: "STOCKS", price: 162, change: 1.22, volatility: 0.1, website: "https://www.threestarhydro.com/" },
    { symbol: "TTL", name: "Trade Tower Limited (TTL)", exchange: "NEPSE", category: "STOCKS", price: 136, change: 1.47, volatility: 0.14, website: "https://tradetower.com.np/" },
    { symbol: "TVCL", name: "Trishuli Jal Vidhyut Company Limited (TVCL)", exchange: "NEPSE", category: "STOCKS", price: 261, change: 0.13, volatility: 0.29, website: "https://tjvcl.com/" },
    { symbol: "UAIL", name: "United Ajod Insurance Limited (UAIL)", exchange: "NEPSE", category: "STOCKS", price: 176, change: -0.31, volatility: 0.11, website: "https://unitedajodinsurance.com/" },
    { symbol: "UHEWA", name: "Upper Hewakhola Hydropower Company Limited (UHEWA)", exchange: "NEPSE", category: "STOCKS", price: 255, change: -1.32, volatility: 0.38, website: "https://upperhewahpc.com.np/" },
    { symbol: "ULBSL", name: "Upakar Laghubitta Bittiya Sanstha Limited (ULBSL)", exchange: "NEPSE", category: "STOCKS", price: 187, change: 1.15, volatility: 0.48, website: "https://www.ulbsl.com.np/" },
    { symbol: "ULHC", name: "Upper Lohore Khola Hydropower Company Limited (ULHC)", exchange: "NEPSE", category: "STOCKS", price: 261, change: -0.82, volatility: 0.46, website: "https://ulkhp.com/" },
    { symbol: "UMHL", name: "United Modi Hydropower Ltd. (UMHL)", exchange: "NEPSE", category: "STOCKS", price: 160, change: 1.11, volatility: 0.02, website: "https://umh.com.np/" },
    { symbol: "UMRH", name: "United IDI Mardi RB Hydropower Limited. (UMRH)", exchange: "NEPSE", category: "STOCKS", price: 191, change: -0.63, volatility: 0.03, website: "https://idimardihydro.com.np/" },
    { symbol: "UNHPL", name: "Union Hydropower Limited (UNHPL)", exchange: "NEPSE", category: "STOCKS", price: 178, change: -1.35, volatility: 0.06, website: "https://www.unionhydropower.com.np/" },
    { symbol: "UNL", name: "Unilever Nepal Limited (UNL)", exchange: "NEPSE", category: "STOCKS", price: 257, change: 0.01, volatility: 0.02, website: "https://www.unilevernepal.com/" },
    { symbol: "UNLB", name: "Unique Nepal Laghubitta Bittiya Sanstha Limited (UNLB)", exchange: "NEPSE", category: "STOCKS", price: 144, change: 0.84, volatility: 0.16, website: "https://uniquenepalmicrofinance.com.np/" },
    { symbol: "UPPER", name: "Upper Tamakoshi Hydropower Ltd (UPPER)", exchange: "NEPSE", category: "STOCKS", price: 192, change: 0.47, volatility: 0.44, website: "https://utkhpl.org.np/" },
    { symbol: "USHEC", name: "Upper Solu Hydro Electric Company Limited (USHEC)", exchange: "NEPSE", category: "STOCKS", price: 111, change: -0.99, volatility: 0.26, website: "https://ushec.com.np/" },
    { symbol: "USHL", name: "Upper Syange Hydropower Limited (USHL)", exchange: "NEPSE", category: "STOCKS", price: 112, change: -0.16, volatility: 0.32, website: "https://uppersyange.com/" },
    { symbol: "USLB", name: "Unnati Sahakarya Laghubitta Bittiya Sanstha Limited (USLB)", exchange: "NEPSE", category: "STOCKS", price: 129, change: -1.09, volatility: 0.43, website: "https://unnatislbs.com.np/" },
    { symbol: "VLBS", name: "Vijaya laghubitta Bittiya Sanstha Ltd. (VLBS)", exchange: "NEPSE", category: "STOCKS", price: 282, change: -0.98, volatility: 0.27, website: "https://vlbs.com.np/" },
    { symbol: "VLUCL", name: "Vision Lumbini Urja Company Limited (VLUCL)", exchange: "NEPSE", category: "STOCKS", price: 234, change: -1.25, volatility: 0.28, website: "https://www.visionlumbiniurja.com/" },
    { symbol: "WNLB", name: "WEAN Nepal Laghubitta Bittiya Sanstha Limited (WNLB)", exchange: "NEPSE", category: "STOCKS", price: 269, change: 0.15, volatility: 0.14, website: "https://weannepal.com/" },
    { symbol: "BTCUSD", name: "Bitcoin / USD", exchange: "BINANCE", category: "CRYPTO", price: 67250.00, change: 3.40, volatility: 0.50 },
    { symbol: "ETHUSD", name: "Ethereum / USD", exchange: "BINANCE", category: "CRYPTO", price: 3480.20, change: 1.85, volatility: 0.55 },
    { symbol: "SOLUSD", name: "Solana / USD", exchange: "BINANCE", category: "CRYPTO", price: 178.60, change: 8.90, volatility: 0.70 },
    { symbol: "ADAUSD", name: "Cardano / USD", exchange: "BINANCE", category: "CRYPTO", price: 0.485, change: -2.10, volatility: 0.45 },
    { symbol: "DOGEUSD", name: "Dogecoin / USD", exchange: "BINANCE", category: "CRYPTO", price: 0.148, change: 12.40, volatility: 0.85 },

    // Forex Pairs
    { symbol: "EURUSD", name: "Euro / US Dollar", exchange: "FOREX", category: "FOREX", price: 1.0854, change: 0.15, volatility: 0.04 },
    { symbol: "GBPUSD", name: "British Pound / USD", exchange: "FOREX", category: "FOREX", price: 1.2680, change: 0.22, volatility: 0.05 },
    { symbol: "USDJPY", name: "US Dollar / Japanese Yen", exchange: "FOREX", category: "FOREX", price: 151.42, change: -0.12, volatility: 0.06 },
    { symbol: "AUDUSD", name: "Australian Dollar / USD", exchange: "FOREX", category: "FOREX", price: 0.6545, change: -0.35, volatility: 0.07 }
];

// Audio Sound Effects (Synthesized using Web Audio API for 100% reliability offline)
function playSound(type) {
    if (state.volumeMuted) return;
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);

        if (type === 'buy') {
            // Uplifting high arpeggio
            osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
            osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1); // E5
            osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.2); // G5
            gain.gain.setValueAtTime(0.1, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
            osc.start();
            osc.stop(ctx.currentTime + 0.35);
        } else if (type === 'sell') {
            // Descending dramatic synth
            osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
            osc.frequency.setValueAtTime(493.88, ctx.currentTime + 0.1); // B4
            osc.frequency.setValueAtTime(392.00, ctx.currentTime + 0.2); // G4
            gain.gain.setValueAtTime(0.1, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
            osc.start();
            osc.stop(ctx.currentTime + 0.35);
        } else if (type === 'notification') {
            // Subtle pop sound
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(880.00, ctx.currentTime);
            gain.gain.setValueAtTime(0.05, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
            osc.start();
            osc.stop(ctx.currentTime + 0.15);
        }
    } catch (e) {
        console.warn("Audio synthesis block failed:", e);
    }
}

// System Toast Notifications
function triggerNotification(message, type = 'info') {
    playSound('notification');
    const container = document.getElementById('notificationContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let iconClass = 'fa-circle-info';
    if (type === 'success') iconClass = 'fa-circle-check';
    if (type === 'error') iconClass = 'fa-circle-exclamation';
    
    toast.innerHTML = `
        <i class="fa-solid ${iconClass}"></i>
        <div>${message}</div>
    `;
    
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.animation = 'slideIn 0.3s ease-out reverse';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// ----------------------------------------------------
// STATE PERSISTENCE ENGINE (localStorage)
// ----------------------------------------------------
function saveStateToStorage() {
    localStorage.setItem("feintrade_trading_state", JSON.stringify(state));
}

function loadStateFromStorage() {
    const saved = localStorage.getItem("feintrade_trading_state");
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            // Deep merge user and balance objects
            state = { ...state, ...parsed };
        } catch (e) {
            console.error("Local storage parsing failed:", e);
        }
    }
    
    // Check if user is logged in to toggle overlay
    const overlay = document.getElementById("authOverlay");
    if (state.user.isLoggedIn) {
        overlay.style.display = "none";
        triggerNotification(`Terminal connected. Welcome back, ${state.user.name}!`, "success");
    } else {
        overlay.style.display = "flex";
    }
    
    updateUIElements();
    initTradingViewChart();
    renderAllViews();
}

// Authentication Logic
function toggleAuthMode() {
    const btn = document.getElementById("authSubmitBtn");
    const toggle = document.getElementById("authToggleText");
    const sub = document.getElementById("authSubtitle");
    
    if (btn.innerText === "LOG IN") {
        btn.innerText = "SIGN UP";
        toggle.innerText = "Log In Here";
        sub.innerText = "Create a new institutional demo account instantly";
    } else {
        btn.innerText = "LOG IN";
        toggle.innerText = "Sign Up Now";
        sub.innerText = "Login to access your premium institutional trading terminal";
    }
}

function handleAuthSubmit(e) {
    e.preventDefault();
    const email = document.getElementById("authEmail").value;
    const name = email.split('@')[0];
    
    state.user.name = name.charAt(0).toUpperCase() + name.slice(1);
    state.user.isLoggedIn = true;
    
    // Initialize default profile parameters
    document.getElementById("profileNameInput").value = state.user.name;
    
    saveStateToStorage();
    
    // Hide Auth screen with animation
    const overlay = document.getElementById("authOverlay");
    overlay.style.opacity = 0;
    setTimeout(() => {
        overlay.style.display = "none";
        overlay.style.opacity = 1;
    }, 400);
    
    triggerNotification(`Authorized terminal key. Hello ${state.user.name}!`, "success");
    updateUIElements();
    renderAllViews();
}

function handleLogOut() {
    state.user.isLoggedIn = false;
    saveStateToStorage();
    document.getElementById("authOverlay").style.display = "flex";
    triggerNotification("Terminal credentials signed out successfully.", "info");
}

function toggleMute() {
    state.volumeMuted = !state.volumeMuted;
    const icon = document.getElementById("volumeIcon");
    if (state.volumeMuted) {
        icon.className = "fa-solid fa-volume-xmark";
        triggerNotification("Interface audio muted.", "info");
    } else {
        icon.className = "fa-solid fa-volume-high";
        triggerNotification("Interface audio enabled.", "success");
    }
}

// Reset System cash and data
function resetPaperTradingAccount() {
    if (confirm("Are you sure you want to reset your portfolio and return to $100,000 cash? This clears trade history and journal logs!")) {
        state.balance = {
            initial: 100000.00,
            cash: 100000.00,
            netLiq: 100000.00,
            unrealizedPnL: 0.00,
            unrealizedPnLPct: 0.00
        };
        state.portfolio = {};
        state.transactions = [];
        state.journal = [];
        saveStateToStorage();
        triggerNotification("Account balance and holdings reset successfully.", "success");
        updateUIElements();
        renderAllViews();
    }
}

// ----------------------------------------------------
// DYNAMIC LIVE TICKER GENERATION
// ----------------------------------------------------
function initTickerBanner() {
    const track = document.getElementById("tickerTrack");
    let content = "";
    // Double array to create seamless loop wrapping
    const doubleList = [...assetDatabase, ...assetDatabase];
    
    doubleList.forEach(asset => {
        const isUp = asset.change >= 0;
        const icon = isUp ? 'fa-caret-up' : 'fa-caret-down';
        const cl = isUp ? 'up' : 'down';
        const formattedPrice = asset.price > 10 ? asset.price.toFixed(2) : asset.price.toFixed(4);
        
        content += `
            <div class="ticker-item" onclick="selectAsset('${asset.symbol}')">
                <span class="ticker-symbol">${asset.symbol}</span>
                <span class="ticker-price">$${formattedPrice}</span>
                <span class="ticker-change ${cl}">
                    <i class="fa-solid ${icon}"></i> ${asset.change > 0 ? '+' : ''}${asset.change.toFixed(2)}%
                </span>
            </div>
        `;
    });
    track.innerHTML = content;
}

// Simulation of price fluctuations dynamically every 3 seconds to keep UI alive!
function simulateMarketFluctuations() {
    assetDatabase.forEach(asset => {
        const volatility = asset.volatility || 0.1;
        const percentChange = (Math.random() - 0.5) * volatility * 1.5;
        asset.price += asset.price * (percentChange / 100);
        asset.change += percentChange;
    });
    
    updateUIElements();
    updateHoldingValues();
    initTickerBanner();
    
    // Refresh table/lists if current views are active
    const activeView = document.querySelector(".page-view.active").id;
    if (activeView === "dashboard") {
        renderMoversLists();
        renderWatchlist();
    } else if (activeView === "markets") {
        renderMarketsTable();
    } else if (activeView === "portfolio") {
        renderPortfolioHoldings();
    } else if (activeView === "trading") {
        calculateEstimatedOrderCost();
    }
}

// Update core financial calculations
function updateHoldingValues() {
    let totalHoldingsVal = 0;
    let totalCost = 0;
    
    Object.keys(state.portfolio).forEach(symbol => {
        const holding = state.portfolio[symbol];
        const currentAsset = assetDatabase.find(a => a.symbol === symbol);
        if (currentAsset) {
            const currentVal = holding.qty * currentAsset.price;
            totalHoldingsVal += currentVal;
            totalCost += holding.qty * holding.avgPrice;
        }
    });
    
    state.balance.netLiq = state.balance.cash + totalHoldingsVal;
    state.balance.unrealizedPnL = totalHoldingsVal - totalCost;
    state.balance.unrealizedPnLPct = totalCost > 0 ? (state.balance.unrealizedPnL / totalCost) * 100 : 0.00;
}

// Update Top Bar & Header Stats
function updateUIElements() {
    updateHoldingValues();
    
    document.getElementById("quickNetLiq").innerText = `$${state.balance.netLiq.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    document.getElementById("quickCash").innerText = `$${state.balance.cash.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    
    const pnlLabel = document.getElementById("quickPnL");
    const prefix = state.balance.unrealizedPnL >= 0 ? '+' : '';
    const formattedPnL = `$${state.balance.unrealizedPnL.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${prefix}${state.balance.unrealizedPnLPct.toFixed(2)}%)`;
    
    pnlLabel.innerText = formattedPnL;
    if (state.balance.unrealizedPnL >= 0) {
        pnlLabel.className = "quick-stat-value profit";
    } else {
        pnlLabel.className = "quick-stat-value loss";
    }
    
    // Sidebar details
    document.getElementById("sidebarUserName").innerText = state.user.name;
    document.getElementById("sidebarAvatar").src = state.user.avatar;
    document.getElementById("profileCardAvatar").src = state.user.avatar;
    document.getElementById("profileCardName").innerText = state.user.name;
}

// ----------------------------------------------------
// SINGLE PAGE NAVIGATION CONTROLLER
// ----------------------------------------------------
function switchTab(e, viewId) {
    if (e) e.preventDefault();
    
    // Update active nav items
    document.querySelectorAll(".nav-item").forEach(item => item.classList.remove("active"));
    
    // Match active anchors or fallbacks
    const navItems = Array.from(document.querySelectorAll(".nav-item"));
    const match = navItems.find(item => item.getAttribute("onclick").includes(`'${viewId}'`));
    if (match) match.classList.add("active");
    
    // Switch views
    document.querySelectorAll(".page-view").forEach(view => view.classList.remove("active"));
    document.getElementById(viewId).classList.add("active");
    
    renderAllViews(viewId);
}

// Render dynamic elements inside active views
function renderAllViews(activeTabId = "dashboard") {
    if (activeTabId === "dashboard") {
        renderMoversLists();
        renderWatchlist();
        renderPerformanceChart();
        updateVirtualSummaryPanel();
    } else if (activeTabId === "markets") {
        renderMarketsTable();
    } else if (activeTabId === "portfolio") {
        renderPortfolioHoldings();
        renderPortfolioCharts();
    } else if (activeTabId === "trading") {
        updateTradingTicketView();
        initTradingViewChart();
    } else if (activeTabId === "news") {
        renderNewsGrid();
    } else if (activeTabId === "ai-tools") {
        renderLeaderboard();
        calculateRiskManagement();
    } else if (activeTabId === "settings") {
        renderJournalLogs();
        renderTransactionHistoryTable();
    }
}

// Select asset and open Trading terminal directly
function selectAsset(symbol) {
    const asset = assetDatabase.find(a => a.symbol === symbol);
    if (!asset) return;
    state.activeSymbol = asset.symbol;
    state.activeExchange = asset.exchange;
    state.activeCategory = asset.category;
    
    switchTab(null, 'trading');
}

// ----------------------------------------------------
// AUTOCOMPLETE & GLOBAL SEARCH
// ----------------------------------------------------
function handleSearchAutocomplete(e) {
    const query = e.target.value.trim().toUpperCase();
    const dropdown = document.getElementById("autocompleteDropdown");
    
    if (query.length === 0) {
        dropdown.style.display = "none";
        return;
    }
    
    const matches = assetDatabase.filter(asset => 
        asset.symbol.includes(query) || 
        asset.name.toUpperCase().includes(query)
    ).slice(0, 6);
    
    if (matches.length === 0) {
        dropdown.innerHTML = `<div style="padding: 10px 16px; color: var(--text-muted); font-size: 12px;">No global assets found</div>`;
        dropdown.style.display = "block";
        return;
    }
    
    let content = "";
    matches.forEach(m => {
        content += `
            <div class="autocomplete-item" onclick="confirmSearchSelection('${m.symbol}')">
                <div>
                    <span class="autocomplete-symbol">${m.symbol}</span> - 
                    <span class="autocomplete-name">${m.name}</span>
                </div>
                <span class="autocomplete-exchange">${m.exchange}</span>
            </div>
        `;
    });
    
    dropdown.innerHTML = content;
    dropdown.style.display = "block";
}

function confirmSearchSelection(symbol) {
    document.getElementById("autocompleteDropdown").style.display = "none";
    document.getElementById("symbolSearchInput").value = "";
    selectAsset(symbol);
}

// Close autocomplete when clicked outside
document.addEventListener("click", (e) => {
    if (!e.target.closest(".search-container")) {
        const d = document.getElementById("autocompleteDropdown");
        if (d) d.style.display = "none";
    }
});

// ----------------------------------------------------
// VIEW 1: DASHBOARD ANALYTICS & WATCHLISTS
// ----------------------------------------------------
let perfChartInstance = null;
function renderPerformanceChart() {
    const ctx = document.getElementById('performanceChart').getContext('2d');
    if (perfChartInstance) perfChartInstance.destroy();

    // Determine if this is a new user (no trades done yet)
    const hasActivity = Object.keys(state.portfolio).length > 0 ||
                        (state.transactions && state.transactions.length > 0);
    const startBalance = 100000;

    let labels, dataPoints;

    if (!hasActivity) {
        // New user: flat line at starting balance — no fake performance data
        if (state.dashboardPeriod === '1W') {
            labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Today'];
        } else if (state.dashboardPeriod === '1M') {
            labels = ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Now'];
        } else {
            labels = ['Account Start', 'Now'];
        }
        dataPoints = labels.map(() => startBalance);
    } else if (state.dashboardPeriod === '1W') {
        // Build from actual transaction history — last 6 data points
        const txns = (state.transactions || []).slice(-5);
        labels = ['Start', ...txns.map((_, i) => `Trade ${i+1}`), 'Now'];
        let running = startBalance;
        dataPoints = [startBalance];
        txns.forEach(t => {
            running += (t.type === 'SELL' ? t.total : -t.total);
            dataPoints.push(Math.max(0, running));
        });
        dataPoints.push(state.balance.netLiq);
    } else if (state.dashboardPeriod === '1M') {
        labels = ['Start', 'Early', 'Mid', 'Late', 'Now'];
        dataPoints = [startBalance, startBalance, startBalance, startBalance, state.balance.netLiq];
    } else {
        labels = ['Account Start', 'Checkpoint', 'Now'];
        dataPoints = [startBalance, (startBalance + state.balance.netLiq) / 2, state.balance.netLiq];
    }
    
    const isProfitable = state.balance.netLiq >= 100000;
    const borderCl = isProfitable ? '#00e676' : '#ff1744';
    const shadowCl = isProfitable ? 'rgba(0, 230, 118, 0.15)' : 'rgba(255, 23, 68, 0.15)';
    
    perfChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Virtual Asset Net Liquidating Value ($)',
                data: dataPoints,
                borderColor: borderCl,
                borderWidth: 3,
                tension: 0.4,
                pointBackgroundColor: borderCl,
                pointHoverRadius: 8,
                fill: true,
                backgroundColor: function(context) {
                    const chart = context.chart;
                    const {ctx, chartArea} = chart;
                    if (!chartArea) return null;
                    const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
                    gradient.addColorStop(0, shadowCl);
                    gradient.addColorStop(1, 'rgba(6, 8, 20, 0)');
                    return gradient;
                }
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                x: {
                    grid: { color: 'rgba(255, 255, 255, 0.03)' },
                    ticks: { color: '#64748b', font: { family: 'Plus Jakarta Sans' } }
                },
                y: {
                    grid: { color: 'rgba(255, 255, 255, 0.03)' },
                    ticks: { color: '#64748b', font: { family: 'Plus Jakarta Sans' } }
                }
            }
        }
    });
}

function updateDashboardChartPeriod(event, period) {
    state.dashboardPeriod = period;
    
    // Manage tab highlight active styling
    const tabs = document.querySelectorAll("#dashboard .market-tab");
    tabs.forEach(t => t.classList.remove("active"));
    if (event && event.target) event.target.classList.add("active");
    
    renderPerformanceChart();
}

function renderMoversLists() {
    const listGainers = document.getElementById("topGainersList");
    const listLosers = document.getElementById("topLosersList");
    
    // Sort array by % change
    const sorted = [...assetDatabase].sort((a, b) => b.change - a.change);
    const gainers = sorted.slice(0, 4);
    const losers = sorted.slice(-4).reverse();
    
    let contentGainers = "";
    gainers.forEach(g => {
        const logoMarkup = g.logo ? `<img src="${g.logo}" alt="${g.symbol} logo">` : g.symbol.slice(0,3);
        contentGainers += `
            <div class="list-item" onclick="selectAsset('${g.symbol}')">
                <div class="stock-info">
                    <div class="stock-logo">${logoMarkup}</div>
                    <div class="stock-name-grp">
                        <span class="stock-symbol">${g.symbol}</span>
                        <span class="stock-name">${g.name}</span>
                    </div>
                </div>
                <div class="stock-stats">
                    <span class="stock-price">$${g.price.toFixed(2)}</span>
                    <span class="stock-change up">+${g.change.toFixed(2)}%</span>
                </div>
            </div>
        `;
    });
    
    let contentLosers = "";
    losers.forEach(l => {
        const logoMarkup = l.logo ? `<img src="${l.logo}" alt="${l.symbol} logo">` : l.symbol.slice(0,3);
        contentLosers += `
            <div class="list-item" onclick="selectAsset('${l.symbol}')">
                <div class="stock-info">
                    <div class="stock-logo">${logoMarkup}</div>
                    <div class="stock-name-grp">
                        <span class="stock-symbol">${l.symbol}</span>
                        <span class="stock-name">${l.name}</span>
                    </div>
                </div>
                <div class="stock-stats">
                    <span class="stock-price">$${l.price.toFixed(2)}</span>
                    <span class="stock-change down">${l.change.toFixed(2)}%</span>
                </div>
            </div>
        `;
    });
    
    listGainers.innerHTML = contentGainers;
    listLosers.innerHTML = contentLosers;
}

function renderWatchlist() {
    const list = document.getElementById("watchlistList");
    let content = "";
    
    state.watchlist.forEach(sym => {
        const asset = assetDatabase.find(a => a.symbol === sym);
        if (asset) {
            const isUp = asset.change >= 0;
            const cl = isUp ? 'up' : 'down';
            const logoMarkup = asset.logo ? `<img src="${asset.logo}" alt="${asset.symbol} logo">` : asset.symbol.slice(0,3);
            content += `
                <div class="list-item" onclick="selectAsset('${asset.symbol}')">
                    <div class="stock-info">
                        <div class="stock-logo" style="background: rgba(0, 242, 254, 0.05); color: var(--neon-blue);">${logoMarkup}</div>
                        <div class="stock-name-grp">
                            <span class="stock-symbol">${asset.symbol}</span>
                            <span class="stock-name">${asset.name}</span>
                        </div>
                    </div>
                    <div class="stock-stats">
                        <span class="stock-price">$${asset.price > 10 ? asset.price.toFixed(2) : asset.price.toFixed(4)}</span>
                        <span class="stock-change ${cl}">${isUp ? '+' : ''}${asset.change.toFixed(2)}%</span>
                    </div>
                </div>
            `;
        }
    });
    list.innerHTML = content;
}

function promptAddWatchlist() {
    const symbol = prompt("Enter asset symbol to add to Watchlist (e.g. BTCUSD, TSLA, NVDA):");
    if (!symbol) return;
    const cleanSym = symbol.trim().toUpperCase();
    const asset = assetDatabase.find(a => a.symbol === cleanSym);
    
    if (!asset) {
        triggerNotification(`Asset key "${cleanSym}" not recognized in active terminal directory.`, "error");
        return;
    }
    
    if (state.watchlist.includes(cleanSym)) {
        triggerNotification(`${cleanSym} is already inside watchlist.`, "info");
        return;
    }
    
    state.watchlist.push(cleanSym);
    saveStateToStorage();
    renderWatchlist();
    triggerNotification(`Added ${cleanSym} to watchlists.`, "success");
}

function updateVirtualSummaryPanel() {
    // Total Trades Executed
    document.getElementById("lblTotalTrades").innerText = state.transactions.length;
    
    // Winning trades ratio
    let wins = 0;
    let sells = state.transactions.filter(t => t.action === 'SELL');
    sells.forEach(s => {
        // Simple mock algorithm to verify profit returns
        if (s.total > (s.price * s.qty)) wins++;
    });
    const winRate = sells.length > 0 ? (wins / sells.length) * 100 : 0;
    document.getElementById("lblWinRate").innerText = `${winRate.toFixed(1)}%`;
    
    // Profit totals
    const totalProfits = state.balance.netLiq - state.balance.initial;
    const profLabel = document.getElementById("lblTotalProfits");
    profLabel.innerText = `${totalProfits >= 0 ? '+' : ''}$${totalProfits.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    profLabel.className = totalProfits >= 0 ? "quick-stat-value profit" : "quick-stat-value loss";
}

// ----------------------------------------------------
// VIEW 2: MARKETS LISTS EXPLORER
// ----------------------------------------------------
let selectedMarketsCategory = "ALL";
function switchMarketAssetTab(event, category) {
    selectedMarketsCategory = category;
    const tabs = document.querySelectorAll("#marketsAssetTabs .market-tab");
    tabs.forEach(t => t.classList.remove("active"));
    if (event && event.target) event.target.classList.add("active");
    renderMarketsTable();
}

function renderMarketsTable() {
    const tbody = document.getElementById("marketsTableBody");
    const filter = document.getElementById("marketFilterInput").value.trim().toUpperCase();
    let content = "";

    let list;
    if (selectedMarketsCategory === "ALL") {
        list = [...assetDatabase];
    } else if (selectedMarketsCategory === "NEPSE") {
        // NEPSE stocks are category STOCKS but exchange NEPSE
        list = assetDatabase.filter(a => a.exchange === "NEPSE");
    } else if (selectedMarketsCategory === "STOCKS") {
        // International equities only (not NEPSE)
        list = assetDatabase.filter(a => a.category === "STOCKS" && a.exchange !== "NEPSE");
    } else {
        list = assetDatabase.filter(a => a.category === selectedMarketsCategory);
    }

    if (filter) {
        list = list.filter(a => a.symbol.includes(filter) || a.name.toUpperCase().includes(filter));
    }

    if (list.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:var(--text-muted);padding:32px;">No assets found.</td></tr>`;
        return;
    }

    list.forEach(a => {
        const isUp = a.change >= 0;
        const cl = isUp ? 'text-profit' : 'text-loss';
        // NEPSE prices are in NPR, others in USD
        const isNepse = a.exchange === "NEPSE";
        const currency = isNepse ? "NPR " : "$";
        const formattedPrice = a.price > 10 ? a.price.toFixed(2) : a.price.toFixed(4);
        const progressVal = Math.min(100, Math.round(a.volatility * 100));
        const logoMarkup = a.logo ? `<img src="${a.logo}" alt="${a.symbol} logo">` : a.symbol.slice(0,3);
        content += `
            <tr>
                <td>
                    <div class="stock-info" onclick="selectAsset('${a.symbol}')">
                        <div class="stock-logo">${logoMarkup}</div>
                        <div class="stock-name-grp">
                            <span class="stock-symbol">${a.symbol}</span>
                            <span class="stock-name">${a.name}</span>
                        </div>
                    </div>
                </td>
                <td><span class="badge-ex">${a.exchange}</span></td>
                <td><strong style="font-family: var(--font-heading);">${currency}${formattedPrice}</strong></td>
                <td class="${cl}">${isUp ? '+' : ''}${a.change.toFixed(2)}%</td>
                <td>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span style="font-size: 11px; font-weight: 700; width: 24px;">${progressVal}%</span>
                        <div class="predict-meter" style="width: 80px; margin: 0; height: 6px;">
                            <div class="predict-fill" style="width: ${progressVal}%; background: linear-gradient(to right, #00b0ff, var(--neon-purple));"></div>
                        </div>
                    </div>
                </td>
                <td>
                    <button class="btn-execute buy" style="width: auto; padding: 6px 12px; margin-top: 0; font-size: 11px;" onclick="selectAsset('${a.symbol}')">
                        TRADE
                    </button>
                </td>
            </tr>
        `;
    });
    tbody.innerHTML = content;
}

function handleMarketFilter() {
    renderMarketsTable();
}

// ----------------------------------------------------
// VIEW 3: PORTFOLIO HOLDINGS & ANALYTICS
// ----------------------------------------------------
let allocationChartInstance = null;
function renderPortfolioCharts() {
    const ctx = document.getElementById('portfolioAllocationChart').getContext('2d');
    if (allocationChartInstance) allocationChartInstance.destroy();
    
    const symbols = Object.keys(state.portfolio);
    const shares = symbols.map(s => state.portfolio[s].qty);
    const values = symbols.map(s => {
        const asset = assetDatabase.find(a => a.symbol === s);
        return asset ? state.portfolio[s].qty * asset.price : 0;
    });
    
    if (symbols.length === 0) {
        // Mock empty allocation data chart
        allocationChartInstance = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Cash Capital available'],
                datasets: [{
                    data: [100],
                    backgroundColor: ['rgba(0, 242, 254, 0.1)'],
                    borderColor: ['rgba(0, 242, 254, 0.4)'],
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } }
            }
        });
        return;
    }
    
    allocationChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: symbols,
            datasets: [{
                data: values,
                backgroundColor: [
                    '#00f2fe', '#7f00ff', '#00e676', '#ff1744', '#ffd700', '#ff9100'
                ],
                borderWidth: 0,
                hoverOffset: 12
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: { color: '#94a3b8', font: { family: 'Plus Jakarta Sans', size: 10 } }
                }
            },
            cutout: '65%'
        }
    });
}

function renderPortfolioHoldings() {
    const tbody = document.getElementById("portfolioTableBody");
    let content = "";
    
    let holdingsTotalValue = 0;
    let holdingsTotalCost = 0;
    
    const symbols = Object.keys(state.portfolio);
    if (symbols.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 40px 0;">No active portfolio positions yet. Open the paper trading terminal to buy assets.</td></tr>`;
        document.getElementById("lblHoldingsCost").innerText = "$0.00";
        document.getElementById("lblCurrentHoldingsVal").innerText = "$0.00";
        return;
    }
    
    symbols.forEach(sym => {
        const holding = state.portfolio[sym];
        const asset = assetDatabase.find(a => a.symbol === sym);
        if (asset && holding.qty > 0) {
            const currentVal = holding.qty * asset.price;
            const costVal = holding.qty * holding.avgPrice;
            const returnPnL = currentVal - costVal;
            const returnPnLPct = costVal > 0 ? (returnPnL / costVal) * 100 : 0;
            const logoMarkup = asset.logo ? `<img src="${asset.logo}" alt="${asset.symbol} logo">` : sym.slice(0,3);
            
            holdingsTotalValue += currentVal;
            holdingsTotalCost += costVal;
            
            const returnClass = returnPnL >= 0 ? 'text-profit' : 'text-loss';
            const sign = returnPnL >= 0 ? '+' : '';
            
            content += `
                <tr>
                    <td>
                        <div class="stock-info" onclick="selectAsset('${sym}')">
                            <div class="stock-logo">${logoMarkup}</div>
                            <div class="stock-name-grp">
                                <span class="stock-symbol">${sym}</span>
                                <span class="stock-name">${asset.name}</span>
                            </div>
                        </div>
                    </td>
                    <td>$${holding.avgPrice.toFixed(2)}</td>
                    <td><strong style="font-family: var(--font-heading);">$${asset.price.toFixed(2)}</strong></td>
                    <td>${holding.qty.toFixed(2)}</td>
                    <td class="${returnClass}">${sign}$${returnPnL.toFixed(2)} (${sign}${returnPnLPct.toFixed(2)}%)</td>
                    <td>
                        <button class="btn-execute sell" style="width: auto; padding: 6px 12px; margin-top: 0; font-size: 11px;" onclick="closeHoldingPosition('${sym}')">
                            LIQUIDATE
                        </button>
                    </td>
                </tr>
            `;
        }
    });
    tbody.innerHTML = content;
    
    document.getElementById("lblHoldingsCost").innerText = `$${holdingsTotalCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    document.getElementById("lblCurrentHoldingsVal").innerText = `$${holdingsTotalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function closeHoldingPosition(symbol) {
    const holding = state.portfolio[symbol];
    if (!holding) return;
    
    // Select and prefill sell ticket
    state.activeSymbol = symbol;
    const asset = assetDatabase.find(a => a.symbol === symbol);
    state.activeExchange = asset.exchange;
    state.activeCategory = asset.category;
    
    switchTab(null, 'trading');
    switchOrderSide('SELL');
    document.getElementById("orderQtyInput").value = holding.qty;
    calculateEstimatedOrderCost();
    
    triggerNotification(`Prefilled trade ticket to liquidate your position in ${symbol}.`, "info");
}

// ----------------------------------------------------
// VIEW 4: PAPER TRADING & ADVANCED TRADINGVIEW CHART
// ----------------------------------------------------
function initTradingViewChart() {
    const container = document.getElementById("tvChartContainer");
    if (!container) return;
    
    container.innerHTML = ""; // Clear existing charts
    
    // Create new advanced widget
    const isCrypto = state.activeCategory === 'CRYPTO';
    const isForex = state.activeCategory === 'FOREX';
    
    let tickerSymbol = state.activeSymbol;
    if (isCrypto) {
        tickerSymbol = `BINANCE:${state.activeSymbol}`;
    } else if (isForex) {
        tickerSymbol = `FX_IDC:${state.activeSymbol}`;
    } else {
        // US Stocks NASDAQ or other global tickers
        tickerSymbol = `${state.activeExchange}:${state.activeSymbol}`;
    }
    
    // Initialize TradingView Widget element
    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/tv.js";
    script.async = true;
    script.onload = () => {
        if (typeof TradingView !== 'undefined') {
            new TradingView.widget({
                "width": "100%",
                "height": "100%",
                "symbol": tickerSymbol,
                "interval": "D",
                "timezone": "Etc/UTC",
                "theme": "dark",
                "style": "1",
                "locale": "en",
                "toolbar_bg": "#090d1a",
                "enable_publishing": false,
                "hide_side_toolbar": false,
                "allow_symbol_change": true,
                "container_id": "tvChartContainer"
            });
        }
    };
    document.head.appendChild(script);
}

function updateTradingTicketView() {
    const asset = assetDatabase.find(a => a.symbol === state.activeSymbol);
    if (!asset) return;
    
    document.getElementById("orderTicketSymbol").innerHTML = `<i class="fa-solid fa-receipt"></i> Trade Ticket: ${asset.symbol}`;
    document.getElementById("orderTicketExchange").innerText = asset.exchange;
    
    // Avail cash in ticket details
    document.getElementById("lblAvailableCashTicket").innerText = `$${state.balance.cash.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    
    // Update Limit price default if needed
    document.getElementById("orderPriceInput").value = asset.price.toFixed(2);
    
    // Update predicted percentage
    const direction = asset.change >= 0 ? "Bullish" : "Bearish";
    const percent = Math.floor(Math.random() * 20) + 55; // random 55-75% accuracy
    const col = direction === "Bullish" ? "var(--bullish-green)" : "var(--bearish-red)";
    
    const textEl = document.getElementById("predictPercentageText");
    textEl.innerText = `${direction} (${percent}%)`;
    textEl.style.color = col;
    document.getElementById("predictFillBar").style.width = `${percent}%`;
    
    calculateEstimatedOrderCost();
}

function switchOrderSide(side) {
    state.activeOrderSide = side;
    
    const b = document.getElementById("btnTabBuy");
    const s = document.getElementById("btnTabSell");
    const subBtn = document.getElementById("btnSubmitOrder");
    
    b.classList.remove("active");
    s.classList.remove("active");
    
    if (side === 'BUY') {
        b.classList.add("active");
        subBtn.className = "btn-execute buy";
        subBtn.innerHTML = `<i class="fa-solid fa-bolt"></i> EXECUTE BUY ORDER`;
    } else {
        s.classList.add("active");
        subBtn.className = "btn-execute sell";
        subBtn.innerHTML = `<i class="fa-solid fa-bolt"></i> EXECUTE SELL ORDER`;
    }
    
    calculateEstimatedOrderCost();
}

function switchOrderType(type) {
    state.activeOrderType = type;
    
    const m = document.getElementById("btnTypeMarket");
    const l = document.getElementById("btnTypeLimit");
    const grp = document.getElementById("limitPriceGroup");
    
    m.classList.remove("active");
    l.classList.remove("active");
    
    if (type === 'MARKET') {
        m.classList.add("active");
        grp.style.display = "none";
    } else {
        l.classList.add("active");
        grp.style.display = "flex";
    }
    
    calculateEstimatedOrderCost();
}

function setOrderQtyPercent(pct) {
    const asset = assetDatabase.find(a => a.symbol === state.activeSymbol);
    if (!asset) return;
    
    const price = state.activeOrderType === 'MARKET' ? asset.price : parseFloat(document.getElementById("orderPriceInput").value);
    
    if (state.activeOrderSide === 'BUY') {
        // Calculate max shares buyable based on percentage of available cash
        const targetCapital = state.balance.cash * (pct / 100);
        const qty = Math.floor(targetCapital / price);
        document.getElementById("orderQtyInput").value = qty > 0 ? qty : 1;
    } else {
        // Percentage of active position
        const holding = state.portfolio[state.activeSymbol];
        if (holding) {
            const qty = Math.floor(holding.qty * (pct / 100));
            document.getElementById("orderQtyInput").value = qty > 0 ? qty : 1;
        } else {
            document.getElementById("orderQtyInput").value = 0;
            triggerNotification("You do not hold any position in this symbol to sell.", "error");
        }
    }
    calculateEstimatedOrderCost();
}

function calculateEstimatedOrderCost() {
    const qty = parseFloat(document.getElementById("orderQtyInput").value) || 0;
    const priceInput = parseFloat(document.getElementById("orderPriceInput").value) || 0;
    const asset = assetDatabase.find(a => a.symbol === state.activeSymbol);
    if (!asset) return;
    
    const price = state.activeOrderType === 'MARKET' ? asset.price : priceInput;
    const total = qty * price;
    
    document.getElementById("lblEstimatedCost").innerText = `$${total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// core trade execution logic
function executePaperTradeOrder() {
    const qty = parseFloat(document.getElementById("orderQtyInput").value) || 0;
    if (qty <= 0) {
        triggerNotification("Quantity must be greater than zero.", "error");
        return;
    }
    
    const priceInput = parseFloat(document.getElementById("orderPriceInput").value) || 0;
    const asset = assetDatabase.find(a => a.symbol === state.activeSymbol);
    if (!asset) return;
    
    const price = state.activeOrderType === 'MARKET' ? asset.price : priceInput;
    const totalCost = qty * price;
    
    if (state.activeOrderSide === 'BUY') {
        // Check for cash balance sufficiency
        if (totalCost > state.balance.cash) {
            triggerNotification("Insufficient cash reserves in virtual account.", "error");
            return;
        }
        
        // Deduct Cash and allocate to portfolio
        state.balance.cash -= totalCost;
        
        if (!state.portfolio[state.activeSymbol]) {
            state.portfolio[state.activeSymbol] = {
                qty: 0,
                avgPrice: 0,
                exchange: asset.exchange,
                category: asset.category
            };
        }
        
        const holding = state.portfolio[state.activeSymbol];
        // Calculate new Average Cost basis
        const totalPreviousCost = holding.qty * holding.avgPrice;
        const totalNewCost = totalPreviousCost + totalCost;
        holding.qty += qty;
        holding.avgPrice = totalNewCost / holding.qty;
        
        // Log transaction
        state.transactions.unshift({
            timestamp: new Date().toLocaleString(),
            symbol: state.activeSymbol,
            action: 'BUY',
            price: price,
            qty: qty,
            total: totalCost
        });
        
        playSound('buy');
        triggerNotification(`Order filled: Bought ${qty} ${state.activeSymbol} at $${price.toFixed(2)}`, "success");
        
    } else {
        // SELL holding execution
        const holding = state.portfolio[state.activeSymbol];
        if (!holding || holding.qty < qty) {
            triggerNotification(`Insufficient shares held. Active position size: ${holding ? holding.qty : 0} shares.`, "error");
            return;
        }
        
        // Add Cash and decrease portfolio shares
        state.balance.cash += totalCost;
        holding.qty -= qty;
        
        if (holding.qty === 0) {
            delete state.portfolio[state.activeSymbol];
        }
        
        // Log transaction
        state.transactions.unshift({
            timestamp: new Date().toLocaleString(),
            symbol: state.activeSymbol,
            action: 'SELL',
            price: price,
            qty: qty,
            total: totalCost
        });
        
        playSound('sell');
        triggerNotification(`Order filled: Sold ${qty} ${state.activeSymbol} at $${price.toFixed(2)}`, "success");
    }
    
    saveStateToStorage();
    updateUIElements();
    updateTradingTicketView();
}

// ----------------------------------------------------
// VIEW 5: MARKET NEWS WIDGETS WITH AI SENTIMENT
// ----------------------------------------------------
// ── News: live feed from backend (Nepal + International RSS) ──
let newsCache = [];
let newsFilterActive = "ALL"; // ALL | NEPAL | INTL

async function renderNewsGrid() {
    const grid = document.getElementById("newsGrid");

    if (newsCache.length === 0) {
        grid.innerHTML = `
            <div style="grid-column:1/-1;text-align:center;padding:48px;color:var(--text-muted);">
                <i class="fa-solid fa-spinner fa-spin" style="font-size:24px;margin-bottom:12px;display:block;"></i>
                Loading live news feeds...
            </div>`;
        await fetchLiveNews();
    }

    renderNewsCards();
}

async function fetchLiveNews() {
    try {
        const res = await fetch("/api/news");
        if (res.ok) {
            const articles = await res.json();
            newsCache = articles.map(a => ({
                title:     a.title,
                source:    a.source,
                time:      a.time,
                sentiment: a.sentiment || "NEUTRAL",
                score:     a.score     || "N/A",
                summary:   a.summary   || "",
                url:       a.url       || null,
                category:  a.category  || "INTL"
            }));
        }
    } catch(err) {
        console.warn("News backend unreachable, using fallback:", err);
        newsCache = [
            { title: "Federal Reserve hints at interest rate stability", source: "Bloomberg Finance", time: "10 min ago", sentiment: "BULLISH", score: "78%", summary: "Fed Chairman signals cooling inflation, prompting momentum in equities.", url: null, category: "INTL" },
            { title: "Bitcoin hits fresh weekly resistance", source: "CoinDesk", time: "1 hr ago", sentiment: "BEARISH", score: "65%", summary: "Leveraged liquidations pushed BTC downward briefly, long-term supports remain stable.", url: null, category: "INTL" },
            { title: "NEPSE Index gains 35 points on heavy utility volume", source: "Kathmandu Post", time: "2 hr ago", sentiment: "BULLISH", score: "88%", summary: "Hydroelectricity and Commercial Bank indices led markets as regulatory boards ease credit.", url: "https://kathmandupost.com/money/2024/05/10/nepse-rises-35-points", category: "NEPAL" },
            { title: "NVIDIA announces next-generation Blackwell ultra-chips", source: "TechCrunch", time: "3 hr ago", sentiment: "BULLISH", score: "94%", summary: "The semiconductor giant delivers 2x performance boost in AI training architectures.", url: null, category: "INTL" },
            { title: "Euro weakens against USD following dovish ECB sentiments", source: "Reuters Business", time: "5 hr ago", sentiment: "BEARISH", score: "72%", summary: "ECB board members express concerns regarding consumer spending slowdowns.", url: null, category: "INTL" }
        ];
    }
}

function setNewsFilter(btn, filter) {
    newsFilterActive = filter;
    document.querySelectorAll(".news-filter-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    renderNewsCards();
}

async function refreshNews() {
    newsCache = [];
    await renderNewsGrid();
}

function renderNewsCards() {
    const grid = document.getElementById("newsGrid");

    let list = newsCache;
    const nepalSources = ["artha","mero","nepse","nepali","sansar","bajar","bizmandu","corporate","insurance","bajark"];

    if (newsFilterActive === "NEPAL") {
        list = newsCache.filter(n =>
            n.category === "NEPAL" ||
            nepalSources.some(kw => n.source.toLowerCase().includes(kw))
        );
    } else if (newsFilterActive === "INTL") {
        list = newsCache.filter(n =>
            n.category === "INTL" &&
            !nepalSources.some(kw => n.source.toLowerCase().includes(kw))
        );
    }

    if (list.length === 0) {
        grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:48px;color:var(--text-muted);">No articles found for this filter.</div>`;
        return;
    }

    let content = "";
    list.forEach(n => {
        const isBullish  = n.sentiment === "BULLISH";
        const isNeutral  = n.sentiment === "NEUTRAL" || !n.sentiment;
        const cardGlow   = isBullish ? 'rgba(0,230,118,0.08)' : isNeutral ? 'rgba(0,176,255,0.05)' : 'rgba(255,23,68,0.08)';
        const sentColor  = isBullish ? 'var(--bullish-green)' : isNeutral ? 'var(--neon-blue)' : 'var(--bearish-red)';
        const sentBg     = isBullish ? 'rgba(0,230,118,0.1)' : isNeutral ? 'rgba(0,176,255,0.08)' : 'rgba(255,23,68,0.1)';
        const sentBorder = isBullish ? 'rgba(0,230,118,0.2)' : isNeutral ? 'rgba(0,176,255,0.15)' : 'rgba(255,23,68,0.2)';
        const isNepal    = n.category === "NEPAL" || nepalSources.some(kw => n.source.toLowerCase().includes(kw));
        const hasLink    = n.url && n.url.startsWith("http");

        // Use onclick on the card div so clicking anywhere opens the article.
        // Wrapping grid items in <a> is valid HTML5 but some older browsers mis-render it;
        // onclick is bulletproof and works in any layout.
        const clickAttr  = hasLink
            ? `onclick="window.open('${n.url}','_blank','noopener,noreferrer')" style="box-shadow:0 4px 15px ${cardGlow};cursor:pointer;transition:transform 0.15s,box-shadow 0.15s;" onmouseover="this.style.transform='translateY(-3px)';this.style.boxShadow='0 10px 32px ${cardGlow}'" onmouseout="this.style.transform='';this.style.boxShadow='0 4px 15px ${cardGlow}'"`
            : `style="box-shadow:0 4px 15px ${cardGlow};"`;

        content += `
            <div class="glass-card news-card" ${clickAttr}>
                <div class="card-header" style="margin-bottom:12px;">
                    <span class="badge-ex" style="${isNepal ? 'border-color:rgba(220,38,38,0.3);color:#f87171;background:rgba(220,38,38,0.07)' : ''}">${n.source}</span>
                    <div style="display:flex;align-items:center;gap:8px;flex-shrink:0;">
                        ${isNepal ? '<span style="font-size:10px;background:rgba(220,38,38,0.1);color:#f87171;padding:2px 7px;border-radius:20px;font-weight:700;">🇳🇵 NEPAL</span>' : ''}
                        <span style="font-size:11px;color:var(--text-muted);"><i class="fa-solid fa-clock"></i> ${n.time}</span>
                    </div>
                </div>
                <h4 style="font-size:15px;font-weight:700;margin-bottom:8px;line-height:1.4;color:var(--text-primary);">${n.title}</h4>
                ${n.summary ? `<p style="font-size:12px;color:var(--text-secondary);margin-bottom:14px;line-height:1.5;">${n.summary}</p>` : ''}
                <div style="display:flex;justify-content:space-between;align-items:center;border-top:1px solid rgba(255,255,255,0.04);padding-top:10px;">
                    <span style="font-size:11px;color:var(--text-muted);">
                        ${hasLink
                            ? '<i class="fa-solid fa-arrow-up-right-from-square"></i> Read full article'
                            : 'AI Sentiment:'}
                    </span>
                    <span class="badge-ex" style="background:${sentBg};color:${sentColor};font-weight:800;border-color:${sentBorder};">
                        ${n.sentiment}${n.score && n.score !== 'N/A' ? ' (' + n.score + ')' : ''}
                    </span>
                </div>
            </div>
        `;
    });
    grid.innerHTML = content;
}


// ----------------------------------------------------
// VIEW 6: AI INVESTMENT CHATBOT & RISK CALCULATOR
// ----------------------------------------------------
function clearAIChat() {
    document.getElementById("chatHistory").innerHTML = `
        <div class="chat-bubble assistant">
            Hello, I am Fein AI, your elite trading advisor. Terminal logs cleared. Ready for your next query!
        </div>
    `;
}

function handleChatInputKeyDown(e) {
    if (e.key === 'Enter') {
        sendChatMessage();
    }
}

function sendChatMessage() {
    const input = document.getElementById("chatMsgInput");
    const query = input.value.trim();
    if (!query) return;
    
    const chatHistory = document.getElementById("chatHistory");
    
    // 1. Append User Bubble
    const userBubble = document.createElement("div");
    userBubble.className = "chat-bubble user";
    userBubble.innerText = query;
    chatHistory.appendChild(userBubble);
    
    input.value = "";
    chatHistory.scrollTop = chatHistory.scrollHeight;
    
    // Simulate thinking state
    setTimeout(() => {
        const thinkBubble = document.createElement("div");
        thinkBubble.className = "chat-bubble assistant";
        thinkBubble.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Fein intelligence network processing...`;
        chatHistory.appendChild(thinkBubble);
        chatHistory.scrollTop = chatHistory.scrollHeight;
        
        setTimeout(() => {
            thinkBubble.remove();
            
            // Generate robust financial AI response
            let reply = "";
            const upper = query.toUpperCase();
            
            if (upper.includes("TESLA") || upper.includes("TSLA")) {
                reply = "<strong>Fein Core Technical Report on TSLA:</strong><br>Tesla is exhibiting high volatility after breaking through its primary descending trendline at $178. Support has formed firmly near $180, while immediate resistance holds at $188. Recommend trailing stops at $176 if attempting a momentum long breakout.";
            } else if (upper.includes("APPLE") || upper.includes("AAPL")) {
                reply = "<strong>Fein Core Technical Report on AAPL:</strong><br>Apple Inc. is currently consolidating near its 50-day Exponential Moving Average ($174.80). Volume remains low, suggesting accumulation. A break above $176.50 opens a clean path to historical resistance at $182. Risk reward remains highly positive for long trades with stop-losses anchored below $171.";
            } else if (upper.includes("BITCOIN") || upper.includes("BTC")) {
                reply = "<strong>Crypto Market Intelligence Update:</strong><br>BTCUSD is holding support at $66,800. MACD indicators show slight bullish divergence. If bulls manage to break and close above $68,200 on daily timeframes, we expect rapid acceleration targeting $71,500. Maintain high defensive stops as market leverage remains near 75%.";
            } else if (upper.includes("STOP LOSS") || upper.includes("RISK")) {
                reply = "<strong>Risk Management Protocol:</strong><br>Professional traders restrict risk to 1% - 2% of total capital per trade. For example, on your $100,000 cash balance, never risk more than $2,000. Set your stop losses based on technical support structures rather than generic percentages, then scale your share quantity accordingly.";
            } else {
                reply = `<strong>Quantitative AI Assessment:</strong><br>Terminal logs confirm your query regarding global assets. General technical conditions appear neutral-to-bullish across US equities, while crypto markets are experiencing minor overbought consolidation. For best trading results, utilize the <strong>Risk Management Calculator</strong> on this panel to plan execution size before entering trades!`;
            }
            
            const assistBubble = document.createElement("div");
            assistBubble.className = "chat-bubble assistant";
            assistBubble.innerHTML = reply;
            chatHistory.appendChild(assistBubble);
            chatHistory.scrollTop = chatHistory.scrollHeight;
            playSound('notification');
        }, 1200);
        
    }, 400);
}

// Risk Management Position Size Formula
function calculateRiskManagement() {
    const bal = parseFloat(document.getElementById("calcBalance").value) || 0;
    const riskPct = parseFloat(document.getElementById("calcRisk").value) || 0;
    const entry = parseFloat(document.getElementById("calcEntry").value) || 0;
    const stop = parseFloat(document.getElementById("calcStop").value) || 0;
    
    if (bal <= 0 || riskPct <= 0 || entry <= 0 || stop <= 0 || entry === stop) {
        return;
    }
    
    const riskCapital = bal * (riskPct / 100);
    const stopDistance = Math.abs(entry - stop);
    const sharesQty = riskCapital / stopDistance;
    const posSize = sharesQty * entry;
    const allocationPct = (posSize / bal) * 100;
    
    document.getElementById("resCapitalRisk").innerText = `$${riskCapital.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    document.getElementById("resPositionSize").innerText = `$${posSize.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    document.getElementById("resQuantity").innerText = `${sharesQty.toFixed(1)} SHARES`;
    document.getElementById("resAllocation").innerText = `${allocationPct.toFixed(1)}%`;
}

// Leaderboard list setup
const leaderboardData = [
    { name: "AlphaAlgo_42", return: "+182.4%", rank: 1, avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=100&q=80" },
    { name: "RiskManager_101", return: "+114.2%", rank: 2, avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80" },
    { name: "NepeTrader_KTM", return: "+84.8%", rank: 3, avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80" },
    { name: "FeinAI_Clone", return: "+76.1%", rank: 4, avatar: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=100&q=80" }
];

function renderLeaderboard() {
    const list = document.getElementById("leaderboardList");
    let content = "";
    
    // Add current user details dynamically inside board
    const netReturn = ((state.balance.netLiq - 100000) / 100000) * 100;
    const userReturnStr = `${netReturn >= 0 ? '+' : ''}${netReturn.toFixed(1)}%`;
    
    const combinedList = [
        ...leaderboardData,
        { name: `${state.user.name} (YOU)`, return: userReturnStr, rank: 5, avatar: state.user.avatar }
    ].sort((a,b) => parseFloat(b.return) - parseFloat(a.return));
    
    combinedList.forEach((lead, index) => {
        const itemRank = index + 1;
        let rankCl = `rank-${itemRank}`;
        
        content += `
            <div class="leader-item">
                <div class="leader-rank-grp">
                    <span class="leader-rank ${rankCl}">${itemRank}</span>
                    <img src="${lead.avatar}" alt="Leader" class="leader-avatar">
                    <span style="font-weight: 700; font-size: 13px;">${lead.name}</span>
                </div>
                <span class="${parseFloat(lead.return) >= 0 ? 'text-profit' : 'text-loss'}" style="font-weight: 800;">
                    ${lead.return}
                </span>
            </div>
        `;
    });
    list.innerHTML = content;
}

// ----------------------------------------------------
// VIEW 7: TRADE JOURNAL & PROFILE EDIT
// ----------------------------------------------------
function updateProfileName(name) {
    state.user.name = name;
    saveStateToStorage();
    updateUIElements();
}

function setProfileAvatar(src) {
    state.user.avatar = src;

    const options = document.querySelectorAll(".avatar-option");
    options.forEach(opt => {
        opt.classList.remove("active");
        if (opt.src === src) opt.classList.add("active");
    });

    // Sync preview image in profile upload section
    const preview = document.getElementById("profilePhotoPreview");
    if (preview) preview.src = src;

    saveStateToStorage();
    updateUIElements();
    triggerNotification("Profile avatar updated successfully.", "success");
}

// Handle file upload for profile photo
function handleAvatarUpload(input) {
    const file = input.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
        triggerNotification("Please select a valid image file.", "error"); return;
    }
    if (file.size > 5 * 1024 * 1024) {
        triggerNotification("Image must be under 5MB.", "error"); return;
    }
    const reader = new FileReader();
    reader.onload = function(e) {
        const dataUrl = e.target.result;
        state.user.avatar = dataUrl;
        const preview = document.getElementById("profilePhotoPreview");
        if (preview) preview.src = dataUrl;
        document.querySelectorAll(".avatar-option").forEach(o => o.classList.remove("active"));
        saveStateToStorage();
        updateUIElements();
        triggerNotification("Profile photo uploaded successfully! 📸", "success");
    };
    reader.readAsDataURL(file);
    input.value = "";
}

function addJournalEntry() {
    const input = document.getElementById("journalEntryInput");
    const text = input.value.trim();
    if (!text) return;
    
    state.journal.unshift({
        timestamp: new Date().toLocaleString(),
        text: text
    });
    
    input.value = "";
    saveStateToStorage();
    renderJournalLogs();
    triggerNotification("Journal entry logged successfully.", "success");
}

function renderJournalLogs() {
    const list = document.getElementById("journalList");
    if (state.journal.length === 0) {
        list.innerHTML = `<div style="text-align: center; color: var(--text-muted); font-size: 12px; padding: 20px;">No journal entries yet. Record your trade logics here.</div>`;
        return;
    }
    
    let content = "";
    state.journal.forEach(j => {
        content += `
            <div style="background: rgba(255,255,255,0.01); border: 1px solid rgba(255,255,255,0.03); padding: 12px; border-radius: 8px;">
                <div style="display: flex; justify-content: space-between; font-size: 10px; color: var(--text-muted); margin-bottom: 6px;">
                    <span><i class="fa-solid fa-calendar-days"></i> ${j.timestamp}</span>
                </div>
                <p style="font-size: 12px; line-height: 1.4;">${j.text}</p>
            </div>
        `;
    });
    list.innerHTML = content;
}

function renderTransactionHistoryTable() {
    const tbody = document.getElementById("transactionTableBody");
    if (state.transactions.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 20px 0;">No transaction logs recorded.</td></tr>`;
        return;
    }
    
    let content = "";
    state.transactions.forEach(t => {
        const actionCl = t.action === 'BUY' ? 'text-profit' : 'text-loss';
        content += `
            <tr>
                <td style="font-size: 11px; color: var(--text-secondary);">${t.timestamp}</td>
                <td><span style="font-weight: 700;">${t.symbol}</span></td>
                <td class="${actionCl}"><span style="font-weight: 800;">${t.action}</span></td>
                <td style="font-family: var(--font-heading); font-weight: 600;">$${t.price.toFixed(2)}</td>
                <td>${t.qty}</td>
                <td>$${t.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            </tr>
        `;
    });
    tbody.innerHTML = content;
}

function clearTransactionLogs() {
    if (confirm("Are you sure you want to clear your trade execution history logs?")) {
        state.transactions = [];
        state.journal = [];
        saveStateToStorage();
        updateUIElements();
        renderJournalLogs();
        renderTransactionHistoryTable();
        triggerNotification("Transaction history and journals cleared.", "info");
    }
}

// ----------------------------------------------------
// SYSTEM STARTUP INITIALIZER
// ----------------------------------------------------
window.addEventListener("DOMContentLoaded", () => {
    loadStateFromStorage();
    initTickerBanner();
    
    // Set simulated prices update loop
    setInterval(simulateMarketFluctuations, 3000);
});
// ════════════════════════════════════════════════════════════
//  FEIN TRADE  —  Auth functions
//  Drop these into script.js (replace any old auth stubs)
// ════════════════════════════════════════════════════════════

const API = "http://127.0.0.1:5000";   // adjust if deployed elsewhere
let _isSignupMode = false;

// ── Toggle between Login / Signup ────────────────────────────
function toggleAuthMode() {
    _isSignupMode = !_isSignupMode;

    const loginForm  = document.getElementById("loginForm");
    const signupForm = document.getElementById("signupForm");
    const subtitle   = document.getElementById("authSubtitle");
    const toggleLine = document.getElementById("authToggleLine");
    const toggleText = document.getElementById("authToggleText");

    if (_isSignupMode) {
        loginForm.style.display  = "none";
        signupForm.style.display = "block";
        subtitle.textContent = "Create your free paper-trading account";
        toggleLine.innerHTML = 'Already have an account? <span id="authToggleText" class="auth-toggle-link" onclick="toggleAuthMode()">Log In</span>';
        // Clear any previous server errors
        document.getElementById("signupError").style.display = "none";
    } else {
        loginForm.style.display  = "block";
        signupForm.style.display = "none";
        subtitle.textContent = "Login to access your premium institutional trading terminal";
        toggleLine.innerHTML = 'Don\'t have an account? <span id="authToggleText" class="auth-toggle-link" onclick="toggleAuthMode()">Sign Up Now</span>';
        document.getElementById("loginError").style.display = "none";
    }
}

// ── Show / hide password ─────────────────────────────────────
function togglePasswordVisibility(inputId, icon) {
    const inp = document.getElementById(inputId);
    if (inp.type === "password") {
        inp.type = "text";
        icon.classList.replace("fa-eye", "fa-eye-slash");
    } else {
        inp.type = "password";
        icon.classList.replace("fa-eye-slash", "fa-eye");
    }
}

// ── Shared helpers ───────────────────────────────────────────
function _setFieldError(errId, okId, msg) {
    const err = document.getElementById(errId);
    const ok  = okId ? document.getElementById(okId) : null;
    if (msg) {
        err.textContent = msg;
        err.style.display = "block";
        if (ok) ok.style.display = "none";
        return false;
    } else {
        err.textContent = "";
        err.style.display = "none";
        if (ok) ok.style.display = "inline";
        return true;
    }
}

function _clearFieldError(errId, okId) {
    _setFieldError(errId, okId, null);  // clear without showing ok
    const ok = okId ? document.getElementById(okId) : null;
    if (ok) ok.style.display = "none";
}

// ── Login field validation ───────────────────────────────────
function validateLoginField(input) {
    if (input.id === "loginEmail") {
        const v = input.value.trim();
        if (!v) return _setFieldError("loginEmailErr", null, "Email is required.");
        if (!/^[^\s@]+@gmail\.com$/i.test(v))
            return _setFieldError("loginEmailErr", null, "Must be a @gmail.com address.");
        return _setFieldError("loginEmailErr", null, null);
    }
    if (input.id === "loginPassword") {
        if (!input.value) return _setFieldError("loginPasswordErr", null, "Password is required.");
        return _setFieldError("loginPasswordErr", null, null);
    }
}

// ── Signup field validation ──────────────────────────────────
const USERNAME_RE = /^[a-zA-Z0-9_]{3,24}$/;
const GMAIL_RE    = /^[^\s@]+@gmail\.com$/i;

function validateSignupField(id) {
    const val = document.getElementById(id).value;

    if (id === "signupUsername") {
        if (!val) return _setFieldError("errSignupUsername", "okSignupUsername", "Username is required.");
        if (!USERNAME_RE.test(val))
            return _setFieldError("errSignupUsername", "okSignupUsername",
                "3–24 chars: letters, numbers, or underscores only.");
        return _setFieldError("errSignupUsername", "okSignupUsername", null);
    }

    if (id === "signupEmail") {
        if (!val) return _setFieldError("errSignupEmail", "okSignupEmail", "Email is required.");
        if (!GMAIL_RE.test(val.trim()))
            return _setFieldError("errSignupEmail", "okSignupEmail", "Must be a @gmail.com address.");
        return _setFieldError("errSignupEmail", "okSignupEmail", null);
    }

    if (id === "signupDob") {
        if (!val) return _setFieldError("errSignupDob", "okSignupDob", "Date of birth is required.");
        const dob     = new Date(val);
        const today   = new Date();
        const minDate = new Date(today.getFullYear() - 16, today.getMonth(), today.getDate());
        if (dob > minDate)
            return _setFieldError("errSignupDob", "okSignupDob", "You must be at least 16 years old.");
        return _setFieldError("errSignupDob", "okSignupDob", null);
    }

    if (id === "signupPassword") {
        // Show strength meter
        const track = document.getElementById("pwStrengthTrack");
        const bar   = document.getElementById("pwStrengthBar");
        if (val) {
            track.style.display = "block";
            const score = _passwordStrength(val);
            const pct   = score * 25;
            bar.style.width = pct + "%";
            bar.className   = "pw-strength-bar " + ["", "weak", "weak", "fair", "strong"][score];
        } else {
            track.style.display = "none";
        }
        if (!val) return _setFieldError("errSignupPassword", null, "Password is required.");
        if (val.length < 8)
            return _setFieldError("errSignupPassword", null, "Password must be at least 8 characters.");
        _setFieldError("errSignupPassword", null, null);
        // Re-validate confirm if already filled
        const conf = document.getElementById("signupConfirm").value;
        if (conf) validateSignupField("signupConfirm");
        return true;
    }

    if (id === "signupConfirm") {
        const pw = document.getElementById("signupPassword").value;
        if (!val) return _setFieldError("errSignupConfirm", "okSignupConfirm", "Please confirm your password.");
        if (val !== pw)
            return _setFieldError("errSignupConfirm", "okSignupConfirm", "Passwords do not match.");
        return _setFieldError("errSignupConfirm", "okSignupConfirm", null);
    }
}

function _passwordStrength(pw) {
    let score = 0;
    if (pw.length >= 8)  score++;
    if (pw.length >= 12) score++;
    if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
    if (/\d/.test(pw) && /[^a-zA-Z0-9]/.test(pw)) score++;
    return score; // 0–4
}

function _allSignupValid() {
    return (
        validateSignupField("signupUsername") !== false &&
        validateSignupField("signupEmail")    !== false &&
        validateSignupField("signupDob")      !== false &&
        validateSignupField("signupPassword") !== false &&
        validateSignupField("signupConfirm")  !== false
    );
}

// ── Login submit ─────────────────────────────────────────────
async function handleLoginSubmit(event) {
    event.preventDefault();

    const email    = document.getElementById("loginEmail").value.trim().toLowerCase();
    const password = document.getElementById("loginPassword").value;
    const errBox   = document.getElementById("loginError");

    // Client-side guard
    if (!email || !password) return;

    // Spinner
    document.getElementById("loginBtnText").style.display    = "none";
    document.getElementById("loginBtnSpinner").style.display = "inline";
    errBox.style.display = "none";

    try {
        const res  = await fetch(`${API}/api/auth/login`, {
            method:  "POST",
            headers: { "Content-Type": "application/json" },
            body:    JSON.stringify({ email, password })
        });
        const data = await res.json();

        if (!res.ok) {
            errBox.textContent   = data.error || "Login failed. Please try again.";
            errBox.style.display = "block";
        } else {
            // Store token + user
            localStorage.setItem("fein_token", data.token);
            localStorage.setItem("fein_user",  JSON.stringify(data.user));
            _onAuthSuccess(data.user);
        }
    } catch (err) {
        errBox.textContent   = "Cannot reach server. Is the backend running?";
        errBox.style.display = "block";
    } finally {
        document.getElementById("loginBtnText").style.display    = "inline";
        document.getElementById("loginBtnSpinner").style.display = "none";
    }
}

// ── Signup submit ────────────────────────────────────────────
async function handleSignupSubmit(event) {
    event.preventDefault();

    // Run all validations first
    if (!_allSignupValid()) return;

    const username = document.getElementById("signupUsername").value.trim();
    const email    = document.getElementById("signupEmail").value.trim().toLowerCase();
    const dob      = document.getElementById("signupDob").value;
    const password = document.getElementById("signupPassword").value;
    const errBox   = document.getElementById("signupError");

    // Spinner
    document.getElementById("signupBtnText").style.display    = "none";
    document.getElementById("signupBtnSpinner").style.display = "inline";
    errBox.style.display = "none";

    try {
        const res  = await fetch(`${API}/api/auth/signup`, {
            method:  "POST",
            headers: { "Content-Type": "application/json" },
            body:    JSON.stringify({ username, email, dob, password })
        });
        const data = await res.json();

        if (!res.ok) {
            errBox.textContent   = data.error || "Signup failed. Please try again.";
            errBox.style.display = "block";
        } else {
            localStorage.setItem("fein_token", data.token);
            localStorage.setItem("fein_user",  JSON.stringify(data.user));
            _onAuthSuccess(data.user);
        }
    } catch (err) {
        errBox.textContent   = "Cannot reach server. Is the backend running?";
        errBox.style.display = "block";
    } finally {
        document.getElementById("signupBtnText").style.display    = "inline";
        document.getElementById("signupBtnSpinner").style.display = "none";
    }
}

// ── Called after successful login OR signup ──────────────────
function _onAuthSuccess(user) {
    // Hide the auth overlay
    document.getElementById("authOverlay").style.display = "none";

    // Update sidebar / profile UI with real user data
    const name = user.username || "Trader";
    const avatarDefault = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=100&q=80";
    const avatar = user.avatar || avatarDefault;

    const sidebarName     = document.getElementById("sidebarUserName");
    const sidebarAvatar   = document.getElementById("sidebarAvatar");
    const profileCardName = document.getElementById("profileCardName");
    const profileCardAv   = document.getElementById("profileCardAvatar");
    const profileNameInp  = document.getElementById("profileNameInput");
    const profilePhotoP   = document.getElementById("profilePhotoPreview");

    if (sidebarName)    sidebarName.textContent    = name;
    if (sidebarAvatar)  sidebarAvatar.src           = avatar;
    if (profileCardName) profileCardName.textContent = name;
    if (profileCardAv)  profileCardAv.src            = avatar;
    if (profileNameInp) profileNameInp.value         = name;
    if (profilePhotoP)  profilePhotoP.src             = avatar;

    // Trigger any existing post-login init (e.g. loadTradingState, initCharts, etc.)
    if (typeof initApp === "function") initApp();
}

// ── Logout ───────────────────────────────────────────────────
function handleLogOut() {
    localStorage.removeItem("fein_token");
    localStorage.removeItem("fein_user");
    // Reset forms for re-login
    document.getElementById("loginEmail").value    = "";
    document.getElementById("loginPassword").value = "";
    document.getElementById("loginError").style.display = "none";
    // Back to login mode
    _isSignupMode = true;   // force toggleAuthMode to switch to login
    toggleAuthMode();
    document.getElementById("authOverlay").style.display = "flex";
}

// ── Auto-login if valid token already stored ─────────────────
(async function checkSavedSession() {
    const token = localStorage.getItem("fein_token");
    const user  = localStorage.getItem("fein_user");
    if (!token || !user) return;   // nothing saved — show auth overlay

    try {
        const res = await fetch(`${API}/api/auth/me`, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        if (res.ok) {
            const freshUser = await res.json();
            localStorage.setItem("fein_user", JSON.stringify(freshUser));
            _onAuthSuccess(freshUser);
        }
        // if 401, overlay stays visible — user must log in again
    } catch (_) {
        // server unreachable — show overlay
    }
})();