import React, { useState, useEffect } from 'react';
import API from '../../api';
import { PlusCircle } from 'lucide-react';

const Portfolios = () => {
  const [portfolios, setPortfolios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newPortfolioName, setNewPortfolioName] = useState('');
  const [newPortfolioDescription, setNewPortfolioDescription] = useState('');

  useEffect(() => {
    const fetchPortfolios = async () => {
      try {
        setLoading(true);
        const response = await API.get('/portfolios');
        setPortfolios(response.data);
      } catch (err) {
        setError('Failed to fetch portfolios.');
      }
      setLoading(false);
    };

    fetchPortfolios();
  }, []);

  const handleCreatePortfolio = async (e) => {
    e.preventDefault();
    try {
      const response = await API.post('/portfolios', {
        name: newPortfolioName,
        description: newPortfolioDescription,
      });
      setPortfolios([...portfolios, response.data]);
      setIsModalOpen(false);
      setNewPortfolioName('');
      setNewPortfolioDescription('');
    } catch (err) {
      setError('Failed to create portfolio.');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">Your Portfolios</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg flex items-center hover:bg-indigo-700 transition duration-300"
        >
          <PlusCircle className="mr-2" /> Create New Portfolio
        </button>
      </div>

      {loading && <p>Loading portfolios...</p>}
      {error && <p className="text-red-500">{error}</p>}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {portfolios.map(portfolio => (
          <div key={portfolio.id} className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-2">{portfolio.name}</h2>
            <p className="text-gray-600">{portfolio.description}</p>
          </div>
        ))}
      </div>

      {portfolios.length === 0 && !loading && (
        <div className="text-center py-16 bg-white rounded-lg shadow-md">
          <p className="text-gray-500">No portfolios yet. Create your first portfolio to get started.</p>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4">Create New Portfolio</h2>
            <form onSubmit={handleCreatePortfolio}>
              <div className="mb-4">
                <label htmlFor="name" className="block text-gray-700 font-bold mb-2">Portfolio Name</label>
                <input
                  type="text"
                  id="name"
                  value={newPortfolioName}
                  onChange={(e) => setNewPortfolioName(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg text-gray-700 focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>
              <div className="mb-6">
                <label htmlFor="description" className="block text-gray-700 font-bold mb-2">Description</label>
                <textarea
                  id="description"
                  value={newPortfolioDescription}
                  onChange={(e) => setNewPortfolioDescription(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg text-gray-700 focus:outline-none focus:border-indigo-500"
                ></textarea>
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg mr-2 hover:bg-gray-400 transition duration-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-indigo-700 transition duration-300"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Portfolios; 