import { API_CONFIG } from './config';

// 管理员认证相关的 API 接口

export interface AdminAuthResponse {
  success: boolean;
  message?: string;
}

// 管理员密码缓存键
const ADMIN_TOKEN_KEY = 'admin_token';

/**
 * 获取存储的管理员令牌
 */
export const getAdminToken = (): string | null => {
  return localStorage.getItem(ADMIN_TOKEN_KEY);
};

/**
 * 存储管理员令牌
 */
export const setAdminToken = (token: string): void => {
  localStorage.setItem(ADMIN_TOKEN_KEY, token);
};

/**
 * 清除管理员令牌
 */
export const clearAdminToken = (): void => {
  localStorage.removeItem(ADMIN_TOKEN_KEY);
};

/**
 * 验证管理员密码
 * @param password 管理员密码
 * @returns Promise<AdminAuthResponse>
 */
export const verifyAdminPassword = async (password: string): Promise<AdminAuthResponse> => {
  try {
    const response = await fetch(`${API_CONFIG.BASE_URL}/admin/test`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${password}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.status === 401 || response.status === 403) {
      return {
        success: false,
        message: '密码错误，请重新输入'
      };
    }

    if (response.ok) {
      // 密码正确，存储到缓存
      setAdminToken(password);
      return {
        success: true,
        message: '登录成功'
      };
    }

    // 其他错误状态
    return {
      success: false,
      message: `服务器错误: ${response.status}`
    };

  } catch (error) {
    console.error('Admin authentication error:', error);
    return {
      success: false,
      message: '网络错误，请检查连接'
    };
  }
};

/**
 * 检查管理员是否已登录
 */
export const isAdminLoggedIn = (): boolean => {
  return getAdminToken() !== null;
};

/**
 * 管理员退出登录
 */
export const adminLogout = (): void => {
  clearAdminToken();
};

/**
 * 创建带有管理员认证的请求头
 */
export const createAdminHeaders = (): HeadersInit => {
  const token = getAdminToken();
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

/**
 * 通用的管理员 API 请求函数
 * @param endpoint API 端点
 * @param options 请求选项
 */
export const adminApiRequest = async (
  endpoint: string, 
  options: RequestInit = {}
): Promise<Response> => {
  const token = getAdminToken();
  
  if (!token) {
    throw new Error('未登录或登录已过期');
  }

  // 动态处理 Content-Type：当 body 是 FormData 时让浏览器自动设置 boundary
  const baseHeaders: HeadersInit = createAdminHeaders();
  if (typeof FormData !== 'undefined' && options.body instanceof FormData) {
    // @ts-ignore
    delete baseHeaders['Content-Type'];
  }

  const response = await fetch(`${API_CONFIG.BASE_URL}/admin${endpoint}`, {
    ...options,
    headers: {
      ...baseHeaders,
      ...options.headers,
    },
  });

  // 如果返回 401 或 403，说明令牌无效，清除缓存
  if (response.status === 401 || response.status === 403) {
    clearAdminToken();
    throw new Error('登录已过期，请重新登录');
  }

  return response;
};

/**
 * 创建备份并返回 ZIP 文件 Blob 与文件名
 * GET /admin/get/backup -> ZIP
 */
export const getBackupZip = async (): Promise<{ blob: Blob; filename: string }> => {
  const resp = await adminApiRequest('/get/backup', { method: 'GET' });
  if (!resp.ok) {
    throw new Error(`创建备份失败: ${resp.status}`);
  }
  const disposition = resp.headers.get('Content-Disposition') || '';
  let filename = 'backup.zip';
  const match = disposition.match(/filename\*=UTF-8''([^;]+)|filename="?([^";]+)"?/i);
  if (match) {
    filename = decodeURIComponent(match[1] || match[2] || filename);
  }
  const blob = await resp.blob();
  return { blob, filename };
};

/**
 * 恢复备份
 * POST /admin/recover (multipart/form-data: backup_file)
 */
export const recoverBackup = async (file: File): Promise<{ status: 'OK' }> => {
  const form = new FormData();
  // 后端要求的字段名：file
  form.append('file', file);
  const resp = await adminApiRequest('/recover', {
    method: 'POST',
    body: form,
    // 让 adminApiRequest 自动去掉 Content-Type
  });
  if (!resp.ok) {
    let detail = '';
    try {
      const ct = resp.headers.get('Content-Type') || '';
      if (ct.includes('application/json')) {
        const data = await resp.json();
        detail = typeof data === 'string' ? data : (data?.message || JSON.stringify(data));
      } else {
        detail = await resp.text();
      }
    } catch {}
    throw new Error(`恢复备份失败: ${resp.status}${detail ? ` - ${detail}` : ''}`);
  }
  return resp.json();
};

