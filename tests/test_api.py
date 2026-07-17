# -*- coding: utf-8 -*-
import urllib.request, json, sys
BASE = 'http://localhost:8000/api/v1'
passed = 0; failed = 0
def check(name, ok):
    global passed, failed
    if ok: passed+=1; print('  PASS:', name)
    else: failed+=1; print('  FAIL:', name)

# 1. Server
r = urllib.request.urlopen('http://localhost:8000/docs', timeout=3)
check('Server running', r.status == 200)

# 2. Login
import json
req = urllib.request.Request(BASE+'/login', data=json.dumps({'username':'admin','password':'admin123'}).encode(), headers={'Content-Type':'application/json'}, method='POST')
r = urllib.request.urlopen(req, timeout=5)
d = json.loads(r.read().decode())
TOKEN = d.get('token', '')
check('Login JWT', len(TOKEN) > 20)
check('Admin role', d['user']['role'] == 'admin')

# 3. Auth required
for ep in ['/students', '/users']:
    try:
        urllib.request.urlopen(urllib.request.Request(BASE+ep), timeout=3)
        check('Auth blocked '+ep, False)
    except:
        check('Auth blocked '+ep, True)

# 4. List endpoints
for ep in ['/students', '/users', '/sites']:
    h = {'Authorization': 'Bearer '+TOKEN}
    r = urllib.request.urlopen(urllib.request.Request(BASE+ep, headers=h), timeout=5)
    dd = json.loads(r.read().decode())
    check('List '+ep, isinstance(dd, list))

# 5. SQL injection
p1 = chr(39) + ' OR ' + chr(39) + '1' + chr(39) + '=' + chr(39) + '1'
p2 = 'admin' + chr(39) + '--'
for payload in [p1, p2]:
    try:
        req = urllib.request.Request(BASE+'/login', data=json.dumps({'username':payload,'password':'x'}).encode(), headers={'Content-Type':'application/json'}, method='POST')
        urllib.request.urlopen(req, timeout=3)
        check('SQLi blocked', False)
    except:
        check('SQLi blocked', True)

# 6. Rate limit
limited = False
for i in range(6):
    try:
        req = urllib.request.Request(BASE+'/login', data=json.dumps({'username':'admin','password':'wrong'}).encode(), headers={'Content-Type':'application/json'}, method='POST')
        urllib.request.urlopen(req, timeout=3)
    except urllib.error.HTTPError as e:
        if e.code == 429:
            limited = True
            break
check('Rate limiting', limited)

# 7. Audit log
import psycopg2
conn = psycopg2.connect(host='localhost', dbname='rehab_db', user='postgres', password='postgres')
cur = conn.cursor()
cur.execute('SELECT COUNT(*) FROM audit_log')
count = cur.fetchone()[0]
check('Audit log entries', count > 0)
cur.close(); conn.close()

print()
print('Passed: ' + str(passed) + '  Failed: ' + str(failed))
sys.exit(0 if failed == 0 else 1)
