# ==============================================================================
# NIFTY 500 STOCK SCREENER - BACKEND (app.py)
# Final Production Version - Optimized for Render.com
# ==============================================================================

import os
from flask import Flask, jsonify, send_from_directory, request
from flask_cors import CORS
from flask_caching import Cache
import requests
from dotenv import load_dotenv
import google.generativeai as genai

# --- 1. ROBUST PATH CONFIGURATION (The Fix for 404 Errors) ---
# We calculate the absolute path to the 'frontend/build' folder based on 
# where this app.py file is located. This ensures Render finds the files 
# regardless of the working directory.
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
FRONTEND_BUILD_DIR = os.path.join(CURRENT_DIR, 'frontend', 'build')

# Initialize Flask pointing to the calculated absolute path
# static_url_path='' ensures assets are served from the root URL
app = Flask(__name__, static_folder=FRONTEND_BUILD_DIR, static_url_path='')

# --- 2. DATA & CONFIGURATION ---

# Hardcoded List of Nifty 500 Stocks (Reliable Source)
NIFTY_500_SYMBOLS = [
    '360ONE', '3MINDIA', 'ABB', 'ACC', 'AARTIIND', 'AAVAS', 'ABBOTINDIA', 'ABCAPITAL', 'ABFRL', 'ADANIENT',
    'ADANIGREEN', 'ADANIPORTS', 'ADANIPOWER', 'ATGL', 'AWL', 'ABSLAMC', 'AEGISCHEM', 'AETHER',
    'AFFLE', 'AIAENG', 'AJANTPHARM', 'APLAPOLLO', 'ALKEM', 'ALLCARGO', 'ALOKINDS', 'AMBER', 'AMBUJACEM',
    'ANGELONE', 'ANURAS', 'APOLLOHOSP', 'APOLLOTYRE', 'APTUS', 'ASAHIINDIA', 'ASHOKLEY', 'ASIANPAINT',
    'ASTERDM', 'ASTRAL', 'AUROPHARMA', 'AUBANK', 'AVANTIFEED', 'AXISBANK', 'BAJAJ-AUTO',
    'BAJFINANCE', 'BAJAJFINSV', 'BAJAJHLDNG', 'BALAMINES', 'BALKRISIND', 'BALRAMCHIN', 'BANDHANBNK',
    'BANKBARODA', 'BANKINDIA', 'MAHABANK', 'BATAINDIA', 'BAYERCROP', 'BDL', 'BEL', 'BERGEPAINT', 'BHARATFORG',
    'BHEL', 'BPCL', 'BHARTIARTL', 'BIOCON', 'BIRLACORPN', 'BSOFT', 'BLUEDART', 'BLUESTARCO', 'BOSCHLTD', 'BRIGADE',
    'BRITANNIA', 'MAPMYINDIA', 'CANFINHOME', 'CANBK', 'CAPLIPOINT', 'CGCL', 'CARBORUNIV', 'CASTROLIND',
    'CEATLTD', 'CENTRALBK', 'CDSL', 'CENTURYPLY', 'CENTURYTEX', 'CERA', 'CESC', 'CGPOWER', 'CHALET',
    'CHAMBLFERT', 'CHEMPLASTS', 'CHOLAFIN', 'CHOLAHLDNG', 'CIPLA', 'CUB', 'CLEAN', 'COALINDIA', 'COCHINSHIP',
    'COFORGE', 'COLPAL', 'CONCOR', 'COROMANDEL', 'CREDITACC', 'CRISIL', 'CROMPTON', 'CUMMINSIND', 'CYIENT',
    'DABUR', 'DALBHARAT', 'DEEPAKNTR', 'DELHIVERY', 'DEVYANI', 'DIVISLAB', 'DIXON', 'DLF', 'DRREDDY',
    'ECLERX', 'EDELWEISS', 'EICHERMOT', 'EIDPARRY', 'EIHOTEL', 'ELGIEQUIP', 'EMAMILTD', 'ENDURANCE',
    'ENGINERSIN', 'EQUITASBNK', 'ERIS', 'ESCORTS', 'EXIDEIND', 'FDC', 'FEDERALBNK', 'FACT', 'FINCABLES',
    'FINEORG', 'FINPIPE', 'FIVESTAR', 'FORTIS', 'GRINFRA', 'GAIL', 'GMRINFRA', 'GLAND', 'GLAXO', 'GLENMARK',
    'GNFC', 'GOCOLORS', 'GODFRYPHLP', 'GODREJCP', 'GODREJIND', 'GODREJPROP', 'GRANULES', 'GRAPHITE', 'GRASIM',
    'GESHIP', 'GSFC', 'GSPL', 'GTPL', 'GUJALKALI', 'GUJGASLTD', 'HAL', 'HAVELLS', 'HCLTECH', 'HDFCAMC',
    'HDFCBANK', 'HDFCLIFE', 'HEG', 'HEROMOTOCO', 'HFCL', 'HIKAL', 'HINDALCO', 'HINDCOPPER', 'HINDPETRO',
    'HINDUNILVR', 'HINDZINC', 'POWERINDIA', 'HONAUT', 'HUDCO', 'IBULHSGFIN', 'ICICIBANK', 'ICICIGI', 'ICICIPRULI',
    'IDBI', 'IDFCFIRSTB', 'IDFC', 'IFBIND', 'IEX', 'IIFL', 'IRB', 'IRCON', 'IRCTC', 'IRFC', 'INDHOTEL',
    'INDIACEM', 'INDIAMART', 'INDIANB', 'INDIGO', 'INDOCO', 'INDUSINDBK', 'NAUKRI', 'INDTOWER', 'INFY',
    'IOB', 'IOC', 'IPCALAB', 'ITC', 'JBCHEPHARM', 'JKCEMENT', 'JKLAKSHMI', 'JKPAPER', 'JMFINANCIL', 'JSL',
    'JINDALSTEL', 'JSWENERGY', 'JSWSTEEL', 'JUBILANT', 'JUBLFOOD', 'JUSTDIAL', 'JYOTHYLAB', 'KSB', 'KAJARIACER',
    'KALPATPOWR', 'KALYANKJIL', 'KARURVYSYA', 'KEC', 'KFINTECH', 'KPITTECH', 'KRBL', 'KPRMILL', 'KOTAKBANK',
    'LTTS', 'LTIM', 'LT', 'LAXMIMACH', 'LAURUSLABS', 'LICI', 'LICHSGFIN', 'LUPIN', 'LUXIND', 'MM', 'MMFIN',
    'MANAPPURAM', 'MRPL', 'MARICO', 'MARUTI', 'MASTEK', 'MAXHEALTH', 'MFSL', 'METROBRAND', 'METROPOLIS',
    'MOTILALOFS', 'MPHASSIS', 'MRF', 'NBCC', 'NCC', 'NESCO', 'NHPC', 'NLCINDIA', 'NMDC', 'NOCIL', 'NTPC',
    'NATIONALUM', 'NAVINFLUOR', 'NESTLEIND', 'NETWORK18', 'NAM-INDIA', 'OBEROIRLTY', 'ONGC', 'OIL', 'OFSS',
    'PAGEIND', 'PATANJALI', 'PERSISTENT', 'PETRONET', 'PFC', 'PFIZER', 'PHOENIXLTD', 'PIDILITIND', 'PIIND',
    'PNB', 'POLYMED', 'POLYCAB', 'POONAWALLA', 'POWERGRID', 'PRESTIGE', 'PRSMJOHNSN', 'PSB', 'PVRINOX', 'RADICO',
    'RVNL', 'RAILTEL', 'RBLBANK', 'RECLTD', 'REDINGTON', 'RELAXO', 'RELIANCE', 'RHIM', 'RITES', 'SAIL', 'SANOFI',
    'SBICARD', 'SBILIFE', 'SBIN', 'SCHAEFFLER', 'SEQUENT', 'SFL', 'SHREECEM', 'SHRIRAMFIN', 'SIEMENS', 'SJVN',
    'SKFINDIA', 'SOBHA', 'SOLARINDS', 'SONACOMS', 'SONATSOFTW', 'STARHEALTH', 'SUNDARMFIN', 'SUNDRMFAST',
    'SUNPHARMA', 'SUNTV', 'SUPRAJIT', 'SUPREMEIND', 'SUZLON', 'SWANENERGY', 'SYMPHONY', 'SYNGENE', 'TANLA',
    'TATACHEM', 'TATACOMM', 'TATACONSUM', 'TATAELXSI', 'TATAINVEST', 'TATAMOTORS', 'TATAPOWER', 'TATASTEEL',
    'TCS', 'TTML', 'TEAMLEASE', 'TECHM', 'NIACL', 'RAMCOCEM', 'THERMAX', 'TIMKEN', 'TITAN', 'TORNTPHARM',
    'TORNTPOWER', 'TRENT', 'TRIDENT', 'TRIVENI', 'TIINDIA', 'TV18BRDCST', 'TVSMOTOR', 'UCOBANK', 'UFLEX',
    'ULTRACEMCO', 'UNIONBANK', 'UBL', 'UPL', 'VAIBHAVGBL', 'VGUARD', 'VARROC', 'VEDL', 'VENKEYS', 'VIJAYA',
    'VOLTAS', 'WELCORP', 'WELSPUNIND', 'WHIRLPOOL', 'WIPRO', 'WOCKPHARMA', 'YESBANK', 'ZEEL', 'ZENSARTECH',
    'ZOMATO', 'ZYDUSLIFE'
]

