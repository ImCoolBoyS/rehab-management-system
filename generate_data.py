"""Generate realistic demo data for the rehabilitation management system"""
import requests, json, random

BASE = "http://localhost:8000"
TOKEN = None

def login():
    global TOKEN
    r = requests.post(f"{BASE}/api/v1/login", json={"username":"admin","password":"admin123"})
    if r.status_code != 200:
        print(f"Cannot login: {r.text}")
        exit(1)
    TOKEN = r.json()["token"]
    print("Login as admin OK")

def api(method, path, **kwargs):
    h = {"Authorization": f"Bearer {TOKEN}"}
    if "headers" in kwargs:
        kwargs["headers"].update(h)
    else:
        kwargs["headers"] = h
    r = requests.request(method, f"{BASE}{path}", **kwargs)
    if r.status_code >= 400 and "duplicate" not in r.text:
        print(f"  WARN: {method} {path} -> {r.status_code}: {r.text[:120]}")
        return None
    if r.status_code >= 400:
        return None  # silently skip duplicates
    return r.json()

# ===== DATA =====
CITY = "福安市"
TOWNS = [
    "城北街道", "城南街道", "阳头街道",
    "赛岐镇", "甘棠镇", "下白石镇", "溪柄镇", "溪潭镇",
    "穆阳镇", "晓阳镇", "湾坞镇", "松罗乡", "范坑乡"
]
SURNAMES = list("王李张刘陈杨黄赵周吴徐孙马胡朱郭何罗高林梁宋唐韩曹许邓冯萧程蔡彭潘袁于董余叶蒋杜苏魏吕卢丁姜崔钟谭廖汪田石赖贾")
GIVEN_M = ["建国","伟","强","磊","军","勇","明","杰","志强","海","峰","华","平","刚","建华","文","健","超","亮","国强","浩","阳","鑫","飞","鹏","利","斌","东","涛","辉"]
GIVEN_F = ["芳","娟","秀英","敏","静","丽","艳","玲","桂英","小芳","美","慧","霞","红","春梅","雪梅","云","娜","莉","玉兰","凤英","淑珍","秀兰","海燕","丹","婷","琳","雅","欣","文静"]
ETHNICITIES = ["汉族", "畲族", "回族"]
VILLAGES = ["朝阳社区","东凤社区","南湖社区","广兴社区","官村社区","前进社区","中兴社区","锦阳社区","棠旺村","苏阳村","廉岭村","柳堤村","溪口村","彭洋村"]
TRAINING_TYPES = ["生活技能训练","社会适应训练","职业康复训练","社交技能训练","心理疏导","体能训练","认知训练","家属支持","文娱活动"]
TRAINING_METHODS = ["个案管理","入户康复","社区活动"]

def rname():
    s = random.choice(SURNAMES)
    g = random.choice(["男","女"])
    return s + random.choice(GIVEN_M if g == "男" else GIVEN_F), g

def idcard(b):
    area = "350981"; bd = b.replace("-","")
    base = area + bd + f"{random.randint(1,999):03d}"
    w = [7,9,10,5,8,4,2,1,6,3,7,9,10,5,8,4,2]
    c = "10X98765432"
    return base + c[sum(int(base[i])*w[i] for i in range(17)) % 11]

def phone():
    return random.choice(["138","139","150","151","152","158","159","186","187","188","130","131","132","135","136","137"]) + f"{random.randint(10000000,99999999)}"

def birth():
    return f"{random.randint(1960,2005):04d}-{random.randint(1,12):02d}-{random.randint(1,28):02d}"

def create_sites():
    print("\nCreating sites...")
    for i, town in enumerate(TOWNS):
        api("POST", "/api/v1/sites", json={
            "name": f"{town}社区康复点", "town": town,
            "siteType": "总站" if i == 0 else "乡镇站点", "isActive": True
        })
    sites = api("GET", "/api/v1/sites")
    print(f"  {len(sites)} sites")
    return sites