/**
 * 获取当前帖子审核模式
 * GET /admin/get/need_audit -> { status: boolean }
 */
export const getAuditMode = async (): Promise<{ status: boolean }> => {
  const resp = await adminApiRequest('/get/need_audit', {
    method: 'GET',
  });
  if (!resp.ok) {
    throw new Error(`获取审核模式失败: ${resp.status}`);
  }
  return resp.json();
};

/**
 * 切换帖子审核模式
 * POST /admin/need_audit { need_audit: boolean }
 */
export const setAuditMode = async (need_audit: boolean): Promise<{ status: 'OK' }> => {
  const resp = await adminApiRequest('/need_audit', {
    method: 'POST',
    body: JSON.stringify({ need_audit }),
  });
  if (!resp.ok) {
    throw new Error(`切换审核模式失败: ${resp.status}`);
  }
  return resp.json();
};

/**
 * 图片链接项
 */
export interface PicLink {
  filename: string;
  url: string;
  upload_time: string;
}

/**
 * 获取图片链接列表
 * GET /admin/get/pic_links?page=1 -> PicLink[]
 */
export const getPicLinks = async (page: number = 1): Promise<PicLink[]> => {
  const resp = await adminApiRequest(`/get/pic_links?page=${encodeURIComponent(page)}`, {
    method: 'GET',
  });
  if (!resp.ok) {
    throw new Error(`获取图片链接失败: ${resp.status}`);
  }
  const data = await resp.json();
  // 兼容字符串数组（如 ["/img/251012_xxx.png", ...]）与对象数组的返回
  return (Array.isArray(data) ? data : []).map((item: any) => {
    // 字符串项：直接视为图片相对或绝对 URL
    if (typeof item === 'string') {
      const raw = item.trim();
      const isAbsolute = /^https?:\/\//i.test(raw);
      const path = isAbsolute ? raw : (raw.startsWith('/') ? raw : `/${raw}`);
      const url = isAbsolute ? raw : `${API_CONFIG.BASE_URL}${path}`;
      // 从路径派生 filename
      let filename = '';
      if (raw.startsWith('/img/')) {
        filename = raw.slice('/img/'.length);
      } else {
        const idx = raw.lastIndexOf('/');
        filename = idx >= 0 ? raw.slice(idx + 1) : raw;
      }
      try { filename = decodeURIComponent(filename); } catch {}
      return { filename, url, upload_time: '' } as PicLink;
    }

    // 对象项：使用字段并进行回退与绝对化
    const filename = String(item?.filename || '');
    const upload_time = String(item?.upload_time || '');
    const urlRaw = item?.url;
    let url = typeof urlRaw === 'string' ? urlRaw.trim() : '';
    if (!url && filename) {
      url = `/img/${encodeURIComponent(filename)}`;
    }
    if (url && !/^https?:\/\//i.test(url)) {
      const path = url.startsWith('/') ? url : `/${url}`;
      url = `${API_CONFIG.BASE_URL}${path}`;
    }
    return { filename, url, upload_time } as PicLink;
  });
};

/**
 * 删除图片
 * POST /admin/del_pic { filename }
 */
export const deletePic = async (filename: string): Promise<{ status: 'OK' }> => {
  if (!filename) {
    throw new Error('缺少图片文件名');
  }
  const resp = await adminApiRequest('/del_pic', {
    method: 'POST',
    body: JSON.stringify({ filename }),
  });
  if (!resp.ok) {
    let detail = '';
    try {
      const ct = resp.headers.get('Content-Type') || '';
      if (ct.includes('application/json')) {
        const data = await resp.json();
        detail = typeof data === 'string' ? data : (data?.message || JSON.stringify(data));
      } else {
        detail = await resp.text();
      }
    } catch {}
    throw new Error(`删除图片失败: ${resp.status}${detail ? ` - ${detail}` : ''}`);
  }
  return resp.json();
};

/**
 * 待处理举报项
 */
export interface PendingReport {
  id: number;
  submission_id: number;
  title: string;
  content: string;
  status: string;
  created_at: string;
}

/**
 * 获取待处理举报列表
 * GET /admin/get/pending_reports -> PendingReport[]
 */
