import { useEffect, useState } from 'react';
import Site from './Site';
import Admin from './Admin';

function App() {
  const [hash, setHash] = useState(window.location.hash);

  useEffect(() => {
    const onChange = () => setHash(window.location.hash);
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);

  return hash.startsWith('#/admin') ? <Admin /> : <Site />;
}

export default App;
