const baseUrl = "https://api.github.com/"; 
const username = "iMarcraft";

let numOfRepos = 2; // Number of repositories to display
let firstTimeToggle = true;

// terminal variables
const terminal = document.getElementById('terminal-window');
const terminalLoadTime = 3000;
const version = "1.0.0";
const welcomeMsg = `Welcome to my portfolio [Version ${version}]`;
let promptText = "C:\\Users\\Marcus>";
let currentInput = null;

document.addEventListener("DOMContentLoaded", () => {

    
    buildProjectCards();

    // prevent form submit reloads
    terminal.addEventListener('submit', (e) => e.preventDefault());

    setTimeout(() => {

        // Make the terminal container clickable to focus the active input
        const terminalWindow = document.getElementById('terminal-window');
        if (terminalWindow) {
            terminalWindow.addEventListener('click', () => {
                if (currentInput) currentInput.focus();
                else displayInTerminal(promptText, true);

                placeCursorAtEnd(currentInput)
            });
    
            // indicate this is a text input area
            terminalWindow.style.cursor = 'text';
        }
    }, terminalLoadTime * 1.5)
});

function buildProjectCards() {

    for (let i = 0; i < numOfRepos; i++) {
        fetchUserRepo(baseUrl + 'users/' + username + '/repos', i);
    }

}

async function fetchUserRepo(url, index) {

    let repoInfo;
    let repoImage;
    
    // Fetch Repo Info
    let response = await fetch(url);
    if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);

    let data = await response.json();
    repoInfo = data[index];    

    // Fetch Repo Image from README.md
    response = await fetch(baseUrl + 'repos/' + username + '/' + repoInfo.name + '/readme');
    if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);

    data = await response.json();
    const readmeContentUrl = data.download_url; // Direct link to raw README content

    const markdownResponse = await fetch(readmeContentUrl);
    const markdown = await markdownResponse.text();

    const regex = /!\[.*\]\((.*?)\)/; // Markdown image pattern
    const match = markdown.match(regex);

    if (match && match[1]) {
        repoImage = match[1];
    }
    
    addProjectCard(repoInfo, repoImage);
}

function addProjectCard(repoInfo, repoImage) {

    let card = document.createElement('div');

    card.className = 'card my-2 position-relative';
    card.style.width = '30%';
    card.innerHTML = 
    `<img src="${repoImage}" alt="...">
    <div class="card-body">
        <h5 class="card-title">${repoInfo.name}</h5>
        <p class="card-text">${repoInfo.description}</p>
        <a href="${repoInfo.html_url}" class="btn btn-primary">Go to repo</a>
    </div>
    `;

    document.getElementById('projects-section').appendChild(card);
}

function toggleProjectView() {
    const projectCardView = document.getElementById('project-cards-container');
    const projectTerminalView = document.getElementById('project-terminal-container');

    projectCardView.style.display = projectCardView.style.display === 'none' ? 'block' : 'none';
    projectTerminalView.style.display = projectTerminalView.style.display === 'none' ? 'block' : 'none';

    if (firstTimeToggle) {
        firstTimeToggle = false;
        displayInTerminal(welcomeMsg, false);
        setTimeout( () => {
            displayInTerminal(promptText, true)
        }, terminalLoadTime);
    }
}

function displayInTerminal(text, isPrompt) {

    let parent = document.createElement('div');
    parent.className = 'd-flex position-relative align-items-start flex-wrap mb-1';

    let prompt = document.createElement('span');

    if (isPrompt) {
        prompt.textContent = text;
        let inputField = document.createElement('span');

        inputField.textContent = ' '.repeat(text.length);
        inputField.style.whiteSpace = 'pre-wrap';
        inputField.style.outline = 'none';
        inputField.className = 'position-absolute start-0';
        inputField.style.wordBreak = 'break-all';
        inputField.contentEditable = "true";
        inputField.spellcheck = false;
        
        parent.appendChild(prompt);
        parent.appendChild(inputField);
        
        terminal.appendChild(parent);
        
        currentInput = inputField;
        inputField.focus();
        placeCursorAtEnd(inputField);
        // scrollToBottom();

        // Handle Enter: echo command and create new prompt line
        inputField.addEventListener('keydown', (e) => {
            const sel = window.getSelection();
            const caretPos = sel.focusOffset;
            
            if (e.key === 'Enter') {
                e.preventDefault();
                const rawInput = inputField.textContent.slice(promptText.length);

                if (rawInput === 'clear') {
                    terminal.innerHTML = ''; // clear terminal
                }
                else {

                    // Replace the input line with a static echoed line
                    const staticLine = document.createElement('div');

                    // Preserve terminal-like wrapping
                    staticLine.style.wordBreak = 'break-all';

                    parent.replaceWith(staticLine);
                    staticLine.textContent = promptText + rawInput;
                    currentInput = null;
                }

                // Create a new prompt line
                setTimeout(() => {
                    displayInTerminal(promptText, true);
                    scrollToBottom();
                }, 0);
            }
            else if (e.key === ('Backspace') && caretPos <= text.length) {
                e.preventDefault();
            }
            else if (e.key === ('ArrowLeft') && caretPos <= text.length) {
                e.preventDefault();
            }
            else if (e.key === ('ArrowUp') && caretPos <= text.length) {
                e.preventDefault();
            }
        });

    } else {
        parent.appendChild(prompt);
        terminal.appendChild(parent);

        typeLoadText(text, prompt, 45);
    }
}

function typeLoadText(text, prompt, speed) {

    let i = 0; // initialize index

    let typingInterval = setInterval(() => {
        if (i < text.length) {
            prompt.textContent += text.charAt(i++); // add one character at a time
            scrollToBottom();
        }
        else {
            clearInterval(typingInterval); // stop the interval
            scrollToBottom();
        }
    }, speed);
}

function scrollToBottom() {
    const terminalWindow = document.getElementById('terminal-window');
    if (!terminalWindow) return;

    // Only scroll if content exceeds container height
    if (terminalWindow.scrollHeight > terminalWindow.clientHeight) {
        terminalWindow.scrollTop = terminalWindow.scrollHeight;
    }

}

function placeCursorAtEnd(element) {
    const range = document.createRange();
    const sel = window.getSelection();
    range.selectNodeContents(element);
    range.collapse(false);
    sel.removeAllRanges();
    sel.addRange(range);
}