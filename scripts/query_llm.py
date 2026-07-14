import sys
import subprocess
import json
import sqlite3
import time
import re

def is_printable_text(s):
    if not s:
        return False
    printable_chars = 0
    for c in s:
        if 32 <= ord(c) < 127 or ord(c) > 127 or c in '\n\r\t':
            printable_chars += 1
    ratio = printable_chars / len(s)
    return ratio > 0.9

def decode_protobuf_strings(data):
    strings = []
    i = 0
    while i < len(data):
        # Read a varint tag
        tag = 0
        shift = 0
        while i < len(data):
            b = data[i]
            i += 1
            tag |= (b & 0x7f) << shift
            shift += 7
            if not (b & 0x80):
                break
        else:
            break
            
        wire_type = tag & 0x7
        field_num = tag >> 3
        
        if wire_type == 0: # Varint
            while i < len(data):
                b = data[i]
                i += 1
                if not (b & 0x80):
                    break
        elif wire_type == 1: # 64-bit
            i += 8
        elif wire_type == 2: # Length-delimited (string or sub-message)
            length = 0
            shift = 0
            while i < len(data):
                b = data[i]
                i += 1
                length |= (b & 0x7f) << shift
                shift += 7
                if not (b & 0x80):
                    break
            else:
                break
            
            val = data[i:i+length]
            i += length
            
            decoded_str = None
            try:
                s = val.decode('utf-8')
                if is_printable_text(s):
                    decoded_str = s
                    strings.append((field_num, s))
            except Exception:
                pass
            
            # Only recursively parse if it is NOT a valid printable string
            if decoded_str is None:
                try:
                    sub_strings = decode_protobuf_strings(val)
                    strings.extend(sub_strings)
                except Exception:
                    pass
        elif wire_type == 5: # 32-bit
            i += 4
    return strings

def query_gemini(prompt, model="flash"):
    cmd = ["agentapi.bat", "new-conversation", f"--model={model}", prompt]
    proc = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8")
    if proc.returncode != 0:
        return None
        
    try:
        res = json.loads(proc.stdout)
        conv_id = res["response"]["newConversation"]["conversationId"]
    except Exception as e:
        return None
        
    db_path = rf"C:\Users\team7\.gemini\antigravity\conversations\{conv_id}.db"
    
    # Poll database for completion
    completed = False
    start_time = time.time()
    while time.time() - start_time < 120: # 2 minutes timeout
        time.sleep(1.5)
        try:
            conn = sqlite3.connect(db_path)
            cursor = conn.cursor()
            cursor.execute("SELECT status FROM steps WHERE step_type=23")
            row = cursor.fetchone()
            conn.close()
            if row and row[0] == 3:
                completed = True
                break
        except sqlite3.OperationalError:
            pass
            
    if not completed:
        return None
        
    # Read response payload
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        cursor.execute("SELECT step_payload FROM steps WHERE step_type=15 ORDER BY idx DESC")
        row = cursor.fetchone()
        conn.close()
    except Exception as e:
        return None
        
    if not row or not row[0]:
        return None
        
    payload = row[0]
    decoded = decode_protobuf_strings(payload)
    
    response = None
    thoughts = None
    
    uuid_pattern = re.compile(r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$', re.IGNORECASE)
    
    for fn, val in decoded:
        if fn == 1:
            if not uuid_pattern.match(val) and len(val) > 5 and "sessionID" not in val:
                if not response or len(val) > len(response):
                    response = val
        elif fn == 3:
            if val.startswith("**") or len(val) > 20:
                if not thoughts or len(val) > len(thoughts):
                    thoughts = val
                    
    return {
        "conversationId": conv_id,
        "thoughts": thoughts,
        "response": response
    }

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python query_llm.py <prompt> [model]")
        sys.exit(1)
    prompt = sys.argv[1]
    model = sys.argv[2] if len(sys.argv) > 2 else "flash"
    
    res = query_gemini(prompt, model)
    if res:
        with open("scripts/query_res.json", "w", encoding="utf-8") as f:
            json.dump(res, f, indent=2, ensure_ascii=False)
        print("Result written to scripts/query_res.json")
        print(json.dumps(res, indent=2, ensure_ascii=True))
    else:
        sys.exit(1)
