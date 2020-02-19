var cells = [];

const opCodes =
{
    "INP": 901,
    "OUT": 902,
    "LDA": 5,
    "STA": 3,
    "ADD": 1,
    "SUB": 2,
    "BRP": 8,
    "BRZ": 7,
    "BRA": 6,
    "HLT": 0,
    "DAT": 0
};

var accum = 0;
var counter = 0;

var halted = false;
var runHandle = 0;

$(() =>
{
    // Populate Memory Cells
    for (var i = 0; i < 100; i++)
    {
        const cell = document.createElement('div');
        const cellNum = document.createElement('span');
        const cellMem = document.createElement('div');

        cellNum.innerHTML = i;
        cellMem.innerHTML = "000";

        cell.append(cellNum);
        cell.append(cellMem);

        cell.classList.add('mem-cell');
        document.getElementById('memory').append(cell);
        cells.push(cellMem);
    }
});

// Coding Text Area
$('#code').on('keydown', event =>
{
    var keyCode = event.keyCode || event.which;
    const text = document.getElementById('code');

    if (!event.shiftKey && keyCode == 9)
    {
        event.preventDefault();
        text.value += "\t";
    }
});

function logToConsole(log) {
    $('#console').append(log + "\n");
}

function logParseError(line, msg) 
{
    const log = "[Error; " + line + "]: " + msg;
    console.log(log);
    logToConsole(log);
}

function haltProgram() 
{
    clearInterval(runHandle);
    console.log("PROGRAM HALTED");
    $('#console').append("PROGRAM HALTED\n");
    halted = true;
}

function setActiveCell(index)
{
    var mems = document.getElementsByClassName('mem-cell');
    var active = document.getElementsByClassName('active-cell');
    for (var i = 0; i < active.length; i++)
        active[i].classList.remove('active-cell');
    mems[index].classList.add('active-cell');
}

function updateRegisters() 
{
    console.log({ counter, accum });
    $('#counter').html(counter);
    $('#accum').html(accum);
    setActiveCell(counter);
}

function clearComputer()
{
    console.clear();

    for (var cell in cells)
        cell.innerHTML = "000";

    halted = false;
    counter = 0;
    accum = 0;

    $('#inputText').html("");
    $('#outputText').html("");
    $('#console').html("");

    setActiveCell(0);
}

$('#load').click(event => 
{
    clearComputer();
    var textToParse = $('#code').val();
    var lines = textToParse.split('\n');
    
    for (var i = 0; i < lines.length; i++) 
    {
        const tokens = lines[i].split(/[ ,\t]+/);

        if (!(tokens[0] in opCodes))
        {
            logParseError(i, "Not a valid operation!");
            return;
        }

        var opCode = opCodes[tokens[0]];

        // CHECK FOR ARGUMENTS
        if (tokens.length > 1)
        {
            switch (opCode)
            {
                case opCodes.DAT:
                    if (!isNaN(tokens[1]))
                        opCode = "[" + tokens[1] + "]"; 
                    break;

                case opCodes.BRA:
                case opCodes.BRZ:
                case opCodes.BRP:
                case opCodes.ADD:
                case opCodes.SUB:
                case opCodes.LDA:
                case opCodes.STA:
                    if (!isNaN(tokens[1].substr(1)) && 
                        tokens[1][0] == '$') 
                    {
                        var memPtr = tokens[1].substr(1);
                        if (parseInt(memPtr) < 10) memPtr = "0" + memPtr;
                        opCode += memPtr;
                    }
                    else {
                        logParseError(i, "Argument is not a memory address!");
                        return;
                    }
                    break;

                default:
                    break;
            }
        }

        cells[i].innerHTML = opCode;
    }
});

function step()
{
    if (halted) return;
    var cellValue = cells[counter].innerHTML;

    if (cellValue[0] != '[')
    {
        const opCode = Math.floor(cellValue / 100.0);
        const memPtr = parseInt(cellValue.substr(1));

        if (opCode == 9)
        {
            if (cellValue == "901")
            {
                var val = prompt("Enter Input Value:");
                if (!isNaN(val)) 
                {
                    accum = parseInt(val);
                    $('#inputText').append(val + "\n");
                }
            }

            if (cellValue == "902") {
                $('#outputText').append(accum + "\n");
            }

        }
        else if (opCode == 0)
        {
            haltProgram();
            return;
        }
        else
        {
            var value = cells[memPtr].innerHTML;
            if (value[0] == "[") 
                value = value.substr(1, value.length - 2);
    
            switch (opCode)
            {
                case opCodes.ADD: accum += parseInt(value); break;
                case opCodes.SUB: accum -= parseInt(value); break;
    
                case opCodes.STA: cells[memPtr].innerHTML = accum; break;
                case opCodes.LDA:
                    var newAccum = cells[memPtr].innerHTML;
                    if (cells[memPtr].innerHTML[0] == "[")
                        newAccum = newAccum.substr(1, newAccum.length - 2);
                    accum = parseInt(newAccum); 
                    break;
    
                case opCodes.BRZ:
                    if (accum == 0)
                    {
                        counter = memPtr;
                        updateRegisters();
                        return;
                    }
                    break;
    
                case opCodes.BRP:
                    if (accum >= 0)
                    {
                        counter = memPtr;
                        updateRegisters();
                        return;
                    }
                    break;
    
                case opCodes.BRA: 
                    counter = memPtr; 
                    updateRegisters();
                    return;

                default:
                    haltProgram();
                    break;
            }
        }

    }

    updateRegisters();
    counter++;
}

$('#stop').click(event => {
    haltProgram();
});

$('#run').click(event => 
{
    clearInterval(runHandle);
    runHandle = setInterval(step, 250);
});

$('#step').click(event => {
    step();
});