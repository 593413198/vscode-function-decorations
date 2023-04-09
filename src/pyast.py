# coding: utf-8
import ast
import os
import time

def parse(path):
    try:
        t = time.time()
        with open(path) as f:
            tree = ast.parse(f.read())
            # check here
            print (time.time() - t, path)
    except:
        pass

target = r''
for path, dirs, files in os.walk(target):
    if 'data' in path:
        continue
    for f in files:
        parse(os.path.join(path, f))