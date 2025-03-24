import React from 'react';
import { useNavigate } from 'react-router-dom';
import Dashboard from '../components/Dashboard/Dashboard';
import Layout from '../components/Layout/Layout';

const DashboardPage = () => {
  const navigate = useNavigate();

  // Function to handle navigation to membership page
  const handleUpgradeMembership = () => {
    navigate('/membership');
  };

  return (
    <Layout>
      <Dashboard onUpgradeMembership={handleUpgradeMembership} />
    </Layout>
  );
};

export default DashboardPage;