export const getPendingReports = async (): Promise<PendingReport[]> => {
  const resp = await adminApiRequest('/get/pending_reports', { method: 'GET' });
  if (!resp.ok) {
    throw new Error(`获取待处理举报失败: ${resp.status}`);
  }
  const data = await resp.json();
  return (Array.isArray(data) ? data : []).map((item: any) => ({
    id: Number(item?.id ?? 0),
    submission_id: Number(item?.submission_id ?? 0),
    title: String(item?.title ?? ''),
    content: String(item?.content ?? ''),
    status: String(item?.status ?? ''),
    created_at: String(item?.created_at ?? ''),
  }));
};

/**
 * 批准举报
 * POST /admin/approve_report { id }
 */
export const approveReport = async (id: number): Promise<{ status: 'OK' }> => {
  if (!id && id !== 0) {
    throw new Error('缺少举报 ID');
  }
  const resp = await adminApiRequest('/approve_report', {
    method: 'POST',
    body: JSON.stringify({ id }),
  });
  if (!resp.ok) {
    let detail = '';
    try {
      const ct = resp.headers.get('Content-Type') || '';
      if (ct.includes('application/json')) {
        const data = await resp.json();
        detail = typeof data === 'string' ? data : (data?.message || JSON.stringify(data));
      } else {
        detail = await resp.text();
      }
    } catch {}
    throw new Error(`批准举报失败: ${resp.status}${detail ? ` - ${detail}` : ''}`);
  }
  return resp.json();
};

/**
 * 拒绝举报
 * POST /admin/reject_report { id }
 */
export const rejectReport = async (id: number): Promise<{ status: 'OK' }> => {
  if (!id && id !== 0) {
    throw new Error('缺少举报 ID');
  }
  const resp = await adminApiRequest('/reject_report', {
    method: 'POST',
    body: JSON.stringify({ id }),
  });
  if (!resp.ok) {
    let detail = '';
    try {
      const ct = resp.headers.get('Content-Type') || '';
      if (ct.includes('application/json')) {
        const data = await resp.json();
        detail = typeof data === 'string' ? data : (data?.message || JSON.stringify(data));
      } else {
        detail = await resp.text();
      }
    } catch {}
    throw new Error(`拒绝举报失败: ${resp.status}${detail ? ` - ${detail}` : ''}`);
  }
  return resp.json();
};

/**
 * 获取管理员视角的帖子详情（只需 content 字段）
 * GET /admin/get/post_info?id=number -> { content: string, ... }
 */
export interface AdminPostInfo { content: string }

export const getAdminPostInfo = async (id: number): Promise<AdminPostInfo> => {
  if (!id && id !== 0) {
    throw new Error('缺少帖子 ID');
  }
  const resp = await adminApiRequest(`/get/post_info?id=${encodeURIComponent(id)}`, { method: 'GET' });
  if (!resp.ok) {
    let detail = '';
    try {
      const ct = resp.headers.get('Content-Type') || '';
      if (ct.includes('application/json')) {
        const data = await resp.json();
        detail = typeof data === 'string' ? data : (data?.message || JSON.stringify(data));
      } else {
        detail = await resp.text();
      }
    } catch {}
    throw new Error(`获取帖子详情失败: ${resp.status}${detail ? ` - ${detail}` : ''}`);
  }
  const data = await resp.json();
  return { content: String(data?.content || '') };
};

/**
 * 管理端帖子列表项（用于待审核/已拒绝）
 */
export interface AdminPostListItem {
  id: number;
  content: string;
  create_time: string;
  upvotes: number;
  downvotes: number;
}

/**
 * 获取待审核帖子列表
 * GET /admin/get/pending_posts -> AdminPostListItem[]
 */
export const getPendingPosts = async (): Promise<AdminPostListItem[]> => {
  const resp = await adminApiRequest('/get/pending_posts', { method: 'GET' });
  if (!resp.ok) {
    let detail = '';
    try {
      const ct = resp.headers.get('Content-Type') || '';
      if (ct.includes('application/json')) {
        const data = await resp.json();
        detail = typeof data === 'string' ? data : (data?.message || JSON.stringify(data));
      } else {
        detail = await resp.text();
      }
    } catch {}
    throw new Error(`获取待审核帖子失败: ${resp.status}${detail ? ` - ${detail}` : ''}`);
  }
  const data = await resp.json();
  return Array.isArray(data) ? data as AdminPostListItem[] : [];
};

