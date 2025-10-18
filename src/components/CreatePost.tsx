import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkIns from 'remark-ins';
import MdEditor from 'react-markdown-editor-lite';
import 'react-markdown-editor-lite/lib/index.css';
import { uploadImage, submitPost } from '../api';
import { Button, makeStyles, tokens } from '@fluentui/react-components';

interface CreatePostProps {
  onSubmitSuccess?: () => void;
}

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
    padding: tokens.spacingHorizontalL,
    maxWidth: '800px',
    margin: '0 auto',
  },
  editor: {
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    borderRadius: tokens.borderRadiusMedium,
    overflow: 'hidden',
  },
  buttonGroup: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: tokens.spacingHorizontalM,
  },
});

const CreatePost: React.FC<CreatePostProps> = ({ onSubmitSuccess }) => {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const styles = useStyles();

  useEffect(() => {
    const savedDraft = localStorage.getItem('draft');
    if (savedDraft) {
      setContent(savedDraft);
      toast.success('读取草稿成功！');
    }
  }, []);

  const handleSaveDraft = () => {
    localStorage.setItem('draft', content);
    toast.success('保存成功！');
  };

  const handleImageUpload = async (file: File): Promise<string> => {

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await uploadImage(formData);
      if (response.status === 'OK' && response.url) {
        return response.url;
      } else {
        toast.error('图片上传失败，文件大小过大或格式不正确！');
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
    if (!content.trim()) {
      toast.error('文章内容不能为空');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await submitPost({ content });
      if (response.status === 'Pass') {
        toast.success(`提交成功！id=${response.id}${response.message ? `, ${response.message}` : ''}`);
        localStorage.removeItem('draft');
        onSubmitSuccess?.();
      } else if (response.status === 'Pending') {
        toast.info(`等待审核！id=${response.id}${response.message ? `, ${response.message}` : ''}`);
        localStorage.removeItem('draft');
        onSubmitSuccess?.();
      } else if (response.status === 'Deny') {
        toast.error(response.message || '投稿中包含违禁词');
      }
    } catch (error) {
      toast.error('投稿提交失败，请稍后重试');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.container}>
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
        <Button appearance="primary" onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? '提交中...' : '提交'}
        </Button>
        <Button appearance="secondary" onClick={handleSaveDraft}>
          保存草稿
        </Button>
      </div>
    </div>
  );
};

export default CreatePost;