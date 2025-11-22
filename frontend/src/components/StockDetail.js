import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaChartLine, FaFileAlt, FaLightbulb, FaShieldAlt, FaBuilding } from 'react-icons/fa';
import PriceChart from './PriceChart';
import './StockDetail.css';

// --- A small, reusable component for a single row in our summary table ---
const SummaryRow = ({ icon, title, content }) => (
  <div className="summary-row">
    <div className="summary-title">
      {icon}
      <span>{title}</span>
    </div>
    <div className="summary-content">
      <p>{content}</p>
    </div>
  </div>
);


const StockDetail = ({ symbol, onClose }) => {
  // --- State Management ---
  const [details, setDetails] = useState(null);
  const [summary, setSummary] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- Data Fetching Effect ---
  useEffect(() => {
    if (!symbol) return;

    // Reset all states when a new symbol is selected
    setIsLoading(true);
    setDetails(null);
    setSummary(null);
    setChartData([]);
    setError(null);

    const fetchDetails = async () => {
      try {
        // Use Promise.all to fetch all three endpoints simultaneously for maximum speed
        const [detailsResponse, summaryResponse, chartResponse] = await Promise.all([
  axios.get(`http://127.0.0.1:5001/api/stock-data/${symbol}`),
  axios.get(`http://127.0.0.1:5001/api/stock-summary/${symbol}`),
  axios.get(`http://127.0.0.1:5001/api/stock-chart/${symbol}`)

        ]);

        setDetails(detailsResponse.data);
        setSummary(summaryResponse.data);
        setChartData(chartResponse.data);

      } catch (err) {
        setError('Failed to fetch all stock details. The backend server might be busy.');
        console.error('API Fetch Error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDetails();
  }, [symbol]);


  // --- Logic to parse the AI summary into a structured table format ---
  const parsedSummary = useMemo(() => {
    if (!summary?.summary) return [];

    // This regular expression splits the text by our expected headings
    const sections = summary.summary.split(/\s*\*{1,2}\d?\.?\s*(.*?)\*{1,2}\s*/).filter(Boolean);
    
    const summaryMap = [];
    for (let i = 0; i < sections.length; i += 2) {
      if (sections[i] && sections[i+1]) {
        summaryMap.push({ 
          title: sections[i].replace(/:/g, '').trim(), 
          content: sections[i+1].trim() 
        });
      }
    }
    return summaryMap;
  }, [summary]); // This logic only re-runs when the summary data changes


  // --- Animation Variants for Framer Motion ---
  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  };
  const modalVariants = {
    hidden: { y: "-50vh", opacity: 0 },
    visible: { y: "0", opacity: 1, transition: { type: 'spring', stiffness: 100 } },
  };


  return (
    <AnimatePresence>
      {symbol && (
        <motion.div
          className="backdrop"
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          onClick={onClose}
        >
          <motion.div
            className="stock-detail-modal"
            variants={modalVariants}
            onClick={(e) => e.stopPropagation()}
          >
            <button className="close-button" onClick={onClose}><FaTimes /></button>
            
            {isLoading && <div className="loading-spinner"></div>}
            {error && <div className="error-message">{error}</div>}

            {!isLoading && !error && details && (
              <>
                <div className="detail-header">
                  <h2>{details.longName} ({details.symbol})</h2>
                </div>

                <div className="detail-section">
                  <PriceChart data={chartData} />
                </div>

                <div className="detail-section market-data">
                  <h3>Live Market Snapshot</h3>
                  <div className="data-grid">
                    <div className="data-item"><span>Current Price</span><strong>₹{details.currentPrice?.toLocaleString('en-IN')}</strong></div>
                    <div className="data-item"><span>Day High</span><p>₹{details.dayHigh?.toLocaleString('en-IN')}</p></div>
                    <div className="data-item"><span>Day Low</span><p>₹{details.dayLow?.toLocaleString('en-IN')}</p></div>
                    <div className="data-item"><span>Previous Close</span><p>₹{details.previousClose?.toLocaleString('en-IN')}</p></div>
                    <div className="data-item"><span>Volume</span><p>{details.volume?.toLocaleString('en-IN')}</p></div>
                    <div className="data-item"><span>Market Cap</span><p>₹{details.marketCap?.toLocaleString('en-IN')}</p></div>
                  </div>
                </div>

                {summary && parsedSummary.length > 0 && (
                  <div className="detail-section ai-summary">
                    <h3><FaFileAlt /> Gemini AI Summary</h3>
                    <div className="summary-table">
                      {parsedSummary.map((item, index) => {
                        let icon = <FaLightbulb />; // Default icon
                        if (item.title.toLowerCase().includes('risk')) icon = <FaShieldAlt />;
                        if (item.title.toLowerCase().includes('business')) icon = <FaBuilding />;
                        
                        return <SummaryRow key={index} icon={icon} title={item.title} content={item.content} />
                      })}
                    </div>
                  </div>
                )}
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default StockDetail;