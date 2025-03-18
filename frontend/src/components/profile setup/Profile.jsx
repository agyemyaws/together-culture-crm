import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Profile = () => {
  const [profile, setProfile] = useState({
    username: '',
    email: '',
    full_name: '',
    bio: '',
    phone_number: '',
    location: '',
    current_membership: null,
    current_interests: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('access_token');
        if (!token) {
          navigate('/');
          return;
        }

        const response = await axios.get('http://localhost:8000/auth/profile/', {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        setProfile({
          username: response.data.username || 'Unknown User',
          email: response.data.email || 'No email',
          full_name: response.data.full_name || '',
          bio: response.data.bio || 'No bio provided',
          phone_number: response.data.phone_number || 'Not specified',
          location: response.data.location || 'Not specified',
          current_membership: response.data.current_membership || null,
          current_interests: response.data.current_interests || []
        });
        setLoading(false);
      } catch (err) {
        console.error('Error fetching profile:', err);
        if (err.response?.status === 401 || err.response?.status === 404) {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          navigate('/');
        } else {
          setError('Failed to load profile data');
        }
        setLoading(false);
      }
    };

    fetchProfile();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-300">
        <div className="text-2xl font-semibold text-gray-700 animate-pulse">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-100 to-red-300">
        <div className="text-2xl font-semibold text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-8 text-center tracking-tight drop-shadow-md">
          Your Profile
        </h1>
        <div className="bg-white shadow-2xl rounded-xl p-8 transform hover:scale-[1.02] transition-all duration-300">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Personal Information Section */}
            <div className="bg-gradient-to-r from-indigo-100 to-purple-100 p-6 rounded-lg shadow-inner">
              <h2 className="text-2xl font-bold text-indigo-900 mb-4 border-b-2 border-indigo-300 pb-2">
                Personal Information
              </h2>
              <div className="mt-4 space-y-4 text-gray-700">
                <p className="flex items-center">
                  <span className="w-32 font-semibold text-indigo-800">Username:</span>
                  <span className="flex-1 bg-white p-2 rounded-md shadow-sm">{profile.username}</span>
                </p>
                <p className="flex items-center">
                  <span className="w-32 font-semibold text-indigo-800">Email:</span>
                  <span className="flex-1 bg-white p-2 rounded-md shadow-sm">{profile.email}</span>
                </p>
                <p className="flex items-center">
                  <span className="w-32 font-semibold text-indigo-800">Full Name:</span>
                  <span className="flex-1 bg-white p-2 rounded-md shadow-sm">{profile.full_name}</span>
                </p>
                <p className="flex items-center">
                  <span className="w-32 font-semibold text-indigo-800">Bio:</span>
                  <span className="flex-1 bg-white p-2 rounded-md shadow-sm">{profile.bio}</span>
                </p>
                <p className="flex items-center">
                  <span className="w-32 font-semibold text-indigo-800">Phone:</span>
                  <span className="flex-1 bg-white p-2 rounded-md shadow-sm">{profile.phone_number}</span>
                </p>
                <p className="flex items-center">
                  <span className="w-32 font-semibold text-indigo-800">Location:</span>
                  <span className="flex-1 bg-white p-2 rounded-md shadow-sm">{profile.location}</span>
                </p>
              </div>
            </div>

            {/* Membership & Interests Section */}
            <div className="bg-gradient-to-r from-purple-100 to-pink-100 p-6 rounded-lg shadow-inner">
              <h2 className="text-2xl font-bold text-purple-900 mb-4 border-b-2 border-purple-300 pb-2">
                Membership & Interests
              </h2>
              <div className="mt-4 space-y-6 text-gray-700">
                <p className="flex items-center">
                  <span className="w-32 font-semibold text-purple-800">Membership:</span>
                  <span className="flex-1 bg-white p-2 rounded-md shadow-sm capitalize">
                    {profile.current_membership ? profile.current_membership.membership_type : 'None'}
                  </span>
                </p>
                <div>
                  <span className="font-semibold text-purple-800 block mb-2">Interests:</span>
                  {profile.current_interests.length > 0 ? (
                    <ul className="space-y-2">
                      {profile.current_interests.map((interest, index) => (
                        <li
                          key={index}
                          className="bg-white p-2 rounded-md shadow-sm text-purple-700 hover:bg-purple-50 transition-colors duration-200"
                        >
                          {interest.interest_type}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <span className="bg-white p-2 rounded-md shadow-sm text-gray-600">
                      None specified
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Back Button */}
          <div className="mt-8 flex justify-center">
            <button
              onClick={() => navigate('/dashboard')}
              className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-full shadow-lg hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-300 transition-all duration-300 transform hover:-translate-y-1"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;