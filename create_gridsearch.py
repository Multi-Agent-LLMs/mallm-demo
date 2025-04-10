import json
from itertools import product

# Load grid search parameters
parameters = {
    "models": ["meta-llama/Llama-3.1-70B-Instruct"],
    "datasets": ["StrategyQA"],
    "response_generators": ["simple", "critical", "reasoning"],
    "persona_generators": ["nopersona", "expert", "ipip"],
    "discussion_paradigms": ["memory", "relay", "report", "debate"],
    "decision_protocols": ["majority_consensus", "unanimity_consensus", "simple_voting", "approval_voting"]
}

# Define the common settings based on exp1_batch.json
common_settings = {
    "repeats": 1,
    "common": {
        "endpoint_url": "http://XXX:8081/v1",
        "model_name": "meta-llama/Llama-3.1-70B-Instruct",
        "input_json_file_path": "exp1/strategyqa.json",
        "task_instruction_prompt_template": "strategyqa",
        "api_key": "-",
        "max_turns": 7,
        "skip_decision_making": True,
        "visible_turns_in_memory": 1,
        "debate_rounds": 2,
        "concurrent_api_requests": 250,
        "use_baseline": False,
        "use_chain_of_thought": True,
        "num_agents": 3,
        "num_neutral_agents": 0,
        "agent_generator": "expert",
        "trust_remote_code": False,
        "use_ablation": False,
        "shuffle_input_samples": True,
        "all_agents_generate_first_draft": False,
        "all_agents_generate_draft": False,
        "calculate_persona_diversity": True,
        "num_samples": 100
    }
}

# Generate grid search combinations
combinations = list(product(
    parameters["models"],
    parameters["datasets"],
    parameters["response_generators"],
    parameters["persona_generators"],
    parameters["discussion_paradigms"],
    parameters["decision_protocols"]
))

# Create JSON objects for each combination
runs_json = []
for combo in combinations:
    model, dataset, response_gen, persona_gen, discussion_paradigm, decision_protocol = combo
    run_config = {
        "model_name": model,
        "response_generator": response_gen,
        "agent_generator": persona_gen,
        "discussion_paradigm": discussion_paradigm,
        "decision_protocol": decision_protocol,
        "output_json_file_path": f"exp1/out/output_{dataset}_{response_gen}_{persona_gen}_{discussion_paradigm}_{decision_protocol}.json"
    }
    runs_json.append(run_config)

grid_search_json = {**common_settings, "runs": runs_json}

# Save to a JSON file
with open('grid_search_output.json', 'w') as f:
    json.dump(grid_search_json, f, indent=4)

print("Grid search JSON generated and saved to grid_search_output.json")
