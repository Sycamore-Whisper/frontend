import React from 'react';
import { makeStyles, Button, tokens, Text } from '@fluentui/react-components';
import { Dismiss24Regular } from '@fluentui/react-icons';
import MdEditor from 'react-markdown-editor-lite';
import 'react-markdown-editor-lite/lib/index.css';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkIns from 'remark-ins';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { uploadImage } from '../api';
import { modifyPost } from '../admin_api';

interface AdminModifyPostProps {
  postId: number;
  initialContent?: string;
  onClose: () => void;
  onSubmitSuccess?: (newContent: string) => void;
}

const useStyles = makeStyles({
  modalContent: {
    backgroundColor: tokens.colorNeutralBackground1,
    padding: tokens.spacingHorizontalXXL,
    borderRadius: tokens.borderRadiusXLarge,
    boxShadow: tokens.shadow64,
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
    width: '800px',
    maxWidth: '90vw',
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: tokens.spacingVerticalS,
    right: tokens.spacingHorizontalS,
  },
  titleRow: {
    display: 'flex',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: tokens.spacingHorizontalS,
  },
  title: {
    fontSize: tokens.fontSizeBase500,
    fontWeight: tokens.fontWeightSemibold,
  },
  editor: {
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    borderRadius: tokens.borderRadiusMedium,
    overflow: 'hidden',
  },
  buttonGroup: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: tokens.spacingHorizontalM,
  },
});

const AdminModifyPost: React.FC<AdminModifyPostProps> = ({ postId, initialContent = '', onClose, onSubmitSuccess }) => {
  const styles = useStyles();
  const [content, setContent] = React.useState<string>(initialContent);
  const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false);

  const handleImageUpload = async (file: File): Promise<string> => {
    if (!['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'].includes(file.type)) {
      toast.error('仅支持 .png, .jpg, .jpeg, .gif, .webp 格式的图片');
      return '';
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('图片大小不能超过 10MB');
      return '';
    }
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await uploadImage(formData);
      if (response.status === 'OK' && response.url) {
        return response.url;
      } else {
        toast.error('图片上传失败');
        return '';
      }
    } catch (error) {
      toast.error('图片上传出错');
      console.error(error);
      return '';
    }
  };

  const handleEditorChange = ({ text }: { text: string }) => {
    setContent(text);
  };

  const handleSubmit = async () => {
    const text = content.trim();
    if (!text) {
      toast.error('文章内容不能为空');
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await modifyPost(postId, text);
      if (response.status === 'OK') {
        toast.success(`修改成功！帖子 #${postId}`);
        onSubmitSuccess?.(text);
        onClose();
      } else {
        toast.error('修改失败');
      }
    } catch (error: any) {
      console.error(error);
      const msg = String(error?.message || '修改失败，请稍后重试');
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
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
      <div className={styles.titleRow}>
        <h2 className={styles.title}>修改帖子</h2>
        <Text size={200} color="subtle">帖子 #{postId}</Text>
      </div>
      <div className={styles.editor}>
        <MdEditor
          value={content}
          style={{ height: '500px' }}
          renderHTML={(text) => <ReactMarkdown remarkPlugins={[remarkGfm, remarkIns]}>{text}</ReactMarkdown>}
          onChange={handleEditorChange}
          onImageUpload={handleImageUpload}
        />
      </div>
      <div className={styles.buttonGroup}>
        <Button appearance="secondary" onClick={onClose} disabled={isSubmitting}>取消</Button>
        <Button appearance="primary" onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? '提交中...' : '提交修改'}
        </Button>
      </div>
    </div>
  );
};

export default AdminModifyPost;