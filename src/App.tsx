import React, { useState, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { 
  Box,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  CssBaseline,
  Container,
  Paper,
  ThemeProvider
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import Sidebar from './components/Sidebar';
import DocumentVerifier from './components/DocumentVerifier';
import HiringExtractor from "./components/HiringExtractor";
import StatusBox from './components/StatusBox';
import { theme } from './theme';

function AppContent() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [statusMessage, setStatusMessage] = useState('Ready to verify documents');
  const location = useLocation();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleSidebarToggle = () => {
    // For mobile, we want to close the temporary drawer
    if (window.innerWidth < 600) {
      setMobileOpen(!mobileOpen);
    } else {
      // For desktop, toggle the permanent drawer
      setIsSidebarOpen(!isSidebarOpen);
    }
  };

  // Handle status updates from child components
  const handleStatusUpdate = useCallback((message: string) => {
    setStatusMessage(message);
  }, []);

  // Get the current page title based on the route
  const getPageTitle = () => {
    switch (location.pathname) {
      case '/':
        return 'Immigration Document Verifier';
      case '/hiring-extractor':
        return 'Hiring Extractor';
      default:
        return 'Immigration Verification Platform';
    }
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${isSidebarOpen ? 240 : 73}px)` },
          ml: { sm: `${isSidebarOpen ? 240 : 73}px` },
          transition: (theme) =>
            theme.transitions.create(['margin', 'width'], {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.leavingScreen,
            }),
          zIndex: (theme) => theme.zIndex.drawer + 1,
          backgroundColor: theme.palette.primary.main,
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleSidebarToggle}
            sx={{
              mr: 2,
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
              },
            }}
          >
            <MenuIcon />
          </IconButton>
          <Typography
            variant="h6"
            component="div"
            sx={{
              flexGrow: 1,
              fontWeight: 600,
              color: 'white',
            }}
          >
            {getPageTitle()}
          </Typography>
        </Toolbar>
      </AppBar>

      <Sidebar
        open={isSidebarOpen}
        onToggle={handleSidebarToggle}
        mobileOpen={mobileOpen}
        onMobileToggle={handleDrawerToggle}
      />

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${isSidebarOpen ? 240 : 0}px)` },
          ml: { sm: `${isSidebarOpen ? 240 : 0}px` },
          mt: '64px',
          transition: (theme) =>
            theme.transitions.create(['margin', 'width'], {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.leavingScreen,
            }),
          backgroundColor: theme.palette.background.default,
          minHeight: 'calc(100vh - 64px)',
        }}
      >
        <Container maxWidth="lg" sx={{ mt: 2, mb: 4 }}>
          <Routes>
            <Route
              path="/"
              element={
                <Paper
                  sx={{
                    p: 3,
                    borderRadius: 2,
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                  }}
                >
                  <DocumentVerifier apiEndpoint="https://3fd5-174-95-254-29.ngrok-free.app/api/v1/verify-immigration-document/" />
                </Paper>
              }
            />
            <Route
              path="/hiring-extractor"
              element={
                <Paper
                  sx={{
                    p: 3,
                    borderRadius: 2,
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                  }}
                >
                  <HiringExtractor apiEndpoint="http://localhost:8000/api/hiring-extract" />
                </Paper>
              }
            />
          </Routes>
        </Container>
      </Box>
      <StatusBox apiEndpoint="http://localhost:8000/api" />
    </Box>
  );
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <AppContent />
      </Router>
    </ThemeProvider>
  );
}

export default App;
