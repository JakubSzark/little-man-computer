/*
 * Little Man Computer Clone
 * Made by: Jakub P. Szarkowicz
 * [Email]: jakubshark@gmail.com
 * [License]: MIT
 * [Credit]: Dr. Stuart Madnick
 * [Wiki]: https://en.wikipedia.org/wiki/Little_man_computer
*/

/**
 * State of the computer
 */
interface State
{
    // The main working register
    accumulator: number,

    // The memory address of the current operation
    programCounter: number,

    // Determines whether the program is stopped
    programHalted: boolean,

    // Clock speed of the computer in milliseconds
    clockSpeed: number,

    // Random Access Memory of the computer
    RAM: Array<number>
}

// Function definition for input callback
type InputCallback = () => number;

// Function definition for output callback
type OutputCallback = (n: number) => void;

/**
 * Used to map labels to their
 * respective memory addresses.
 */
type Label = Record<string, number>;

// Standard OP Codes for LMC
const operationCodes: any =
{
    "INP": 901,
    "OUT": 902,
    "LDA": 500,
    "STA": 300,
    "ADD": 100,
    "SUB": 200,
    "BRP": 800,
    "BRZ": 700,
    "BRA": 600,
    "HLT": 0,
    "DAT": -1
};

// The State of the Computer
let state: State = 
{
    accumulator: 0,
    programCounter: 0,
    programHalted: false,
    clockSpeed: 250,
    RAM: new Array<number>(100)
}

/**
 * Resets the computer to its default state
 */
function reset()
{
    state.accumulator = 0;
    state.programCounter = 0;

    for (let i = 0; i < state.RAM.length; i++)
        state.RAM[i] = 0;

    state.programHalted = false;
}

/**
 * Halts the currently running program
 * @param callback Callback when program is halted successfully.
*/ 
function halt(callback: FunctionStringCallback) 
{
    if (!state.programHalted)
    {
        state.programHalted = true;
        if (callback != null) 
            callback("Program Halted");
    }
}

/**
 * Parses an array of Strings into an array of operation codes
 * @param lines Array of strings to parse
 * @param callback Callback for parsing errors
 * @returns Operation codes
 */
function parse(lines: string[], 
    callback: FunctionStringCallback): number[]
{
    // Function for splitting a line for tokens
    function getTokens(line: string): string[] {
        return line.trim().split(/[ ,\t]+/);
    }

    let codes: number[] = [];
    let labels: Map<string, number> = new Map();

    // Check for labels and convert them
    for (let j = 0; j < lines.length; j++)
    {
        // We extract tokens
        const tokens = getTokens(lines[j]);
        if (tokens.length < 2) continue;

        // Check if line contains a label
        if (!(tokens[0] in operationCodes))
            labels.set(tokens[0], j);
    }

    // Parse instructions and store them
    for (let i = 0; i < lines.length; i++)
    {
        // Ignore empty lines
        if (/^\s*$/.test(lines[i]) || lines[i].includes('#')) 
            continue;

        let code: number = 0; // Resulting Operation Token

        // We extract tokens
        const tokens = getTokens(lines[i]);

        // Check if no tokens are available
        if (tokens.length == 0)
        {
            callback(`[Line (${i})]: Does not contain any tokens!`);
            continue;
        }

        let codeToken: string;
        let argToken: string;

        // Depending on if there is a label, get the correct tokens
        if (tokens[0] in operationCodes)
        {
            codeToken = tokens[0];
            argToken = tokens[1];
        }
        else
        {
            codeToken = tokens[1];
            argToken = tokens[2];
        }

        // Check if codeToken is a valid operation code
        if (codeToken in operationCodes) { 
            code = operationCodes[codeToken]; 
        }
        else
        {
            callback(`[Line (${i})]: Operation code is not valid!`);
            continue;
        }

        // Arguments
        if (argToken != undefined)
        {
            // Check if argToken is a memory address
            if (argToken[0] == '$')
            {
                argToken = argToken.substr(1); // Remove $
                let arg = parseInt(argToken);
    
                if (isNaN(arg))
                {
                    callback(`[Line (${i})]: Address argument is NaN!`);
                    continue;
                }
                else if (arg < 0 && arg > state.RAM.length - 1) 
                {
                    callback(`[Line (${i})]: Address argument is out of range!`);
                    continue;
                }
                else { code += arg; }
            }
            else if (labels.has(argToken)) // Label Parsing
            {
                // Get memory address from label
                let argVal = labels.get(argToken);
                if (argVal != undefined) code += argVal;
            }
            else if (code == -1) // DAT Parsing
            {
                let arg = parseInt(argToken);
                if (isNaN(arg))
                {
                    callback(`[Line (${i})]: Data argument is NaN!`);
                    continue;
                }
                else {
                    code = arg;
                }
            }
            else
            {
                callback(`[Line (${i})]: Argument token could not be parsed!`);
                continue;
            }
        }

        // Push parsed code
        codes.push(code);
    }

    return codes;
}

