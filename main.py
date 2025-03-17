import json
from itertools import product

def generate_configs():
    # Load grid search parameters
    with open('gridsearch_parameters', 'r') as file:
        grid_params = json.load(file)

    # Extract parameter lists
    models = grid_params.get('models', [])
    datasets = grid_params.get('datasets', [])
    response_generators = grid_params.get('response_generators', [])
    persona_generators = grid_params.get('persona_generators', [])
    discussion_paradigms = grid_params.get('discussion_paradigms', [])
    decision_protocols = grid_params.get('decision_protocols', [])

    # Generate all combinations of parameters
    combinations = product(models, datasets, response_generators, persona_generators, discussion_paradigms, decision_protocols)

    # Create configuration objects
    configs = []
    for combination in combinations:
        config = {
            'model_name': combination[0],
            'dataset': combination[1],
            'response_generator': combination[2],
            'persona_generator': combination[3],
            'discussion_paradigm': combination[4],
            'decision_protocol': combination[5]
        }
        configs.append(config)

    print(f"Generated {len(configs)} configurations")
    for config in configs:
        print(json.dumps(config, indent=2)) 


def main():
    generate_configs()

if __name__ == "__main__":
    main()