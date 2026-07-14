with open("scripts/debug_strings.txt", "r", encoding="utf-8") as f:
    for line in f:
        if "In Thai, the translation" in line and "Sawatdee" in line:
            print(line.strip())
