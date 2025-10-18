import React from 'react';
import { useNavigate } from 'react-router-dom';
import { makeStyles, tokens, Card, CardHeader, CardPreview, Text, Button, Title1, Subtitle1 } from '@fluentui/react-components';
import { ArrowLeft24Regular, Home24Regular } from '@fluentui/react-icons';

const useStyles = makeStyles({
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tokens.colorNeutralBackground3,
    padding: tokens.spacingHorizontalXL,
  },
  card: {
    width: 'min(720px, 92vw)',
    borderRadius: tokens.borderRadiusLarge,
    overflow: 'hidden',
    boxShadow: tokens.shadow8,
  },
  header: {
    paddingLeft: tokens.spacingHorizontalXL,
    paddingRight: tokens.spacingHorizontalXL,
    paddingTop: tokens.spacingVerticalM,
    paddingBottom: tokens.spacingVerticalM,
  },
  preview: {
    height: '140px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: `linear-gradient(135deg, ${tokens.colorBrandBackground} 0%, ${tokens.colorBrandBackground2} 50%, ${tokens.colorPaletteBlueBackground2} 100%)`,
    color: tokens.colorNeutralForegroundOnBrand,
  },
  content: {
    paddingLeft: tokens.spacingHorizontalXL,
    paddingRight: tokens.spacingHorizontalXL,
    paddingTop: tokens.spacingVerticalL,
    paddingBottom: tokens.spacingVerticalL,
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
  },
  actions: {
    display: 'flex',
    gap: tokens.spacingHorizontalM,
    marginTop: tokens.spacingVerticalL,
  },
});

const NotFound: React.FC = () => {
  const styles = useStyles();
  const navigate = useNavigate();

  return (
    <div className={styles.page}>
      <Card className={styles.card}>
        <CardHeader className={styles.header} header={<Title1 style={{ margin: 0 }}>😕 404 页面未找到</Title1>} />
        <CardPreview>
          <div className={styles.preview} />
        </CardPreview>
        <div className={styles.content}>
          <Subtitle1>抱歉，你访问的页面不存在或已被移动。</Subtitle1>
          <Text>请检查链接是否正确，或使用下方按钮返回继续浏览。</Text>
          <div className={styles.actions}>
            <Button appearance="primary" icon={<ArrowLeft24Regular />} onClick={() => navigate(-1)}>
              返回上一页
            </Button>
            <Button appearance="secondary" icon={<Home24Regular />} onClick={() => navigate('/') }>
              返回首页
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default NotFound;