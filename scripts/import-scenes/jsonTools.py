import csv
import json
import sys
import datetime
import re

file = None
out = None
buffer = []

def write(data, fn):
    global out
    if out == None:
        out = open(fn, 'w')
    
    buffer.append(data)

def rm(data, field):
    if field in data:
        data.pop(field)

def keep(data, fields):
    toRemove = []
    for df in data:
        if df not in fields:
            toRemove.append(df)
    
    for f in toRemove:
        rm(data, f)

def mv(data, frm, to):
    if frm in data:
        data[to] = data[frm]
        data.pop(frm)

def parseDate(data, field, format):
    dt = datetime.datetime.strptime(data[field], format)
    data[field] = dt.strftime("%Y-%m-%d")

def parseDuration(data, field, format):
    # example
    # "(?:(?:(?P<hours>\d+):)?(?:(?P<minutes>\d+):))?(?P<seconds>\d+)"
    regex = re.compile(format)

    parts = regex.match(data[field])
    if not parts:
        return
    
    parts = parts.groupdict()
    time_params = {}
    for name, param in parts.items():
        if param:
            time_params[name] = int(param)
    td = datetime.timedelta(**time_params)
    
    # convert to seconds
    data[field] = int(td.total_seconds())

def replace(data, field, regex, rpl):
    regex = re.compile(regex)
    data[field] = regex.sub(rpl, data[field])

def execute(data, args):
    if len(args) > 0:
        cmd = args.pop(0).lower()

        if cmd == "write":
            fn = args.pop(0)
            write(data, fn)
        elif cmd == "rm":
            field = args.pop(0)
            rm(data, field)
        elif cmd == "mv":
            field = args.pop(0)
            to = args.pop(0)
            mv(data, field, to)
        elif cmd == "keep":
            fields = args.pop(0).split(",")
            keep(data, fields)
        elif cmd == "replace":
            field = args.pop(0)
            regex = args.pop(0)
            repl = args.pop(0)
            replace(data, field, regex, repl)
        elif cmd == "parsedate":
            field = args.pop(0)
            format = args.pop(0)
            parseDate(data, field, format)
        elif cmd == "parseduration":
            field = args.pop(0)
            format = args.pop(0)
            parseDuration(data, field, format)
        else:
            raise Exception("unknown command", cmd)

def executeCommands(data):
    localCmds = sys.argv[1:]

    while len(localCmds) > 0:
        execute(data, localCmds)

def main():
    cmd = sys.argv[1]
    fn = sys.argv[2]
    if cmd.lower() == "readcsv":
        with open(fn, newline='') as file:
            reader = csv.DictReader(file)

            for row in reader:
                execute(row, 3)
    elif cmd.lower() == "readjson":
        with open(fn) as file:
            reader = json.load(file)

            for row in reader:
                execute(row, 3)

    if file != None:
        file.close()

    if out != None:
        json.dump(buffer, out, indent=1)
        out.close()

main()