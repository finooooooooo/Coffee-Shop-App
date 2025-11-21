import psutil
import os

print('Current Process ID:', os.getpid())
for proc in psutil.process_iter(['pid', 'name', 'cmdline']):
    if 'python' in proc.info['name'].lower():
        cmdline = ' '.join(proc.info['cmdline'] or [])
        if 'flask' in cmdline or 'app' in cmdline:
            print(f'Python process: PID={proc.info["pid"]}, CMD={cmdline}')
