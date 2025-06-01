import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Drawer, 
  List, 
  ListItem, 
  ListItemButton, 
  ListItemIcon, 
  ListItemText, 
  styled,
  Toolbar,
  Divider,
  IconButton,
  Typography,
  useTheme,
  useMediaQuery,
  Box
} from '@mui/material';
import DescriptionIcon from '@mui/icons-material/Description';
import WorkIcon from '@mui/icons-material/Work';
import EditNoteIcon from '@mui/icons-material/EditNote';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';

const drawerWidth = 240;

const StyledDrawer = styled(Drawer, { 
  shouldForwardProp: (prop) => prop !== 'open' 
})<{ open: boolean }>(({ theme, open }) => ({
  width: drawerWidth,
  flexShrink: 0,
  whiteSpace: 'nowrap',
  boxSizing: 'border-box',
  '& .MuiDrawer-paper': {
    width: drawerWidth,
    transition: theme.transitions.create('width', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
    boxSizing: 'border-box',
    ...(!open && {
      overflowX: 'hidden',
      transition: theme.transitions.create('width', {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.leavingScreen,
      }),
      width: theme.spacing(7) + 1,
      [theme.breakpoints.up('sm')]: {
        width: theme.spacing(9) + 1,
      },
    }),
  },
}));

interface SidebarProps {
  open: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onMobileToggle: () => void;
}

const menuItems = [
  { text: 'Immigration Document Verifier', icon: <DescriptionIcon />, path: '/' },
  { text: 'Hiring Extractor', icon: <WorkIcon />, path: '/hiring-extractor' },
  { text: 'Convert Candidate Resume', icon: <EditNoteIcon />, path: '/convert-candidate-resume/' },
];

const Sidebar: React.FC<SidebarProps> = ({ 
  open, 
  onToggle, 
  mobileOpen,
  onMobileToggle 
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [isClosing, setIsClosing] = useState(false);

  const handleDrawerClose = () => {
    setIsClosing(true);
    if (isMobile) {
      onMobileToggle();
    } else {
      onToggle();
    }
    // Reset the closing state after the transition
    setTimeout(() => setIsClosing(false), 200);
  };

  // Close mobile drawer when a menu item is selected
  const handleListItemClick = (path: string) => {
    navigate(path);
    if (isMobile) {
      onMobileToggle();
    }
  };

  // Prevent hydration issues by rendering nothing on the server
  if (typeof window === 'undefined') {
    return null;
  }

  return (
    <Box>
      {/* Mobile Drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerClose}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile
        }}
        sx={{
          display: { xs: 'block', sm: 'none' },
          '& .MuiDrawer-paper': { 
            boxSizing: 'border-box',
            width: drawerWidth,
          },
        }}
      >
        <Toolbar sx={{ justifyContent: 'flex-end', minHeight: '64px !important' }}>
          <IconButton onClick={handleDrawerClose}>
            <ChevronLeftIcon />
          </IconButton>
        </Toolbar>
        <Divider />
        <List>
          {menuItems.map((item) => (
            <ListItem 
              key={item.path} 
              disablePadding
              onClick={() => handleListItemClick(item.path)}
              sx={{
                backgroundColor: location.pathname === item.path ? 'action.selected' : 'transparent',
                '&:hover': {
                  backgroundColor: 'action.hover',
                },
              }}
            >
              <ListItemButton>
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Drawer>

      {/* Desktop Drawer */}
      <StyledDrawer 
        variant="permanent" 
        open={open}
        sx={{
          display: { xs: 'none', sm: 'block' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: open ? drawerWidth : `calc(${theme.spacing(7)} + 1px)`,
          },
        }}
      >
        <Toolbar 
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'flex-end',
            px: [1],
            minHeight: '64px !important',
          }}
        >
          <Typography 
            variant="h6" 
            noWrap 
            component="div"
            sx={{
              flexGrow: 1,
              textAlign: 'center',
              fontSize: '1.1rem',
              fontWeight: 600,
              display: open ? 'block' : 'none',
            }}
          >
            Menu
          </Typography>
          {open && (
            <IconButton onClick={handleDrawerClose}>
              <ChevronLeftIcon />
            </IconButton>
          )}
        </Toolbar>
        <Divider />
        <List>
          {menuItems.map((item) => (
            <ListItem 
              key={item.path} 
              disablePadding 
              sx={{ 
                display: 'block',
                backgroundColor: location.pathname === item.path ? 'action.selected' : 'transparent',
                '&:hover': {
                  backgroundColor: 'action.hover',
                },
              }}
              onClick={() => handleListItemClick(item.path)}
            >
              <ListItemButton>
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} sx={{ opacity: open ? 1 : 0 }} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </StyledDrawer>
    </Box>
  );
};

export default Sidebar;