/**
 * Loads a program into RAM
 * @param codes Array of operation codes
 */
function load(codes: number[])
{
    reset();
    for (let i = 0; i < state.RAM.length; i++)
    {
        if (i < codes.length) state.RAM[i] = codes[i]
        else state.RAM[i] = 0
    }
}

/**
 * Steps through a program. Evaluates operation codes 
 * sequencially, if a problem occurs, then program will halt
 * @param inCallback Callback called when input is requested
 * @param outCallback Callback called when output is requested
 */
function step(inCallback: InputCallback, 
    outCallback: OutputCallback, haltCallback: Function)
{
    if (state.programHalted) return;

    // Memory address value at program counter
    let addressValue = state.RAM[state.programCounter];

    // IR[Address]
    let instructionArgument = addressValue - 
        Math.floor(addressValue / 100.0) * 100;

    // Operation Code
    let operationCode = addressValue < 900 ? 
        addressValue - instructionArgument : addressValue;

    // Execute based on current operation
    switch (operationCode)
    {
        // IOR -> A
        // PC + 1 -> PC
        case operationCodes.INP:
            state.accumulator = inCallback();
            state.programCounter++;
            break;

        // A -> IOR
        // PC + 1 -> PC
        case operationCodes.OUT:
            outCallback(state.accumulator);
            state.programCounter++;
            break;

        // IR[address] -> MAR
        // A + MDR -> A
        // PC + 1 -> PC
        case operationCodes.ADD:
            state.accumulator += state.RAM[instructionArgument];
            state.programCounter++;
            break;

        // IR[address] -> MAR
        // A - MDR -> A
        // PC + 1 -> PC
        case operationCodes.SUB:
            state.accumulator -= state.RAM[instructionArgument];
            state.programCounter++;    
            break;
            
        // IR[address] -> MAR
        // MDR -> A
        // PC + 1 -> PC
        case operationCodes.LDA:
            state.accumulator = state.RAM[instructionArgument];
            state.programCounter++;    
            break;

        // IR[address] -> MAR
        // A -> MDR
        // PC + 1 -> PC    
        case operationCodes.STA:
            state.RAM[instructionArgument] = state.accumulator;
            state.programCounter++;    
            break;

        // IR[address] -> PC
        case operationCodes.BRA:
            state.programCounter = instructionArgument;
            break;

        // A > 0
        // IF TRUE, IR[address] -> PC
        // ELSE, PC + 1 -> PC
        case operationCodes.BRP:
            if (state.accumulator > 0) 
                state.programCounter = instructionArgument;
            else
                state.programCounter++;    
            break;

        // A == 0
        // IF TRUE, IR[address] -> PC
        // ELSE, PC + 1 -> PC
        case operationCodes.BRZ:
            if (state.accumulator == 0) 
                state.programCounter = instructionArgument;
            else
                state.programCounter++;   
            break;
        
        // HALT PROGRAM
        case operationCodes.HLT:
            halt(() => {});
            haltCallback();
            break;
    }
}

// ===========================================
// BROWSER CODE
// ===========================================

let cells: HTMLElement[] = [];
let runningHandle = 0;

// Boxes
let inputBox = document.getElementById("inputText");
let outputBox = document.getElementById("outputText");
let consoleBox = document.getElementById("console");

let notepad = document.getElementById('notepad');

// Registers
let accumulator = document.getElementById('accum');
let pc = document.getElementById('counter');

/**
 * Log a message to the console box
 * @param msg Message to add
 */
const log = (msg: string) => consoleBox?.append(msg + '\n');

function setActiveCell(index: number)
{
    var mems = document.getElementsByClassName('mem-cell');
    var active = document.getElementsByClassName('active-cell');
    for (let i = 0; i < active.length; i++)
        active[i].classList.remove('active-cell');
    mems[index].classList.add('active-cell');
}

function updateRegisters() 
{
    // Set Program Counter
    if (pc != null) 
        pc.innerHTML = state.programCounter.toString();

    // Set Accumulator
    if (accumulator != null) 
        accumulator.innerHTML = state.accumulator.toString();

    // Set Cells
    for (let i = 0; i < cells.length; i++)
    {
        cells[i].innerHTML = state.RAM[i].toString();
        if (state.RAM[i] == 0) cells[i].innerHTML += "00";
    }

    // Set the Active Cell
    setActiveCell(state.programCounter);
}

function resetComputer()
{
    reset();
    console.clear();

    if (inputBox != null) inputBox.innerHTML = "";
    if (consoleBox != null) consoleBox.innerHTML = "";
    if (outputBox != null) outputBox.innerHTML = "";
    
    setActiveCell(0);
}

