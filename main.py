import json
from itertools import product
from mallm.scheduler import Scheduler
from mallm.utils.config import Config

def generate_configs(endpoint_url="http://127.0.0.1:8080/v1"):
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
        config = Config(
            endpoint_url = endpoint_url,
            model_name = combination[0],
            input_json_file_path = combination[1],
            response_generator = combination[2],
            agent_generator = combination[3],
            discussion_paradigm = combination[4],
            decision_protocol = combination[5],
            output_json_file_path = f"out/{combination[0]}_{combination[1]}_{combination[2]}_{combination[3]}_{combination[4]}_{combination[5]}.json",
        )
        configs.append(config)

    print(f"Generated {len(configs)} configurations")
    return configs


def main():
    configs = generate_configs()
    for config in configs:
        mallm_scheduler = Scheduler(config)
        mallm_scheduler.run()

if __name__ == "__main__":
    main()