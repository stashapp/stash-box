import csv
import json
import sys
import datetime
import re
import requests
import hashlib
import os
import shlex

class State:
    file = None
    out = None
    data = None

    mapFiles = {}
    outputs = {}

    def __init__(self) -> None:
        self.args = sys.argv[1:]

    def usage(self, ln, usage):
        if len(self.args) < ln:
            raise Exception(usage)

    def arg(self):
        return self.args.pop(0)

    def finalise(self):
        for o in self.outputs:
            out = open(o, 'w')
            json.dump(self.outputs[o], out, indent=1)
            out.close()

class CommandSpec:
    usage = ""
    func = None
    nargs = 0
    branched = False

    def __init__(self, func, nargs, usage, branched = False) -> None:
        self.usage = usage
        self.func = func
        self.nargs = nargs
        self.branched = branched

    def parseArgs(self, args):
        if len(args) < self.nargs:
            raise Exception(self.usage)

        ret = []
        for _ in range(self.nargs):
            ret.append(args.pop(0))

        return ret


class Command:
    func = None
    args = []
    commands = []

    def __init__(self, args, spec: CommandSpec) -> None:
        self.func = spec.func
        self.args = spec.parseArgs(args)

        if spec.branched:
            self.commands = makeCommands(args)
    
    def execute(self, state: State):
        self.func(state, self)

    def executeSubCommands(self, state: State):
        for c in self.commands:
            c.execute(state)

def includeFile(fn, args):
    subargs = []
    with open(fn) as file:
        lines = file.readlines()
        for l in lines:
            if len(l) > 0 and l[0] != "#":
                subargs.extend(shlex.split(l))
    
    args[0:0] = subargs


def makeCommands(args):
    ret = []
    while len(args) > 0:
        cmd = args.pop(0).lower()

        # special case for run - include a file
        if cmd == "run":
            fn = args.pop(0)
            includeFile(fn, args)
            continue

        if cmd not in commands:
            raise Exception("unknown command", cmd)

        spec = commands[cmd]
        ret.append(Command(args, spec))

    return ret

def readCSV(state: State, cmd: Command):
    fn = cmd.args[0]

    with open(fn, newline='') as file:
        reader = csv.DictReader(file)

        for row in reader:
            state.data = row
            cmd.executeSubCommands(state)

def readJSON(state: State, cmd: Command):
    fn = cmd.args[0]

    with open(fn) as file:
        reader = json.load(file)

        for row in reader:
            state.data = row
            cmd.executeSubCommands(state)

def write(state: State, cmd: Command):
    fn = cmd.args[0]
    
    if fn not in state.outputs:
        state.outputs[fn] = []

    state.outputs[fn].append(state.data)

def rm(state: State, cmd: Command):
    field = cmd.args[0]

    if field in state.data:
        state.data.pop(field)

def keep(state: State, cmd: Command):
    fields = cmd.args[0].split(",")

    toRemove = []
    for df in state.data:
        if df not in fields:
            toRemove.append(df)
    
    for f in toRemove:
        if f in state.data:
            state.data.pop(f)

def mv(state: State, cmd: Command):
    frm = cmd.args[0]
    to = cmd.args[1]

    if frm in state.data:
        state.data[to] = state.data[frm]
        state.data.pop(frm)

def parseDate(state: State, cmd: Command):
    field = cmd.args[0]
    format = cmd.args[1]

    dt = datetime.datetime.strptime(state.data[field], format)
    state.data[field] = dt.strftime("%Y-%m-%d")

def parseDuration(state: State, cmd: Command):
    field = cmd.args[0]
    format = cmd.args[1]

    # example
    # "(?:(?:(?P<hours>\d+):)?(?:(?P<minutes>\d+):))?(?P<seconds>\d+)"
    regex = re.compile(format)

    parts = regex.match(state.data[field])
    if not parts:
        return
    
    parts = parts.groupdict()
    time_params = {}
    for name, param in parts.items():
        if param:
            time_params[name] = int(param)
    td = datetime.timedelta(**time_params)
    
    # convert to seconds
    state.data[field] = int(td.total_seconds())

def setStr(state: State, cmd: Command):
    field = cmd.args[0]
    value = cmd.args[1]

    state.data[field] = value

def replace(state: State, cmd: Command):
    field = cmd.args[0]
    regex = cmd.args[1]
    repl = cmd.args[2]

    regex = re.compile(regex)
    state.data[field] = regex.sub(repl, state.data[field])

def tolist(state: State, cmd: Command):
    field = cmd.args[0]
    sep = cmd.args[1]

    state.data[field] = state.data[field].split(sep)

def wget(state: State, cmd: Command):
    field = cmd.args[0]
    outDir = cmd.args[1]
    suffix = cmd.args[2]

    url = state.data[field]
    filename = os.path.join(outDir, hashlib.md5(url.encode("utf-8")).hexdigest())
    filename = filename + suffix

    if not os.path.exists(filename):
        print("Downloading {}".format(url))
        try:
            r = requests.get(url)
        except:
            print("Failed to get url {}, skipping".format(url))
            return
        
        with open(filename, 'wb') as fd:
            for chunk in r.iter_content(chunk_size=128):
                fd.write(chunk)

    state.data[field] = filename

def extractMap(state: State, cmd: Command):
    field = cmd.args[0]
    outFile = cmd.args[1]

    if outFile not in state.outputs:
        state.outputs[outFile] = {}

    output = state.outputs[outFile]
    value = state.data[field]
    if not isinstance(value, list):
        value = [value]

    for v in value:
        if v not in output:
            output[v] = None

def mapValues(state: State, cmd: Command):
    field = cmd.args[0]
    mapFile = cmd.args[1]

    if mapFile not in state.mapFiles:
        with open(mapFile) as file:
            mappings = json.load(file)
            state.mapFiles[mapFile] = mappings

    mappings = state.mapFiles[mapFile]
    value = state.data[field]
    if isinstance(value, list):
        out = []
        for e in value:
            if e in mappings:
                mapped = mappings[e]
                if mapped != None:
                    out.append(mappings[e])
        state.data[field] = out
    else:
        if value != None:
            mapped = mappings[value]
            if mapped == None:
                # remove
                del(state.data[field])
            else:
                state.data[field] = mapped

commands = {
    "readcsv": CommandSpec(readCSV, 1, "readcsv <filename>", True),
    "readjson": CommandSpec(readJSON, 1, "readjson <filename>", True),
    "write": CommandSpec(write, 1, "write <filename>"),
    "rm": CommandSpec(rm, 1, "rm <field>"),
    "mv": CommandSpec(mv, 2, "mv <field> <to>"),
    "keep": CommandSpec(keep, 1, 'keep <"field,...">'),
    "replace": CommandSpec(replace, 3, "replace <field> <regex> <replace with>"),
    "parsedate": CommandSpec(parseDate, 2, "parsedate <field> <format>"),
    "parseduration": CommandSpec(parseDuration, 2, "parseduration <field> <format>"),
    "tolist": CommandSpec(tolist, 2, "tolist <field> <separator>"),
    "wget": CommandSpec(wget, 3, "wget <field> <dir> <suffix>"),
    "extractmap": CommandSpec(extractMap, 2, "extractmap <field> <filename>"),
    "setstr": CommandSpec(setStr, 2, "setstr <field> <value>"),
    "mapvalues": CommandSpec(mapValues, 2, "mapvalues <field> <mapfile>")
}

def main():
    commands = makeCommands(sys.argv[1:])

    state = State()

    for c in commands:
        c.execute(state)
    
    state.finalise()

main()