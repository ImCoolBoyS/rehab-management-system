import psycopg2, uuid, random, bcrypt

conn = psycopg2.connect("postgresql://postgres:postgres@localhost:5432/rehab_db")
conn.autocommit = True
cur = conn.cursor()

# Clear all
for t in ["assessments","trainings","visits","announcements","audit_log","students","users","sites"]:
    cur.execute(f'DELETE FROM "{t}"')
print("All data cleared")

# Sites
TOWNS = ["A街道","B街道","C镇","D镇","E镇","F镇","G镇","H乡","I乡","J镇","K镇","L镇","M街道"]
sites = []
for i, tn in enumerate(TOWNS):
    sid = str(uuid.uuid4())
    cur.execute("INSERT INTO sites (id,name,town,site_type,is_active) VALUES (%s,%s,%s,%s,true)",
        (sid, f"{tn}社区康复点", tn, "总站" if i==0 else "乡镇站点"))
    sites.append({"id":sid, "town":tn})
print(f"Sites: {len(sites)}")

# Users
pwd = bcrypt.hashpw(b"admin123", bcrypt.gensalt()).decode()
cur.execute("INSERT INTO users (id,username,real_name,gender,role,site_id,phone,password,is_active) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,true)",
    (str(uuid.uuid4()),"admin","测试管理员","男","admin",sites[0]["id"],"13800000000",pwd))
for i, s in enumerate(sites):
    cur.execute("INSERT INTO users (id,username,real_name,gender,role,site_id,phone,password,is_active) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,true)",
        (str(uuid.uuid4()), f"sg_{i+1}", f"测试社工{i+1}", random.choice(["男","女"]), "worker", s["id"], f"1380000{1000+i}", pwd))
print(f"Users: {1 + len(sites)}")

# Students - all fields explicitly set
NAMES = ["测试学员A","测试学员B","测试学员C","测试学员D","测试学员E","测试学员F","测试学员G","测试学员H","测试学员I","测试学员J"]
students = []
per_site = [5, 3, 2, 3, 2, 2, 2, 2, 1, 1, 1, 1, 1]
G = ["男","女"]
for si, c in enumerate(per_site):
    s = sites[si]
    for j in range(c):
        sid = str(uuid.uuid4())
        name = random.choice(NAMES) + f"_{si+1}{j+1}"
        birth = f"{random.randint(1960,2005)}-{random.randint(1,12):02d}-{random.randint(1,28):02d}"
        cur.execute("""
            INSERT INTO students (id,name,id_card,gender,ethnicity,birth_date,age,phone,home_phone,address,
                marital_status,living_situation,has_disability_cert,disability_type,disability_level,
                has_dibao,contact_person,contact_phone,co_residents,co_resident_relation,
                living_environment,economic_status,income_source,money_management,
                past_behavior,current_risk,medication_compliance,medication_method,medication_detail,
                town,village,site_id,status,risk_level,service_type,created_at)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
        """, (
            sid, name, f"TEST_ID_{si+1}_{j+1}", random.choice(G), "汉族", birth, 2026-int(birth[:4]),
            f"138{random.randint(10000000,99999999)}", "", f"测试市{s['town']}虚拟路{random.randint(1,99)}号",
            random.choice(["已婚","未婚","离婚"]), random.choice(["与亲属共同生活","独居"]),
            random.choice([True,False]), random.choice(["精神残疾","智力残疾"]) if random.random()>0.3 else None,
            random.choice(["一级","二级","三级"]) if random.random()>0.3 else None,
            random.choice([True,False]), "测试家属", "13800000000",
            "[]", random.choice(["好","良好","一般"]), random.choice(["好","良好","一般"]),
            random.choice(["好","一般","较差"]), "[]", random.choice(["自理","家人代管"]),
            "[]", random.choice(["无","低","中"]), random.choice(["规律","间断","不服药"]),
            random.choice(["口服","注射"]) if random.random()>0.5 else None,
            random.choice(["每日一次","每日两次"]) if random.random()>0.5 else None,
            s["town"], "测试小区", s["id"], "active",
            random.choice(["low","medium","high"]), random.choice(["type80","type60"]),
            f"2026-{random.randint(1,7):02d}-{random.randint(1,28):02d}"
        ))
        students.append({"id":sid, "name":name, "siteId":s["id"], "town":s["town"]})
print(f"Students: {len(students)}")

