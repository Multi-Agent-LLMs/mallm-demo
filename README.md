# MALLM Demo
This web application provides an interactive visualization of multi-agent collaborative reasoning discussions. It allows you to explore how different AI personas work together to answer questions, showing the step-by-step process and voting results for each turn.

Read the [EMNLP 2025 Demo](https://aclanthology.org/2025.emnlp-demos.29/).

## Features

- View the discussion step-by-step through multiple turns
- See different AI personas and their contributions
- Track voting and consensus formation across turns
- Visualize the final answer and agreement process

## How to Use

1. Open `index.html` in a modern web browser
2. Navigate through the discussion using the "Previous Turn" and "Next Turn" buttons
3. Examine each agent's contribution and reasoning in the center panel
4. See voting results for each turn in the right panel

## Data Format

The application reads data from `discussion-data.json`, which should follow the format demonstrated in the included example. This format captures:

- Agent personas and descriptions
- Task instructions and questions
- Messages exchanged during each turn
- Voting results for each turn
- Final consensus answer

## Customizing

To visualize a different discussion:
1. Replace the content in `discussion-data.json` with your own data following the same format
2. Refresh the page to see the new discussion

## Technical Details

- Built with pure HTML, CSS, and JavaScript (no dependencies)
- Responsive design works on desktop and mobile devices
- Color-coded agent messages for easier tracking

## Citation

```
@inproceedings{becker-etal-2025-mallm,
    title = "{MALLM}: Multi-Agent Large Language Models Framework",
    author = "Becker, Jonas  and
      Kaesberg, Lars Benedikt  and
      Bauer, Niklas  and
      Wahle, Jan Philip  and
      Ruas, Terry  and
      Gipp, Bela",
    editor = {Habernal, Ivan  and
      Schulam, Peter  and
      Tiedemann, J{\"o}rg},
    booktitle = "Proceedings of the 2025 Conference on Empirical Methods in Natural Language Processing: System Demonstrations",
    month = nov,
    year = "2025",
    address = "Suzhou, China",
    publisher = "Association for Computational Linguistics",
    url = "https://aclanthology.org/2025.emnlp-demos.29/",
    doi = "10.18653/v1/2025.emnlp-demos.29",
    pages = "418--439",
    ISBN = "979-8-89176-334-0",
    abstract = "Multi-agent debate (MAD) has demonstrated the ability to augment collective intelligence by scaling test-time compute and leveraging expertise. Current frameworks for MAD are often designed towards tool use, lack integrated evaluation, or provide limited configurability of agent personas, response generators, discussion paradigms, and decision protocols. We introduce MALLM (Multi-Agent Large Language Models), an open-source framework that enables systematic analysis of MAD components. MALLM offers more than 144 unique configurations of MAD, including (1) agent personas (e.g., Expert, Personality), (2) response generators (e.g., Critical, Reasoning), (3) discussion paradigms (e.g., Memory, Relay), and (4) decision protocols (e.g., Voting, Consensus). MALLM uses simple configuration files to define a debate. Furthermore, MALLM can load any textual Hugging Face dataset (e.g., MMLU-Pro, WinoGrande) and provides an evaluation pipeline for easy comparison of MAD configurations. MALLM enables researchers to systematically configure, run, and evaluate debates for their problems, facilitating the understanding of the components and their interplay."
}
```
