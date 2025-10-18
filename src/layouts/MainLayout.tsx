import { makeStyles, tokens, shorthands } from '@fluentui/react-components';
import { Outlet } from 'react-router-dom';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Footer from './components/Footer';
import StatusDisplay from '../components/StatusDisplay';
import { useEffect, useState } from 'react';

const useStyles = makeStyles({
  root: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: tokens.colorNeutralBackground2,
    overflow: 'hidden',
    height: '100vh',
  },
  container: {
    display: 'flex',
    flex: '1 1 auto',
    overflow: 'hidden',
    height: 'calc(100vh - 64px)',
    position: 'relative',
  },
  sidebar: {
    width: '240px',
    flexShrink: 0,
    borderRight: `1px solid ${tokens.colorNeutralStroke1}`,
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: tokens.colorNeutralBackground1,
    '@media (max-width: 768px)': {
      display: 'none',
    },
  },
  content: {
    flex: '1 1 auto',
    padding: '20px',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    height: '100%',
    width: '100%',
    minHeight: 0,
  },
  rightPanel: {
    width: '240px',
    flexShrink: 0,
    borderLeft: `1px solid ${tokens.colorNeutralStroke1}`,
    padding: '20px',
    '@media (max-width: 768px)': {
      display: 'none',
    },
  },
  mobileOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    backdropFilter: 'blur(2px)',
    display: 'flex',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    zIndex: 10,
    '@media (min-width: 769px)': {
      display: 'none',
    },
  },
  mobileSidebarPanel: {
    width: 'min(90vw, 320px)',
    backgroundColor: tokens.colorNeutralBackground1,
    boxShadow: tokens.shadow28,
    ...shorthands.borderRadius(tokens.borderRadiusLarge),
    ...shorthands.padding(tokens.spacingVerticalM, tokens.spacingHorizontalM),
  },
});

interface MainLayoutProps {
  isDarkMode: boolean;
  onToggleTheme: () => void;
}

export const MainLayout = ({ isDarkMode, onToggleTheme }: MainLayoutProps) => {
  const styles = useStyles();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    console.log("QwQ！感谢你使用Scyamore_Whisper项目~");
  }, []);

  return (
    <div className={styles.root}>
      <Header isDarkMode={isDarkMode} onToggleTheme={onToggleTheme} onToggleSidebar={() => setMobileSidebarOpen((o) => !o)} />
      <div className={styles.container}>
        <div className={styles.sidebar}>
          <Sidebar />
        </div>
        <main className={styles.content}>
          <Outlet />
        </main>
        <div className={styles.rightPanel}>
          <StatusDisplay />
        </div>
        {mobileSidebarOpen && (
          <div className={styles.mobileOverlay} onClick={() => setMobileSidebarOpen(false)}>
            <div className={styles.mobileSidebarPanel} onClick={(e) => e.stopPropagation()}>
              <Sidebar />
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default MainLayout;