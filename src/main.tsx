import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Purge any legacy cached dummy/mock products from browser storage
try {
  localStorage.removeItem('vyuma_real_products');
  localStorage.removeItem('vyuma_mock_products');
  localStorage.removeItem('vyuma_demo_products');
} catch (e) {
  // ignore
}

createRoot(document.getElementById('root')!).render(<App />);
