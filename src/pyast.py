# coding: utf-8

import ast
import sys
import json
from collections import defaultdict


class LowbAstParser(object):

    def __init__(self):
        self.linenos = defaultdict(list)
        self.reversed_attrs = {
            'is_client' : 'is_server',
            'is_server' : 'is_client',
        }

    def _entry(self, path):
        with open(path) as f:
            tree = ast.parse(f.read())
            self.walk_tree(tree)
    
    def capture_defs(self, attr, body):
        linenos = [
            i.lineno + len(i.decorator_list) for i in body if isinstance(i, ast.FunctionDef)
        ]
        self.linenos[attr].extend(linenos)
    
    def parse_node(self, node):
        if isinstance(node, ast.If):
            attr = getattr(node.test, 'attr', '')
            if attr not in ('is_server', 'is_client'):
                return
            self.capture_defs(attr, node.body)
            if node.orelse:
                attr = self.reversed_attrs[attr]
                self.capture_defs(attr, node.orelse)
            # TODO 处理elif

    def walk_tree(self, tree):
        for node in ast.walk(tree):
            self.parse_node(node)

if __name__ == '__main__':
    parser = LowbAstParser()
    if len(sys.argv) > 1:
        parser._entry(sys.argv[1])
    else:
        parser._entry(r'./src/demo.py')
    print json.dumps(dict(parser.linenos))
