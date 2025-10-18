import {
  makeStyles,
  Card,
  CardFooter,
  Button,
  tokens,
} from '@fluentui/react-components';
import React from 'react';
import { voteArticle } from '../api';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkIns from 'remark-ins';
import {
  ArrowUp24Regular,
  ArrowDown24Regular,
  Comment24Regular,
  Warning24Regular,
} from '@fluentui/react-icons';
import ReportPost from './ReportPost';
import CommentSection from './CommentSection';

const useStyles = makeStyles({
  card: {
    width: '100%',
    maxWidth: '800px',
    padding: tokens.spacingVerticalL,
    marginBottom: tokens.spacingVerticalL,
  },
  content: {
    paddingTop: tokens.spacingVerticalS,
    paddingBottom: tokens.spacingVerticalS,
    
    // Markdown样式优化
    '& h1, & h2, & h3, & h4, & h5, & h6': {
      marginTop: '1em',
      marginBottom: '0.5em',
      fontWeight: 'bold',
    },
    '& p': {
      marginTop: '0.5em',
      marginBottom: '0.5em',
      lineHeight: '1.6',
    },
    '& ul, & ol': {
      marginTop: '0.5em',
      marginBottom: '0.5em',
      paddingLeft: '2em',
    },
    '& li': {
      marginTop: '0.25em',
      marginBottom: '0.25em',
    },
    '& blockquote': {
      margin: '1em 0',
      paddingLeft: '1em',
      borderLeft: `3px solid ${tokens.colorNeutralStroke1}`,
      color: tokens.colorNeutralForeground2,
    },
    '& code': {
      backgroundColor: tokens.colorNeutralBackground1,
      padding: '2px 4px',
      borderRadius: '3px',
      fontFamily: 'monospace',
    },
    '& pre': {
      backgroundColor: tokens.colorNeutralBackground1,
      padding: '1em',
      borderRadius: '5px',
      overflowX: 'auto',
      marginTop: '1em',
      marginBottom: '1em',
    },
    '& table': {
      borderCollapse: 'collapse',
      width: '100%',
      marginTop: '1em',
      marginBottom: '1em',
    },
    '& th, & td': {
      border: `1px solid ${tokens.colorNeutralStroke1}`,
      padding: '8px',
      textAlign: 'left',
    },
    '& th': {
      backgroundColor: tokens.colorNeutralBackground1,
      fontWeight: 'bold',
    },
    '& ins': {
      textDecoration: 'underline',
      backgroundColor: 'transparent',
    },
  },
  actions: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
    alignItems: 'center',
    justifyItems: 'center',
    gap: '0 8px',
  },
  expandButton: {
    display: 'flex',
    justifyContent: 'flex-end',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    backdropFilter: 'blur(5px)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  commentSection: {
    marginTop: tokens.spacingVerticalM,
    borderTop: `1px solid ${tokens.colorNeutralStroke1}`,
    paddingTop: tokens.spacingVerticalM,
  },
});

interface PostCardProps {
  id: number;
  content: string;
  upvotes: number;
  downvotes: number;
}

const PostCard = ({
  id,
  content,
  upvotes,
  downvotes
}: PostCardProps) => {
  const styles = useStyles();
  const markdownContent = content;
  
  React.useEffect(() => {
    setVotes({ upvotes, downvotes });
  }, [upvotes, downvotes]);
  const [votes, setVotes] = React.useState({ upvotes, downvotes });
  const [hasVoted, setHasVoted] = React.useState(false);
  const [showReportModal, setShowReportModal] = React.useState(false);
  const [showComments, setShowComments] = React.useState(false);

  return (
    <Card className={styles.card}>
      <div className={styles.content}>
        <div style={{ whiteSpace: 'pre-wrap' }}>
          <ReactMarkdown remarkPlugins={[remarkGfm, remarkIns]}>{markdownContent}</ReactMarkdown>
        </div>
      </div>
      <CardFooter>
        <div className={styles.actions}>
          <Button 
            icon={<ArrowUp24Regular />} 
            appearance="transparent"
            onClick={async () => {
              if (hasVoted) {
                toast.info('你已经点过一次了哦~');
                return;
              }
              try {
                await voteArticle(id, 'up');
                setVotes(prev => ({ ...prev, upvotes: prev.upvotes + 1 }));
                setHasVoted(true);
              } catch (error) {
                console.error('Failed to upvote:', error);
                toast.error('投票失败，请稍后重试');
              }
            }}
          >
            {votes.upvotes}
          </Button>
          <Button 
            icon={<ArrowDown24Regular />} 
            appearance="transparent"
            onClick={async () => {
              if (hasVoted) {
                toast.info('你已经点过一次了哦~');
                return;
              }
              try {
                await voteArticle(id, 'down');
                setVotes(prev => ({ ...prev, downvotes: prev.downvotes + 1 }));
                setHasVoted(true);
              } catch (error) {
                console.error('Failed to downvote:', error);
                toast.error('投票失败，请稍后重试');
              }
            }}
          >
            {votes.downvotes}
          </Button>
          <Button 
            icon={<Comment24Regular />} 
            appearance='transparent'
            onClick={() => setShowComments(!showComments)}
          />
          <Button 
            icon={<Warning24Regular />} 
            appearance="transparent"
            onClick={() => setShowReportModal(true)}
          />
        </div>
      </CardFooter>
      
      {showComments && (
        <div className={styles.commentSection}>
          <CommentSection postId={id} />
        </div>
      )}
      
      {showReportModal && (
        <div className={styles.modalOverlay}>
          <ReportPost postId={id} onClose={() => setShowReportModal(false)} />
        </div>
      )}
    </Card>
  );
};

export default PostCard;