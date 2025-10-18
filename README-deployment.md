# SPA 路由部署说明

## 问题描述
React Router 使用的是客户端路由，当用户直接访问 `/admin`、`/create` 等路由时，服务器会尝试查找对应的文件，但这些路径在服务器上并不存在，因此返回 404。

## 解决方案

### 1. OpenResty/Nginx 配置

在你的 OpenResty 配置中添加以下配置：

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /path/to/your/dist;
    index index.html;

    # 处理静态资源
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files $uri =404;
    }

    # SPA 路由回退 - 关键配置
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

### 2. 关键配置说明

- `try_files $uri $uri/ /index.html;` 是核心配置
- 当访问任何路由时，服务器会：
  1. 首先尝试查找对应的文件 (`$uri`)
  2. 然后尝试查找对应的目录 (`$uri/`)
  3. 最后回退到 `index.html`

### 3. 部署步骤

1. 构建项目：
   ```bash
   pnpm build
   ```

2. 将 `dist` 目录的内容上传到服务器

3. 配置 OpenResty/Nginx 使用上述配置

4. 重启服务器：
   ```bash
   nginx -s reload
   # 或
   systemctl reload nginx
   ```

### 4. 验证

部署后，以下访问方式都应该正常工作：
- 直接访问 `https://your-domain.com/admin`
- 直接访问 `https://your-domain.com/create`
- 通过侧边栏导航访问

### 5. 注意事项

- 确保静态资源路径正确
- 如果使用子路径部署，需要相应调整配置
- API 路由需要单独配置代理，避免被 SPA 回退规则影响