import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { ChatProvider } from './context/ChatContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataCacheProvider } from './context/DataCacheContext';
import { ToastProvider } from './context/ToastContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Home from './pages/Home';

import Profile from './pages/Profile';
import Admin from './pages/Admin';
import Dashboard from './pages/Dashboard';
import Companies from './pages/Companies';
import CompanyDetails from './pages/CompanyDetails';
import Students from './pages/Students';
import Analytics from './pages/Analytics';
import Reports from './pages/Reports';
import Trends from './pages/Trends';
import Leaderboard from './pages/Leaderboard';
import UploadData from './pages/UploadData';



function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <DataCacheProvider>
          <ToastProvider>
            <ChatProvider>
              <Router>
                <Routes>
                  {/* Public Routes */}
                  <Route path="/" element={<Home />} />
                  <Route path="/login" element={<Login />} />

                  {/* Protected Routes */}
                  <Route
                    path="/*"
                    element={
                      <ProtectedRoute>
                        <Layout>
                          <Routes>
                            <Route path="/dashboard" element={<Dashboard />} />
                            <Route path="/companies" element={<Companies />} />
                            <Route path="/companies/:id" element={<CompanyDetails />} />
                            <Route path="/students" element={<Students />} />
                            <Route path="/analytics" element={<Analytics />} />
                            <Route path="/reports" element={<Reports />} />
                            <Route path="/trends" element={<Trends />} />
                            <Route path="/leaderboard" element={<Leaderboard />} />
                            <Route path="/upload" element={<UploadData />} />
                            <Route path="/profile" element={<Profile />} />

                            {/* Admin Only Route */}
                            <Route
                              path="/admin"
                              element={
                                <ProtectedRoute requireAdmin>
                                  <Admin />
                                </ProtectedRoute>
                              }
                            />

                            {/* Catch all - redirect to dashboard */}
                            <Route path="*" element={<Navigate to="/dashboard" replace />} />
                          </Routes>
                        </Layout>
                      </ProtectedRoute>
                    }
                  />
                </Routes>
              </Router>
            </ChatProvider>
          </ToastProvider>
        </DataCacheProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;