load_dotenv()
# Cache for 10 minutes to save API calls
config = {"CACHE_TYPE": "SimpleCache", "CACHE_DEFAULT_TIMEOUT": 600}
app.config.from_mapping(config)
cache = Cache(app)
CORS(app)

# --- API Keys ---
FMP_API_KEY = os.getenv("FMP_API_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
FMP_BASE_URL = "https://financialmodelingprep.com/api/v3"

if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

# --- Error Handling ---
@app.errorhandler(500)
def internal_error(error): return (jsonify({"error": "Internal Server Error", "message": str(error)}), 500)

# --- 3. API ROUTES ---

@app.route("/api/nifty500-market-data", methods=['GET'])
@cache.cached(timeout=600)
def get_nifty500_market_data():
    """ Fetches bulk data for all 500 stocks in one efficient call """
    if not FMP_API_KEY:
        return jsonify({"error": "FMP_API_KEY is not configured."}), 500
    
    print(f"Using hardcoded list of {len(NIFTY_500_SYMBOLS)} symbols to fetch FMP data.")
    
    # Create comma-separated string of symbols with .NS suffix
    fmp_symbols_string = ",".join([f"{symbol}.NS" for symbol in NIFTY_500_SYMBOLS])
    url = f"{FMP_BASE_URL}/quote/{fmp_symbols_string}?apikey={FMP_API_KEY}"
    
    try:
        response = requests.get(url, timeout=30)
        response.raise_for_status()
        bulk_data = response.json()
        
        if not bulk_data:
            return jsonify({"error": "FMP bulk quote endpoint returned no data."}), 404
            
        processed_data = []
        for stock_data in bulk_data:
            price = stock_data.get("price", 0)
            prev_close = stock_data.get("previousClose", 0)
            change = price - prev_close
            # Avoid division by zero
            percent_change = (change / prev_close * 100) if prev_close != 0 else 0
            
            processed_data.append({
                "symbol": stock_data.get("symbol", "").replace(".NS", ""),
                "name": stock_data.get("name"),
                "price": price,
                "change": round(change, 2),
                "percentChange": round(percent_change, 2),
                "volume": stock_data.get("volume"),
                "marketCap": stock_data.get("marketCap"),
            })
            
        print("Successfully processed bulk market data from FMP.")
        return jsonify(processed_data)
        
    except Exception as e:
        return jsonify({"error": f"An unexpected error occurred during FMP bulk fetch: {e}"}), 500

@app.route("/api/stock-data/<symbol>", methods=['GET'])
@cache.cached(timeout=300)
def get_stock_data(symbol):
    """ Fetches single stock details """
    fmp_symbol = f"{symbol.upper()}.NS"
    url = f"{FMP_BASE_URL}/quote/{fmp_symbol}?apikey={FMP_API_KEY}"
    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        # FMP returns a list for quote, we take the first item
        info = response.json()[0]
        return jsonify({
            "symbol": info.get("symbol", "").replace(".NS", ""),
            "longName": info.get("name"),
            "currentPrice": info.get("price"),
            "previousClose": info.get("previousClose"),
            "dayHigh": info.get("dayHigh"),
            "dayLow": info.get("dayLow"),
            "volume": info.get("volume"),
            "marketCap": info.get("marketCap"),
        })
    except Exception as e:
        return jsonify({"error": f"FMP API request for detailed data failed: {e}"}), 502

@app.route("/api/stock-chart/<symbol>", methods=['GET'])
@cache.cached(timeout=3600)
def get_stock_chart_data(symbol):
    """ Fetches historical chart data """
    fmp_symbol = f"{symbol.upper()}.NS"
    url = f"{FMP_BASE_URL}/historical-price-full/{fmp_symbol}?timeseries=252&apikey={FMP_API_KEY}"
    try:
        response = requests.get(url, timeout=15)
        response.raise_for_status()
        historical_data = response.json().get('historical', [])
        
        chart_ready_data = [
            {
                "time": item['date'], 
                "open": item['open'], 
                "high": item['high'], 
                "low": item['low'], 
                "close": item['close']
            }
            for item in reversed(historical_data)
        ]
        return jsonify(chart_ready_data)
    except Exception as e:
        return jsonify({"error": f"FMP API request for chart data failed: {e}"}), 502

@app.route("/api/stock-summary/<symbol>", methods=['GET'])
@cache.cached(timeout=86400)
def get_stock_summary(symbol):
    """ Generates Gemini AI Summary """
    if not GEMINI_API_KEY:
        return jsonify({"error": "GEMINI_API_KEY is not configured."}), 500
    
    fmp_symbol = f"{symbol.upper()}.NS"
    url = f"{FMP_BASE_URL}/profile/{fmp_symbol}?apikey={FMP_API_KEY}"
    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        info = response.json()[0]
        
        prompt = f"""
        Analyze the following Indian stock for an investor. Do not give financial advice.
        Company Name: {info.get('companyName', symbol)}, Ticker Symbol: {symbol}, Sector: {info.get('sector', 'N/A')}, Industry: {info.get('industry', 'N/A')}, Company Description: {info.get('description')}
        Based on the information above, please generate a concise, neutral summary in three distinct sections.
        Use double asterisks for headings. The sections should be:
        **1. Core Business and Market Position:**
        **2. Key Potential Strengths:**
        **3. Notable Risks or Challenges:**
        The summary should be easy to understand for a retail investor.
        """
        model = genai.GenerativeModel('gemini-2.5-flash')
        response = model.generate_content(prompt)
        return jsonify({"symbol": symbol, "summary": response.text})
    except Exception as e:
        return jsonify({"error": f"An error occurred during AI summary generation: {e}"}), 500

# --- 4. PRODUCTION SERVING LOGIC (The Critical Fix) ---

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    """
    This is a catch-all route.
    1. It tries to find a file in the 'frontend/build' folder (like css, js, png).
    2. If it can't find the file (e.g., user requests '/'), it serves 'index.html'.
    This allows React Router to handle the routing on the client side.
    """
    if path != "" and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, 'index.html')

# --- Main execution block ---
if __name__ == '__main__':
    app.run(debug=True, port=5001)