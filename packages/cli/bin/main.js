#!/usr/bin/env node

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const options_1 = require("./options");
const commander_1 = require("commander");
const commands_1 = require("./commands");
const program = new commander_1.Command("Gylfie CLI").name("gylfie");
const options = new options_1.OptionFactory(program);
const commands = new commands_1.CommandFactory(program);
commands.add(new commands_1.InitializeCommand({
    options: [new options_1.ForceOption(), new options_1.PackageOption()],
}), new commands_1.StartCommand({ options: [new options_1.WatchOption(), new options_1.StageOption()] }), new commands_1.BuildCommand({ options: [new options_1.WatchOption(), new options_1.StageOption()] }), new commands_1.CleanCommand({ options: [new options_1.WatchOption(), new options_1.StageOption()] }), new commands_1.AddCommand({
    options: [new options_1.ForceOption(), new options_1.PackageOption(), new options_1.StageOption()],
}), new commands_1.UpdateCommand({}), new commands_1.GlobalCommand({ options: [new options_1.ForceOption()] }));
program.parse(process.argv);
