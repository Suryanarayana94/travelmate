import { useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import Layout from './components/Layout';
import DatabaseGate from './components/DatabaseGate';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Destinations from './pages/Destinations';
import DestinationDetail from './pages/DestinationDetail';
import PlanTrip from './pages/PlanTrip';
import Services from './pages/Services';
import Login from './pages/Login';
import Register from './pages/Register';
import NotFound from './pages/NotFound';
import DashboardLayout from './pages/dashboards/DashboardLayout';

// Views that carry their own navigation or hero treatment.
import TravellerDashboard from './pages/dashboards/TravellerDashboard';
import ProviderDashboard from './pages/dashboards/ProviderDashboard';
import ProfilePage from './pages/dashboards/ProfilePage';
import ServicesManager from './pages/dashboards/ServicesManager';
import BookingsPage from './pages/dashboards/BookingsPage';
import { PROVIDER_ROLES } from './lib/constants';

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
  }, [pathname]);
  return null;
};

const App = () => (
  <DatabaseGate>
    <ScrollToTop />
    <Routes>
      <Route path="/" element={<Layout><Home /></Layout>} />
      <Route path="/destinations" element={<Layout><Destinations /></Layout>} />
      <Route path="/destinations/:slug" element={<Layout><DestinationDetail /></Layout>} />
      <Route path="/plan" element={<Layout><PlanTrip /></Layout>} />
      <Route path="/services" element={<Layout><Services /></Layout>} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardLayout.Redirect />} />
        <Route path="traveller" element={<ProtectedRoute roles={['traveller']}><TravellerDashboard /></ProtectedRoute>} />
        <Route
          path=":role"
          element={
            <ProtectedRoute roles={PROVIDER_ROLES}>
              <ProviderDashboard />
            </ProtectedRoute>
          }
        />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="services" element={<ProtectedRoute roles={PROVIDER_ROLES}><ServicesManager /></ProtectedRoute>} />
        <Route path="bookings" element={<BookingsPage />} />
        <Route path="*" element={<NotFound embedded />} />
      </Route>

      <Route path="*" element={<Layout><NotFound /></Layout>} />
    </Routes>
  </DatabaseGate>
);

export default App;
