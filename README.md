A simple anonymous post website awa!



## 快速开始~



0、Clone本仓库



`git clone https://github.com/Sycamore-Whisper/frontend.git`



1、安装node依赖



`pnpm install`



2、修改配置



找到/src/config.ts，根据注释配置后端信息和变量



接下来，找到/public/icon.png，将其替换为你自己的图标



最后，找到/public/about.md，填入自己的关于信息！



配置完成！



3、构建静态文件



`pnpm build`



生成出的静态文件在/dist目录下，将其上传到静态网页托管服务商或者自己的服务器上



接下来，配置SPA路由回退：

```nginx
# Nginx/OpenResty
location / {
    try_files $uri $uri/ /index.html;
}
```



```nginx
# Apache - .htaccess
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteCond %{REQUEST_FILENAME} !-l
  RewriteRule . /index.html [L]
</IfModule>
```



4、初始化后端



打开前端，会自动跳转至/init以便配置后端参数！



部署完成owo。





`python api\_server.py`



后端API已部署完成喵！接下来，请调用/init接口进行初始化

## License



This project is licensed under the MIT License.
