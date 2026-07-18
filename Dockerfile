# =============================================
# Dockerfile - 多阶段构建
# 精神康复中心管理系统
# =============================================

# ---- Stage 1: 构建前端 ----
FROM node:20-alpine AS build-frontend
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci
COPY vite.config.ts tsconfig.json tsconfig.app.json tsconfig.node.json index.html ./
COPY src/ ./src/
COPY public/ ./public/
RUN npm run build

# ---- Stage 2: 运行后端 + 静态文件服务 ----
FROM python:3.11-slim
WORKDIR /app

# 安装系统依赖（psycopg2 需要）
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev gcc && \
    rm -rf /var/lib/apt/lists/*

# 安装 Python 依赖
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 复制后端代码
COPY server.py .
COPY generate_data.py .
COPY tests/ ./tests/

# 复制构建好的前端
COPY --from=build-frontend /app/dist ./dist

# 创建上传目录
RUN mkdir -p uploads/pdfs

# 启动脚本
COPY entrypoint.sh .
RUN chmod +x entrypoint.sh

EXPOSE 8000

ENTRYPOINT ["./entrypoint.sh"]
