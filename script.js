const baseUrl = "https://api.github.com/";
const users = ['iMarcraft', 'mtlaguerre'];

let username = users[0];

let repos = [];
let numOfRepos = 2; // Number of repositories to display
let firstTimeToggle = true;

// terminal variables
const terminal = document.getElementById('terminal-window');
const terminalLoadTime = 3500;
const terminalTypeSpeed = 45;
const version = "1.0.0";
const welcomeMsg = `Welcome to my portfolio [Version ${version}]`;

let currentInput = null;

// define terminal paths
const path = {
    'C:' : {
        Users : buildUsersDir(users)
    },
    'D:' : {
        Users : {}
    }
};

function buildUsersDir(usersArray) {
    const usersDir = {};

    usersArray.forEach(user => {
        usersDir[user] = {
            Projects : {}
        };    // each user gets their own folder and a projects folder
    });

    return usersDir;
}

const defaultDrive = Object.keys(path)[0];          // "C:"
let drive = defaultDrive;
let prompt;
const promptChar = '>';
let dir = [];
let cwd = path[drive];

buildDefaultPrompt();


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
                else displayInTerminal(prompt, true);

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
    <p class="card-text pb-4">${repoInfo.description}</p>
    <a href="${repoInfo.html_url}" class="btn btn-primary position-absolute start-0 bottom-0 ms-3 mb-2">Go to repo</a>
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
        displayInTerminal(welcomeMsg, false, terminalTypeSpeed);
        setTimeout( () => {
            displayInTerminal(prompt, true)
        }, terminalLoadTime);
    }
}

