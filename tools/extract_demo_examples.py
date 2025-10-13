import json
import random
from pathlib import Path


def meets_criteria(sample: dict) -> bool:
    if "3" in sample["votesEachTurn"]:
        longer_debate_until_agreement = sample["votesEachTurn"]["3"]["agreed"] is False # not agreement in first turn (voting)
    else:
        longer_debate_until_agreement = not (sample["globalMemory"][1]["agreement"] and sample["globalMemory"][2]["agreement"]) # not agreement in first turn (consensus)

    offensive = "suicide" in sample["input"][0]
    if offensive:
        print("Sample is offensive: " + sample["input"][0])
    if not longer_debate_until_agreement:
        print("Sample does not have a longer debate until agreement: " + sample["input"][0])

    return longer_debate_until_agreement and not offensive


def main() -> None:
    # Resolve repo root from this file's location
    repo_root = Path(__file__).resolve().parent.parent
    dataset_dir = repo_root / "exp1/out"
    output_dir = repo_root / "docs" / "llm-logs" / "extracted_objects"

    output_dir.mkdir(parents=True, exist_ok=True)

    # Clear previous extractions to guarantee final count matches dataset files
    for old_file in output_dir.glob("*.json"):
        try:
            old_file.unlink()
        except OSError:
            pass

    json_files = sorted(dataset_dir.glob("*.json"))
    if not json_files:
        raise SystemExit(f"No JSON files found in {dataset_dir}")

    num_written = 0
    for idx, json_path in enumerate(json_files, start=1):
        with open(json_path, "r", encoding="utf-8") as f:
            data = json.load(f)

        if isinstance(data, list) and data:
            sample = random.choice(data)

            while not meets_criteria(sample):
                print("Sample does not meet criteria. Retrying...")
                sample = random.choice(data)
        else:
            # Fallback: if not a non-empty list, write the whole object
            sample = data

        out_path = output_dir / json_path.name
        with open(out_path, "w", encoding="utf-8") as f:
            json.dump(sample, f, ensure_ascii=False, indent=2)
        num_written += 1

    print(f"Successfully extracted {num_written} objects to {output_dir}")


if __name__ == "__main__":
    main()


