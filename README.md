

# My Little Man Computer
This is a clone of the little man computer made by: Dr. Stuart Madnick
- Based off: https://www.101computing.net/LMC/
- Wikipedia: https://en.wikipedia.org/wiki/Little_man_computer

<img src="https://i.imgur.com/AWhz3zx.png">

# Differences
- Using $ for address arguments
- Ability to make comment lines

# Documentation

## Operation Codes
<table>
  <tr>
    <th>Code</th>
    <th>Description</th>
    <th>Number</th>
  </tr>
  <tr>
    <td>INP</td>
    <td>Takes in user input and puts value into the accumulator</td>
    <td>901</td>
  </tr>
  <tr>
    <td>OUT</td>
    <td>Outputs accumulator to the output box</td>
    <td>902</td>
  </tr>
  <tr>
    <td>LDA</td>
    <td>Loads a memory address's value into the accumulator</td>
    <td>5XX</td>
  </tr>
  <tr>
    <td>STA</td>
    <td>Stores accumulator value into a memory address</td>
    <td>3XX</td>
  </tr>
  <tr>
    <td>ADD</td>
    <td>Adds value from memory address to accumulator</td>
    <td>1XX</td>
  </tr>
  <tr>
    <td>SUB</td>
    <td>Subtracts value from memory address to accumulator</td>
    <td>2XX</td>
  </tr>
  <tr>
    <td>BRP</td>
    <td>Checks if accumulator value is positive, if so then goto memory address</td>
    <td>8XX</td>
  </tr>
  <tr>
    <td>BRZ</td>
    <td>Checks if accumulator value is zero, if so then goto memory address</td>
    <td>7XX</td>
  </tr>
  <tr>
    <td>BRA</td>
    <td>Goto memory address</td>
    <td>6XX</td>
  </tr>  
  <tr>
    <td>HLT</td>
    <td>Stops the program</td>
    <td>000</td>
  </tr>  
  <tr>
    <td>DAT</td>
    <td>Puts a value into a memory address, like a variable</td>
    <td>XXX</td>
  </tr>  
</table>

## Comments
```
# This is how you do comments
```

## Example
Program that takes a number input and prints 
the number added to itself in an infinite loop.
```
      INP
      STA $99
loop  ADD $99
      OUT
      BRA loop
```
