const baseUrl = "https://api.github.com/";
const BACKEND_URL = "https://error-monitor.fly.dev";
const version = "1.0.0";
let theme = 'dark';

const users = ['iMarcraft', 'mtlaguerre'];
const externalUsers = [];

let username = users[0];

let repos;
let numOfRepos = 6; // Number of repositories to display
let firstTimeToggle = true;

// terminal variables
const terminal = document.getElementById('terminal-window');
const terminalLoadTime = 3500;
const terminalTypeSpeed = 45;
const welcomeMsg = `Welcome to my portfolio [Version ${version}]`;
let currentInput = null;

// define terminal paths
let path;
buildPath();

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

const icons = [
    'cs', 'cpp', 'css', 'html', 'java', 'javascript', 'mysql', 'mongodb', 'postgres',
    'react', 'nodejs', 'aws', 'figma', 'git', 'vercel', 'github', 'discord'
];


document.addEventListener("DOMContentLoaded", () => {
    
    buildProjectCards(); // toggle during development (prevent reaching api limit, figure caching for better experience)
    loadIcons();

    // set observer for revealing hidden elements when in sight
    setTimeout(() => {
        const observer = new IntersectionObserver(
            entries => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        reveal(entry.target);
                        // observer.unobserve(entry.target);       // animate once
                    }
                })
            },
            { 
                threshold: 0.2 // trigger when 20% visible
            }
        );

        document.querySelectorAll('.reveal').forEach(el => {
            observer.observe(el);
        });
    }, 2500);
    
    
    // prevent form submit reloads
    terminal.addEventListener('submit', (e) => e.preventDefault());

});

async function buildProjectCards() {
    
    for (let i = 0; i < numOfRepos; i++) {
        const [repoInfo, repoImage] = await fetchUserRepo(baseUrl + 'users/' + username + '/repos', i);

        // hide all github hosted websites
        if (repoInfo.name.includes('github.io')) continue;

        addProjectCard(repoInfo, repoImage);    // build project card
    }

}

async function fetchUserRepo(url, index) {

    let repoInfo;
    let repoImage;
    
    // Fetch Repo Info
    let response = await fetch(url);
    if (!response.ok)
        if (response.status === 403) {
            notify403({url: response.url});
            console.log(response.status);
            return;
        }
        else
            throw new Error(`HTTP error! status: ${response.status}`);
    
    let data = await response.json();
    repoInfo = data[index];
    
    // Fetch Repo Image from README.md
    response = await fetch(baseUrl + 'repos/' + username + '/' + repoInfo.name + '/readme');
    if (response.ok) {
        data = await response.json();
        const readmeContentUrl = data.download_url; // Direct link to raw README content
        
        const markdownResponse = await fetch(readmeContentUrl);
        const markdown = await markdownResponse.text();
        
        const regex = /!\[.*\]\((.*?)\)/; // Markdown image pattern
        const match = markdown.match(regex);
        
        if (match && match[1]) {
            repoImage = match[1];
        }
    }
    else if (response.status === 404) {} // do nothing (the readme is missing)
    else
        throw new Error(`HTTP error! status: ${response.status}`);
    
    return [repoInfo, repoImage]
}

function addProjectCard(repoInfo, repoImage) {
    
    let card = document.createElement('div');
    const noDescription = "No discription yet. I'm sure they're considering it.\n -Marcus";
    
    card.className = 'card my-2 position-relative';
    card.style.width = '30%';
    card.innerHTML = 
    `<img src="${repoImage ?? ''}" alt="${repoInfo.name} thumbnail">
    <div class="card-body">
    <h5 class="card-title">${repoInfo.name}</h5>
    <p class="card-text pb-4">${repoInfo.description ?? noDescription}</p>
    <a href="${repoInfo.html_url}" class="btn btn-primary position-absolute start-0 bottom-0 ms-3 mb-2">Go to repo</a>
    </div>
    `;
    
    document.getElementById('projects-section').appendChild(card);
}

function clearProjectCards() {
    document.getElementById('projects-section').innerHTML = ''; // remove all children elements
}

