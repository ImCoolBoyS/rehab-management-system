# Python 环境配置与数据库部署指南

## 1. 环境要求

- Python 3.10+
- PostgreSQL 16+
- Node.js 20+（前端构建用）
- 操作系统：Windows / Linux / macOS

## 2. Python 环境配置

```bash
# 创建虚拟环境（推荐）
python -m venv venv

# 激活虚拟环境
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# 安装依赖
pip install -r requirements.txt
```

### 依赖清单（requirements.txt）

```txt
fastapi==0.115.0
uvicorn==0.30.0
psycopg2-binary==2.9.9
bcrypt==4.2.0
pyjwt==2.9.0
python-multipart==0.0.12
pydantic==2.9.0
slowapi==0.1.9
```

## 3. PostgreSQL 数据库安装

### Windows

1. 下载安装包：https://www.postgresql.org/download/windows/
2. 安装过程中设置 postgres 用户密码（记下来）
3. 默认端口 5432
4. 安装完成后，打开 pgAdmin 或命令行

### Linux (Ubuntu/Debian)

```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql

# 设置密码
sudo -u postgres psql
ALTER USER postgres PASSWORD 'postgres';
\q
```

### macOS

```bash
brew install postgresql@16
brew services start postgresql@16
```

## 4. 创建数据库

```bash
# 命令行创建
psql -U postgres -c "CREATE DATABASE rehab_db;"

# 或者在 psql 里
# CREATE DATABASE rehab_db;
```

## 5. 配置连接信息

编辑项目根目录下的 `.env` 文件（复制 `.env.example` 后修改）：

```
DATABASE_URL="postgresql://postgres:password@localhost:5432/rehab_db"
```

将 `password` 替换为你的 PostgreSQL 密码。

## 6. 启动项目

```bash
# 1. 确保 PostgreSQL 已启动

# 2. 安装前端依赖（首次）
npm install

# 3. 启动后端（自动建表 + 写入测试数据）
python server.py

# 4. 新开终端，启动前端
npx vite --port 5173

# 5. 浏览器打开
# http://localhost:5173
```

## 7. 验证数据库

```bash
# 连接数据库检查表结构
psql -U postgres -d rehab_db -c "\dt"

# 预期输出 8 张表：
# sites, users, students, assessments, trainings, visits, announcements, audit_log

# 查看初始管理员账号
psql -U postgres -d rehab_db -c "SELECT username, role FROM users;"
# 预期: admin | admin
# 默认密码: admin123
```
