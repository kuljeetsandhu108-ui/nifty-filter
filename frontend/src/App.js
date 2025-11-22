import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import StockDetail from './components/StockDetail';
import { FaSearch } from 'react-icons/fa';
import './App.css';

// Filter Button Component
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
  const [activeFilter, setActiveFilter] = useState('Market Cap');

  useEffect(() => {
    const fetchMarketData = async () => {
      try {
        // USE RELATIVE PATH FOR PRODUCTION
        // This automatically works on both Localhost (with proxy) and Render
        const response = await axios.get('/api/nifty500-market-data');
        
        // --- CRITICAL SAFETY CHECK ---
        // If the server returns an error object instead of a list, don't crash.
        if (Array.isArray(response.data)) {
          setStockList(response.data);
          setError(null);
        } else {
          console.error("Invalid Data:", response.data);
          setError("Server returned invalid data. Check API Keys.");
        }

      } catch (err) {
        console.error("Fetch Error:", err);
        setError('Failed to connect to server. Please wait a moment and refresh.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchMarketData();
  }, []);

  const filteredAndSortedStocks = useMemo(() => {
    // Safety check: Ensure stockList is actually an array before filtering
    if (!Array.isArray(stockList)) return [];

    let sortedStocks = [...stockList];

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
        // Handle potential missing marketCap values safely
        sortedStocks.sort((a, b) => (b.marketCap || 0) - (a.marketCap || 0));
        break;
    }
    
    if (!searchTerm) return sortedStocks;
    
    return sortedStocks.filter(stock =>
      (stock.symbol || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (stock.name || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [stockList, activeFilter, searchTerm]);

  const handleStockClick = (symbol) => setSelectedSymbol(symbol);
  const handleCloseDetail = () => setSelectedSymbol(null);

  if (isLoading) return <div className="loading-container"><h1>Loading Market Data...</h1></div>;
  
  // Display the error on screen if one exists
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
          <div className="filter-buttons">
            <FilterButton label="Market Cap" activeFilter={activeFilter} setFilter={setActiveFilter} />
            <FilterButton label="Top Gainers" activeFilter={activeFilter} setFilter={setActiveFilter} />
            <FilterButton label="Top Losers" activeFilter={activeFilter} setFilter={setActiveFilter} />
            <FilterButton label="Volume" activeFilter={activeFilter} setFilter={setActiveFilter} />
          </div>
        </div>

        <div className="stock-table">
          <div className="stock-table-header">
            <div className="stock-cell name">Company Name</div>
            <div className="stock-cell">Price</div>
            <div className="stock-cell">Change</div>
            <div className="stock-cell">Market Cap</div>
          </div>
          
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
              <div className="stock-cell price">₹{stock.price?.toLocaleString('en-IN')}</div>
              <div className={`stock-cell change ${stock.change >= 0 ? 'positive' : 'negative'}`}>
                {stock.change >= 0 ? '+' : ''}{stock.change?.toLocaleString('en-IN')} ({stock.percentChange}%)
              </div>
              <div className="stock-cell market-cap">
                {stock.marketCap ? `₹${(stock.marketCap / 10000000).toLocaleString('en-IN', {maximumFractionDigits: 0})} Cr` : 'N/A'}
              </div>
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