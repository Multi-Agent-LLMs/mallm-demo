import json
import os
from pathlib import Path

# Create output directory if it doesn't exist
output_dir = Path('../llm-logs/extracted_objects')
output_dir.mkdir(exist_ok=True)

# Read the input JSON file
input_file = 'output_mmlu_pro_repeat1.json'
with open(input_file, 'r') as f:
    data = json.load(f)

# Extract each object and save to a separate file
for i, obj in enumerate(data):
    output_file = output_dir / f'object_{i+1}.json'
    with open(output_file, 'w') as f:
        json.dump(obj, f, indent=2)

print(f'Successfully extracted {len(data)} objects to {output_dir}/') 