/**
 * 获取已拒绝帖子列表
 * GET /admin/get/reject_posts -> AdminPostListItem[]
 */
export const getRejectedPosts = async (): Promise<AdminPostListItem[]> => {
  const resp = await adminApiRequest('/get/reject_posts', { method: 'GET' });
  if (!resp.ok) {
    let detail = '';
    try {
      const ct = resp.headers.get('Content-Type') || '';
      if (ct.includes('application/json')) {
        const data = await resp.json();
        detail = typeof data === 'string' ? data : (data?.message || JSON.stringify(data));
      } else {
        detail = await resp.text();
      }
    } catch {}
    throw new Error(`获取已拒绝帖子失败: ${resp.status}${detail ? ` - ${detail}` : ''}`);
  }
  const data = await resp.json();
  return Array.isArray(data) ? data as AdminPostListItem[] : [];
};

/**
 * 审核通过帖子
 * POST /admin/approve { id }
 */
export const approvePost = async (id: number): Promise<{ status: 'OK' }> => {
  if (!id && id !== 0) {
    throw new Error('缺少帖子 ID');
  }
  const resp = await adminApiRequest('/approve', {
    method: 'POST',
    body: JSON.stringify({ id }),
  });
  if (!resp.ok) {
    let detail = '';
    try {
      const ct = resp.headers.get('Content-Type') || '';
      if (ct.includes('application/json')) {
        const data = await resp.json();
        detail = typeof data === 'string' ? data : (data?.message || JSON.stringify(data));
      } else {
        detail = await resp.text();
      }
    } catch {}
    const msg = resp.status === 401 || resp.status === 403
      ? '身份验证失败，请重新登陆'
      : resp.status === 404
        ? '帖子不存在'
        : resp.status === 400
          ? '缺少帖子 ID'
          : `审核通过失败: ${resp.status}${detail ? ` - ${detail}` : ''}`;
    throw new Error(msg);
  }
  return resp.json();
};

/**
 * 拒绝帖子
 * POST /admin/disapprove { id }
 */
export const disapprovePost = async (id: number): Promise<{ status: 'OK' }> => {
  if (!id && id !== 0) {
    throw new Error('缺少帖子 ID');
  }
  const resp = await adminApiRequest('/disapprove', {
    method: 'POST',
    body: JSON.stringify({ id }),
  });
  if (!resp.ok) {
    let detail = '';
    try {
      const ct = resp.headers.get('Content-Type') || '';
      if (ct.includes('application/json')) {
        const data = await resp.json();
        detail = typeof data === 'string' ? data : (data?.message || JSON.stringify(data));
      } else {
        detail = await resp.text();
      }
    } catch {}
    const msg = resp.status === 401 || resp.status === 403
      ? '身份验证失败，请重新登陆'
      : resp.status === 404
        ? '帖子不存在'
        : resp.status === 400
          ? '缺少帖子 ID'
          : `拒绝帖子失败: ${resp.status}${detail ? ` - ${detail}` : ''}`;
    throw new Error(msg);
  }
  return resp.json();
};

/**
 * 重新审核帖子（将已通过设回待审核）
 * POST /admin/reaudit { id }
 */
export const reauditPost = async (id: number): Promise<{ status: 'OK' }> => {
  if (!id && id !== 0) {
    throw new Error('缺少帖子 ID');
  }
  const resp = await adminApiRequest('/reaudit', {
    method: 'POST',
    body: JSON.stringify({ id }),
  });
  if (!resp.ok) {
    let detail = '';
    try {
      const ct = resp.headers.get('Content-Type') || '';
      if (ct.includes('application/json')) {
        const data = await resp.json();
        detail = typeof data === 'string' ? data : (data?.message || JSON.stringify(data));
      } else {
        detail = await resp.text();
      }
    } catch {}
    const msg = resp.status === 401 || resp.status === 403
      ? '身份验证失败，请重新登陆'
      : resp.status === 404
        ? '帖子不存在'
        : resp.status === 400
          ? '缺少帖子 ID'
          : `重新审核失败: ${resp.status}${detail ? ` - ${detail}` : ''}`;
    throw new Error(msg);
  }
  return resp.json();
};

/**
 * 删除帖子
 * POST /admin/del_post { id }
 */