function stepComputer()
{
    step(() =>
    {
        let input = prompt("Enter an Input");

        if (input != null)
        {
            if (inputBox != null)
                inputBox.innerHTML += input.toString() + "\n";
            return parseInt(input);
        }

        return 0;
    }, 
    out => 
    {
        if (outputBox != null) 
            outputBox.innerHTML += out.toString() + "\n";
    }, 
    () => log("PROGRAM HALTED!"));

    updateRegisters();
}

function updateLineNumbers()
{
    let lines = document.getElementsByClassName('line');
    for (let i = 0; i < lines.length; i++)
    {
        let num = i.toString();
        if (i < 10) num = "0" + num;
        lines[i].children[0].innerHTML = num;
    }
}

function createLine(index: number): HTMLInputElement | null
{
    if (notepad != undefined && notepad.children.length > 99)
        return null;

    const line = document.createElement('div');
    const number = document.createElement('span');
    const input = document.createElement('input');

    line.append(number);
    line.append(input);
    
    input.classList.add('line-input');
    line.classList.add('line');

    notepad?.insertBefore(line, notepad.children[index]);

    input.addEventListener('keydown', event =>
    {
        function focusLine(lineNumber: number) 
        {
            let lastLine = notepad?.children[lineNumber];
            if (lastLine != undefined)
                (<HTMLInputElement>lastLine.children[1]).focus();
        }

        var sel = input.selectionStart;

        // Support for Tabbing
        if (sel != undefined && event.keyCode == 9) 
        {
            let oldSel = sel;
            input.value = input.value.substr(0, sel) + "\t" +
                input.value.substr(sel);
            input.selectionStart = oldSel + 1;
            input.selectionEnd = input.selectionStart;
            event.preventDefault();
        }

        let lineNum = parseInt(line.children[0].innerHTML);

        // Making new lines
        if (event.keyCode == 13)
        {
            let newLine = createLine(lineNum + 1);
            newLine?.focus();
        }

        // Removing Lines
        if (lineNum > 0)
        {
            if (event.keyCode == 8 && input.value.length == 0)
            {
                focusLine(lineNum - 1);
                notepad?.removeChild(line);
                updateLineNumbers();

                event.preventDefault();
            }
        }

        // Up Arrow
        if (event.keyCode == 38) { focusLine(lineNum - 1); }

        // Down Arrow
        if (event.keyCode == 40) { focusLine(lineNum + 1); }
    });

    updateLineNumbers();
    return input;
}

// EVENTS

window.onload = () =>
{
    for (let i = 0; i < 100; i++)
    {
        const cell = document.createElement('div');
        const cellNum = document.createElement('span');
        const cellMem = document.createElement('div');

        cellNum.innerHTML = i.toString();
        cellMem.innerHTML = "000";

        cell.append(cellNum);
        cell.append(cellMem);

        cell.classList.add('mem-cell');
        let memory = document.getElementById('memory');
        if (memory != null) memory.append(cell);
        cells.push(cellMem);
    }

    for (let i = 0; i < 99; i++)
    {
        let storedLine = localStorage.getItem(`line${i}`);
        if (storedLine != null)
        {
            let line = createLine(i);
            if (line != null) {
                (<HTMLInputElement>line).value = storedLine;
            }
        }
    }

    localStorage.clear();

    if (notepad != undefined && notepad.children.length == 0)
        createLine(0);
};

window.addEventListener('unload', () => 
{
    let lineElems = <HTMLCollectionOf<HTMLInputElement>>document
        .getElementsByClassName('line-input');
    for (let i = 0; i < lineElems.length; i++) {
        localStorage.setItem(`line${i}`, lineElems[i].value);
    }
});

document.getElementById('load')
    ?.addEventListener('click', () =>
{
    resetComputer();

    // Get all lines
    let lineElems = <HTMLCollectionOf<HTMLInputElement>>document
        .getElementsByClassName('line-input');
    let lines: string[] = [];

    // Remove all empty lines and comments
    for (let i = 0; i < lineElems.length; i++)
    {
        if (!(/^\s*$/.test(lineElems[i].value) || 
            lineElems[i].value.includes('#')))
        {
            lines.push(lineElems[i].value);
        }
    }

    let program = parse(lines, err => log(err));
    load(program);
    updateRegisters();
});

document.getElementById('run')
    ?.addEventListener('click', () =>
{
    if (state.programHalted) return;

    stepComputer();
    runningHandle = setInterval(() => stepComputer(), 
        state.clockSpeed);
});

document.getElementById('stop')
    ?.addEventListener('click', () =>
{
    clearInterval(runningHandle);
    halt(() => log("PROGRAM HALTED!"));
});

document.getElementById('step')
    ?.addEventListener('click', () => 
{
    if (state.programHalted) return;
    stepComputer();
});

document.getElementById('docs')
    ?.addEventListener('click', () => {
    window.location.href = "https://github.com/JakubSzark/jakubs-little-man-computer";
});