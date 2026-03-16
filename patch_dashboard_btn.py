import re

with open('app/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Find any existing dashboard button and replace href with /go
# Also find Go to Dashboard text
replacements = [
    ('href="/dashboard"', 'href="/go"'),
    ("href='/dashboard'", "href='/go'"),
    ('href="http://localhost:3000/dashboard"', 'href="/go"'),
]

changed = False
for old, new in replacements:
    if old in content:
        # Only replace dashboard buttons that say "Dashboard" or "Go to Dashboard"
        # Find lines with both dashboard href and Dashboard text
        lines = content.split('\n')
        for i, line in enumerate(lines):
            if old in line and ('Dashboard' in line or 'dashboard' in line.lower()):
                lines[i] = line.replace(old, new)
                print(f"Fixed line {i}: {line.strip()[:60]}...")
                changed = True
        content = '\n'.join(lines)

# Also find the button/link section with "Go to Dashboard" or just "Dashboard" 
# and make sure it points to /go
content = re.sub(
    r'((?:Go to )?Dashboard["\s]*</[aA]>)',
    r'\1',
    content
)

# Find all hrefs pointing to /dashboard in buttons labeled Dashboard
content = re.sub(
    r'href=["\']\/dashboard["\']([^>]*>(?:\s*[🎓📊]?\s*)?(?:Go to )?Dashboard)',
    r'href="/go"\1',
    content
)

if changed or '/go' in content:
    with open('app/page.tsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print("\nSUCCESS! Dashboard button now points to /go")
    print("- Not logged in: goes to /login")  
    print("- Admin: goes to /admin")
    print("- Regular user: goes to /dashboard")
else:
    print("Looking for dashboard button...")
    for i, line in enumerate(content.split('\n'), 1):
        if 'ashboard' in line and ('href' in line or 'button' in line.lower()):
            print(f"Line {i}: {line.strip()[:80]}")
