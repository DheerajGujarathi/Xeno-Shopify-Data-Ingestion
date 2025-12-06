import React, { useState, useEffect } from 'react';
import { Save, Trash2 } from 'lucide-react';
import api from '../api';
import '../index.css';

function Settings() {
  const [formData, setFormData] = useState({
    shopifyShopDomain: '',
    shopifyAccessToken: ''
  });
  const [hasExistingConfig, setHasExistingConfig] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    checkExistingConfig();
  }, []);

  const checkExistingConfig = async () => {
    try {
      const response = await api.get('/auth/me');
      if (response.data.user.shopifyShopDomain) {
        setHasExistingConfig(true);
        setFormData({
          shopifyShopDomain: response.data.user.shopifyShopDomain,
          shopifyAccessToken: '••••••••••••••••' // Masked for security
        });
      }
    } catch (error) {
      console.error('Error checking config:', error);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await api.post('/shopify/config', formData);
      setMessage({ type: 'success', text: response.data.message });
      setHasExistingConfig(true);
      // Clear form after successful save
      setTimeout(() => {
        setMessage({ type: '', text: '' });
      }, 3000);
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.error || 'Failed to save configuration' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete your Shopify configuration? This will stop data synchronization.')) {
      return;
    }

    setDeleting(true);
    setMessage({ type: '', text: '' });

    try {
      await api.delete('/shopify/config');
      setMessage({ type: 'success', text: 'Configuration deleted successfully' });
      setHasExistingConfig(false);
      setFormData({
        shopifyShopDomain: '',
        shopifyAccessToken: ''
      });
      setTimeout(() => {
        setMessage({ type: '', text: '' });
      }, 3000);
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.error || 'Failed to delete configuration' 
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="settings-container">
      <div className="settings-header">
        <h1>Shopify Configuration</h1>
        <p>Configure your Shopify store credentials to enable data synchronization</p>
      </div>

      <div className="settings-card">
        {hasExistingConfig && (
          <div className="config-status">
            <span className="status-badge status-active">✓ Configuration Active</span>
            <button 
              onClick={handleDelete}
              className="btn-danger"
              disabled={deleting}
            >
              <Trash2 size={18} />
              {deleting ? 'Deleting...' : 'Delete Configuration'}
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="shopifyShopDomain">
              Shopify Shop Domain *
            </label>
            <input
              type="text"
              id="shopifyShopDomain"
              name="shopifyShopDomain"
              value={formData.shopifyShopDomain}
              onChange={handleChange}
              placeholder="your-store.myshopify.com"
              required
            />
            <small className="form-help">
              Enter your Shopify store domain (e.g., your-store.myshopify.com)
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="shopifyAccessToken">
              Admin API Access Token *
            </label>
            <input
              type="password"
              id="shopifyAccessToken"
              name="shopifyAccessToken"
              value={formData.shopifyAccessToken}
              onChange={handleChange}
              placeholder="shpat_xxxxxxxxxxxx"
              required
            />
            <small className="form-help">
              Your Shopify Admin API access token (starts with shpat_)
            </small>
          </div>

          {message.text && (
            <div className={`message ${message.type}`}>
              {message.text}
            </div>
          )}

          <button 
            type="submit" 
            className="btn-primary"
            disabled={loading}
          >
            <Save size={18} />
            {loading ? 'Saving...' : hasExistingConfig ? 'Update Configuration' : 'Save Configuration'}
          </button>
        </form>

        <div className="settings-instructions">
          <h3>How to get your credentials:</h3>
          <ol>
            <li>Go to your Shopify Admin → Settings → Apps and sales channels</li>
            <li>Click "Develop apps" → "Create an app"</li>
            <li>Name it (e.g., "Data Sync") and create the app</li>
            <li>Go to "Configuration" tab → "Admin API integration" → "Configure"</li>
            <li>Select scopes: read_customers, read_orders, read_products</li>
            <li>Click "Save" → "Install app"</li>
            <li>Copy the "Admin API access token" (starts with shpat_)</li>
            <li>Your domain is: your-store-name.myshopify.com</li>
          </ol>
        </div>
      </div>
    </div>
  );
}

export default Settings;
