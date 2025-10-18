import React, { useState, useEffect } from 'react';
import {
  makeStyles,
  tokens,
  Card,
  CardHeader,
  CardPreview,
  Text,
  Spinner,
  Badge,
} from '@fluentui/react-components';
import { CheckmarkCircle20Filled, DismissCircle20Filled } from '@fluentui/react-icons';
import API_CONFIG from '../config';
import { useNavigate, useLocation } from 'react-router-dom';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
  },
  card: {
    width: '100%',
  },
  statusText: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
  },
  online: {
    color: tokens.colorStatusSuccessForeground1,
  },
  offline: {
    color: tokens.colorStatusDangerForeground1,
  },
});

interface StaticsData {
  posts: number;
  comments: number;
  images: number;
}

const StatusDisplay: React.FC = () => {
  const styles = useStyles();
  const [isApiOnline, setIsApiOnline] = useState<boolean | null>(null);
  const [statics, setStatics] = useState<StaticsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        // Check API online status
        const teapotResponse = await fetch(`${API_CONFIG.BASE_URL}/test`);
        if (teapotResponse.status === 200) {
          setIsApiOnline(true);
        } else if (teapotResponse.status === 503) {
          setIsApiOnline(false);
          if (location.pathname !== '/init') {
            navigate('/init');
          }
        } else {
          setIsApiOnline(false);
        }

        // Fetch statics data
        const staticsResponse = await fetch(`${API_CONFIG.BASE_URL}/get/statics`);
        if (staticsResponse.status === 503) {
          if (location.pathname !== '/init') {
            navigate('/init');
          }
          setStatics(null);
        } else if (staticsResponse.ok) {
          const data: StaticsData = await staticsResponse.json();
          setStatics(data);
        } else {
          setStatics(null);
        }
      } catch (error) {
        console.error('Error fetching API status or statics:', error);
        setIsApiOnline(false);
        setStatics(null);
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [navigate, location.pathname]);

  return (
    <div className={styles.container}>
      <Card className={styles.card}>
        <CardHeader
          header={
            <Text weight="semibold">系统状态</Text>
          }
        />
        <CardPreview>
          {loading ? (
            <Spinner size="tiny" label="加载中..." />
          ) : (
            <div style={{ padding: tokens.spacingHorizontalL }}>
              <div className={styles.statusText}>
                {isApiOnline ? (
                  <>
                    <CheckmarkCircle20Filled className={styles.online} />
                    <Text className={styles.online}>在线</Text>
                  </>
                ) : (
                  <>
                    <DismissCircle20Filled className={styles.offline} />
                    <Text className={styles.offline}>离线</Text>
                  </>
                )}
              </div>
            </div>
          )}
        </CardPreview>
      </Card>

      <Card className={styles.card}>
        <CardHeader
          header={
            <Text weight="semibold">统计数据</Text>
          }
        />
        <CardPreview>
          {loading ? (
            <Spinner size="tiny" label="加载中..." />
          ) : statics ? (
            <div style={{ padding: tokens.spacingHorizontalL }}>
              <Text>投稿数量: <Badge appearance="outline">{statics.posts}</Badge></Text><br />
              <Text>评论数量: <Badge appearance="outline">{statics.comments}</Badge></Text><br />
              <Text>图片数量: <Badge appearance="outline">{statics.images}</Badge></Text>
            </div>
          ) : (
            <div style={{ padding: tokens.spacingHorizontalL }}>
              <Text>无法获取统计数据。</Text>
            </div>
          )}
        </CardPreview>
      </Card>
    </div>
  );
};

export default StatusDisplay;