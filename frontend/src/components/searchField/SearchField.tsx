import React, { useState } from 'react';
import { useMutation } from '@apollo/react-hooks';
import { components, OptionsType, OptionProps } from 'react-select';
import Async from 'react-select/async';
import { debounce } from 'lodash';
import { navigate } from '@reach/router';
import {
    Search,
    Search_search_performers as PerformerResult,
    Search_search_scenes as SceneResult
} from 'src/definitions/Search';
import SearchQuery from 'src/queries/Search.gql';

export const enum SearchType {
    Performer = 'performer',
    Combined = 'combined'
}

interface SearchFieldProps {
    onClick?: (result:PerformerResult|SceneResult) => void;
    searchType: SearchType;
}

interface SearchGroup {
    label: String;
    options: SearchResult[];
}
interface SearchResult {
    label: string;
    value: PerformerResult|SceneResult;
    type: string;
}

const Option: React.FC = (props:OptionProps<OptionsType<SearchResult>>) => {
    const { data: { label, subLabel } } = props;
    return (
        <components.Option {...props}>
            <div className="search-value">{label}</div>
            <div className="search-subvalue">{subLabel}</div>
        </components.Option>
    );
};

const SearchField: React.FC<SearchFieldProps> = ({ onClick, searchType = SearchType.Performer }) => {
    const [selectedValue, setSelected] = useState(null);
    const [search] = useMutation<Search>(SearchQuery);

    const handleSearch = (term:String, callback:(options:Array<SearchGroup>) => void) => {
        search({ variables: { term, searchType } }).then((result) => {
            const data = result.data.search;
            const performers = data.performers && data.performers.map((performer:PerformerResult) => ({
                type: 'performer',
                value: performer,
                label: performer.displayName,
                subLabel: [performer.birthday ? `Born: ${performer.birthday}` : null,
                    performer.aliases
                        ? `AKA: ${performer.aliases.join(', ')}`
                        : null].filter((p) => p !== null).join(', ')
            }));
            const scenes = data.scenes && data.scenes.map((scene:SceneResult) => ({
                type: 'scene',
                value: scene,
                label: `${scene.title} ${scene.date ? `(${scene.date})` : ''}`,
                subLabel: `${scene.studio.title}${scene.performers ? ' • ' : ''}
                    ${scene.performers.map((p) => p.alias || p.performer.displayName).join(', ')}`
            }));
            const options = [];
            if (performers.length) options.push({ label: 'Performers', options: performers });
            if (scenes.length) options.push({ label: 'Scenes', options: scenes });
            callback(options);
        });
    };

    const debouncedLoadOptions = debounce(handleSearch, 400);

    const handleChange = (result:SearchResult) => {
        if (result)
            if (onClick)
                onClick(result.value);
            else
                navigate(`/${result.type}/${result.value.uuid}`);

        setSelected(null);
    };

    return (
        <div className="SearchField">
            <Async
                autoload={false}
                value={selectedValue}
                defaultOptions
                loadOptions={debouncedLoadOptions}
                onChange={handleChange}
                placeholder={searchType === SearchType.Performer
                    ? 'Search for performer...' : 'Search for performer or scene...'}
                components={{ Option, DropdownIndicator: () => null, IndicatorSeparator: () => null }}
                noOptionsMessage={({ inputValue }:{inputValue: string}):string => null && inputValue}
            />
        </div>
    );
};

export default SearchField;
