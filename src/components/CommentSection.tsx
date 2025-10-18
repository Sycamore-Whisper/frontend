import React, { useState, useEffect, useRef } from 'react';
import { 
  makeStyles, 
  Button, 
  Input, 
  Text, 
  tokens, 
  Card, 
  Tooltip,
  Divider
} from '@fluentui/react-components';
import { Dismiss24Regular, ArrowReply24Regular } from '@fluentui/react-icons';
import { getComments, postComment } from '../api';
import type { Comment as CommentType } from '../api';
import { toast, Toaster } from 'react-hot-toast';

const useStyles = makeStyles({
  container: {
    padding: tokens.spacingVerticalM,
    width: '100%',
  },
  commentInput: {
    marginBottom: tokens.spacingVerticalS,
    width: '100%',
    height: '40px',
    fontSize: '16px',
  },
  commentButton: {
    marginBottom: tokens.spacingVerticalM,
  },
  commentList: {
    marginTop: tokens.spacingVerticalM,
  },
  commentCard: {
    marginBottom: tokens.spacingVerticalS,
    padding: tokens.spacingHorizontalM,
    width: '100%',
  },
  childComment: {
    marginLeft: tokens.spacingHorizontalL,
    borderLeft: `2px solid ${tokens.colorNeutralStroke1}`,
    paddingLeft: tokens.spacingHorizontalM,
  },
  commentHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: tokens.spacingVerticalXS,
  },
  nickname: {
    fontWeight: 'bold',
  },
  commentFooter: {
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: tokens.spacingVerticalXS,
  },
  replyButton: {
    cursor: 'pointer',
    color: tokens.colorBrandForeground1,
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalXS,
  },
  replyInfo: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: tokens.spacingVerticalXS,
  },
  cancelReply: {
    marginLeft: tokens.spacingHorizontalS,
    cursor: 'pointer',
  },
  inputContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
  },
  nicknameInput: {
    width: '100%',
    height: '40px',
    fontSize: '16px',
  },
});

interface CommentSectionProps {
  postId: number;
}

const CommentSection: React.FC<CommentSectionProps> = ({ postId }) => {
  const styles = useStyles();
  const [comments, setComments] = useState<CommentType[]>([]);
  const [content, setContent] = useState('');
  const [nickname, setNickname] = useState('');
  const [replyTo, setReplyTo] = useState<CommentType | null>(null);
  const [loading, setLoading] = useState(false);
  const commentCardRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  useEffect(() => {
    fetchComments();
  }, [postId]);

  const fetchComments = async () => {
    try {
      setLoading(true);
      const data = await getComments(postId);
      setComments(data as CommentType[]);
    } catch (error) {
      toast.error('获取评论失败');
      console.error('Error fetching comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!content.trim() || !nickname.trim()) {
      toast.error('评论内容和昵称不能为空');
      return;
    }

    try {
      setLoading(true);
      await postComment({
        submission_id: postId,
        nickname,
        content,
        parent_comment_id: replyTo ? replyTo.id : 0,
      });
      toast.success('评论成功');
      setContent('');
      if (replyTo) setReplyTo(null);
      fetchComments();
    } catch (error: any) {
      toast.error('评论失败');
      console.error('Error posting comment:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReply = (comment: CommentType) => {
    setReplyTo(comment);
  };

  const cancelReply = () => {
    setReplyTo(null);
  };

  const renderComments = (parentId: number = 0, level: number = 0) => {
    return comments
      .filter(comment => comment.parent_comment_id === parentId)
      .map(comment => (
        <div 
          key={comment.id} 
          className={level > 0 ? styles.childComment : ''}
          ref={el => {
            if (el) commentCardRefs.current.set(comment.id, el);
          }}
        >
          <Card className={styles.commentCard}>
            <div className={styles.commentHeader}>
              <Text className={styles.nickname}>{comment.nickname}</Text>
            </div>
            <Text>{comment.content}</Text>
            <div className={styles.commentFooter}>
              <Tooltip content="回复" relationship="label">
                <div 
                  className={styles.replyButton}
                  onClick={() => handleReply(comment)}
                >
                  <ArrowReply24Regular />
                  <Text size={200}>回复</Text>
                </div>
              </Tooltip>
            </div>
          </Card>
          {renderComments(comment.id, level + 1)}
        </div>
      ));
  };

  return (
    <div className={styles.container}>
      <div className={styles.inputContainer}>
        <Input
          className={styles.nicknameInput}
          placeholder="输入昵称"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
        />
        
        {replyTo && (
          <div className={styles.replyInfo}>
            <Text>回复：{replyTo.nickname}</Text>
            <Dismiss24Regular 
              className={styles.cancelReply} 
              onClick={cancelReply}
            />
          </div>
        )}
        
        <Input
          className={styles.commentInput}
          placeholder="输入评论"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        
        <Button 
          className={styles.commentButton}
          appearance="primary"
          onClick={handleSubmitComment}
          disabled={loading || !content.trim() || !nickname.trim()}
        >
          发布评论
        </Button>
      </div>
      
      <Divider />
      
      <div className={styles.commentList}>
        {loading && <Text>加载评论中...</Text>}
        {!loading && comments.length === 0 && <Text>暂无评论</Text>}
        {renderComments()}
      </div>
      <Toaster position="top-center" />
    </div>
  );
};

export default CommentSection;