export const deletePost = async (id: number): Promise<{ status: 'OK' }> => {
  if (!id && id !== 0) {
    throw new Error('缺少帖子 ID');
  }
  const resp = await adminApiRequest('/del_post', {
    method: 'POST',
    body: JSON.stringify({ id }),
  });
  if (!resp.ok) {
    let detail = '';
    try {
      const ct = resp.headers.get('Content-Type') || '';
      if (ct.includes('application/json')) {
        const data = await resp.json();
        detail = typeof data === 'string' ? data : (data?.message || JSON.stringify(data));
      } else {
        detail = await resp.text();
      }
    } catch {}
    const msg = resp.status === 401 || resp.status === 403
      ? '身份验证失败，请重新登陆'
      : resp.status === 404
        ? '帖子不存在'
        : resp.status === 400
          ? '缺少帖子 ID'
          : `删除帖子失败: ${resp.status}${detail ? ` - ${detail}` : ''}`;
    throw new Error(msg);
  }
  return resp.json();
};

/**
 * 修改帖子内容
 * POST /admin/modify_post { id, content }
 */
export const modifyPost = async (
  id: number,
  content: string
): Promise<{ status: 'OK' }> => {
  if ((!id && id !== 0) || !content) {
    throw new Error(!content ? '缺少帖子内容' : '缺少帖子 ID');
  }
  const resp = await adminApiRequest('/modify_post', {
    method: 'POST',
    body: JSON.stringify({ id, content }),
  });
  if (!resp.ok) {
    let detail = '';
    try {
      const ct = resp.headers.get('Content-Type') || '';
      if (ct.includes('application/json')) {
        const data = await resp.json();
        detail = typeof data === 'string' ? data : (data?.message || JSON.stringify(data));
      } else {
        detail = await resp.text();
      }
    } catch {}
    const msg = resp.status === 401 || resp.status === 403
      ? '身份验证失败，请重新登陆'
      : resp.status === 404
        ? '帖子不存在'
        : resp.status === 400
          ? '缺少 ID 或 content'
          : `修改帖子失败: ${resp.status}${detail ? ` - ${detail}` : ''}`;
    throw new Error(msg);
  }
  return resp.json();
};

/**
 * 删除评论
 * POST /admin/del_comment { id }
 */
export const deleteComment = async (id: number): Promise<{ status: 'OK' }> => {
  if (!id && id !== 0) {
    throw new Error('缺少评论 ID');
  }
  const resp = await adminApiRequest('/del_comment', {
    method: 'POST',
    body: JSON.stringify({ id }),
  });
  if (!resp.ok) {
    let detail = '';
    try {
      const ct = resp.headers.get('Content-Type') || '';
      if (ct.includes('application/json')) {
        const data = await resp.json();
        detail = typeof data === 'string' ? data : (data?.message || JSON.stringify(data));
      } else {
        detail = await resp.text();
      }
    } catch {}
    const msg = resp.status === 401 || resp.status === 403
      ? '身份验证失败，请重新登陆'
      : resp.status === 404
        ? '评论不存在'
        : resp.status === 400
          ? '缺少评论 ID'
          : `删除评论失败: ${resp.status}${detail ? ` - ${detail}` : ''}`;
    throw new Error(msg);
  }
  return resp.json();
};

/**
 * 修改评论
 * POST /admin/modify_comment { id, content, parent_comment_id, nickname }
 */
export const modifyComment = async (
  id: number,
  content: string,
  parent_comment_id: number,
  nickname: string
): Promise<{ status: 'OK' }> => {
  const missingId = !id && id !== 0;
  const missingParent = parent_comment_id === undefined || parent_comment_id === null || Number.isNaN(parent_comment_id);
  if (missingId || !content || !nickname || missingParent) {
    throw new Error('缺少必填字段');
  }
  const resp = await adminApiRequest('/modify_comment', {
    method: 'POST',
    body: JSON.stringify({ id, content, parent_comment_id, nickname }),
  });
  if (!resp.ok) {
    let detail = '';
    try {
      const ct = resp.headers.get('Content-Type') || '';
      if (ct.includes('application/json')) {
        const data = await resp.json();
        detail = typeof data === 'string' ? data : (data?.message || JSON.stringify(data));
      } else {
        detail = await resp.text();
      }
    } catch {}
    const msg = resp.status === 401 || resp.status === 403
      ? '身份验证失败，请重新登陆'
      : resp.status === 404
        ? '评论或父评论不存在'
        : resp.status === 400
          ? '缺少必填字段'
          : `修改评论失败: ${resp.status}${detail ? ` - ${detail}` : ''}`;
    throw new Error(msg);
  }
  return resp.json();
};