import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./App.css";
import LandingPage from "./pages/landingPage";
import LoginPage from "./pages/loginPage";
import SignupPage from "./pages/SignupPage";
import CompleteProfilePage from "./pages/completeProfilePage";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/join" element={<SignupPage />} />
        <Route path="/complete-profile" element={<CompleteProfilePage />} />
      </Routes>
    </Router>
  );
}
export default App;
