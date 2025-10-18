import { makeStyles, tokens } from '@fluentui/react-components';
import { Home24Regular, Add24Regular, History24Regular, Info24Regular, DocumentSearch24Regular, PeopleSearch24Regular, ChevronDown24Regular, ChevronRight24Regular } from '@fluentui/react-icons';
import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const useStyles = makeStyles({
  sidebar: {
    padding: tokens.spacingVerticalM,
  },
  menuItem: {
    display: 'flex',
    alignItems: 'center',
    padding: tokens.spacingVerticalS + ' ' + tokens.spacingHorizontalM,
    color: tokens.colorNeutralForeground1,
    textDecoration: 'none',
    borderRadius: tokens.borderRadiusMedium,
    gap: tokens.spacingHorizontalS,
    
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground1Hover,
    },
  },
  activeMenuItem: {
    backgroundColor: tokens.colorNeutralBackground1Selected,
    color: tokens.colorBrandForeground1,
    
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground1Selected,
    },
  },
});

const menuItems = [
  { path: '/', icon: Home24Regular, label: '主页' },
  { path: '/create', icon: Add24Regular, label: '发布新帖' },
  { 
    path: '/progress', 
    icon: History24Regular, 
    label: '进度查询',
    subItems: [
      { path: '/progress/review', icon: DocumentSearch24Regular, label: '投稿审核' },
      { path: '/progress/complaint', icon: PeopleSearch24Regular, label: '投诉受理' }
    ]
  },
  { path: '/about', icon: Info24Regular, label: '关于' },
];

const Sidebar = () => {
  const [expandedItems, setExpandedItems] = React.useState<Record<string, boolean>>({});
  const styles = useStyles();
  const location = useLocation();

  return (
    <nav className={styles.sidebar}>
      {menuItems.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.path || 
                         (item.subItems && item.subItems.some(subItem => location.pathname === subItem.path));
        const isExpanded = expandedItems[item.path];
        
        return (
          <div key={item.path}>
            {item.subItems ? (
              <div 
                className={`${styles.menuItem} ${isActive ? styles.activeMenuItem : ''}`}
                onClick={() => setExpandedItems(prev => ({
                  ...prev,
                  [item.path]: !prev[item.path]
                }))}
                style={{ cursor: 'pointer' }}
              >
                <Icon />
                 {item.label}
                 {item.subItems && (
                   isExpanded ? 
                     <ChevronDown24Regular style={{ marginLeft: 'auto' }} /> : 
                     <ChevronRight24Regular style={{ marginLeft: 'auto' }} />
                 )}
               </div>
             ) : (
               <Link
                 to={item.path}
                 className={`${styles.menuItem} ${isActive ? styles.activeMenuItem : ''}`}
               >
                 <Icon />
                 {item.label}
               </Link>
             )}
             {item.subItems && isExpanded && (
              <div style={{ marginLeft: tokens.spacingHorizontalL }}>
                {item.subItems.map((subItem) => {
                  const SubIcon = subItem.icon;
                  const isSubActive = location.pathname === subItem.path;
                  return (
                    <Link
                      key={subItem.path}
                      to={subItem.path}
                      className={`${styles.menuItem} ${isSubActive ? styles.activeMenuItem : ''}`}
                      style={{ paddingLeft: tokens.spacingHorizontalXXL }}
                    >
                      <SubIcon />
                      {subItem.label}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
};

export default Sidebar;