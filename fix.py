import re
f = open('src/app/api/seed-talk/route.ts', 'r', encoding='utf-8')
text = f.read()
f.close()

text = re.sub(r'\s*role: "user",', '', text)
text = text.replace('trust_score:', 'thanks_count:')

f = open('src/app/api/seed-talk/route.ts', 'w', encoding='utf-8')
f.write(text)
f.close()
print('Done')
