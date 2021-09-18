# Scene import tools

All scripts require Python 3.

## JSON Tools

The jsonTools script reads in a CSV or JSON file, performing operations on the data.

To run:
```
python jsonTools.py [operation...]
```

For example, the following command will read in a CSV file, and convert it to a JSON file:
```
python jsonTools.py readcsv input.csv write output.json
```

Alternatively, script files may be executed using `run`.

The following commands are supported:

### `readcsv <filename>` 

Reads and processes a CSV file. Subsequent commands are performed on rows read from the CSV file.

### `readjson <filename>` 

Reads and processes a JSON file. Subsequent commands are performed on rows read from the JSON file.

### `write <filename>`

Writes the data as JSON to the provided output file.

### `setstr <field> <value>`

Sets a field in all rows to the provided string value.

For example:

Before:
```
[
    {
        "foo": "a",
        "bar": "b"
    },
    {
        "foo": "b",
        "bar": "b"
    }
]
```

After `setstr foo z`:
```
[
    {
        "foo": "z",
        "bar": "b"
    },
    {
        "foo": "z",
        "bar": "b"
    }
]
```

### `rm <field>`

Removes a field from all objects in the data.

For example:

Before:

```
[{
    "foo": "bar",
    "bar": "baz"
}]
```

After `rm foo`:
```
[{
    "bar": "baz"
}]
```

### `mv <field> <to>`

Renames a field to a different name.

For example:

Before:

```
[{
    "foo": "bar",
    "bar": "baz"
}]
```

After `mv foo baz`:
```
[{
    "baz": "bar",
    "bar": "baz"
}]
```

### `keep <field,...>`

Removes all fields except those listed.

For example:

Before:

```
[{
    "a": "1",
    "b": "2",
    "c": "3",
    "d": "4"
}]
```

After `keep "a,b"`:
```
[{
    "a": "1",
    "b": "2"
}]
```

### `replace <field> <regex> <replace with>`

Performs regex replacement on the given field. 

For example:

Before:
```
[{
    "a": "foo",
    "b": "2"
}]
```

After `replace a "fo+" bar`:
```
[{
    "a": "bar",
    "b": "2"
}]
```

### `parsedate <field> <format>`

Converts a date into one suitable for stash-box. Uses python `strptime` format.

For example:

Before:
```
[{
    "date": "September 18, 2021",
    "b": "2"
}]
```
After `parsedate date "%B %d, %Y"`:
```
[{
    "date": "2021-09-18",
    "b": "2"
}]
```
### `parseduration <field> <format>`

Converts a duration using regex into seconds for stash-box. Uses named capture groups for `hours`, `minutes` and `seconds` to determine the components of the duration.

For example:

Before:
```
[{
    "duration": "1:23:45",
    "b": "2"
}]
```
After `parseduration duration "(?:(?:(?P<hours>\d+):)?(?:(?P<minutes>\d+):))?(?P<seconds>\d+)"`:
```
[{
    "duration": 5025,
    "b": "2"
}]
```
### `tolist <field> <separator>`

Converts a string field into a list.

For example:

Before:
```
[{
    "list": "a,b,c,d,e,f",
    "b": "2"
}]
```
After `tolist list ,`:
```
[{
    "list": ["a","b","c","d","e","f"]
    "b": "2"
}]
```
### `wget <field> <dir> <suffix>`

Downloads the URL in the provided field and stores it in the provided directory, using the MD5 hash of the URL plus the provided suffix as the filename. Replaces the URL in the data with the path to the downloaded file.

### `extractmap <field> <filename>`

Creates a JSON file with an empty mapping of field values - for use with the `mapvalues` command. Does not modify the data. Works with singular and list data.

For example:

```
[
    {
        "tags": ["a","b","c"]
    },
    {
        "tags": ["c","d"]
    },
]
```

With `extractmap tags tags.json`, `tags.json` will be created with the following contents:

```
{
    "a": null,
    "b": null,
    "c": null,
    "d": null,
}
```

### `mapvalues <field> <mapfile>`

Sets field values by mapping values using the provided map file. Any values that could not be mapped are removed. This means that for non-list values, the key is removed altogether for that object.

For example:
```
[
    {
        "tags": ["a","b","c"]
    },
    {
        "tags": ["c","d"]
    },
]
```

With `tags.json`:
```
{
    "a": "foo",
    "b": "bar",
    "c": "baz",
    "d": null,
}
```

After `mapvalues tags tags.json`:
```
[
    {
        "tags": ["foo","bar","baz"]
    },
    {
        "tags": ["baz"]
    },
]
```

For a singular value example, before:

```
[
    {
        "foo": "bar",
        "tag": "a"
    },
    {
        "foo": "bar",
        "tag": "d"
    },
]
```

Using the data `tags.json` and command:
```
[
    {
        "foo": "bar",
        "tag": "foo"
    },
    {
        "foo": "bar"
    },
]
```

## Match

The `match.py` tool is used to match performers, studios and tags by name. It accepts an input JSON file, the type of objects to match, and a path to the output file.

The input file follows the format output by the `extractmap` command of the JSON tools. It queries for performers/tags/studios for each key that has a `null` value. If a result is found, then the value is replaced with the id of the object. If no object is found, the value is left as `null`.

## Import Scenes

Expects a json file with a list of objects. 

```
python importScenes.py <json file>
```

The objects may include the following fields:
```
{
  "url": "<required>",
  "title": "<optional>",
  "tags": ["tag1_id", ...], 
  "performers": ["performer_id, ...],
  "date": "YYYY-MM-DD",
  "duration": <int in seconds>,
  "image": <path to image file>,
  "details": "<optional>",
  "studio": "<studio_id>"
}
```

Only `url` is required. URL is used to test for scene uniqueness. The tool will not create the scene if a scene is found with the same studio URL. Performers are associated without an alias.