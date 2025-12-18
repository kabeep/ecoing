import process from 'node:process';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { type PullCommandOptions, pullCommand } from './commands';

yargs(hideBin(process.argv))
    .scriptName('ecoing')
    .usage('$0 <command> [arguments]')
    .command<PullCommandOptions>(pullCommand)
    .alias('h', 'help')
    .alias('V', 'version')
    .strict()
    .demandCommand()
    .parse();
