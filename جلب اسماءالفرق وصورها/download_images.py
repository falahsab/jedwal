# -*- coding: utf-8 -*-
"""
سكربت تحميل شعارات الفرق تلقائياً وتسميتها بأسماء الفرق بالعربية
"""
import os
import urllib.request
import ssl

# إنشاء مجلد حفظ الصور
output_dir = "teams_images"
os.makedirs(output_dir, exist_ok=True)

# قائمة الفرق وروابط الصور المستخرجة من كود HTML
teams = [
    ("برشلونة", "https://jdwel.com/image/teams/3337.png"),
    ("شتوتغارت", "https://jdwel.com/image/teams/2036.png"),
    ("مانشستر سيتي", "https://jdwel.com/image/teams/2185.png"),
    ("أستون فيلا", "https://jdwel.com/image/teams/767.png"),
    ("بوروسيا دورتموند", "https://jdwel.com/image/teams/1326.png"),
    ("ريال بيتيس", "https://jdwel.com/image/teams/2776.png"),
    ("ريال مدريد", "https://jdwel.com/image/teams/2605.png"),
    ("آيك أثينا", "https://jdwel.com/image/teams/2306.png"),
    ("آرسنال", "https://jdwel.com/image/teams/2999.png"),
    ("أتلتيكو مدريد", "https://jdwel.com/image/teams/6403.png"),
    ("بايرن ميونخ", "https://jdwel.com/image/teams/1300.png"),
    ("بودو غليمت", "https://jdwel.com/image/teams/1459.png"),
    ("كومو", "https://jdwel.com/image/teams/2520.png"),
    ("فنربخشة", "https://jdwel.com/image/teams/1681.png"),
    ("غلطة سراي", "https://jdwel.com/image/teams/1416.png"),
    ("لانس", "https://jdwel.com/image/teams/fra_lens.png"),
    ("ليفربول", "https://jdwel.com/image/teams/1512.png"),
    ("مانشستر يونايتد", "https://jdwel.com/image/teams/3092.png"),
    ("نابولي", "https://jdwel.com/image/teams/3854.png"),
    ("باريس سان جيرمان", "https://jdwel.com/image/teams/2347.png"),
    ("آيندهوفن", "https://jdwel.com/image/teams/1307.png"),
    ("لايبزيغ", "https://jdwel.com/image/teams/2849.png"),
    ("روما", "https://jdwel.com/image/teams/2435.png"),
    ("صباح", "https://jdwel.com/image/teams/964.png"),
    ("شاختار دونيتسك", "https://jdwel.com/image/teams/1408.png"),
    ("سلافيا براغ", "https://jdwel.com/image/teams/1019.png"),
    ("سلوفان براتيسلافا", "https://jdwel.com/image/teams/3369.png"),
    ("سبورتينغ لشبونة", "https://jdwel.com/image/teams/5958.png"),
    ("كلوب بروج", "https://jdwel.com/image/teams/5895.png"),
    ("ليل", "https://jdwel.com/image/teams/3190.png"),
    ("فياريال", "https://jdwel.com/image/teams/1680.png"),
    ("إنتر ميلان", "https://jdwel.com/image/teams/2034.png"),
    ("لاسك", "https://jdwel.com/image/teams/1167.png"),
    ("فايكنغ", "https://jdwel.com/image/teams/2338.png"),
    ("بورتو", "https://jdwel.com/image/teams/1443.png"),
    ("فاينورد", "https://jdwel.com/image/teams/1406.png"),
]

# تجاوز التحقق من شهادة SSL إن وجد عائق
ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

headers = {'User-Agent': 'Mozilla/5.0'}

print(f"⏳ بدء تحميل {len(teams)} صورة إلى المجلد: {output_dir}/ ...")

for index, (name, url) in enumerate(teams, 1):
    file_path = os.path.join(output_dir, f"{name}.png")
    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, context=ctx) as response, open(file_path, 'wb') as out_file:
            out_file.write(response.read())
        print(f"[{index}/{len(teams)}] ✔️ تم تحميل: {name}.png")
    except Exception as e:
        print(f"[{index}/{len(teams)}] ❌ فشل تحميل {name}: {e}")

print("\n🎉 اكتمل التحميل بنجاح في مجلد 'teams_images'!")