def create_users(sites):
    print("\nCreating users...")
    ulist = [
        ("admin","admin123","陈志强","男","admin",sites[0]["id"]),
        ("fuan_sg","admin123","林伟明","男","supervisor",sites[0]["id"]),
        ("fuan_sg2","admin123","黄丽华","女","supervisor",sites[0]["id"]),
    ]
    for i, s in enumerate(sites):
        n, g = rname()
        ulist.append((f"sg_{i+1}","admin123",n,g,"worker",s["id"]))
    for u in ulist:
        api("POST", "/api/v1/users", json={
            "username":u[0],"password":u[1],"realName":u[2],"gender":u[3],
            "role":u[4],"siteId":u[5],"phone":phone(),"isActive":True
        })
    print(f"  {len(ulist)} users")

def create_students(sites):
    print("\nCreating students...")
    students = []
    per = [5, 3, 2, 3, 2, 2, 2, 2, 1, 1, 1, 1, 1]
    MAR = ["已婚","未婚","离婚","丧偶"]
    LIV = ["与亲属共同生活","独居","与配偶共同生活","与子女共同生活","社区托养"]
    DT = ["精神残疾","智力残疾","多重残疾"]
    DL = ["一级","二级","三级","四级"]
    for si, c in enumerate(per):
        s = sites[si]; t = s["town"]
        for _ in range(c):
            n, g = rname(); b = birth()
            r = api("POST", "/api/v1/students", json={
                "name":n,"idCard":idcard(b),"gender":g,"ethnicity":random.choice(ETHNICITIES),
                "birthDate":b,"age":2026-int(b[:4]),"phone":phone(),"homePhone":phone(),
                "address":f"{CITY}{t}{random.choice(VILLAGES)}",
                "maritalStatus":random.choice(MAR),"livingSituation":random.choice(LIV),
                "hasDisabilityCert":random.choice([True,False]),
                "disabilityType":random.choice(DT) if random.random()>0.3 else None,
                "disabilityLevel":random.choice(DL) if random.random()>0.3 else None,
                "hasDibao":random.choice([True,False]),
                "contactPerson":rname()[0],"contactPhone":phone(),
                "coResidents":[],"coResidentRelation":random.choice(["好","良好","一般"]),
                "livingEnvironment":random.choice(["好","良好","一般"]),
                "economicStatus":random.choice(["好","一般","较差","贫困"]),
                "incomeSource":[],"moneyManagement":random.choice(["自理","家人代管"]),
                "pastBehavior":[],"currentRisk":random.choice(["无","低","中"]),
                "medicationCompliance":random.choice(["规律","间断","不服药","医嘱勿须服药"]),
                "town":t,"village":random.choice(VILLAGES),
                "siteId":s["id"],"status":"active",
                "riskLevel":random.choice(["low","medium","high"]),
                "serviceType":random.choice(["type80","type60"])
            })
            if r: students.append(r)
    print(f"  {len(students)} students")
    return students

def create_assessments(students):
    print("\nCreating assessments...")
    c = 0
    IMP = ["康复效果良好","病情稳定，社会功能逐步恢复","情绪平稳，服药依从性好","认知功能改善","社交主动性增强"]
    for s in students:
        for at in ["baseline","process1","process2"][:random.randint(1,3)]:
            r = api("POST", "/api/v1/assessments", json={
                "studentId":s["id"],"studentName":s["name"],"siteId":s["siteId"],
                "assessmentType":at,"assessDate":f"2026-{random.randint(1,6):02d}-{random.randint(1,28):02d}",
                "assessor":random.choice(["陈志强","林伟明","黄丽华","王医生","李医生"]),
                "overallImpression":random.choice(IMP),
                "scores":{"psychoSocial":random.randint(20,95),"mentalStatus":"情绪稳定，自知力部分恢复",
                          "sdss":random.randint(0,20),"socialAdapt":random.randint(5,40),
                          "adl":random.randint(14,56),"iadl":random.randint(8,32)}
            })
            if r: c += 1
    print(f"  {c} assessments")

