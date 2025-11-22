import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import StockDetail from './components/StockDetail';
import { FaSearch } from 'react-icons/fa';
import './App.css';

// --- NEW: Filter Button Component ---
const FilterButton = ({ label, activeFilter, setFilter }) => (
  <button
    className={`filter-button ${activeFilter === label ? 'active' : ''}`}
    onClick={() => setFilter(label)}
  >
    {label}
  </button>
);


function App() {
  const [stockList, setStockList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSymbol, setSelectedSymbol] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // --- NEW: State for the active filter ---
  const [activeFilter, setActiveFilter] = useState('Market Cap');

  // --- MODIFIED: useEffect now calls our new, powerful endpoint ---
  useEffect(() => {
    const fetchMarketData = async () => {
      try {
        const response = await axios.get('/api/nifty500-market-data');
        
        // --- SAFETY CHECK ---
        // Check if the response is actually an array (list of stocks)
        if (Array.isArray(response.data)) {
          setStockList(response.data);
          setError(null);
        } else {
          // If it's not an array, it's likely an error object from the backend
          console.error("Server returned non-array data:", response.data);
          setError(response.data.error || 'Received invalid data format from server');
        }
        
      } catch (err) {
        console.error("API Error:", err);
        // Extract the specific error message from the backend if it exists
        const msg = err.response?.data?.error || 'Failed to fetch market data. Please check console.';
        setError(msg);
      } finally {
        setIsLoading(false);
      }
    };
    fetchMarketData();
  }, []);

  // --- NEW: Advanced Filtering and Sorting Logic using useMemo for performance ---
  const filteredAndSortedStocks = useMemo(() => {
    let sortedStocks = [...stockList];

    // 1. Apply the active filter/sort
    switch (activeFilter) {
      case 'Top Gainers':
        sortedStocks.sort((a, b) => b.percentChange - a.percentChange);
        break;
      case 'Top Losers':
        sortedStocks.sort((a, b) => a.percentChange - b.percentChange);
        break;
      case 'Volume':
        sortedStocks.sort((a, b) => b.volume - a.volume);
        break;
      case 'Market Cap':
      default:
        sortedStocks.sort((a, b) => b.marketCap - a.marketCap);
        break;
    }
    
    // 2. Apply the search term on top of the sorted list
    if (!searchTerm) {
      return sortedStocks;
    }
    return sortedStocks.filter(stock =>
      stock.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
      stock.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [stockList, activeFilter, searchTerm]); // Recalculate only when these change


  const handleStockClick = (symbol) => setSelectedSymbol(symbol);
  const handleCloseDetail = () => setSelectedSymbol(null);

  if (isLoading) return <div className="loading-container"><h1>Loading Stock Data...</h1></div>;
  if (error) return <div className="error-container"><h1>Error: {error}</h1></div>;

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Nifty 500 Stock Screener</h1>
        <p>Your Gateway to Market Insights</p>
      </header>
      
      <main className="app-main">
        <div className="filter-controls">
          <div className="search-bar">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search in selection..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          {/* --- NEW: Filter buttons UI --- */}
          <div className="filter-buttons">
            <FilterButton label="Market Cap" activeFilter={activeFilter} setFilter={setActiveFilter} />
            <FilterButton label="Top Gainers" activeFilter={activeFilter} setFilter={setActiveFilter} />
            <FilterButton label="Top Losers" activeFilter={activeFilter} setFilter={setActiveFilter} />
            <FilterButton label="Volume" activeFilter={activeFilter} setFilter={setActiveFilter} />
          </div>
        </div>

        <div className="stock-table">
          {/* --- MODIFIED: Table header now includes our new data points --- */}
          <div className="stock-table-header">
            <div className="stock-cell name">Company Name</div>
            <div className="stock-cell">Price</div>
            <div className="stock-cell">Change</div>
            <div className="stock-cell">Market Cap</div>
          </div>
          
          {/* --- MODIFIED: We now map over the fully processed list --- */}
          {filteredAndSortedStocks.map(stock => (
            <motion.div 
              key={stock.symbol} 
              className="stock-table-row"
              onClick={() => handleStockClick(stock.symbol)}
              whileHover={{ scale: 1.01, backgroundColor: "rgba(255, 255, 255, 0.05)" }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
              layout
            >
              <div className="stock-cell name">
                <span className="symbol">{stock.symbol}</span>
                {stock.name}
              </div>
              <div className="stock-cell price">₹{stock.price.toLocaleString('en-IN')}</div>
              {/* --- NEW: Dynamically color the change based on positive/negative value --- */}
              <div className={`stock-cell change ${stock.change >= 0 ? 'positive' : 'negative'}`}>
                {stock.change >= 0 ? '+' : ''}{stock.change.toLocaleString('en-IN')} ({stock.percentChange}%)
              </div>
              <div className="stock-cell market-cap">₹{(stock.marketCap / 10000000).toLocaleString('en-IN')} Cr</div>
            </motion.div>
          ))}
          
          {filteredAndSortedStocks.length === 0 && (
            <div className="no-results">
              No stocks found matching your criteria.
            </div>
          )}
        </div>
      </main>

      <StockDetail symbol={selectedSymbol} onClose={handleCloseDetail} />
    </div>
  );
}

export default App;