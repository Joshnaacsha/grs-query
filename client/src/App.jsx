import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from './components/admin/AdminLayout';
import AdminDashboard from './components/admin/AdminDashboard';
import EscalatedCases from './components/admin/EscalatedCases';
import ResourceManagement from './components/admin/ResourceManagement';
import SmartQuery from './components/admin/SmartQuery';
import MetricsDashboard from './components/admin/MetricsDashboard';
import Settings from './components/admin/Settings';
import OfficialsList from './components/admin/OfficialsList';
import GrievancesList from './components/admin/GrievancesList';
import NotificationsList from './components/admin/NotificationsList';

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/admin" element={<AdminLayout />}>
                    <Route index element={<Navigate to="/admin/dashboard" replace />} />
                    <Route path="dashboard" element={<AdminDashboard />} />
                    <Route path="escalated" element={<EscalatedCases />} />
                    <Route path="resource-management" element={<ResourceManagement />} />
                    <Route path="smart-query" element={<SmartQuery />} />
                    <Route path="metrics" element={<MetricsDashboard />} />
                    <Route path="settings" element={<Settings />} />
                    <Route path="officials" element={<OfficialsList />} />
                    <Route path="grievances" element={<GrievancesList />} />
                    <Route path="notifications" element={<NotificationsList />} />
                </Route>
            </Routes>
        </Router>
    );
}

export default App; 