function toggleProjectView() {
    const projectCardView = document.getElementById('project-cards-container');
    const projectTerminalView = document.getElementById('project-terminal-container');
    
    projectCardView.style.display = projectCardView.style.display === 'none' ? 'block' : 'none';
    projectTerminalView.style.display = projectTerminalView.style.display === 'none' ? 'block' : 'none';
    
    // if project cards showing
    if (projectCardView.style.display === 'block') {

        // if not my users
        if (!users.includes(username)) {
            document.getElementById('projects-p').innerText = 'Wait a minute... who\'s work is that?!';
        }
        else
            document.getElementById('projects-p').innerText = 'Check out some of my work below!'
    }

    if (firstTimeToggle) {
        firstTimeToggle = false;
        displayInTerminal(welcomeMsg, false, terminalTypeSpeed);
        setTimeout( () => {
            displayInTerminal(prompt, true)

            terminal.style.cursor = 'text';     // indicate terminal is a text input area
            // add click to focus on terminal
            terminal.addEventListener('click', () => {
                if (currentInput) currentInput.focus();
                
                placeCursorAtEnd(currentInput)
            });
        }, terminalLoadTime);
    }

}

async function displayInTerminal(text, isPrompt = false, typeSpeed = 0) {
    
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
        currentInput.focus();
        placeCursorAtEnd(inputField);
        
        // Handle Enter: echo command and create new prompt line
        inputField.addEventListener('keydown', async (e) => {
            const sel = window.getSelection();
            const caretPos = sel.focusOffset;
            
            validCommands = {
                'cls' : {
                    argSize : 0,
                    action : (args) => {
                        // if no arguments
                        if (!args)
                            terminal.innerHTML = ''; // clear terminal
                        else
                            displayInTerminal('too many arguments');
                    }
                },
                'echo' : {
                    argSize : 1,
                    action : (args) => {
                        let output;
                        // if args[0] has a value
                        if (args && args[0] !== null) {
                            output = args[0].replaceAll('"', '');   // remove double quotes
                        }
                        else {
                            output = '';
                        
                        }
                        displayInTerminal(output);
                    }
                },
                'dir' : {
                    argSize : 1,
                    action : async (args) => {
                        // if arguments exist
                        if (args) {
                            // if 1 argument
                            if (args.length === 1) {
                                // if args[0] not valid directory
                                if (!isDirectory(cwd[args[0]])) {
                                    displayInTerminal(`'${args[0]}' is not a directory`);
                                }
                                else {
                                    let entries = Object.keys(cwd[args[0]]);

                                    // if arguement equals 'Projects'
                                    if (args[0] === 'Projects') {
                                        await displayProjects(username, entries);
                                    }

                                    displayInTerminal(entries.join(' '));
                                }
                            }
                            else    // otherwise, not 1 argument
                                displayInTerminal('too many arguments');
                        }
                        else {  // otherwise, no arguments
                            let entries = Object.keys(cwd);     // sub directories
                            
                            // if in projects
                            if (dir[dir.length-1] == 'Projects') {
                                await displayProjects(username, entries);
                            }

                            displayInTerminal(entries.join(' '));

                        }
                    }
                },
                'cd' : {
                    argSize : 2,
                    action : (args) => {
                        // if arguments exist
                        if (args) {
                            // if 1 argument
                            if (args.length === 1) {

                                if (args[0] === '..') {
                                    // if not at drive path
                                    if (dir.length > 0) {
                                        // go back one directory
                                        removeFromPrompt();
        
                                        cwd = resolveCwd(); // update current working directory pointer
                                    }
                                }
                                else if (args[0] === '/D') {    // if the only argument is '/D'
                                    displayInTerminal('missing argument');
                                }
                                else {  // otherwise, args[0] != '..'
                                    // if arg[0] is valid directory
                                    if (isDirectory(cwd[args[0]])) {
    
                                        // if at "Users" directory"
                                        if (dir.length === 1){
                                            username = args[0]; // update username
                                            
                                            // rebuild project cards
                                            clearProjectCards();
                                            buildProjectCards();
                                        }
    
                                        // go into directory
                                        addToPrompt(args[0]);
    
                                        cwd = resolveCwd();
    
                                    }
                                    else    // otherwise, args[0] invalid
                                        displayInTerminal("'" + args[0] + "' directory not found");
                                }
                            }
                            else if (args.length === 2) {
                                // if first arg equals '/D' (change drive)
                                if (args[0] === '/D') {
                                    // if drive exists on system (within paths)
                                    if (Object.keys(path).includes(args[1])) {
                                        drive = args[1];   // dynamically change to valid drive
                                        dir = [];       // clear directories array
                                        cwd = path[drive];  // update current directory pointer
                                        buildPrompt(drive, dir);
                                    }
                                    else
                                        displayInTerminal('drive not found');
                                }
                                else
                                    displayInTerminal('invalid argument(s)');
                            }
                            else    // otherwise, unhandled amount of arguments
                                displayInTerminal('too many arguments');
                        }
                        else    // otherwise, no arguments
                            displayInTerminal('missing arguments');
                    }
                },
                'run' : {
                    argSize : 1,
                    action : (args) => {
                        // if arguments exist
                        if (args) {
                            // if 1 argument
                            if(args.length === 1) {

                                foundRepo = false;
                                repoName = '';          // github repo name placeholder

                                repos.forEach(repo => {
                                    console.log(repo.name);
                                    // if args[0] matches repo name
                                    if (args[0] === repo.name){
                                        foundRepo = true;
                                        repoName = repo.name;
                                    }
                                })
    
                                if (foundRepo) {
                                    window.open(`https://github.com/${username}/${repoName}`);
                                }
                                else {
                                    displayInTerminal('Repo not found... :(');
                                }
                            }
                            else
                                displayInTerminal('too many arguments');
                        }
                        else
                            displayInTerminal('missing arguments');
                    }
                },
                'mkdir' : {
                    argSize : 1,
                    action : (args) => {
                        // if at "Users" directory of D: drive
                        if (dir.length == 1 && drive !== Object.keys(path)[0] ) {
                            if (args) {
                                // if 1 argument
                                if (args.length === 1) {

                                    // add user to user list
                                    externalUsers.push(args[0]);
    
                                    // recreate path
                                    buildPath();
                                    console.log('path: ', path);
    
                                    // update path variables
                                    cwd = path[drive]['Users'];
                                }
                                else
                                    displayInTerminal('too many arguments');
                            }
                            else
                                displayInTerminal('missing arguments');
                        }
                        else
                            displayInTerminal('permissions denied');
                    }
                }
            }
            
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
                    await cmd.action(args);   // perform command action with passed arguments
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
                        displayInTerminal(`command: '${args[0]}' not found.`);
                    
                    currentInput = null;
                }
                
                // Create a new prompt line
                displayInTerminal(prompt, true);
                scrollToBottom();
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

        if (typeSpeed > 0) {
            await typeLoadText(text, promptElem, typeSpeed);
        }
        else {
            promptElem.textContent = text;
            scrollToBottom();
        }
    }
}

