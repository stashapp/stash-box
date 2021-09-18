import argparse
import json

from typing import Dict

from constants import *
from stashboxInterface import StashBoxInterface

def parseArgs():
    parser = argparse.ArgumentParser(description="Import scenes from a csv file")
    parser.add_argument("input", metavar="INPUT", help="json file")
    return parser.parse_args()

def main():
    args = parseArgs()
    process(args)

def process(args):
    client = StashBoxInterface()

    with open(args.input) as jsonfile:
        reader = json.load(jsonfile)

        for row in reader:
            # ensure scene does not already exist
            if URL not in row:
                print("Skipping row without URL\n")
                continue
            
            if client.isSceneExist(row[URL]):
               print("Skipping existing scene with URL {}".format(row[URL]))
               continue

            # upload image first
            imageId = None

            if IMAGE in row:
                with open(row[IMAGE], 'rb') as imageFile:
                    imageId = client.createImage(imageFile, row[IMAGE])

            input = makeSceneCreateInput(row)
            if imageId != None:
                input["image_ids"] = [imageId]

            client.createScene(input)
            print("Created scene: {}".format(row[URL]))

def makeSceneCreateInput(row: Dict[str, str]):
    ret = {}
    if TITLE in row:
        ret["title"] = row[TITLE]
    if DETAILS in row:
        ret["details"] = row[DETAILS]
    if DATE in row:
        # TODO
        ret["date"] = row[DATE]
    if DURATION in row:
        # assume an integer
        ret["duration"] = int(row[DURATION])
    if DIRECTOR in row:
        ret["director"] = row[DIRECTOR]
    if URL in row:
        ret["urls"] = [{"url": row[URL], "type": "STUDIO"}]
    if STUDIO in row:
        ret["studio_id"] = row[STUDIO]
    
    if TAGS in row:
        ret["tag_ids"] = row[TAGS]

    if PERFORMERS in row:
        # TODO - handle aliases
        performers = row[PERFORMERS]
        ret["performers"] = []
        for p in performers:
            ret["performers"].append({"performer_id": p})

    # TODO - image handling

    ret["fingerprints"] = []

    return ret

main()