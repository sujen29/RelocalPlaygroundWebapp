import React, { useState } from 'react';
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
// import Sidebar from './components/Sidebar';
import DocumentVerifier from './components/DocumentVerifier';
import HiringExtractor from "./components/HiringExtractor";
import CandidateResumeConverter from './components/CandidateResumeConverter';
import StatusBox from './components/StatusBox';
import { theme } from './theme';

function AppContent() {
  const [mobileOpen, setMobileOpen] = useState(false);
  // Temporarily hide the sidebar
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
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


  // Get the current page title based on the route
  const getPageTitle = () => {
    switch (location.pathname) {
      case '/':
        return 'Welcome';
      case '/verify-immigration-document':
        return 'Immigration Document Verifier';
      case '/hiring-extractor':
        return 'Hiring Extractor';
      case '/convert-candidate-resume/':
        return 'Convert Candidate Resume';
      default:
        return 'Immigration Verification Platform';
    }
  };

  // Construct API endpoints using environment variables
  const baseApiUrl = import.meta.env.VITE_API_BASE_URL;
  const documentVerifierApiEndpoint = `${baseApiUrl}api/v1/verify-immigration-document/`;
  const candidateResumeConverterApiEndpoint = `${baseApiUrl}api/v1/convert-candidate-resume/`;

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AppBar
        position="fixed"
        sx={{
          width: '100%',
          ml: 0,
          zIndex: (theme) => theme.zIndex.drawer + 1,
          backgroundColor: theme.palette.primary.main,
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
        }}
      >
        <Toolbar>
          {/* <IconButton
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
          </IconButton> */}
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

      {/* <Sidebar
        open={isSidebarOpen}
        onToggle={handleSidebarToggle}
        mobileOpen={mobileOpen}
        onMobileToggle={handleDrawerToggle}
      /> */}

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: '100%',
          ml: 0,
          mt: '64px',
          backgroundColor: theme.palette.background.default,
          minHeight: 'calc(100vh - 64px)',
        }}
      >
        <Container maxWidth="lg" sx={{ mt: 2, mb: 4 }}>
          <Routes>
            <Route
              path="/"
              element={
                <Box sx={{ textAlign: 'center', mt: 8 }}>
                  <Typography variant="h4" gutterBottom>
                    {/* Welcome to the platform */}
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    {/* Select a tool from the sidebar to get started. */}
                  </Typography>
                </Box>
              }
            />
            <Route
              path="/verify-immigration-document"
              element={
                <Paper
                  sx={{
                    p: 3,
                    borderRadius: 2,
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                  }}
                >
                  <DocumentVerifier apiEndpoint={documentVerifierApiEndpoint} />
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
            <Route 
              path="/convert-candidate-resume/"
              element={
                <Paper
                  sx={{
                    p: 3,
                    borderRadius: 2,
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                  }}
                >
                  <CandidateResumeConverter apiEndpoint={candidateResumeConverterApiEndpoint} />
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
