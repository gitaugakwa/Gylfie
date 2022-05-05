import {
	PackageOption,
	OptionFactory,
	ForceOption,
	WatchOption,
	StageOption,
} from "./options";
import { Command } from "commander";
import {
	AddCommand,
	CommandFactory,
	InitializeCommand,
	StartCommand,
	GlobalCommand,
	BuildCommand,
	CleanCommand,
	UpdateCommand,
} from "./commands";

const program = new Command("Gylfie CLI").name("gylfie");

const options = new OptionFactory(program as Command);
const commands = new CommandFactory(program as Command);

// options.add(new PackageOption());
// options.add(new ForceOption());
commands.add(
	new InitializeCommand({
		options: [new ForceOption(), new PackageOption()],
	}),
	new StartCommand({ options: [new WatchOption(), new StageOption()] }),
	new BuildCommand({ options: [new WatchOption(), new StageOption()] }),
	new CleanCommand({ options: [new WatchOption(), new StageOption()] }),
	new AddCommand({
		options: [new ForceOption(), new PackageOption(), new StageOption()],
	}),
	new UpdateCommand({}),
	new GlobalCommand({ options: [new ForceOption()] })
);

// console.log(process.cwd());

program.parse(process.argv);
// console.log(program.opts());
