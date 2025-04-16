import React from 'react';
import { Box, List, ListItem, ListItemIcon, ListItemText, Typography } from '@mui/material';
import { Link, useLocation } from 'react-router-dom';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import AssignmentIcon from '@mui/icons-material/Assignment';
import BarChartIcon from '@mui/icons-material/BarChart';
import NotificationsIcon from '@mui/icons-material/Notifications';

const menuItems = [
    {
        text: 'Dashboard',
        icon: <DashboardIcon />,
        path: '/admin/dashboard'
    },
    {
        text: 'Officials',
        icon: <PeopleIcon />,
        path: '/admin/officials'
    },
    {
        text: 'Grievances',
        icon: <AssignmentIcon />,
        path: '/admin/grievances'
    },
    {
        text: 'Notifications',
        icon: <NotificationsIcon />,
        path: '/admin/notifications'
    },
    {
        text: 'API Metrics',
        icon: <BarChartIcon />,
        path: '/admin/metrics'
    }
];

const AdminDashboard = () => {
    const location = useLocation();

    return (
        <Box sx={{ width: '100%', maxWidth: 360, bgcolor: 'background.paper' }}>
            <List component="nav">
                {menuItems.map((item) => (
                    <ListItem
                        button
                        key={item.text}
                        component={Link}
                        to={item.path}
                        selected={location.pathname === item.path}
                        sx={{
                            '&.Mui-selected': {
                                backgroundColor: 'primary.light',
                                '&:hover': {
                                    backgroundColor: 'primary.light',
                                },
                            },
                        }}
                    >
                        <ListItemIcon sx={{ color: location.pathname === item.path ? 'primary.main' : 'inherit' }}>
                            {item.icon}
                        </ListItemIcon>
                        <ListItemText
                            primary={item.text}
                            sx={{
                                color: location.pathname === item.path ? 'primary.main' : 'inherit',
                                '& .MuiTypography-root': {
                                    fontWeight: location.pathname === item.path ? 'bold' : 'normal',
                                }
                            }}
                        />
                    </ListItem>
                ))}
            </List>
        </Box>
    );
};

export default AdminDashboard; 