function displayInTerminal(text, isPrompt, typeSpeed = 0) {
    
    let parentElem = document.createElement('div');
    parentElem.className = 'd-flex position-relative align-items-start flex-wrap mb-1';
    
    let promptElem = document.createElement('span');
    
    if (isPrompt) {
        promptElem.textContent = text;
        let inputField = document.createElement('span');
        
        inputField.textContent = ' '.repeat(text.length);
        inputField.style.whiteSpace = 'pre-wrap';
        inputField.style.outline = 'none';
        inputField.className = 'position-absolute start-0';
        inputField.style.wordBreak = 'break-all';
        inputField.contentEditable = "true";
        inputField.spellcheck = false;
        
        parentElem.appendChild(promptElem);
        parentElem.appendChild(inputField);
        
        terminal.appendChild(parentElem);
        
        currentInput = inputField;
        inputField.focus();
        placeCursorAtEnd(inputField);
        // scrollToBottom();
        
        // Handle Enter: echo command and create new prompt line
        inputField.addEventListener('keydown', (e) => {
            const sel = window.getSelection();
            const caretPos = sel.focusOffset;
            
            validCommands = {
                'clear' : {
                    argSize : 0,
                    action : () => {
                        terminal.innerHTML = ''; // clear terminal
                    }
                },
                'echo' : {
                    argSize : 1,
                    action : (arg) => {
                        let output;
                        if (arg && arg !== null) {
                            output = arg.replaceAll('"', '');   // remove double quotes
                        }
                        else {
                            output = '';
                        
                        }
                        displayInTerminal(output, false);
                    }
                },
                'ls' : {
                    argSize : 1,
                    action : async (arg) => {
                        if (arg) {
                            if (isDirectory) {
                                displayInTerminal('Not a directory', false);
                            }
                            else {
                                let entries = Object.keys(cwd);
                                displayInTerminal(entries.join(' '), false);
                            }
                        }
                        else {
                            let entries = Object.keys(cwd);
                            
                            // if in projects
                            if (dir[dir.length-1] == 'Projects') {
                                repos = await findUserRepos(dir[1]);      // find all of user's public repos
                                
                                repos.forEach(repo => {
                                    entries.push(repo.name);
                                })
                            }

                            displayInTerminal(entries.join(' '), false);

                        }
                    }
                },
                'cd' : {
                    argSize : 1,
                    action : (arg) => {
                        if (arg) {
                            if (arg === '..') {
                                // if not at drive path
                                if (dir.length > 0) {
                                    // go back one directory
                                    removeFromPrompt();
    
                                    cwd = resolveCwd(); // update current working directory pointer
                                }
                            }
                            else {
                                if (isDirectory(cwd[arg])) {
                                    // go into directory
                                    addToPrompt(arg);

                                    cwd = resolveCwd();

                                }
                                else
                                    displayInTerminal("'" + arg + "' directory not found", false);
                            }
                        }
                        else
                            displayInTerminal('missing arguments');
                    }
                },
                'cat' : {
                    argSize : 1,
                    action : (arg) => {
                        
                    }
                }
            }
            
            // clear, echo, cd, ls, cat
            
            if (e.key === 'Enter') {
                e.preventDefault();
                const rawInput = inputField.textContent.slice(prompt.length);
                const command = rawInput.split(' ')[0];
                
                if (command in validCommands) {
                    const cmd = validCommands[command];
                    let args = [];
                    
                    if (command !== 'clear') {
                        let argValue = rawInput.slice(command.length);          // save command arguments
                        args = splitArgs(argValue);
                        
                        const staticLine = document.createElement('div');
                        staticLine.style.wordBreak = 'break-all';           // preserve terminal-like wrapping
                        parentElem.replaceWith(staticLine);                     // update to make past commands immutable
                        staticLine.textContent = prompt + rawInput;
                    }
                    
                    // console.log('args: ', args);
                    cmd.action(args[cmd.argSize > 0 ? cmd.argSize - 1 : null]);   // perform command action with passed arguments
                }
                else {
                    
                    // Replace the input line with a static echoed line
                    const staticLine = document.createElement('div');
                    
                    // Preserve terminal-like wrapping
                    staticLine.style.wordBreak = 'break-all';
                    
                    parentElem.replaceWith(staticLine);
                    staticLine.textContent = prompt + rawInput;
                    
                    let args = splitArgs(rawInput);
                    if (rawInput)
                        displayInTerminal(`command: '${args[0]}' not found.`, false);
                    
                    currentInput = null;
                }
                
                // Create a new prompt line
                setTimeout(() => {
                    displayInTerminal(prompt, true);
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
        parentElem.appendChild(promptElem);
        terminal.appendChild(parentElem);
        
        typeLoadText(text, promptElem, typeSpeed);
    }
}

function typeLoadText(text, promptElem, speed) {
    
    let i = 0; // initialize index
    
    let typingInterval = setInterval(() => {
        if (i < text.length) {
            promptElem.textContent += text.charAt(i++); // add one character at a time
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

function splitArgs(string) {
    
    if (string.length > 1 && string[1] !== ' ') {
        const args = string.match(/(?:[^\s"]+|"[^"]*")+/g)
        .map(s => s.replace(/^"|"$/g, ''));                 // split arguments except double quoted args, and store in args array
        
        return args;
    }
    else {
        return '';
    }
}

function buildDefaultPrompt() {
    prompt = drive;
    dir = [];

    while(true) {
        const keys = Object.keys(cwd);
        if (keys.length === 0) break; // stop if no subfolders

        const nextDir = keys[0];    // pick first folder

        // if (nextDir === 'Projects') break;  // STOP before 'Projects' folder

        // dir.push(nextDir);
        addToPrompt(nextDir);

        cwd = cwd[nextDir]; // go deeper
        if (!cwd || Object.keys(cwd).length === 0) break; // stop at leaf
    }
}

function addToPrompt(nextDir) {
    let promptLastDir = dir.length > 0 ? dir[dir.length - 1] : null;            // curr directory
    let promptLastChar;
    
    if (promptLastDir) {
        promptLastChar = promptLastDir[promptLastDir.length - 1];   // current directory's last character
    }

    // if prompt character is present
    if (promptLastChar == promptChar) {
        promptLastDir = promptLastDir.slice(0, promptLastDir.length - 1);   // remove prompt character        
        dir[dir.length-1] = promptLastDir;      // update actual directory array
    }
    
    dir.push(nextDir);              // add next directory
    
    buildPrompt(drive, dir);        // build the prompt
}

function removeFromPrompt() {
    stringSize = dir[dir.length - 1].length;
    prompt = prompt.slice(0, stringSize - 1);

    dir.pop();
    buildPrompt(drive, dir);
}

function buildPrompt(drive, dirArray) {
    prompt = drive;

    dirArray.forEach(dir => {
        dir == dirArray[dirArray.length-1] ? dir += promptChar : null;
        prompt += '\\' + dir;
    })
}

function resolveCwd() {
    let current = path[drive];
    for (const part of dir) {
        current = current[part];
    }
    return current;
}

function isDirectory(node) {
    return typeof node === 'object' && node !== null;
}

async function findUserRepos(user) {

    let response = await fetch(baseUrl + 'users/' + user + '/repos');
    if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);

    let data = await response.json();
    
    return data;
}