# Marcus' Web Portfolio
A beautiful display of Marcus' past and present projects!

> [!NOTE]
> Though I think you should learn terminal commands, this is *not* an elaborate scheme to get you to learn it.
> But you should know, you can only change the theme through the terminal. [^1]

## Terminal Commands
There is a terminal within the website itself. Should you find it, here are some commands and their uses!
Most all commands function similar if not exactly as you would expect from the Command Prompt (Windows default terminal).

### Theme ☀️🌑
To switch to new themes, you must type `theme` and then the name of the theme you wish to enable.

Example:
```
theme light
```
> [!IMPORTANT]
> `theme` supports **up to 1 argument**.

### Clean Screen 🧹
`cls` fully wipes the terminal of all previous text, while keeping you in your current working directory.

Example:
```
cls
```
Simple, right?

> [!IMPORTANT]
> `cls` supports **no arguments**.

### Change Directory ↗️
What fun is a terminal if you can't browse around? You can do so with the `cd` command.

#### Argument(s): 1
With just one arguement, you can traverse up (out of) or down (into) directories or folders.

Example:
```
cd Users
```
This will position you in the 'Users' directory. To back out of a directory, use `cd ..` and continue roaming as you delight.

#### Argument(s): 2
With two arguments, you become a *true* explorer! You can switch between drives that are found in the file system. The first argument must be `/D` and the second should be an existing drive letter followed by a colon.

Example:
```
cd /D D:
```

> [!IMPORTANT]
> `cd` supports **up to 2 arguments**.

### Show Directories & Files 📂
Use `dir` to view the inner contents of your **current** directory or pair with a directory name to see the **child** directory's inner contents.

#### No Arguments
See the inner contents of your current directory.

Example:
```
dir
```
#### Argument(s): 1
See the inner works of the specified directory.

Example:
```
dir Projects
```

> [!IMPORTANT]
> `dir` supports **up to 1 argument**.

### Make a Directory 🏗️
To add your own directory, you use `mkdir`.

Example:
```
mkdir mtlaguerre
```
You can do something *I* think is pretty cool with that on *this* web portfolio! <sub>Hidden Features!</sub>

> [!IMPORTANT]
> `mkdir` requires and supports **1 argument**.

### Open (Run) Project Files 💻
Launching a program (project in this case) is as easy as `run` followed by the name of the project.

Example:
```
run ELT-RPG
```

> [!IMPORTANT]
> `run` requires and supports **1 argument**.
> Only project files are "executable" on this web portfolio.

### Echo 🗣️
Echo does just what it sounds like. You will command the terminal to give you a cave-like experience. Well, it only echos once..

Examples:
```
echo "Hello World!"
Hello World!

echo Hello World!
Hello
```

> [!IMPORTANT]
> `echo` supports **1 argument**.
> You can pair arguments within **double** quotes, as the example shows.

[^1]: Is it working?
