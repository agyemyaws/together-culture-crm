import { BrowserRouter as Router } from 'react-router-dom';
import { UserProvider } from './context/UserContext';
import AppRoutes from './routes';

function App() {
  return (
    <Router>
      <UserProvider>
        <AppRoutes />
      </UserProvider>
    </Router>
  );
}

export default App;