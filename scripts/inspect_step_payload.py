import string

with open("scripts/step_2.txt", "rb") as f:
    data = f.read()

# Extract printable strings
printable = set(string.printable.encode('ascii'))
current = bytearray()
strings = []

for b in data:
    if b in printable:
        current.append(b)
    else:
        if len(current) > 4:
            strings.append(current.decode('ascii', errors='ignore'))
        current = bytearray()
if len(current) > 4:
    strings.append(current.decode('ascii', errors='ignore'))

for s in strings:
    if len(s.strip()) > 5:
        print(repr(s.strip()))