function typeLoadText(text, promptElem, speed) {
    
    return new Promise(resolve => {

        let i = 0; // initialize index
        
        let typingInterval = setInterval(() => {
            if (i < text.length) {
                promptElem.textContent += text.charAt(i++); // add one character at a time
                scrollToBottom();
            }
            else {
                clearInterval(typingInterval); // stop the interval
                scrollToBottom();
                resolve();  // typing finished
            }
        }, speed);
    });
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

function buildPath() {
    path = {
        'C:' : {
            Users : buildUsersDir(users)
        },
        'D:' : {
            Users : buildUsersDir(externalUsers)
        }
    };
}

async function displayProjects(user, entries) {
    // if repos is undefined or current user has changed
    if (!repos || repos[0].owner.login != user ) {
        repos = await findUserRepos(username);      // find all of user's public repos
    }

    // if repos is defined
    if (repos) {
        repos.forEach(repo => {
            entries.push(repo.name);        // replace subdirectories with public repos
        })
    }
}

function reveal(element) {
    element.classList.add('in-view');
}

async function notify403(details) {
  try {
    await fetch(BACKEND_URL + '/notify-403', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: details.url,
        userAgent: navigator.userAgent
      }),
    });
  } catch (err) {
    console.error('Failed to notify backend', err);
  }
}

function loadIcons() {
    icons.forEach(icon => {
        const img = document.getElementById(icon + '-icon')
        if (!img) return;
        
        img.src = `https://skillicons.dev/icons?i=${icon}${theme ? '&theme='+theme : ''}`;
    })
}