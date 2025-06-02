import json
from pathlib import Path
from collections import defaultdict

def get_type(value):
    if isinstance(value, dict):
        return {k: get_type(v) for k, v in value.items()}
    elif isinstance(value, list):
        if value:
            return [get_type(value[0])]
        else:
            return []
    else:
        return type(value).__name__

# Directory containing the JSON files
input_dir = Path('../llm-logs/extracted_objects')

# Aggregate schema
schema = defaultdict(set)

for json_file in input_dir.glob('object_*.json'):
    with open(json_file, 'r') as f:
        obj = json.load(f)
        def walk(obj, prefix=''):
            if isinstance(obj, dict):
                for k, v in obj.items():
                    key = f'{prefix}.{k}' if prefix else k
                    if isinstance(v, dict) or isinstance(v, list):
                        walk(v, key)
                    else:
                        schema[key].add(type(v).__name__)
            elif isinstance(obj, list):
                for item in obj:
                    walk(item, prefix)
        walk(obj)

# Print the schema
print('Extracted object structure:')
for key, types in sorted(schema.items()):
    print(f'{key}: {" | ".join(sorted(types))}') 