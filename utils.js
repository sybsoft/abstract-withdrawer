import figlet from 'figlet'
import chalk from 'chalk'
import fs from "fs"


export const printGreetingMessage = () => {
    console.log(
        chalk.green.bold(
            figlet.textSync('SYBILYCH', {
                font: 'Small Slant',
                horizontalLayout: 'default',
                verticalLayout: 'default',
                width: 80,
                whitespaceBreak: true
            })
        )
    )
}

export const readFromTxt = (filePath) => {
    return fs
        .readFileSync(filePath, 'utf-8')
        .replace(/\r/g, '')
        .split('\n')
        .filter(Boolean)
}