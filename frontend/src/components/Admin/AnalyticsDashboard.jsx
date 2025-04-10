import React from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import styles from './AdminDashboard.module.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const AnalyticsDashboard = ({ engagementData, funnelData, interestData }) => {
    const funnelChartData = funnelData && {
        labels: ['Total Users', 'Completed Profiles', 'Pending Requests'],
        datasets: [{
            label: 'Member Funnel',
            data: [
                funnelData.funnel.total_users,
                funnelData.funnel.completed_profiles,
                funnelData.funnel.pending_requests,
            ],
            backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56'],
        }],
    };

    const membershipChartData = funnelData && {
        labels: funnelData.funnel.membership_counts.map(item => item.membership_type),
        datasets: [{
            label: 'Approved Memberships',
            data: funnelData.funnel.membership_counts.map(item => item.count),
            backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56'],
        }],
    };

    const interestChartData = interestData && {
        labels: interestData.map(item => item.username),
        datasets: [{
            label: 'Interest History Count',
            data: interestData.map(item => item.interest_history.length),
            backgroundColor: interestData.map(item => 
                item.predominant_interest === 'None' ? '#FF6384' : 
                item.predominant_interest ? '#36A2EB' : '#FFCE56'
            ),
            borderColor: 'rgba(0, 0, 0, 0.1)',
            borderWidth: 1,
        }],
    };

    const progressionChartData = funnelData?.progression && {
        labels: funnelData.progression.map(item => item.username || 'Unknown'),
        datasets: [{
            label: 'Number of Transitions',
            data: funnelData.progression.map(item => item.transitions.length),
            backgroundColor: funnelData.progression.map(item => 
                item.transitions.length > 1 ? '#36A2EB' : '#FFCE56'
            ),
            borderColor: 'rgba(0, 0, 0, 0.1)',
            borderWidth: 1,
        }],
    };

    return (
        <div className={styles.analyticsSection}>
            {engagementData ? (
                <>
                    <h3>Engagement Analytics</h3>
                    <p>Active Users (Last 30 Days): {engagementData.active_users ?? 'Data not available'}</p>
                    {engagementData.active_users === 0 && (
                        <p style={{ color: 'orange' }}>
                            Note: Showing 0 active users. Check if users have logged in within the last 30 days.
                        </p>
                    )}
                    
                </>
            ) : (
                <p>Engagement data not available</p>
            )}
            
            {funnelData && (
                <>
                    <h3>Member Funnel</h3>
                    <Bar
                        data={funnelChartData}
                        options={{
                            responsive: true,
                            plugins: {
                                legend: { position: 'top' },
                                title: { display: true, text: 'Member Funnel' },
                            },
                        }}
                    />
                    <h3>Approved Membership Distribution</h3>
                    <Bar
                        data={membershipChartData}
                        options={{
                            responsive: true,
                            plugins: {
                                legend: { position: 'top' },
                                title: { display: true, text: 'Membership Distribution' },
                            },
                        }}
                    />
                    <h3>Community Journey (Progression)</h3>
                    {funnelData.progression && funnelData.progression.length > 0 ? (
                        <Bar
                            data={progressionChartData}
                            options={{
                                responsive: true,
                                plugins: {
                                    legend: { position: 'top' },
                                    title: { display: true, text: 'User Progression History' },
                                    tooltip: {
                                        callbacks: {
                                            label: (context) => {
                                                const user = funnelData.progression[context.dataIndex];
                                                return [
                                                    `Transition Count: ${context.raw}`,
                                                    `Transitions: ${user.transitions.join(', ')}`
                                                ];
                                            }
                                        }
                                    }
                                },
                                scales: {
                                    y: {
                                        beginAtZero: true,
                                        title: { display: true, text: 'Number of Transitions' }
                                    },
                                    x: {
                                        title: { display: true, text: 'Users' }
                                    }
                                }
                            }}
                        />
                    ) : (
                        <p>No progression data available.</p>
                    )}
                </>
            )}
            
            {interestData && (
                <>
                    <h3>Interest Categorization</h3>
                    <Bar
                        data={interestChartData}
                        options={{
                            responsive: true,
                            plugins: {
                                legend: { position: 'top' },
                                title: { display: true, text: 'User Interest History' },
                                tooltip: {
                                    callbacks: {
                                        label: (context) => {
                                            const user = interestData[context.dataIndex];
                                            return [
                                                `Interest Count: ${context.raw}`,
                                                `Predominant Interest: ${user.predominant_interest || 'None'}`
                                            ];
                                        }
                                    }
                                }
                            },
                            scales: {
                                y: {
                                    beginAtZero: true,
                                    title: { display: true, text: 'Number of Interests' }
                                },
                                x: {
                                    title: { display: true, text: 'Users' }
                                }
                            }
                        }}
                    />
                </>
            )}
        </div>
    );
};

export default AnalyticsDashboard;