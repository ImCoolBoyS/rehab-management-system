def fix_timestamps():
    """Post-process: update timestamps to match actual record dates"""
    import psycopg2, random
    conn = psycopg2.connect("postgresql://postgres:postgres@localhost:5432/rehab_db")
    cur = conn.cursor()
    
    # Fix trainings: created_at matches start_time
    cur.execute("SELECT id, start_time FROM trainings WHERE start_time IS NOT NULL")
    for tid, st in cur.fetchall():
        h, m, s = random.randint(8,18), random.randint(0,59), random.randint(0,59)
        cur.execute("UPDATE trainings SET created_at = %s WHERE id = %s", (f"{st[:10]} {h:02d}:{m:02d}:{s:02d}", tid))
    
    # Fix assessments: created_at matches assess_date
    cur.execute("SELECT id, assess_date FROM assessments WHERE assess_date IS NOT NULL")
    for aid, ad in cur.fetchall():
        h, m, s = random.randint(8,18), random.randint(0,59), random.randint(0,59)
        cur.execute("UPDATE assessments SET created_at = %s WHERE id = %s", (f"{ad} {h:02d}:{m:02d}:{s:02d}", aid))
    
    # Fix visits: created_at matches visit_date
    cur.execute("SELECT id, visit_date FROM visits WHERE visit_date IS NOT NULL")
    for vid, vd in cur.fetchall():
        h, m, s = random.randint(8,18), random.randint(0,59), random.randint(0,59)
        cur.execute("UPDATE visits SET created_at = %s WHERE id = %s", (f"{vd} {h:02d}:{m:02d}:{s:02d}", vid))
    
    conn.commit()
    conn.close()
    print("  Timestamps fixed to match record dates")
