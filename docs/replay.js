document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const instructionText = document.getElementById('instruction-text');
    const questionText = document.getElementById('question-text');
    const personasList = document.getElementById('personas-list');
    const messagesContainer = document.getElementById('messages-container');
    const turnProgress = document.getElementById('turn-progress');
    const currentTurnSpan = document.getElementById('current-turn');
    const maxTurnsSpan = document.getElementById('max-turns');
    const responseGeneratorSelect = document.getElementById('response-generator');
    const personaGeneratorSelect = document.getElementById('persona-generator');
    const discussionParadigmSelect = document.getElementById('discussion-paradigm');
    const decisionProtocolSelect = document.getElementById('decision-protocol');
    const loadConversationBtn = document.getElementById('load-conversation');
    const currentConfigFileSpan = document.getElementById('current-config-file');
    const loadingIndicator = document.getElementById('loading-indicator');
    const startReplayBtn = document.getElementById('start-replay');
    const stopReplayBtn = document.getElementById('stop-replay');
    const replaySpeedSlider = document.getElementById('replay-speed');
    const speedValueSpan = document.getElementById('speed-value');
    const replayCompleteModal = document.getElementById('replay-complete-modal');
    const modalFinalAnswer = document.getElementById('modal-final-answer');
    const replayAgainBtn = document.getElementById('replay-again');
    const closeModalBtn = document.getElementById('close-modal');

    // Create floating stop button for mobile
    const floatingStopBtn = document.createElement('button');
    floatingStopBtn.className = 'floating-stop-btn';
    floatingStopBtn.innerHTML = '<i class="fas fa-stop"></i>';
    document.body.appendChild(floatingStopBtn);
    
    // Create discussion play overlay
    const discussionPlayOverlay = document.createElement('div');
    discussionPlayOverlay.className = 'discussion-play-overlay';
    discussionPlayOverlay.innerHTML = `
        <div class="discussion-play-button">
            <i class="fas fa-play"></i>
        </div>
        <div class="play-text">Click to start replay</div>
    `;
    
    // State
    let discussionData = null;
    let currentTurn = 1;
    let maxTurns = 0;
    let agentPersonas = []; // Store the list of agent personas
    let agentColorMap = {}; // Map agent names to color classes
    let agentIconMap = {}; // Map agent names to SVG icon files
    let currentConversationFile = ''; // Will be constructed from component selections
    let isReplaying = false;
    let replaySpeed = 1.0; // Default replay speed
    let replayTimeouts = []; // Store all timeouts for cancellation if needed
    let previousAgent = null;
    let previousAgentsByTurn = {}; // Track the previous agent for each turn
    let discussionParadigm = "Unknown";

    // Available SVG icons from the images folder
    const availableIcons = [
        'images/1F468.svg',           // Man
        'images/1F469.svg',           // Woman
        'images/1F474.svg',           // Old man
        'images/1F475.svg',           // Old woman
        'images/1F468-200D-1F9B0.svg', // Man with red hair
        'images/1F469-200D-1F9B0.svg', // Woman with red hair
        'images/1F468-200D-1F9B1.svg', // Man with curly hair
        'images/1F468-200D-1F9B3.svg', // Man with white hair
        'images/1F469-200D-1F9B3.svg', // Woman with white hair
        'images/1F9D4-200D-2642-FE0F.svg', // Man with beard
        'images/1F471-200D-2642-FE0F.svg', // Person with blond hair
        'images/1F471-200D-2640-FE0F.svg'  // Woman with blond hair
    ];

    // Agent color scheme - using colors distinct from agree/disagree (green/red)
    const agentColors = [
        { bg: '#e3f2fd', accent: '#1976d2', light: '#bbdefb' }, // Blue
        { bg: '#ede7f6', accent: '#673ab7', light: '#d1c4e9' }, // Purple
        { bg: '#fff8e1', accent: '#ffc107', light: '#ffecb3' }, // Amber
        { bg: '#e0f2f1', accent: '#009688', light: '#b2dfdb' }, // Teal
        { bg: '#fce4ec', accent: '#e91e63', light: '#f8bbd0' }, // Pink
        { bg: '#fffde7', accent: '#ffeb3b', light: '#fff9c4' }  // Yellow
    ];
    
    // Initialize the app
    init();

    // Event listeners
    loadConversationBtn.addEventListener('click', () => {
        if (isReplaying) {
            stopReplay();
        }
        loadNewConversation();
    });

    startReplayBtn.addEventListener('click', () => {
        startReplay();
    });

    stopReplayBtn.addEventListener('click', () => {
        stopReplay();
    });
    
    // Floating stop button event listener
    floatingStopBtn.addEventListener('click', () => {
        stopReplay();
    });

    replaySpeedSlider.addEventListener('input', () => {
        replaySpeed = parseFloat(replaySpeedSlider.value);
        speedValueSpan.textContent = `${replaySpeed.toFixed(1)}x`;
    });

    replayAgainBtn.addEventListener('click', () => {
        closeModal();
        setTimeout(() => {
            startReplay();
        }, 300);
    });

    closeModalBtn.addEventListener('click', () => {
        closeModal();
    });

    // Add event listeners for component selector changes
    responseGeneratorSelect.addEventListener('change', updateConversationFile);
    personaGeneratorSelect.addEventListener('change', updateConversationFile);
    discussionParadigmSelect.addEventListener('change', updateConversationFile);
    decisionProtocolSelect.addEventListener('change', updateConversationFile);
    
    // Add event listener for window resize to handle scrolling
    window.addEventListener('resize', () => {
        if (isReplaying) {
            scrollChatToBottom();
        }
    });

    // Initialize the application
    function init() {
        // Construct the initial conversation file based on default selections
        updateConversationFile();
        // Load the initial conversation
        fetchDiscussionData()
            .then(data => {
                discussionData = data;
                setupConversation();
                // Add the play overlay to the conversation panel after setup
                showDiscussionPlayOverlay();
            })
            .catch(error => {
                console.error('Error loading discussion data:', error);
                alert('Failed to load discussion data. Please try refreshing the page.');
                hideLoadingIndicator();
            });
    }

    // Function to construct conversation file name from component selections
    function updateConversationFile() {
        const responseGen = responseGeneratorSelect.value;
        const personaGen = personaGeneratorSelect.value;
        const paradigm = discussionParadigmSelect.value;
        const protocol = decisionProtocolSelect.value;
        
        // Construct filename based on component selections
        // Format: output_{responseGen}_{personaGen}_{paradigm}_{protocol}_repeat1.json
        currentConversationFile = `output_StrategyQA_${responseGen}_${personaGen}_${paradigm}_${protocol}_repeat1.json`;
        
        // Update the display
        currentConfigFileSpan.textContent = currentConversationFile;
        
        console.log('Updated conversation file:', currentConversationFile);
    }

    // Function to show play button overlay in the discussion panel
    function showDiscussionPlayOverlay() {
        if (isReplaying) return; // Don't show if already replaying
        
        const conversationPanel = document.querySelector('.conversation-panel .panel-content');
        if (!conversationPanel) return;
        
        // Add the overlay to the panel
        conversationPanel.style.position = 'relative'; // Ensure proper positioning
        conversationPanel.appendChild(discussionPlayOverlay);
        
        // Add click event listener to start replay
        discussionPlayOverlay.querySelector('.discussion-play-button').addEventListener('click', () => {
            startReplay();
        });
    }

    // Function to hide play button overlay
    function hideDiscussionPlayOverlay() {
        if (discussionPlayOverlay.parentElement) {
            discussionPlayOverlay.parentElement.removeChild(discussionPlayOverlay);
        }
    }

    // Load a new conversation
    function loadNewConversation() {
        // Show loading indicator
        showLoadingIndicator();
        
        // Update the conversation file based on current component selections
        updateConversationFile();
        
        // Reset state
        currentTurn = 1;
        resetUI();
        
        // Fetch and load the new conversation
        fetchDiscussionData()
            .then(data => {
                discussionData = data;
                setupConversation();
                hideLoadingIndicator();
                // Show play overlay after loading new conversation
                showDiscussionPlayOverlay();
            })
            .catch(error => {
                console.error('Error loading discussion data:', error);
                alert(`Failed to load conversation data for configuration: ${currentConversationFile}. Please try a different combination or refresh the page.`);
                hideLoadingIndicator();
            });
    }
    
    // Setup conversation after data is loaded
    function setupConversation() {
        // Reset the agent personas and color mapping
        maxTurns = discussionData.turns;
        agentPersonas = discussionData.personas.map(p => p.persona);
        
        // Store the discussion paradigm if available
        discussionParadigm = discussionData.paradigm || "Unknown";
        
        // Create a mapping from agent names to color classes (1-6)
        agentColorMap = {};
        agentIconMap = {};
        
        // Shuffle the agent colors to have random assignment each time
        const shuffledColors = [...Array(agentColors.length).keys()].sort(() => Math.random() - 0.5);
        
        agentPersonas.forEach((persona, index) => {
            // Use shuffled colors for random color assignment
            const colorIndex = (shuffledColors[index % shuffledColors.length] % 6) + 1;
            agentColorMap[persona] = colorIndex;
            
            // Randomly assign an icon to each agent
            const randomIconIndex = Math.floor(Math.random() * availableIcons.length);
            agentIconMap[persona] = availableIcons[randomIconIndex];
        });
        
        // Initialize the UI
        initializeUI();
        updateTurnInfo();
    }

    // Functions
    async function fetchDiscussionData() {
        try {
            const response = await fetch(`llm-logs/extracted_objects/${currentConversationFile}`);
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching discussion data:', error);
            throw error;
        }
    }

    function initializeUI() {
        // Set instruction and question
        instructionText.textContent = discussionData.instruction;
        
        // Format the input text to properly display multiple choice options if present
        const inputText = discussionData.input[0];
        
        // Check if the input contains multiple choice options (A), B), etc.)
        if (inputText.match(/[A-Z]\)\s+/)) {
            // Format multiple choice options
            const formattedText = formatMultipleChoiceQuestion(inputText);
            questionText.innerHTML = formattedText;
        } else {
            // Regular text without options
            questionText.textContent = inputText;
        }
        
        // Clear containers
        messagesContainer.innerHTML = '';
        
        // Render personas
        renderPersonas();
        
        // Set turn counter info
        currentTurnSpan.textContent = currentTurn;
        maxTurnsSpan.textContent = maxTurns;
        
        // Reset progress bar
        turnProgress.style.width = `${(currentTurn / maxTurns) * 100}%`;
    }

    // Function to format multiple choice questions
    function formatMultipleChoiceQuestion(text) {
        // First identify the question part (before the options)
        let questionPart = '';
        let optionsPart = '';
        
        // Look for the first option pattern (A), B), etc)
        const optionStartMatch = text.match(/[A-Z]\)\s+/);
        
        if (optionStartMatch && optionStartMatch.index > 0) {
            questionPart = text.substring(0, optionStartMatch.index);
            optionsPart = text.substring(optionStartMatch.index);
        } else {
            // If no match, return the original text
            return text;
        }
        
        // Format the question part
        const formattedQuestion = `<div class="question-text">${questionPart}</div>`;
        
        // Format options - replace each option with styled version
        const formattedOptions = optionsPart.replace(/([A-Z]\))\s+([^\n]+)(?:\n|$)/g, 
            '<div class="multiple-choice-option"><span class="option-letter">$1</span> $2</div>');
        
        return formattedQuestion + '<div class="multiple-choice-options">' + formattedOptions + '</div>';
    }

    function renderPersonas() {
        personasList.innerHTML = '';
        discussionData.personas.forEach(persona => {
            const colorClass = agentColorMap[persona.persona];
            const iconSrc = agentIconMap[persona.persona];
            const personaEl = document.createElement('div');
            personaEl.className = `persona-item agent-color-${colorClass}`;
            
            personaEl.innerHTML = `
                <div class="persona-name">
                    <span class="persona-color-indicator color-${colorClass}"></span>
                    <img src="${iconSrc}" class="persona-icon" alt="${persona.persona} icon"> ${persona.persona}
                </div>
                <div class="persona-description">
                    <i class="fas fa-info-circle"></i> ${persona.personaDescription}
                </div>
            `;
            
            personasList.appendChild(personaEl);
        });
    }

    function startReplay() {
        if (isReplaying) return;
        
        isReplaying = true;
        startReplayBtn.disabled = true;
        stopReplayBtn.disabled = false;
        loadConversationBtn.disabled = true;
        
        // Hide the discussion play overlay when replay starts
        hideDiscussionPlayOverlay();
        
        // Show floating stop button
        floatingStopBtn.classList.add('visible');
        
        // Reset UI before starting replay
        resetUI();
        
        // Reassign random icons for each agent on replay start
        agentPersonas.forEach(persona => {
            const randomIconIndex = Math.floor(Math.random() * availableIcons.length);
            agentIconMap[persona] = availableIcons[randomIconIndex];
        });
        
        // Start from turn 1
        currentTurn = 1;
        updateTurnInfo();
        
        // Begin the replay sequence
        replaySequence();
    }
    
    function stopReplay() {
        isReplaying = false;
        startReplayBtn.disabled = false;
        stopReplayBtn.disabled = true;
        loadConversationBtn.disabled = false;
        
        // Hide floating stop button
        floatingStopBtn.classList.remove('visible');
        
        // Clear all timeouts to stop any pending animations
        replayTimeouts.forEach(timeout => clearTimeout(timeout));
        replayTimeouts = [];
        
        // Stop all animations by removing any in-progress animations
        const animatingElements = document.querySelectorAll('[style*="animation"], [style*="transition"]');
        animatingElements.forEach(el => {
            el.style.animation = 'none';
            el.style.transition = 'none';
        });
        
        // Add a small notification that replay was stopped
        const stoppedNotice = document.createElement('div');
        stoppedNotice.className = 'replay-stopped-notice';
        stoppedNotice.innerHTML = '<i class="fas fa-hand-paper"></i> Replay stopped';
        messagesContainer.appendChild(stoppedNotice);
        
        // Scroll to show the notice
        scrollChatToBottom();
        
        // Remove the notice after 2 seconds
        setTimeout(() => {
            if (messagesContainer.contains(stoppedNotice)) {
                messagesContainer.removeChild(stoppedNotice);
            }
        }, 2000);
    }
    
    function resetUI() {
        messagesContainer.innerHTML = '';
        currentTurn = 1;
        updateTurnInfo();
        
        // Remove play button overlay if it exists
        hideDiscussionPlayOverlay();
    }
    
    function updateTurnInfo() {
        currentTurnSpan.textContent = currentTurn;
        turnProgress.style.width = `${(currentTurn / maxTurns) * 100}%`;
    }
    
    function replaySequence() {
        if (!isReplaying) return; // Early check
        
        // Clear previous timeouts
        replayTimeouts.forEach(timeout => clearTimeout(timeout));
        replayTimeouts = [];
        
        // If this is the first turn, show the task setup first
        if (currentTurn === 1) {
            displayTaskSetup();
            return;
        }
        
        // For subsequent turns, just start the turn replay directly
        startTurnReplay();
    }

    function formatMessageContent(content, currentPersona, previousAgent) {
        // Create a temporary div to work with the content as DOM
        const tempDiv = document.createElement('div');
        
        // Replace [AGREE] with "agrees with [previous agent]" if previous agent exists
        if (previousAgent && previousAgent !== currentPersona) {
            const colorClass = agentColorMap[previousAgent];
            const iconSrc = agentIconMap[previousAgent];            
            content = content.replace(/\[AGREE\]/g, `<span class="agreed-tag"><i class="fas fa-check-circle"></i> agrees with ${previousAgent}</span>`);
            
            // Add support for [DISAGREE] tags
            content = content.replace(/\[DISAGREE\]/g, `<span class="disagreed-tag"><i class="fas fa-circle-xmark"></i> disagrees with ${previousAgent}</span>`);
        } else {
            // If no previous agent or it's the same agent, just use a generic AGREE tag
            content = content.replace(/\[AGREE\]/g, `<span class="agreed-tag"><i class="fas fa-check-circle"></i> AGREE</span>`);
            
            // Generic DISAGREE tag when no previous agent
            content = content.replace(/\[DISAGREE\]/g, `<span class="disagreed-tag"><i class="fas fa-circle-xmark"></i> DISAGREE</span>`);
        }
        
        // Replace [SAME] with similar styled tag
        content = content.replace(/\[SAME\]/g, `<span class="agreed-tag"><i class="fas fa-check-circle"></i> SAME</span>`);
        
        // Convert markdown-style formatting
        content = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        content = content.replace(/\n\n/g, '<br><br>');
        
        // We'll handle the agent name replacements directly in the text before creating DOM elements
        // This avoids any DOM manipulation issues that might cause duplication
        Object.keys(agentColorMap).forEach(persona => {
            if (persona !== currentPersona) {
                // Use word boundary to ensure we match full names
                const regex = new RegExp(`\\b${escapeRegExp(persona)}\\b`, 'g');
                const colorClass = agentColorMap[persona];
                const iconSrc = agentIconMap[persona];
                
                // Do a direct string replacement
                content = content.replace(regex, 
                    `<span class="agent-mention mention-color-${colorClass}"><img src="${iconSrc}" class="agent-icon-small" alt="${persona} icon"> ${persona}</span>`);
            }
        });
        
        // Set the processed content to the temp div
        tempDiv.innerHTML = content;
        
        return tempDiv.innerHTML;
    }
    
    // Helper function to escape special regex characters
    function escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    function showCompletionModal() {
        modalFinalAnswer.textContent = discussionData.finalAnswer;
        replayCompleteModal.style.display = 'flex';
    }
    
    function closeModal() {
        replayCompleteModal.style.display = 'none';
    }
    
    function showLoadingIndicator() {
        loadingIndicator.style.display = 'flex';
    }
    
    function hideLoadingIndicator() {
        loadingIndicator.style.display = 'none';
    }

    // Improved scroll behaviour: auto-scroll only if user is already near the bottom
    function scrollChatToBottom(force = false) {
        const chatContainer = document.querySelector('.conversation-panel .panel-content');
        if (!chatContainer) return;

        // Determine if the user is currently near the bottom (200 px threshold)
        const threshold = 200; // px
        const distanceFromBottom = chatContainer.scrollHeight - chatContainer.scrollTop - chatContainer.clientHeight;
        const shouldScroll = force || distanceFromBottom <= threshold;

        if (!shouldScroll) return; // Respect the user's scroll position

        // Scroll to bottom immediately
        chatContainer.scrollTop = chatContainer.scrollHeight;

        const isMobile = window.innerWidth <= 992;

        // After content has rendered, ensure we're still at bottom
        setTimeout(() => {
            chatContainer.scrollTop = chatContainer.scrollHeight;

            // On mobile, optionally scroll the window if chat panel is out of view
            if (isMobile) {
                window.scrollTo({
                    top: document.body.scrollHeight,
                    behavior: 'smooth'
                });
            }
        }, isMobile ? 300 : 50);
    }

    // Function to display the turn paradigm indicator before the first message
    function displayTurnParadigmIndicator(firstMessage) {
        const paradigm = discussionData.paradigm || "Unknown paradigm";
        
        const indicatorEl = document.createElement('div');
        indicatorEl.className = 'turn-paradigm-indicator';
        
        indicatorEl.innerHTML = `
            <div class="paradigm-info">
                <i class="fas fa-random"></i> Discussion paradigm: <strong>${paradigm}</strong>
            </div>
            <div class="next-agent-wrapper">
                <span>Next agent: </span>
                <span class="agent-badge badge-color-${agentColorMap[firstMessage.persona]}">
                    <img src="${agentIconMap[firstMessage.persona]}" class="agent-icon-small" alt="${firstMessage.persona} icon"> ${firstMessage.persona}
                </span>
            </div>
        `;
        
        messagesContainer.appendChild(indicatorEl);
        scrollChatToBottom();
    }
    
    // Function to display task setup at the beginning of discussion
    function displayTaskSetup() {
        if (!isReplaying) return;
        
        // Display prompt/instruction
        const promptEl = document.createElement('div');
        promptEl.className = 'task-setup-message task-prompt';
        promptEl.innerHTML = `
            <div class="setup-header">
                <i class="fas fa-clipboard-list"></i>
                <span>Task Instructions</span>
            </div>
            <div class="setup-content">${discussionData.instruction}</div>
        `;
        messagesContainer.appendChild(promptEl);
        scrollChatToBottom();
        
        // Delay before showing question
        const timeoutId1 = setTimeout(() => {
            if (!isReplaying) return;
            
            // Display question
            const questionEl = document.createElement('div');
            questionEl.className = 'task-setup-message task-question';
            
            // Format the question content like in the task panel
            const inputText = discussionData.input[0];
            let formattedQuestionContent = '';
            
            if (inputText.match(/[A-Z]\)\s+/)) {
                formattedQuestionContent = formatMultipleChoiceQuestion(inputText);
            } else {
                formattedQuestionContent = inputText;
            }
            
            questionEl.innerHTML = `
                <div class="setup-header">
                    <i class="fas fa-question-circle"></i>
                    <span>Question</span>
                </div>
                <div class="setup-content">${formattedQuestionContent}</div>
            `;
            messagesContainer.appendChild(questionEl);
            scrollChatToBottom();
            
            // Delay before showing participants
            const timeoutId2 = setTimeout(() => {
                if (!isReplaying) return;
                
                // Display participants
                const participantsEl = document.createElement('div');
                participantsEl.className = 'task-setup-message task-participants';
                
                let participantsHtml = `
                    <div class="setup-header">
                        <i class="fas fa-users"></i>
                        <span>Discussion Participants</span>
                    </div>
                    <div class="setup-content">
                        <div class="participants-grid">
                `;
                
                discussionData.personas.forEach(persona => {
                    const colorClass = agentColorMap[persona.persona];
                    const iconSrc = agentIconMap[persona.persona];
                    participantsHtml += `
                        <div class="participant-card agent-color-${colorClass}">
                            <div class="participant-name">
                                <img src="${iconSrc}" class="participant-icon" alt="${persona.persona} icon">
                                <span class="participant-persona">${persona.persona}</span>
                            </div>
                            <div class="participant-description">${persona.personaDescription}</div>
                        </div>
                    `;
                });
                
                participantsHtml += `
                        </div>
                    </div>
                `;
                
                participantsEl.innerHTML = participantsHtml;
                messagesContainer.appendChild(participantsEl);
                scrollChatToBottom();
                
                // Add discussion start separator
                const timeoutId3 = setTimeout(() => {
                    if (!isReplaying) return;
                    
                    const separatorEl = document.createElement('div');
                    separatorEl.className = 'discussion-start-separator';
                    separatorEl.innerHTML = `
                        <div class="separator-line"></div>
                        <div class="separator-text">
                            <i class="fas fa-comments"></i>
                            Discussion Begins - Turn ${currentTurn}
                        </div>
                        <div class="separator-line"></div>
                    `;
                    messagesContainer.appendChild(separatorEl);
                    scrollChatToBottom();
                    
                    // Now start the actual turn replay
                    const timeoutId4 = setTimeout(() => {
                        if (!isReplaying) return;
                        startTurnReplay();
                    }, 1000 / replaySpeed);
                    replayTimeouts.push(timeoutId4);
                }, 1500 / replaySpeed);
                replayTimeouts.push(timeoutId3);
            }, 2000 / replaySpeed);
            replayTimeouts.push(timeoutId2);
        }, 1500 / replaySpeed);
        replayTimeouts.push(timeoutId1);
    }
    
    // Function to start the actual turn replay (extracted from replaySequence)
    function startTurnReplay() {
        if (!isReplaying) return;
        
        // Get messages for this turn
        const turnMessages = discussionData.globalMemory.filter(msg => msg.turn === currentTurn);
        turnMessages.sort((a, b) => a.message_id - b.message_id);
        
        if (turnMessages.length === 0) {
            // No messages for this turn, move to the next or finish
            proceedToNextTurnOrFinish();
            return;
        }
        
        // Show the paradigm indicator before the first message of the turn
        const firstMessage = turnMessages[0];
        
        // First display the discussion paradigm for this turn
        const timeoutId = setTimeout(() => {
            if (!isReplaying) return;
            displayTurnParadigmIndicator(firstMessage);
            
            // Start displaying messages after a brief delay
            const messageTimeoutId = setTimeout(() => {
                if (!isReplaying) return;
                displayMessages();
            }, 1000 / replaySpeed);
            replayTimeouts.push(messageTimeoutId);
        }, 500 / replaySpeed);
        replayTimeouts.push(timeoutId);
        
        // Function to animate content word by word
        async function animateContent(sourceEl, targetEl) {
            return new Promise(resolve => {
                if (!isReplaying) { // Check at the beginning
                    resolve();
                    return;
                }
                const elements = [];
                
                // First, we'll process all child nodes to separate HTML elements from text
                function processNodeForAnimation(node, elements, currentPosition) {
                    if (node.nodeType === Node.TEXT_NODE) {
                        // For text nodes, split into words and add to our array
                        const text = node.textContent.trim();
                        if (text) {
                            // Split by whitespace and add each word
                            const words = text.split(/\s+/);
                            words.forEach(word => {
                                if (word) elements.push({
                                    type: 'text',
                                    content: word + ' ',
                                    position: currentPosition++
                                });
                            });
                        }
                        return currentPosition;
                    } else if (node.nodeType === Node.ELEMENT_NODE) {
                        // Special handling for elements we want to preserve
                        if (node.classList && 
                           (node.classList.contains('agent-mention') || 
                            node.classList.contains('agreed-tag') ||
                            node.classList.contains('disagreed-tag'))) {
                            // Store these special elements as-is
                            elements.push({
                                type: 'element',
                                element: node.cloneNode(true),
                                position: currentPosition++
                            });
                            return currentPosition;
                        }
                        
                        // For other elements, clone them but process their children separately
                        const elClone = node.cloneNode(false); // Shallow clone
                        
                        // Add this element to our array
                        const elementIndex = elements.push({
                            type: 'element-start',
                            element: elClone,
                            position: currentPosition++,
                            children: []
                        }) - 1;
                        
                        // Process all child nodes recursively
                        let newPosition = currentPosition;
                        for (const child of node.childNodes) {
                            newPosition = processNodeForAnimation(child, elements[elementIndex].children, newPosition);
                        }
                        
                        elements.push({
                            type: 'element-end',
                            position: newPosition++
                        });
                        
                        return newPosition;
                    }
                    return currentPosition;
                }
                
                // Process all child nodes of the source element
                let position = 0;
                for (const child of sourceEl.childNodes) {
                    position = processNodeForAnimation(child, elements, position);
                }
                
                // Sort elements by position
                elements.sort((a, b) => a.position - b.position);
                
                // Now animate elements
                let currentIndex = 0;
                const wordDelay = 30 / replaySpeed; // Adjust for desired speed
                
                function showNextElement() {
                    if (!isReplaying) { // Check before each step
                        resolve();
                        return;
                    }
                    if (currentIndex < elements.length) {
                        const item = elements[currentIndex];
                        
                        if (item.type === 'text') {
                            // For text, just append it
                            const wordSpan = document.createElement('span');
                            wordSpan.textContent = item.content;
                            targetEl.appendChild(wordSpan);
                        } else if (item.type === 'element') {
                            // For preserved elements (agent-mention, agreed-tag), append as-is
                            targetEl.appendChild(item.element);
                        } else if (item.type === 'element-start') {
                            // For element start, create the element
                            const newEl = item.element;
                            targetEl.appendChild(newEl);
                            
                            // Process its children
                            let childIndex = 0;
                            
                            function processChildren() {
                                if (!isReplaying) { // Check in child processing loop
                                    resolve();
                                    return;
                                }
                                if (childIndex < item.children.length) {
                                    const child = item.children[childIndex];
                                    
                                    if (child.type === 'text') {
                                        // For text, append to the parent element
                                        const wordSpan = document.createElement('span');
                                        wordSpan.textContent = child.content;
                                        newEl.appendChild(wordSpan);
                                    } else if (child.type === 'element') {
                                        // For preserved elements, append as-is
                                        newEl.appendChild(child.element);
                                    }
                                    
                                    childIndex++;
                                    const childTimeoutId = setTimeout(processChildren, wordDelay / 2);
                                    replayTimeouts.push(childTimeoutId); // Add to replayTimeouts
                                } else {
                                    // Done with children, move to next element
                                    currentIndex++;
                                    const nextElementTimeoutId = setTimeout(showNextElement, wordDelay);
                                    replayTimeouts.push(nextElementTimeoutId); // Add to replayTimeouts
                                }
                            }
                            
                            // Start processing children if any
                            if (item.children.length > 0) {
                                processChildren();
                            } else {
                                // No children, move to next element
                                currentIndex++;
                                const nextElementTimeoutId = setTimeout(showNextElement, wordDelay);
                                replayTimeouts.push(nextElementTimeoutId); // Add to replayTimeouts
                            }
                            return; // Skip the increment at the end
                        } else if (item.type === 'element-end') {
                            // For element end, just continue
                        }
                        
                        // Scroll chat to bottom periodically for smooth experience
                        if (currentIndex % 5 === 0) {
                            scrollChatToBottom();
                        }
                        
                        // Move to next element
                        currentIndex++;
                        const timeoutId = setTimeout(showNextElement, wordDelay);
                        replayTimeouts.push(timeoutId); // Add to replayTimeouts
                    } else {
                        // Animation complete
                        scrollChatToBottom();
                        resolve();
                    }
                }
                
                // Start animation
                showNextElement();
            });
        }
        
        // Function to display all messages in sequence
        function displayMessages() {
            let currentMessageIndex = 0;
            
            function displayNextMessage() {
                if (!isReplaying) return; // Check if we're still replaying
                
                if (currentMessageIndex < turnMessages.length) {
                    const message = turnMessages[currentMessageIndex];
                    const colorClass = agentColorMap[message.persona];
                    const iconSrc = agentIconMap[message.persona];
                    
                    // Create message element
                    const messageEl = document.createElement('div');
                    messageEl.className = `message agent-color-${colorClass}`;
                    
                    // Set header content
                    messageEl.innerHTML = `
                        <div class="message-header">
                            <span class="message-persona">
                                <span class="agent-badge badge-color-${colorClass}"><img src="${iconSrc}" class="agent-icon-small" alt="${message.persona} icon"> ${message.persona}</span>
                            </span>
                            <span class="message-id"><i class="fas fa-hashtag"></i> ID: ${message.message_id}</span>
                        </div>
                        <div class="message-content"></div>
                        ${message.solution ? `<div class="solution" style="opacity: 0;"><i class="fas fa-lightbulb"></i> ${message.solution}</div>` : ''}
                    `;
                    
                    messagesContainer.appendChild(messageEl);
                    
                    // Scroll to bottom immediately after adding new content
                    scrollChatToBottom();
                    
                    // Get the content element to animate text
                    const contentEl = messageEl.querySelector('.message-content');
                    const solutionEl = messageEl.querySelector('.solution');
                    
                    // Format and prepare the content for word-by-word display with previous agent reference
                    const formattedContent = formatMessageContent(message.message, message.persona, previousAgent);
                    
                    // After formatting, set current agent as previous for next message
                    previousAgent = message.persona;
                    
                    // Convert HTML content to array of elements and text nodes
                    const tempDiv = document.createElement('div');
                    tempDiv.innerHTML = formattedContent;
                    
                    // Animate words
                    animateContent(tempDiv, contentEl).then(() => {
                        // Animate solution if exists
                        if (solutionEl) {
                            solutionEl.innerHTML = message.solution || '';
                            setTimeout(() => {
                                solutionEl.style.opacity = '1';
                                solutionEl.style.transition = 'opacity 0.5s ease';
                                scrollChatToBottom(); // Scroll after solution appears
                                
                                // Check if there's a next message to show paradigm info
                                const nextMessage = turnMessages[currentMessageIndex + 1];
                                if (nextMessage) {
                                    // Move to next message after solution is shown and paradigm info
                                    setTimeout(() => {
                                        displayNextAgentIndicator(message, nextMessage);
                                        setTimeout(() => {
                                            currentMessageIndex++;
                                            displayNextMessage();
                                        }, 1500 / replaySpeed);
                                    }, 500 / replaySpeed);
                                } else {
                                    // No more messages in this turn
                                    currentMessageIndex++;
                                    displayNextMessage();
                                }
                            }, 500 / replaySpeed);
                        } else {
                            // Check if there's a next message to show paradigm info
                            const nextMessage = turnMessages[currentMessageIndex + 1];
                            if (nextMessage) {
                                setTimeout(() => {
                                    displayNextAgentIndicator(message, nextMessage);
                                    setTimeout(() => {
                                        currentMessageIndex++;
                                        displayNextMessage();
                                    }, 1500 / replaySpeed);
                                }, 500 / replaySpeed);
                            } else {
                                // No more messages, move on
                                currentMessageIndex++;
                                displayNextMessage();
                            }
                        }
                    });
                } else {
                    // All messages displayed, show voting after a delay
                    const timeoutId = setTimeout(() => {
                        if (!isReplaying) return; // Additional check
                        // Display voting in conversation window instead of side panel
                        displayVotingInChat();
                    }, 1000 / replaySpeed);
                    replayTimeouts.push(timeoutId);
                }
            }
            
            // Start displaying messages
            displayNextMessage();
        }
    }

    // Function to display next agent indicator between messages
    function displayNextAgentIndicator(currentMessage, nextMessage) {
        if (!isReplaying || !nextMessage) return;
        
        const paradigm = discussionData.paradigm || "Unknown paradigm";
        let nextAgentName = nextMessage.persona;
        
        const nextAgentColorClass = agentColorMap[nextAgentName];
        const nextAgentIconSrc = agentIconMap[nextAgentName];
        
        const indicatorEl = document.createElement('div');
        indicatorEl.className = 'next-agent-indicator';
        
        indicatorEl.innerHTML = `
            <div class="paradigm-info">
                <i class="fas fa-random"></i> Discussion paradigm: <strong>${paradigm}</strong>
            </div>
            <div class="next-agent-wrapper">
                <span>Next agent: </span>
                <span class="agent-badge badge-color-${nextAgentColorClass}">
                    <img src="${nextAgentIconSrc}" class="agent-icon-small" alt="${nextAgentName} icon"> ${nextAgentName}
                </span>
            </div>
        `;
        
        messagesContainer.appendChild(indicatorEl);
        scrollChatToBottom();
        
        // No longer removing the indicator - it stays in chat history
    }

    // 2. Show voting results in the chat window
    function displayVotingInChat() {
        if (!isReplaying) return; // Check if still replaying
        
        const voteData = discussionData.votesEachTurn[currentTurn];
        if (voteData) {
            // Create voting message element
            const voteEl = document.createElement('div');
            voteEl.className = 'message voting-message';
            
            // Format voting process string with highlighted agent names
            let formattedVotingProcess = voteData.voting_process_string;
            
            // Use a simpler, more direct approach for replacing agent names
            Object.keys(agentColorMap).forEach(persona => {
                const regex = new RegExp(`\\b${escapeRegExp(persona)}\\b`, 'g');
                const colorClass = agentColorMap[persona];
                const iconSrc = agentIconMap[persona];
                
                // Replace all occurrences directly
                formattedVotingProcess = formattedVotingProcess.replace(regex, 
                    `<span class="agent-mention mention-color-${colorClass}"><img src="${iconSrc}" class="agent-icon-small" alt="${persona} icon"> ${persona}</span>`);
            });
            
            voteEl.innerHTML = `
                <div class="message-header">
                    <span class="message-persona">
                        <span class="vote-badge">Turn ${currentTurn} Voting</span>
                    </span>
                </div>
                <div class="message-content voting-content">
                    <div class="vote-process-details">
                        <div class="vote-details">
                            <div><i class="fas fa-info-circle"></i> Type: <strong>${voteData.type}</strong></div>
                            <div><i class="fas fa-list-ul"></i> Answers: <strong>${voteData.answers.join(', ')}</strong></div>
                            <div class="voting-process">
                                <small>${formattedVotingProcess.replace(/\n/g, '<br>')}</small>
                            </div>
                        </div>
                        <div class="vote-result">
                            <div><span class="vote-result-label"><i class="fas fa-check"></i> Final Answer:</span> <strong>${voteData.alterations.public.final_answer}</strong></div>
                            <div><span class="vote-result-label"><i class="fas fa-handshake"></i> Consensus:</span> <span class="agreed">${voteData.alterations.public.agreed ? 'Yes' : 'No'}</span></div>
                        </div>
                    </div>
                </div>
            `;
            
            // Add voting element to chat
            messagesContainer.appendChild(voteEl);
            
            // Force scroll to bottom
            scrollChatToBottom();
            
            // Animate the vote result appearance
            const voteResultEl = voteEl.querySelector('.vote-process-details');
            voteResultEl.style.opacity = '0';
            
            // First show the visual voting, then the details
            if (!isReplaying) return; // Check again before setting timeout
            setTimeout(() => {
                if (!isReplaying) return; // Check if we're still replaying
                voteResultEl.style.opacity = '1';
                voteResultEl.style.transition = 'opacity 1s ease';
                scrollChatToBottom(); // Scroll after making details visible
                
                // After voting display, move to next turn or finish
                const nextTurnDelay = 3000 / replaySpeed;
                const timeoutId = setTimeout(() => {
                    if (!isReplaying) return; // Check again before proceeding
                    proceedToNextTurnOrFinish();
                }, nextTurnDelay);
                replayTimeouts.push(timeoutId);
            }, 2000 / replaySpeed);
        } else {
            // No voting data, move to next turn
            const timeoutId = setTimeout(() => {
                if (!isReplaying) return; // Check if we're still replaying
                proceedToNextTurnOrFinish();
            }, 1000 / replaySpeed);
            replayTimeouts.push(timeoutId);
        }
    }
    
    // 3. Move to next turn or finish the replay
    function proceedToNextTurnOrFinish() {
        if (!isReplaying) return; // Check if still replaying
        
        if (currentTurn < maxTurns) {
            // Add a turn separator
            const separatorEl = document.createElement('div');
            separatorEl.className = 'turn-separator';
            separatorEl.innerHTML = `<span>Moving to Turn ${currentTurn + 1}</span>`;
            messagesContainer.appendChild(separatorEl);
            
            // Force scroll
            scrollChatToBottom();
            
            // Go to next turn after a brief pause
            const timeoutId = setTimeout(() => {
                if (!isReplaying) return; // Check again before proceeding
                currentTurn++;
                updateTurnInfo();
                replaySequence();
            }, 1000 / replaySpeed);
            replayTimeouts.push(timeoutId);
        } else {
            // Add a completion message
            const completionEl = document.createElement('div');
            completionEl.className = 'completion-message';
            completionEl.innerHTML = `
                <div class="completion-header"><i class="fas"></i> Discussion Complete</div>
                <div class="completion-content">
                    The agents have reached a final consensus.
                </div>
            `;
            messagesContainer.appendChild(completionEl);
            
            // Force scroll
            scrollChatToBottom();
            
            // Display the final answer in the chat window
            const finalAnswerEl = document.createElement('div');
            finalAnswerEl.className = 'message final-consensus';
            finalAnswerEl.innerHTML = `
                <div class="message-header">
                    <span class="message-persona">
                        <span class="vote-badge"><i class="fas fa-award"></i> Final Consensus</span>
                    </span>
                </div>
                <div class="message-content">
                    <div class="final-answer-text">${discussionData.finalAnswer}</div>
                </div>
            `;
            messagesContainer.appendChild(finalAnswerEl);
            
            // Add vertical space after final message
            const spacerEl = document.createElement('div');
            spacerEl.style.height = '20px'; // Add vertical space
            messagesContainer.appendChild(spacerEl);
            
            scrollChatToBottom();
            
            // Wait a moment then show completion modal
            const timeoutId = setTimeout(() => {
                showCompletionModal();
                isReplaying = false;
                startReplayBtn.disabled = false;
                stopReplayBtn.disabled = true;
                loadConversationBtn.disabled = false;
                floatingStopBtn.classList.remove('visible'); // Hide floating stop button
            }, 2000 / replaySpeed);
            
            replayTimeouts.push(timeoutId);
        }
    }
}); 