import { API_CONFIG } from './config';
import { toast } from 'react-hot-toast';

export interface Article {
  id: number;
  content: string;
  upvotes: number;
  downvotes: number;
}

export const fetchArticles = async (page: number, signal?: AbortSignal): Promise<Article[]> => {
  try {
    const response = await fetch(`${API_CONFIG.BASE_URL}/get/10_info?page=${page}`, { signal });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    if (error instanceof Error && error.name !== 'AbortError') {
      console.error('Error fetching articles:', error);
    }
    throw error;
  }
};

export const voteArticle = async (
  id: number, 
  type: 'up' | 'down'
): Promise<void> => {
  try {
    const response = await fetch(`${API_CONFIG.BASE_URL}/${type}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id }),
    });

    const data = await response.json();
    if (data.status !== 'OK') {
      throw new Error(`Vote ${type} failed`);
    }
  } catch (error) {
    toast.error(`点赞${type === 'up' ? '赞' : '踩'}失败`);
    throw error;
  }
};

interface SubmitPostResponse {
  id: string;
  status: "Pass" | "Pending" | "Deny";
  message?: string;
}

export const submitPost = async (postData: { content: string }): Promise<SubmitPostResponse> => {
  try {
    const response = await fetch(`${API_CONFIG.BASE_URL}/post`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content: postData.content }),
    });

    if (response.status === 403) {
      return { status: 'Deny', message: '投稿中包含违禁词', id: 'null'};
    }

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json() as SubmitPostResponse;
  } catch (error) {
    console.error('Error submitting post:', error);
    throw error;
  }
};

export const uploadImage = async (formData: FormData): Promise<{ status: 'OK' | 'Error'; url?: string; message?: string }> => {
  try {
    const response = await fetch(`${API_CONFIG.BASE_URL}/upload_pic`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    if (result.url) {
      result.url = `${API_CONFIG.BASE_URL}${result.url}`;
    }

    return result;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
};

interface ReportPostResponse {
  id: number;
  status: string;
}

export const reportPost = async (reportData: { id: number; title: string; content: string }): Promise<ReportPostResponse> => {
  const response = await fetch(`${API_CONFIG.BASE_URL}/report`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(reportData),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return (await response.json()) as ReportPostResponse;
};

export async function getPostState(id: string): Promise<{ status: string }> {
  const response = await fetch(`${API_CONFIG.BASE_URL}/get/post_state?id=${id}`);
  if (!response.ok) {
    throw new Error('Failed to fetch post state');
  }
  return response.json();
}

export async function getReportState(id: string): Promise<{ status: string }> {
  const response = await fetch(`${API_CONFIG.BASE_URL}/get/report_state?id=${id}`);
  if (!response.ok) {
    throw new Error('Failed to fetch report state');
  }
  return response.json();
}


export interface Comment {
  id: number;
  nickname: string;
  content: string;
  parent_comment_id: number;
}

export const getComments = async (id: string | number): Promise<Comment[]> => {
  try {
    const response = await fetch(`${API_CONFIG.BASE_URL}/get/comment?id=${id}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching comments:', error);
    throw error;
  }
};

export interface PostCommentRequest {
  content: string;
  submission_id: number;
  parent_comment_id: number;
  nickname: string;
}

export interface PostCommentResponse {
  id: number;
  status: string;
}

export const postComment = async (commentData: PostCommentRequest): Promise<PostCommentResponse> => {
  try {
    const response = await fetch(`${API_CONFIG.BASE_URL}/comment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(commentData),
    });

    if (response.status === 403) {
      throw new Error('评论包含违禁词');
    }

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error posting comment:', error);
    throw error;
  }
};

// === Backend Initialization ===
export interface InitPayload {
  adminToken: string;
  uploadFolder: string;
  allowedExtensions: string[];
  maxFileSize: number;
  bannedKeywords?: string[];
}

export const initBackend = async (payload: InitPayload): Promise<{ status: string; reason?: string }> => {
  const body = {
    ADMIN_TOKEN: payload.adminToken,
    UPLOAD_FOLDER: payload.uploadFolder,
    ALLOWED_EXTENSIONS: payload.allowedExtensions,
    MAX_FILE_SIZE: payload.maxFileSize,
    ...(payload.bannedKeywords ? { BANNED_KEYWORDS: payload.bannedKeywords } : {}),
  };

  const response = await fetch(`${API_CONFIG.BASE_URL}/init`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const data = await response.json().catch(() => ({ status: 'Fail', reason: 'Invalid response' }));

  if (response.status === 403) {
    throw new Error(data?.reason || '后端已初始化');
  }
  if (!response.ok) {
    throw new Error(data?.reason || `初始化失败，状态码 ${response.status}`);
  }

  return data as { status: string; reason?: string };
};