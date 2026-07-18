#!/bin/bash
set -e

echo "============================================"
echo "  精神康复中心管理系统 - Docker 启动"
echo "============================================"

# 等待数据库就绪
echo "[等待] 数据库连接中..."
for i in $(seq 1 30); do
  if python -c "
import psycopg2
try:
    psycopg2.connect('$DATABASE_URL')
    print('ok')
except Exception:
    exit(1)
" 2>/dev/null; then
    echo "[成功] 数据库已就绪"
    break
  fi
  if [ "$i" -eq 30 ]; then
    echo "[失败] 数据库连接超时"
    exit 1
  fi
  echo "[等待] 正在重试 ($i/30)..."
  sleep 2
done

# 初始化表结构
echo "[结构] 初始化数据库表结构..."
python init_schema.py

# 判断是否需要初始化数据
NEED_INIT=$(python -c "
import psycopg2
conn = psycopg2.connect('$DATABASE_URL')
cur = conn.cursor()
try:
    cur.execute('SELECT COUNT(*) FROM sites')
    count = cur.fetchone()[0]
    print('yes' if count == 0 else 'no')
except Exception:
    print('yes')
" 2>/dev/null || echo "yes")

if [ "$NEED_INIT" = "yes" ]; then
  echo "[数据] 数据库为空，正在生成测试数据..."
  python generate_data.py
  echo "[完成] 数据初始化完成"
else
  echo "[跳过] 数据库已有数据，跳过初始化"
fi

echo "[启动] 服务已启动: http://0.0.0.0:8000"
echo "============================================"

export NODE_ENV=production
exec uvicorn server:app --host 0.0.0.0 --port 8000 --log-level info
