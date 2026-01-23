import { components } from "react-select";
import { extractIdFromUrl } from "src/utils";

type InputComponent = typeof components.Input;

// Shared Input component for react-select that extracts IDs from pasted stash-box URLs
const SearchInput: InputComponent = (props) => (
  <components.Input
    {...props}
    onPaste={(e) => {
      const pasted = e.clipboardData.getData("text/plain");
      const extracted = extractIdFromUrl(pasted);
      if (extracted !== pasted) {
        e.preventDefault();
        props.selectProps.onInputChange(extracted, {
          action: "input-change",
          prevInputValue: String(props.value ?? ""),
        });
      }
    }}
  />
);

export default SearchInput;
