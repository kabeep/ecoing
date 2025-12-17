import type { CommandModule } from 'yargs';

export interface CommandOptions {
    reLogin?: boolean;
}

const module: CommandModule<CommandOptions, CommandOptions> = {
    command: ['pull [options]', '$0'],
    aliases: ['p'],
    describe: 'Pull the latest development tasks',
    builder: {
        're-login': {
            alias: 'r',
            type: 'boolean',
            desc: 'Pull the tasks after re-login',
            default: false,
        },
    },
    handler: (args) => console.log(args),
};

export default module;
