import { makeStyles, Button, Input, Textarea, tokens } from '@fluentui/react-components';
import { Dismiss24Regular } from '@fluentui/react-icons';
import React from 'react';
import { reportPost } from '../api';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const useStyles = makeStyles({
  modalContent: {
    backgroundColor: tokens.colorNeutralBackground1,
    padding: tokens.spacingHorizontalXXL,
    borderRadius: tokens.borderRadiusXLarge,
    boxShadow: tokens.shadow64,
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
    width: '400px',
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: tokens.spacingVerticalS,
    right: tokens.spacingHorizontalS,
  },
  title: {
    fontSize: tokens.fontSizeBase500,
    fontWeight: tokens.fontWeightSemibold,
    marginBottom: tokens.spacingVerticalS,
  },
});

interface ReportPostProps {
  onClose: () => void;
  postId: number;
}

const ReportPost: React.FC<ReportPostProps> = ({ onClose, postId }) => {
  const styles = useStyles();
  const [title, setTitle] = React.useState('');
  const [content, setContent] = React.useState('');

  const handleSubmit = async () => {
    try {
      const response = await reportPost({ id: postId, title, content });
      toast.success(`投诉成功！id=${response.id}`);
      onClose();
    } catch (error) {
      console.error('Failed to report post:', error);
      if (error instanceof Error) {
        toast.error(`投诉失败：${error.message}`);
      } else {
        toast.error('投诉失败，请稍后重试');
      }
    }
  };

  return (
    <div className={styles.modalContent}>
      <Button
        icon={<Dismiss24Regular />}
        appearance="transparent"
        className={styles.closeButton}
        onClick={onClose}
      />
      <h2 className={styles.title}>投诉帖子</h2>
      <Input
        placeholder="简述投诉类型"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <Textarea
        placeholder="投诉具体内容"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={5}
      />
      <Button appearance="primary" onClick={handleSubmit}>
        提交
      </Button>
    </div>
  );
};

export default ReportPost;