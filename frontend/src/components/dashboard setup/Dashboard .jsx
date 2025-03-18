import { Disclosure, DisclosureButton, DisclosurePanel, Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { Bars3Icon, BellIcon, XMarkIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { useState, useEffect } from 'react';
import CataloguePage from '../../pages/cataloguePage';
import axios from 'axios';
import { useNavigate } from "react-router-dom";

const navigation = [
  { name: 'Workshop', href: '#workshop', current: true },
  { name: 'Catalogue', href: '#catalogue', current: false },
  { name: 'Workspace', href: '#workspace', current: false },
  { name: 'Network', href: '#network', current: false },
  { name: 'Skills', href: '#skills', current: false },
];

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

export default function Dashboard() {
  const [activeNav, setActiveNav] = useState('Workshop');
  const [userData, setUserData] = useState({
    username: '',
    email: '',
    imageUrl: 'https://media.istockphoto.com/id/2161624528/vector/cute-pixel-cartoon-8bit-character-man-exercises-training-dance-lifestyle-music-decoration.jpg?s=612x612&w=0&k=20&c=luiNVSrC8Er__zLOpSIDQZyg-Gm8EFNgtekYGh-sgvI='
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();


  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem('access_token');
        if (!token) {
          navigate('/'); 
          return;
        }

        const response = await axios.get('http://localhost:8000/auth/profile/', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        setUserData({
          ...userData,
          username: response.data.username,
          email: response.data.email
        });
        setLoading(false);
      } catch (error) {
        console.error('Error fetching user data:', error);
        if (error.response?.status === 401) {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          navigate('/'); 
        }
        setLoading(false);
      }
    };

    fetchUserData();
  }, [navigate]);

  const handleNavClick = (name) => {
    setActiveNav(name);
  };

  const handleLogout = async () => {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      
      await axios.post('http://localhost:8000/auth/logout/', {
        refresh: refreshToken
      }, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });

      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      navigate('/');
    } catch (error) {
      console.error('Logout failed:', error);
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      navigate('/');
    }
  };

  const userNavigation = [
    { name: 'Your Profile',href: '/ProfilePage', onClick: () => navigate('/ProfilePage')},
    { name: 'Settings', href: '#' },
    { name: 'Sign out', href: '#', onClick: handleLogout },
  ];

  if (loading) {
    return <div>Loading...</div>; // Simple loading state
  }

  return (
    <>
      <div className="min-h-full">
        <Disclosure as="nav" className="bg-gray-800">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 items-center justify-between">
              <div className="flex items-center">
                <div className="shrink-0">
                  <img
                    alt="Together Culture"
                    src="https://media.istockphoto.com/id/2157542875/photo/rearview-of-diverse-people-hugging-each-other.jpg?s=612x612&w=0&k=20&c=yCLPZWHasqMNP9rf7_J0qLY2YiPC8VkkUJSr_eO5wHQ="
                    className="size-8"
                  />
                </div>
                <div className="hidden md:block">
                  <div className="ml-10 flex items-baseline space-x-4">
                    {navigation.map((item) => (
                      <a
                        key={item.name}
                        href={item.href}
                        onClick={() => handleNavClick(item.name)}
                        aria-current={item.name === activeNav ? 'page' : undefined}
                        className={classNames(
                          item.name === activeNav ? 'bg-gray-900 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white',
                          'rounded-md px-3 py-2 text-sm font-medium',
                        )}
                      >
                        {item.name}
                      </a>
                    ))}
                  </div>
                </div>
              </div>

              <div className="hidden md:flex flex-1 justify-center px-2 lg:ml-6 lg:justify-end">
                <div className="max-w-lg w-full lg:max-w-xs">
                  <label htmlFor="search" className="sr-only">
                    Search
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                    </div>
                    <input
                      id="search"
                      name="search"
                      className="block w-full pl-10 pr-3 py-2 border border-transparent rounded-md leading-5 bg-gray-700 text-gray-300 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-white focus:ring-white focus:text-gray-900 sm:text-sm"
                      placeholder="Search"
                      type="search"
                    />
                  </div>
                </div>
              </div>

              <div className="hidden md:block">
                <div className="ml-4 flex items-center md:ml-6">
                  <button
                    type="button"
                    className="relative rounded-full bg-gray-800 p-1 text-gray-400 hover:text-white focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800 focus:outline-hidden"
                  >
                    <span className="absolute -inset-1.5" />
                    <span className="sr-only">View notifications</span>
                    <BellIcon aria-hidden="true" className="size-6" />
                  </button>

                  <Menu as="div" className="relative ml-3">
                    <div>
                      <MenuButton className="relative flex max-w-xs items-center rounded-full bg-gray-800 text-sm focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800 focus:outline-hidden">
                        <span className="absolute -inset-1.5" />
                        <span className="sr-only">Open user menu</span>
                        <img alt="" src={userData.imageUrl} className="size-8 rounded-full" />
                      </MenuButton>
                    </div>
                    <MenuItems
                      transition
                      className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 ring-1 shadow-lg ring-black/5 transition focus:outline-hidden data-closed:scale-95 data-closed:transform data-closed:opacity-0 data-enter:duration-100 data-enter:ease-out data-leave:duration-75 data-leave:ease-in"
                    >
                      {userNavigation.map((item) => (
                        <MenuItem key={item.name}>
                          <a
                            href={item.href}
                            onClick={item.onClick}
                            className="block px-4 py-2 text-sm text-gray-700 data-focus:bg-gray-100 data-focus:outline-hidden"
                          >
                            {item.name}
                          </a>
                        </MenuItem>
                      ))}
                    </MenuItems>
                  </Menu>
                </div>
              </div>
              <div className="-mr-2 flex md:hidden">
                <DisclosureButton className="group relative inline-flex items-center justify-center rounded-md bg-gray-800 p-2 text-gray-400 hover:bg-gray-700 hover:text-white focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800 focus:outline-hidden">
                  <span className="absolute -inset-0.5" />
                  <span className="sr-only">Open main menu</span>
                  <Bars3Icon aria-hidden="true" className="block size-6 group-data-open:hidden" />
                  <XMarkIcon aria-hidden="true" className="hidden size-6 group-data-open:block" />
                </DisclosureButton>
              </div>
            </div>
          </div>

          <DisclosurePanel className="md:hidden">
            <div className="space-y-1 px-2 pt-2 pb-3 sm:px-3">
              <div className="px-2 pb-3">
                <label htmlFor="mobile-search" className="sr-only">
                  Search
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                  </div>
                  <input
                    id="mobile-search"
                    name="search"
                    className="block w-full pl-10 pr-3 py-2 border border-transparent rounded-md leading-5 bg-gray-700 text-gray-300 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-white focus:ring-white focus:text-gray-900 sm:text-sm"
                    placeholder="Search"
                    type="search"
                  />
                </div>
              </div>
              {navigation.map((item) => (
                <DisclosureButton
                  key={item.name}
                  as="a"
                  href={item.href}
                  onClick={() => handleNavClick(item.name)}
                  aria-current={item.name === activeNav ? 'page' : undefined}
                  className={classNames(
                    item.name === activeNav ? 'bg-gray-900 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white',
                    'block rounded-md px-3 py-2 text-base font-medium',
                  )}
                >
                  {item.name}
                </DisclosureButton>
              ))}
            </div>
            <div className="border-t border-gray-700 pt-4 pb-3">
              <div className="flex items-center px-5">
                <div className="shrink-0">
                  <img alt="" src={userData.imageUrl} className="size-10 rounded-full" />
                </div>
                <div className="ml-3">
                  <div className="text-base/5 font-medium text-white">{userData.username}</div>
                  <div className="text-sm font-medium text-gray-400">{userData.email}</div>
                </div>
                <button
                  type="button"
                  className="relative ml-auto shrink-0 rounded-full bg-gray-800 p-1 text-gray-400 hover:text-white focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800 focus:outline-hidden"
                >
                  <span className="absolute -inset-1.5" />
                  <span className="sr-only">View notifications</span>
                  <BellIcon aria-hidden="true" className="size-6" />
                </button>
              </div>
              <div className="mt-3 space-y-1 px-2">
                {userNavigation.map((item) => (
                  <DisclosureButton
                    key={item.name}
                    as="a"
                    href={item.href}
                    onClick={item.onClick}
                    className="block rounded-md px-3 py-2 text-base font-medium text-gray-400 hover:bg-gray-700 hover:text-white"
                  >
                    {item.name}
                  </DisclosureButton>
                ))}
              </div>
            </div>
          </DisclosurePanel>
        </Disclosure>

        <header className="bg-white shadow-sm">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Together Culture</h1>
            <p className="mt-2 text-lg text-gray-600">
              Join our community of creators and innovators building a more equitable and ecological creative economy.
            </p>
          </div>
        </header>

        <main>
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            {activeNav === 'Catalogue' ? (
              <CataloguePage />
            ) : activeNav === 'Workshop' ? (
              <div className="bg-gray-100 p-6 rounded-lg">
                <h2 className="text-xl font-semibold text-gray-900">Creative Workshop</h2>
                <p className="mt-2 text-gray-700">
                  Learn about sustainable practices in the creative industry.<br />
                  <strong>Date:</strong> 2025-02-15 at 14:00<br />
                  <strong>Location:</strong> Main Space<br />
                  <strong>Capacity:</strong> 30
                </p>
              </div>
            ) : (
              <div className="bg-gray-100 p-6 rounded-lg">
                <h2 className="text-xl font-semibold text-gray-900">{activeNav}</h2>
                <p className="mt-2 text-gray-700">
                  Content for {activeNav} coming soon!
                </p>
              </div>
            )}
          </div>
        </main>
      </div>
    </>
  );
}