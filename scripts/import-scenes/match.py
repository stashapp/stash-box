import json
import sys

from stashboxInterface import StashBoxInterface

def readInput(fn):
    with open(fn) as file:
        return json.load(file)

def writeOutput(fn, data):
    with open(fn, 'w') as out:
        json.dump(data, out, indent=1)

def mapPerformer(client: StashBoxInterface, v):
    return client.performerIDByName(v)

def mapStudio(client: StashBoxInterface, v):
    return client.studioIDByName(v)

def mapTag(client: StashBoxInterface, v):
    return client.tagIDByName(v)

def performMapping(client, typ, map):
    for v in map:
        if map[v] == None:
            if typ == "performers":
                map[v] = mapPerformer(client, v)
            elif typ == "studios":
                map[v] = mapStudio(client, v)
            elif typ == "tags":
                map[v] = mapTag(client, v)
            else:
                raise Exception("unknown type: {}".format(typ))

        if map[v] == None:
            print("No match found for {}".format(v))
        else:
            print("{} matched to {}".format(v, map[v]))


def main():
    input = sys.argv[1]
    typ = sys.argv[2]
    output = sys.argv[3]

    map = readInput(input)
    client = StashBoxInterface()

    try:
        performMapping(client, typ, map)
    except KeyboardInterrupt:
        # ignore and write the output
        pass
    
    writeOutput(output, map)

main()