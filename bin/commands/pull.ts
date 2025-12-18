import type { Argv, CommandModule } from 'yargs';

export interface Options {
    /**
     * Reauthorize before pull request
     * @default false
     */
    reauthorize?: boolean;
}

const COMMAND_NAME = 'pull [options]';
const COMMAND_ALIAS = 'p';
const COMMAND_DESCRIPTION = 'Pull the latest development tasks';

const builder = (instance: Argv<Options>) =>
    instance.option('reauthorize', {
        alias: 'r',
        type: 'boolean',
        describe: 'Reauthorize before pull request',
        default: false,
    });

const module: CommandModule<Options, Options> = {
    command: [COMMAND_NAME, '$0'],
    aliases: COMMAND_ALIAS,
    describe: COMMAND_DESCRIPTION,
    builder,
    handler: (args) => console.log(args),
};

export default module;
