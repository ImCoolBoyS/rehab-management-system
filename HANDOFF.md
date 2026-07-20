# 精神康复中心管理系统 — 项目交接文档

## 项目概览
精神康复中心管理系统（Rehab Management System），用于社区精神康复服务点的日常业务管理。
业务流程：学员档案管理 → 基线/过程评估 → 九大康复训练 → 入户探访问卷 → 数据统计看板

## 架构对比

| 项目 | 技术栈 | 端口 | 路径 |
|------|--------|------|------|
| **当前项目（主）** | React + Vite + FastAPI + PostgreSQL | 5173 / 8001 | C:\Users\Administrator\Desktop\精神康复中心管理系统 |
| **对照项目（5888）** | React + Vite + Express + JSON | 5888 | C:\Users\Administrator\Downloads\精神康复中心管理系统 |

## 启动方式

```bash
# 主项目
cd C:\Users\Administrator\Desktop\精神康复中心管理系统
python server.py          # 后端 FastAPI (8001)
npx vite --port 5173      # 前端 Vite (5173)

# 对照项目
cd C:\Users\Administrator\Downloads\精神康复中心管理系统
npx tsx server.ts         # 后端 Express + Vite 一体 (5888)
```

## 数据库
- 类型: PostgreSQL（主项目）/ JSON文件（对照项目）
- 数据库名: rehab_db
- 连接: postgresql://postgres:postgres@localhost:5432/rehab_db
- 建表: init_schema.py（启动时自动执行）
- 初始化数据: server.py 启动时自动写入测试数据

### 数据表
1. sites - 服务站点
2. users - 系统用户（含 bcrypt 加密密码）
3. students - 学员档案（核心表）
4. assessments - 评估记录（baseline/process1/process2）
5. trainings - 训练记录（九大类）
6. visits - 入户探访
7. announcements - 公告通知
8. audit_log - 审计日志

## API 接口（全部 /api/v1/xxx）

### 认证
- POST /login → { user, token }

### 学员
- GET/POST /students
- PUT /students/{id}
- DELETE /students/{id}（级联删除关联评估/训练/探访）

### 评估
- GET/POST /assessments
- DELETE /assessments/{id}

### 训练
- GET/POST /trainings
- DELETE /trainings/{id}

### 探访
- GET/POST /visits
- DELETE /visits/{id}

### 公告
- CRUD /announcements

### 用户管理
- CRUD /users

### 站点
- GET/POST /sites

### 文件
- POST /upload/pdf（PDF上传）
- GET /files/{path}（文件下载）

## 前端文件结构

src/
├── App.tsx                  # 主应用：路由、登录、session、数据流
├── main.tsx                 # 入口
├── types.ts                 # TypeScript 类型定义
├── data.ts                  # 下拉常量（TOWNS、DRUGS_DICTIONARY、TRAINING_TYPES）
├── index.css                # Tailwind 样式
├── lib/api.ts               # API 调用封装（React Query hooks）
├── components/
│   ├── Dashboard.tsx        # 办公桌面（首页看板）
│   ├── Statistics.tsx       # 数据统计中心（当前已恢复备份原始版）
│   ├── StudentsList.tsx     # 学员档案管理
│   ├── AssessmentsList.tsx  # 基线/过程评估
│   ├── TrainingsList.tsx    # 九大康复训练
│   ├── VisitsList.tsx       # 入户探访
│   ├── ServicePointsList.tsx # 服务点用户管理
│   ├── AnnouncementsList.tsx # 公告管理
│   ├── Profile.tsx          # 个人中心
│   ├── Sidebar.tsx          # 侧边导航栏
│   ├── DataQuery.tsx        # 数据查询中心
│   └── ErrorBoundary.tsx    # 错误边界

## 对照项目（5888）UI 参考

对照项目在数据统计中心有完整的图表看板：
- **近七日全市多维康复动态趋势**（折线图：训练次数/新增档案/基线评估/过程评估）
- **当前在册管理对象风险评定比例**（环形图）
- **九大社区康复训练类别开展成效分析**（柱状图+进度条）
- **社区康复重点关注人员风险评估监控名册**（高危学员列表）

这些 SVG 图表在对照项目的 src/components/Statistics.tsx 和 src/components/Dashboard.tsx 中。

## 关键业务规则

1. **角色权限**：
   - admin: 全部权限
   - supervisor: 主管级
   - worker: 社工，只能查看本社区数据
   - 社工（worker）可以添加基础信息（但只能查看本社区）

2. **级联删除**：删除学员时自动删除其评估/训练/探访记录

3. **Token 认证**：JWT token，5分钟心跳保活，刷新不丢失

4. **数据隔离**：社工只能看到本乡镇数据（PostgreSQL RLS 实现）

5. **密码**：bcrypt 加密，默认密码 "128080"

## 当前 git 状态

最新 commit: ad41308 feat: add SVG chart visualizations to Statistics page
共 29 个 commits，完整的变更历史。

## 页面功能对应

| 导航菜单 | 功能描述 | 状态 |
|---------|---------|------|
| 办公桌面 | 业务概览看板 | 完成 |
| 数据统计中心 | 辖区核算表 + 类别比例分析 | 需要 UI 迁移 |
| 学员档案管理 | CRUD | 完成 |
| 基线评估 | CRUD + PDF上传 | 完成 |
| 过程评估(1/2) | CRUD | 完成 |
| 九大康复训练 | CRUD | 完成 |
| 入户探访 | CRUD | 完成 |
| 数据查询中心 | 综合查询 | 完成 |
| 服务点用户管理 | 站点+用户CRUD | 完成 |
| 公告管理 | CRUD | 完成 |
| 个人中心 | 个人信息 | 完成 |