# Assessments - some without baseline
TYPES = ["baseline","process1","process2"]
ASS = ["测试评估员A","测试评估员B"]
count = 0
for stu in students:
    if random.random() < 0.3:  # 30% have no assessments
        continue
    for at in TYPES[:random.randint(1,2)]:
        m = random.randint(1,6); d = random.randint(1,28)
        cur.execute("INSERT INTO assessments (id,student_id,student_name,site_id,assessment_type,assess_date,assessor,overall_impression,scores,created_at) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)",
            (str(uuid.uuid4()), stu["id"], stu["name"], stu["siteId"], at,
             f"2026-{m:02d}-{d:02d}", random.choice(ASS), random.choice(["康复效果良好","病情稳定"]),
             '{"psychoSocial":' + str(random.randint(20,95)) + ',"mentalStatus":"稳定","sdss":' + str(random.randint(0,20)) + ',"socialAdapt":' + str(random.randint(5,40)) + ',"adl":' + str(random.randint(14,56)) + ',"iadl":' + str(random.randint(8,32)) + '}',
             f"2026-{m:02d}-{d:02d} {random.randint(8,18):02d}:{random.randint(0,59):02d}:{random.randint(0,59):02d}"))
        count += 1
print(f"Assessments: {count}")

# Trainings
TT = ["生活技能训练","社会适应训练","职业康复训练","社交技能训练","心理疏导","体能训练","认知训练","家属支持","文娱活动"]
count = 0
for stu in students:
    for _ in range(random.randint(1,5)):
        tt = random.choice(TT); m = random.randint(1,6); d = random.randint(1,28)
        cur.execute("INSERT INTO trainings (id,student_id,student_name,site_id,title,training_type,training_method,location,start_time,end_time,duration_minutes,content,summary,recorder_name,created_at) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)",
            (str(uuid.uuid4()), stu["id"], stu["name"], stu["siteId"], tt, tt,
             random.choice(["个案管理","入户康复","社区活动"]),
             random.choice(["患者居所","康复机构"]),
             f"2026-{m:02d}-{d:02d} {random.randint(8,16):02d}:00",
             f"2026-{m:02d}-{d:02d} {random.randint(9,17):02d}:00",
             random.choice([30,45,60,90]), f"{tt}内容", random.choice(["完成","良好"]),
             random.choice(ASS),
             f"2026-{m:02d}-{d:02d} {random.randint(8,18):02d}:{random.randint(0,59):02d}:{random.randint(0,59):02d}"))
        count += 1
print(f"Trainings: {count}")

# Visits
count = 0
for stu in students:
    for _ in range(random.randint(1,3)):
        m = random.randint(1,6); d = random.randint(1,28)
        cur.execute("INSERT INTO visits (id,student_id,student_name,site_id,visit_date,visit_method,visitor_name,reason,mental_status,medication_status,social_function,risk_level,family_communication,emotional_state,medication_checked,medication_notes,next_visit_date,created_at) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)",
            (str(uuid.uuid4()), stu["id"], stu["name"], stu["siteId"],
             f"2026-{m:02d}-{d:02d}", random.choice(["入户探访","电话随访"]),
             random.choice(ASS), random.choice(["常规随访","用药指导"]),
             random.choice(["稳定","基本稳定"]), random.choice(["规律","间断"]),
             random.choice(["良好","一般"]), random.choice(["无风险","低风险"]),
             random.choice(["良好","一般"]), random.choice(["稳定","平稳"]),
             True, "服药良好",
             f"2026-{random.randint(7,12):02d}-{random.randint(1,28):02d}",
             f"2026-{m:02d}-{d:02d} {random.randint(8,18):02d}:{random.randint(0,59):02d}:{random.randint(0,59):02d}"))
        count += 1
print(f"Visits: {count}")

# Announcements
for t, c in [("【测试】康复训练评估工作安排","测试公告内容"),("【测试】服药管理通知","测试通知"),("【测试】康复活动安排","测试安排")]:
    cur.execute("INSERT INTO announcements (id,title,content,created_by,start_date,end_date,created_at) VALUES (%s,%s,%s,%s,%s,%s,%s)",
        (str(uuid.uuid4()), t, c, "测试管理员", "2026-07-01", "2026-12-31", "2026-07-18"))

conn.commit()
conn.close()
print("\n=== ALL FAKE DATA GENERATED ===")
