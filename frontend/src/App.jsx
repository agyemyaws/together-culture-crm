import { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import Login from "./components/Login";
import SignUp from "./components/SignUp";
import "./App.css";
import Home from "./components/Home";

function App() {
  return (
    <Router>
      

     
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={< SignUp/>}/>
        <Route path="/" element={<Login />} />
        <Route path="/home" element={<Home/>} />
      </Routes>
    </Router>
  );
}

export default App;