def create_trainings(students):
    print("\nCreating trainings...")
    c = 0
    for s in students:
        for _ in range(random.randint(1,5)):
            tt = random.choice(TRAINING_TYPES)
            r = api("POST", "/api/v1/trainings", json={
                "studentId":s["id"],"studentName":s["name"],"siteId":s["siteId"],
                "title":tt,"trainingType":tt,"trainingMethod":random.choice(TRAINING_METHODS),
                "location":random.choice(["患者居所","康复机构","社区活动中心"]),
                "startTime":f"2026-{random.randint(1,6):02d}-{random.randint(1,28):02d} {random.randint(8,16):02d}:00",
                "endTime":f"2026-{random.randint(1,6):02d}-{random.randint(1,28):02d} {random.randint(9,17):02d}:00",
                "durationMinutes":random.choice([30,45,60,90]),
                "content":f"{tt}：针对患者具体情况开展个性化训练",
                "summary":random.choice(["患者积极配合","基本完成训练目标","社交能力有所提升"]),
                "recorderName":random.choice(["陈志强","林伟明","黄丽华"])
            })
            if r: c += 1
    print(f"  {c} trainings")

def create_visits(students):
    print("\nCreating visits...")
    c = 0
    for s in students:
        for _ in range(random.randint(1,4)):
            r = api("POST", "/api/v1/visits", json={
                "studentId":s["id"],"studentName":s["name"],"siteId":s["siteId"],
                "visitDate":f"2026-{random.randint(1,6):02d}-{random.randint(1,28):02d}",
                "visitMethod":random.choice(["入户探访","电话随访","社区见面"]),
                "visitorName":random.choice(["陈志强","林伟明","黄丽华"]),
                "reason":random.choice(["常规随访","病情跟踪","用药指导"]),
                "mentalStatus":random.choice(["稳定","基本稳定","不稳定"]),
                "medicationStatus":random.choice(["规律","间断","不服药"]),
                "socialFunction":random.choice(["良好","一般","差"]),
                "riskLevel":random.choice(["无风险","低风险","中风险"]),
                "familyCommunication":random.choice(["良好","一般"]),
                "emotionalState":random.choice(["稳定","焦虑","平稳"]),
                "medicationChecked":True,"medicationNotes":"服药情况良好",
                "nextVisitDate":f"2026-{random.randint(7,12):02d}-{random.randint(1,28):02d}"
            })
            if r: c += 1
    print(f"  {c} visits")

def create_announcements():
    print("\nCreating announcements...")
    items = [
        ("关于开展2026年度康复训练评估工作的通知","各站点负责人：现决定开展2026年度康复训练效果评估工作。","陈志强"),
        ("关于进一步加强服药管理工作的通知","各站点社工：请加强服药管理工作，落实每周电话随访制度。","林伟明"),
        ("2026年第三季度康复活动安排","7月-户外拓展；8月-生活技能竞赛；9月-家属开放日。","黄丽华"),
        ("新入职社工培训通知","2026年7月20日-22日举办新入职社工岗前培训。","陈志强"),
        ("关于启用电子档案管理系统的通知","2026年8月1日起全面启用电子档案管理系统。","陈志强"),
        ("关于加强信息安全管理的通知","不得泄露学员个人信息，系统账号仅限本人使用。","陈志强"),
        ("精神卫生法宣传月活动方案","10月份开展精神卫生法宣传月活动，各站点组织2场以上宣传活动。","林伟明"),
    ]
    for t, c, a in items:
        api("POST", "/api/v1/announcements", json={
            "title":t,"content":c,"createdBy":a,
            "startDate":"2026-07-01","endDate":"2026-12-31"
        })
    print(f"  {len(items)} announcements")

if __name__ == "__main__":
    login()
    sites = create_sites()
    create_users(sites)
    students = create_students(sites)
    create_assessments(students)
    create_trainings(students)
    create_visits(students)
    create_announcements()
    print("\n=== DONE ===")
    print(f"Sites: {len(sites)}, Students: {len(students)}")
