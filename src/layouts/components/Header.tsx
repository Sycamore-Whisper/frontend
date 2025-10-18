import { makeStyles, Text, tokens, Button } from '@fluentui/react-components';
import { WeatherSunny24Regular, WeatherMoon24Regular } from '@fluentui/react-icons';

import icon from '/icon.png';
import { SITE_TITLE } from '../../config';

const useStyles = makeStyles({
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: '30px',
    backgroundColor: tokens.colorNeutralBackground1,
    boxShadow: tokens.shadow4,
    padding: tokens.spacingHorizontalL,
  },
  title: {
    marginLeft: tokens.spacingHorizontalM,
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
  },
  icon: {
    height: '32px',
    width: '32px',
  },
  themeToggle: {
    cursor: 'pointer',
  },
  mobileMenuButton: {
    display: 'none',
    '@media (max-width: 768px)': {
      display: 'inline-flex',
    },
  },
});

interface HeaderProps {
  isDarkMode: boolean;
  onToggleTheme: () => void;
  onToggleSidebar?: () => void;
}

const Header = ({ isDarkMode, onToggleTheme, onToggleSidebar }: HeaderProps) => {
  const styles = useStyles();

  return (
    <header className={styles.header}>
      <Text size={500} weight="semibold" className={styles.title}>
        <img src={icon} alt="logo" className={styles.icon} />
         {SITE_TITLE}
      </Text>
      <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalS }}>
        <Button 
          appearance="transparent"
          onClick={onToggleSidebar}
          className={styles.mobileMenuButton}
        >菜单</Button>
        <Button 
          appearance="transparent" 
          icon={isDarkMode ? <WeatherSunny24Regular /> : <WeatherMoon24Regular />}
          onClick={onToggleTheme}
          className={styles.themeToggle}
        />
      </div>
    </header>
  );
};

export default Header;